import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../db.js'
import { findComparables } from '../services/vehicleService.js'
import {
  buildDealerTrust,
  buildDreamAlternatives,
  buildFinancingSimulation,
  buildHiddenCostAlerts,
  buildInspectionChecklist,
  buildNegotiationAdvice,
  buildServicePlan,
  buildWhyCheap,
  compareListings,
} from '../services/advisory/buyingAssistant.js'

/**
 * Regelbasierter Kaufberater (aus der Parallel-Implementierung übernommen und
 * an das PR-Schema angepasst): Checklisten, Verhandlungs-Hinweise, versteckte
 * Kosten, Finanzierungsrechner, Vergleich. Kein LLM — reine Heuristiken.
 */
export async function buyingAssistantRoutes(app: FastifyInstance) {
  /** Kaufcheck zu einem Inserat: Checkliste + Kosten-Warnungen + Verhandlung. */
  app.get('/check/:listingId', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { listingId } = z.object({ listingId: z.string() }).parse(req.params)
    const listing = await prisma.vehicleListing.findUnique({
      where: { id: listingId },
      include: { specs: true },
    })
    if (!listing) return reply.code(404).send({ ok: false, error: 'NOT_FOUND' })

    // Baureihen-Wissen aus der Modell-Ebene (bekannte Schwachstellen)
    const model = listing.vehicleModelId
      ? await prisma.vehicleModel.findUnique({ where: { id: listing.vehicleModelId } })
      : null
    const knowledge = model ? { commonIssuesJson: model.knownIssuesJson } : null

    const comparables = await findComparables(listing)
    const prices = comparables.map((c) => c.price)
    const marketAverage = prices.length >= 3 ? prices.reduce((s, p) => s + p, 0) / prices.length : null

    return {
      ok: true,
      data: {
        inspectionChecklist: buildInspectionChecklist(listing, knowledge),
        hiddenCostAlerts: buildHiddenCostAlerts(listing, knowledge),
        negotiation: buildNegotiationAdvice(listing, marketAverage),
        whyCheap: buildWhyCheap(listing, marketAverage),
        dealerTrust: buildDealerTrust(listing),
        comparablesCount: comparables.length,
      },
    }
  })

  /** Finanzierungsrechner (reine Simulation, keine Beratung/kein Angebot). */
  app.post('/financing', { preHandler: [app.authenticate] }, async (req) => {
    const body = z
      .object({
        price: z.number().int().positive(),
        downPayment: z.number().int().nonnegative().optional(),
        months: z.number().int().min(12).max(96).optional(),
        annualRate: z.number().min(0).max(20).optional(),
        residualValue: z.number().int().nonnegative().optional(),
      })
      .parse(req.body)
    return { ok: true, data: buildFinancingSimulation(body) }
  })

  /** Vergleich von 2–4 Inseraten (nutzt die Favoriten-/Garage-Auswahl). */
  app.post('/compare', { preHandler: [app.authenticate] }, async (req, reply) => {
    const body = z.object({ listingIds: z.array(z.string()).min(2).max(4) }).parse(req.body)
    const listings = await prisma.vehicleListing.findMany({ where: { id: { in: body.listingIds } } })
    if (listings.length < 2) return reply.code(404).send({ ok: false, error: 'LISTINGS_NOT_FOUND' })
    return { ok: true, data: compareListings(listings) }
  })

  /** Günstigere Alternativen zum Traummodell im Monatsbudget. */
  app.post('/dream-alternatives', { preHandler: [app.authenticate] }, async (req) => {
    const body = z
      .object({
        dreamMake: z.string().optional(),
        dreamModel: z.string().min(1),
        monthlyBudgetEur: z.number().int().positive().default(550),
      })
      .parse(req.body)
    return { ok: true, data: buildDreamAlternatives(body) }
  })

  /** Serviceplan für das eigene Fahrzeug ("Mein Auto"). */
  app.get('/service-plan/:ownedId', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { ownedId } = z.object({ ownedId: z.string() }).parse(req.params)
    const owned = await prisma.ownedVehicle.findUnique({ where: { id: ownedId } })
    if (!owned || owned.userId !== req.user.sub)
      return reply.code(404).send({ ok: false, error: 'NOT_FOUND' })
    return {
      ok: true,
      data: buildServicePlan({
        make: owned.make,
        model: owned.model,
        year: owned.year,
        currentMileage: owned.mileage,
        purchasePrice: owned.purchasePrice,
        tuvDate: owned.inspectionUntil ? `${owned.inspectionUntil}-01` : null,
      }),
    }
  })
}
