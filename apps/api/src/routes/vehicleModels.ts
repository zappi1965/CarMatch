import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../db.js'
import { track } from '../services/analyticsService.js'

const publicModel = (m: Record<string, unknown>) => ({ ...m })

export async function vehicleModelRoutes(app: FastifyInstance) {
  /**
   * Inspirationsmodus-Feed: noch nicht geswipte Fahrzeugmodelle,
   * bewusst divers gemischt (Cold Start: über Segmente verteilt).
   */
  app.get('/discover', { preHandler: [app.authenticate] }, async (req) => {
    const q = z.object({ limit: z.coerce.number().max(500).default(15) }).parse(req.query)
    const swiped = await prisma.modelSwipeEvent.findMany({
      where: { userId: req.user.sub, undone: false },
      select: { vehicleModelId: true },
    })
    const models = await prisma.vehicleModel.findMany({
      where: { id: { notIn: swiped.map((s) => s.vehicleModelId) } },
      include: { specs: true },
    })

    // Diversity: round-robin über Segmente statt zufälliger Reihenfolge
    const bySegment = new Map<string, typeof models>()
    for (const m of models) {
      const key = m.segment ?? 'other'
      bySegment.set(key, [...(bySegment.get(key) ?? []), m])
    }
    const buckets = [...bySegment.values()]
    const mixed: typeof models = []
    let added = true
    while (mixed.length < q.limit && added) {
      added = false
      for (const bucket of buckets) {
        const next = bucket.shift()
        if (next) {
          mixed.push(next)
          added = true
        }
      }
    }
    const swipeCount = swiped.length
    return { ok: true, data: { models: mixed.map(publicModel), swipeCount } }
  })

  app.get('/:id', async (req, reply) => {
    const { id } = z.object({ id: z.string() }).parse(req.params)
    const model = await prisma.vehicleModel.findUnique({ where: { id }, include: { specs: true } })
    if (!model) return reply.code(404).send({ ok: false, error: 'NOT_FOUND' })
    await track('model_detail_open', undefined, { modelId: id })
    return { ok: true, data: publicModel(model) }
  })

  /** Ähnliche Modelle: gleiches Segment oder gleiche Karosserie + Leistungsklasse. */
  app.get('/:id/similar', async (req, reply) => {
    const { id } = z.object({ id: z.string() }).parse(req.params)
    const model = await prisma.vehicleModel.findUnique({ where: { id } })
    if (!model) return reply.code(404).send({ ok: false, error: 'NOT_FOUND' })
    const similar = await prisma.vehicleModel.findMany({
      where: {
        id: { not: id },
        OR: [
          { segment: model.segment ?? undefined },
          {
            bodyType: model.bodyType ?? undefined,
            minPowerHp: model.minPowerHp != null ? { gte: Math.round(model.minPowerHp * 0.7) } : undefined,
          },
        ],
      },
      take: 6,
    })
    return { ok: true, data: similar.map(publicModel) }
  })

  /** Echte Inserate zu einem Modell ("Ähnliche echte Angebote finden"). */
  app.get('/:id/listings', async (req, reply) => {
    const { id } = z.object({ id: z.string() }).parse(req.params)
    const model = await prisma.vehicleModel.findUnique({ where: { id } })
    if (!model) return reply.code(404).send({ ok: false, error: 'NOT_FOUND' })
    const matches = await prisma.vehicleModelToListingMatch.findMany({
      where: { vehicleModelId: id, listing: { isAvailable: true } },
      orderBy: { matchScore: 'desc' },
      take: 20,
      include: { listing: true },
    })
    await track('model_to_listings', undefined, { modelId: id, results: matches.length })
    return {
      ok: true,
      data: matches.map((m) => ({
        matchScore: m.matchScore,
        matchReasons: m.matchReasonJson,
        listing: { ...m.listing, rawData: undefined },
      })),
    }
  })
}
