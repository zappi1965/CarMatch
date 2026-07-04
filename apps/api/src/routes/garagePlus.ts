import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../db.js'
import { estimateVehicleValue } from '../scores/valuation.js'
import { getModelTrend } from '../services/marketService.js'
import { monthsUntilAffordable } from '../scores/marketTrend.js'
import { track } from '../services/analyticsService.js'

/**
 * Garage-Erweiterungen: Sparziele (Traumwagen beobachten) und
 * "Mein Auto" (Besitzphase: Wertverlauf + TÜV-Erinnerung in-app).
 */
export async function garagePlusRoutes(app: FastifyInstance) {
  // ── Sparziele ──
  app.get('/savings-goals', { preHandler: [app.authenticate] }, async (req) => {
    const goals = await prisma.savingsGoal.findMany({
      where: { userId: req.user.sub },
      orderBy: { createdAt: 'desc' },
    })
    const enriched = await Promise.all(
      goals.map(async (g) => {
        let trendPercent: number | null = null
        if (g.listingId) {
          const listing = await prisma.vehicleListing.findUnique({ where: { id: g.listingId } })
          if (listing) trendPercent = (await getModelTrend(listing.make, listing.model)).trendPercent
        }
        return {
          ...g,
          trendPercent,
          monthsToGoal: monthsUntilAffordable(g.targetPrice, g.currentBudget, g.monthlySaving, trendPercent),
        }
      }),
    )
    return { ok: true, data: enriched }
  })

  app.post('/savings-goals', { preHandler: [app.authenticate] }, async (req) => {
    const body = z
      .object({
        listingId: z.string().optional(),
        vehicleModelId: z.string().optional(),
        title: z.string().min(1).max(120),
        targetPrice: z.number().int().positive(),
        currentBudget: z.number().int().nonnegative().default(0),
        monthlySaving: z.number().int().nonnegative().default(0),
      })
      .parse(req.body)
    const goal = await prisma.savingsGoal.create({ data: { userId: req.user.sub, ...body } })
    await track('savings_goal_created', req.user.sub)
    return { ok: true, data: goal }
  })

  app.patch('/savings-goals/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { id } = z.object({ id: z.string() }).parse(req.params)
    const body = z
      .object({ currentBudget: z.number().int().nonnegative().optional(), monthlySaving: z.number().int().nonnegative().optional() })
      .parse(req.body)
    const goal = await prisma.savingsGoal.findUnique({ where: { id } })
    if (!goal || goal.userId !== req.user.sub) return reply.code(404).send({ ok: false, error: 'NOT_FOUND' })
    return { ok: true, data: await prisma.savingsGoal.update({ where: { id }, data: body }) }
  })

  app.delete('/savings-goals/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { id } = z.object({ id: z.string() }).parse(req.params)
    const goal = await prisma.savingsGoal.findUnique({ where: { id } })
    if (!goal || goal.userId !== req.user.sub) return reply.code(404).send({ ok: false, error: 'NOT_FOUND' })
    await prisma.savingsGoal.delete({ where: { id } })
    return { ok: true }
  })

  // ── Mein Auto (Besitzphase) ──
  app.get('/owned', { preHandler: [app.authenticate] }, async (req) => {
    const vehicles = await prisma.ownedVehicle.findMany({
      where: { userId: req.user.sub },
      orderBy: { createdAt: 'desc' },
    })
    const enriched = await Promise.all(
      vehicles.map(async (v) => {
        const comparables = await prisma.vehicleListing.findMany({
          where: {
            isAvailable: true,
            make: { equals: v.make, mode: 'insensitive' },
            model: { contains: v.model, mode: 'insensitive' },
            ...(v.year != null ? { year: { gte: v.year - 2, lte: v.year + 2 } } : {}),
          },
          select: { price: true, mileage: true, year: true },
          take: 50,
        })
        const valuation = estimateVehicleValue(v, comparables)
        const trend = await getModelTrend(v.make, v.model)
        // TÜV-Erinnerung in-app: fällig in < 60 Tagen?
        let inspectionDue = false
        if (v.inspectionUntil) {
          const [y, m] = v.inspectionUntil.split('-').map(Number)
          if (y && m) inspectionDue = new Date(y, m - 1, 1).getTime() - Date.now() < 60 * 86400_000
        }
        return { ...v, valuation, trendPercent: trend.trendPercent, inspectionDue }
      }),
    )
    return { ok: true, data: enriched }
  })

  app.post('/owned', { preHandler: [app.authenticate] }, async (req) => {
    const body = z
      .object({
        make: z.string().min(1).max(60),
        model: z.string().min(1).max(60),
        variant: z.string().max(80).optional(),
        year: z.number().int().min(1950).max(2030).optional(),
        mileage: z.number().int().nonnegative().optional(),
        powerHp: z.number().int().positive().optional(),
        fuelType: z.enum(['PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID', 'PLUGIN_HYBRID', 'LPG', 'CNG', 'OTHER']).optional(),
        purchasePrice: z.number().int().positive().optional(),
        inspectionUntil: z.string().regex(/^\d{4}-\d{2}$/).optional(),
      })
      .parse(req.body)
    const vehicle = await prisma.ownedVehicle.create({ data: { userId: req.user.sub, ...body } })
    await track('owned_vehicle_added', req.user.sub)
    return { ok: true, data: vehicle }
  })

  app.delete('/owned/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { id } = z.object({ id: z.string() }).parse(req.params)
    const v = await prisma.ownedVehicle.findUnique({ where: { id } })
    if (!v || v.userId !== req.user.sub) return reply.code(404).send({ ok: false, error: 'NOT_FOUND' })
    await prisma.ownedVehicle.delete({ where: { id } })
    return { ok: true }
  })
}
