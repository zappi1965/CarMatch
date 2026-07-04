import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../db.js'
import {
  buildDealerTrust,
  buildDreamAlternatives,
  buildFinancingSimulation,
  buildHiddenCostAlerts,
  buildInspectionChecklist,
  buildNegotiationAdvice,
  buildPartnerCompromise,
  buildServicePlan,
  buildWhyCheap,
  compareListings,
} from '../services/advisory/buyingAssistant.js'

const financeSchema = z.object({ price: z.number().int().positive(), downPayment: z.number().int().nonnegative().optional(), months: z.number().int().min(12).max(96).optional(), annualRate: z.number().min(0).max(20).optional(), residualValue: z.number().int().nonnegative().optional() })
const compareSchema = z.object({ listingIds: z.array(z.string()).min(2).max(4) })
const dreamSchema = z.object({ dreamMake: z.string().optional(), dreamModel: z.string().min(1), monthlyBudgetEur: z.number().int().positive().default(550) })

export async function buyingAssistantRoutes(app: FastifyInstance) {
  app.get('/listings/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { id } = z.object({ id: z.string() }).parse(req.params)
    const listing = await prisma.vehicleListing.findUnique({
      where: { id },
      include: {
        priceHistory: { orderBy: { recordedAt: 'desc' }, take: 12 },
        dealer: true,
        specs: true,
      },
    })
    if (!listing) return reply.code(404).send({ ok: false, error: 'NOT_FOUND' })
    const model = await prisma.vehicleModel.findFirst({
      where: { make: listing.make, OR: [{ model: listing.model }, { model: { contains: listing.model.split(' ')[0], mode: 'insensitive' } }] },
      include: { knowledge: true },
    })
    const marketAverage = listing.priceHistory.length
      ? Math.round(listing.priceHistory.reduce((sum, p) => sum + p.price, 0) / listing.priceHistory.length)
      : null
    return {
      listingId: listing.id,
      hiddenCostAlerts: buildHiddenCostAlerts(listing, model?.knowledge),
      inspectionChecklist: buildInspectionChecklist(listing, model?.knowledge),
      negotiationAdvice: buildNegotiationAdvice(listing, marketAverage),
      whyCheap: buildWhyCheap(listing, marketAverage),
      dealerTrust: buildDealerTrust(listing),
      financing: buildFinancingSimulation({ price: listing.price }),
      modelKnowledge: model?.knowledge ?? null,
    }
  })

  app.post('/compare', { preHandler: [app.authenticate] }, async (req) => {
    const { listingIds } = compareSchema.parse(req.body)
    const listings = await prisma.vehicleListing.findMany({ where: { id: { in: listingIds } } })
    return compareListings(listings)
  })

  app.post('/finance', { preHandler: [app.authenticate] }, async (req) => {
    return buildFinancingSimulation(financeSchema.parse(req.body))
  })

  app.post('/dream-alternatives', { preHandler: [app.authenticate] }, async (req) => {
    return { alternatives: buildDreamAlternatives(dreamSchema.parse(req.body)) }
  })

  app.get('/shared/:id/compromise', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { id } = z.object({ id: z.string() }).parse(req.params)
    const member = await prisma.sharedSearchMember.findUnique({ where: { sharedSearchId_userId: { sharedSearchId: id, userId: req.user.sub } } })
    if (!member) return reply.code(403).send({ ok: false, error: 'FORBIDDEN' })
    const signals = await prisma.sharedVehicleSignal.findMany({ where: { sharedSearchId: id } })
    return { results: buildPartnerCompromise(signals) }
  })

  app.get('/owned/:id/service-plan', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { id } = z.object({ id: z.string() }).parse(req.params)
    const owned = await prisma.ownedVehicle.findFirst({ where: { id, userId: req.user.sub } })
    if (!owned) return reply.code(404).send({ ok: false, error: 'NOT_FOUND' })
    return buildServicePlan(owned)
  })
}
