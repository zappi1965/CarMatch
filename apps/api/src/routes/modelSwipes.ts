import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../db.js'
import { recalculateTasteProfile } from '../services/tasteProfileService.js'
import { track } from '../services/analyticsService.js'
import { TASTE_SUMMARY_THRESHOLD } from '../recommendation/taste.js'

const modelSwipeSchema = z.object({
  vehicleModelId: z.string(),
  action: z.enum(['LIKE', 'DISLIKE', 'SUPERLIKE', 'SKIP']),
  dwellTimeMs: z.number().int().nonnegative().max(600_000).optional(),
  openedDetails: z.boolean().optional(),
  openedMore: z.boolean().optional(),
})

/** Swipes im Inspirationsmodus (Fahrzeugmodelle, keine Inserate). */
export async function modelSwipeRoutes(app: FastifyInstance) {
  app.post('/', { preHandler: [app.authenticate] }, async (req, reply) => {
    const body = modelSwipeSchema.parse(req.body)
    const model = await prisma.vehicleModel.findUnique({ where: { id: body.vehicleModelId } })
    if (!model) return reply.code(404).send({ ok: false, error: 'MODEL_NOT_FOUND' })

    const swipe = await prisma.modelSwipeEvent.create({
      data: { userId: req.user.sub, ...body },
    })
    const profile = await recalculateTasteProfile(req.user.sub)
    await track(`model_swipe_${body.action.toLowerCase()}`, req.user.sub)

    return {
      ok: true,
      data: {
        id: swipe.id,
        signalCount: profile.signalCount,
        confidence: profile.confidence,
        // App zeigt die Geschmackszusammenfassung, sobald genug Signale da sind
        summaryReady: profile.signalCount >= TASTE_SUMMARY_THRESHOLD,
      },
    }
  })

  app.post('/undo', { preHandler: [app.authenticate] }, async (req, reply) => {
    const last = await prisma.modelSwipeEvent.findFirst({
      where: { userId: req.user.sub, undone: false },
      orderBy: { createdAt: 'desc' },
    })
    if (!last) return reply.code(404).send({ ok: false, error: 'NOTHING_TO_UNDO' })
    await prisma.modelSwipeEvent.update({ where: { id: last.id }, data: { undone: true } })
    await recalculateTasteProfile(req.user.sub)
    return { ok: true, data: { undoneModelId: last.vehicleModelId } }
  })
}
