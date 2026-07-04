import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../db.js'
import { buildMarketTimingInsight } from '../services/kaufhilfe/marketTiming.js'

export async function marketTimingRoutes(app: FastifyInstance) {
  app.get('/listing/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { id } = z.object({ id: z.string() }).parse(req.params)
    const listing = await prisma.vehicleListing.findUnique({ where: { id } })
    if (!listing) return reply.code(404).send({ ok: false, error: 'NOT_FOUND' })
    const history = await prisma.vehiclePriceHistory.findMany({
      where: { OR: [{ listingId: id }, { modelId: listing.vehicleModelId ?? undefined }] },
      orderBy: { date: 'asc' },
    })
    const user = await prisma.user.findUnique({
      where: { id: req.user.sub },
      select: { monthlyBudgetEur: true },
    })
    return {
      ok: true,
      data: buildMarketTimingInsight({
        currentPrice: listing.price,
        model: `${listing.make} ${listing.model}`,
        bodyType: listing.bodyType,
        history: history.map((h) => ({ price: h.price, date: h.date })),
        monthlyBudget: user?.monthlyBudgetEur,
      }),
    }
  })

  app.get('/models/:modelId', async (req, reply) => {
    const { modelId } = z.object({ modelId: z.string() }).parse(req.params)
    const model = await prisma.vehicleModel.findUnique({
      where: { id: modelId },
      include: { priceStats: true },
    })
    if (!model) return reply.code(404).send({ ok: false, error: 'NOT_FOUND' })
    return { ok: true, data: model.priceStats }
  })
}
