import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../db.js'
import { updateProfileFromSwipe } from '../services/recommendationService.js'
import { recalculateTasteProfile } from '../services/tasteProfileService.js'
import { track } from '../services/analyticsService.js'

const swipeSchema = z.object({
  listingId: z.string(),
  action: z.enum(['LIKE', 'DISLIKE', 'SUPERLIKE', 'SKIP']),
  dwellTimeMs: z.number().int().nonnegative().max(600_000).optional(),
  openedDetails: z.boolean().optional(),
  openedMore: z.boolean().optional(),
})

export async function swipeRoutes(app: FastifyInstance) {
  app.post('/', { preHandler: [app.authenticate] }, async (req, reply) => {
    const body = swipeSchema.parse(req.body)
    const listing = await prisma.vehicleListing.findUnique({ where: { id: body.listingId } })
    if (!listing) return reply.code(404).send({ ok: false, error: 'LISTING_NOT_FOUND' })

    const swipe = await prisma.swipeEvent.create({
      data: { userId: req.user.sub, ...body },
    })

    // Like/Super-Like landet automatisch in der Garage
    if (body.action === 'LIKE' || body.action === 'SUPERLIKE') {
      await prisma.favorite.upsert({
        where: { userId_listingId: { userId: req.user.sub, listingId: body.listingId } },
        create: { userId: req.user.sub, listingId: body.listingId },
        update: {},
      })
    }

    await updateProfileFromSwipe(req.user.sub, swipe.id)
    // Hybrid: Inseratsverhalten fließt auch ins Geschmacksprofil ein
    await recalculateTasteProfile(req.user.sub)
    await track(`swipe_${body.action.toLowerCase()}`, req.user.sub)
    return { ok: true, data: { id: swipe.id } }
  })

  /** Undo: letzten Swipe zurücknehmen (auch Favorit, falls durch Like entstanden). */
  app.post('/undo', { preHandler: [app.authenticate] }, async (req, reply) => {
    const last = await prisma.swipeEvent.findFirst({
      where: { userId: req.user.sub, undone: false },
      orderBy: { createdAt: 'desc' },
    })
    if (!last) return reply.code(404).send({ ok: false, error: 'NOTHING_TO_UNDO' })
    await prisma.swipeEvent.update({ where: { id: last.id }, data: { undone: true } })
    if (last.action === 'LIKE' || last.action === 'SUPERLIKE') {
      await prisma.favorite.deleteMany({
        where: { userId: req.user.sub, listingId: last.listingId },
      })
    }
    return { ok: true, data: { undoneListingId: last.listingId } }
  })
}
