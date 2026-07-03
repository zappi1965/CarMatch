import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../db.js'
import { track } from '../services/analyticsService.js'

export async function favoriteRoutes(app: FastifyInstance) {
  /** Garage: gespeicherte Fahrzeuge inkl. Preisverlauf für Vergleich. */
  app.get('/', { preHandler: [app.authenticate] }, async (req) => {
    const favorites = await prisma.favorite.findMany({
      where: { userId: req.user.sub },
      orderBy: { createdAt: 'desc' },
      include: {
        listing: { include: { specs: true, priceHistory: { orderBy: { recordedAt: 'desc' }, take: 5 } } },
      },
    })
    return {
      ok: true,
      data: favorites.map((f) => ({ ...f, listing: { ...f.listing, rawData: undefined } })),
    }
  })

  app.post('/', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { listingId } = z.object({ listingId: z.string() }).parse(req.body)
    const listing = await prisma.vehicleListing.findUnique({ where: { id: listingId } })
    if (!listing) return reply.code(404).send({ ok: false, error: 'LISTING_NOT_FOUND' })
    const fav = await prisma.favorite.upsert({
      where: { userId_listingId: { userId: req.user.sub, listingId } },
      create: { userId: req.user.sub, listingId },
      update: {},
    })
    await track('favorite_add', req.user.sub)
    return { ok: true, data: { id: fav.id } }
  })

  app.delete('/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { id } = z.object({ id: z.string() }).parse(req.params)
    const fav = await prisma.favorite.findUnique({ where: { id } })
    if (!fav || fav.userId !== req.user.sub)
      return reply.code(404).send({ ok: false, error: 'NOT_FOUND' })
    await prisma.favorite.delete({ where: { id } })
    return { ok: true }
  })

  /** Fahrzeugvergleich: 2–4 Favoriten nebeneinander (Basisversion im MVP). */
  app.get('/compare', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { ids } = z.object({ ids: z.string() }).parse(req.query)
    const listingIds = ids.split(',').slice(0, 4)
    if (listingIds.length < 2) return reply.code(400).send({ ok: false, error: 'NEED_AT_LEAST_2' })
    const favorites = await prisma.favorite.findMany({
      where: { userId: req.user.sub, listingId: { in: listingIds } },
      include: { listing: { include: { specs: true } } },
    })
    return {
      ok: true,
      data: favorites.map((f) => ({ ...f.listing, rawData: undefined })),
    }
  })
}
