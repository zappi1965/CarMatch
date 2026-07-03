import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../db.js'

/**
 * Discovery-Modi: "inspiration" (Autogeschmack entdecken) und
 * "listings" (echte Angebote). Beide sind gleichberechtigt — kein Zwang.
 */
export async function discoveryRoutes(app: FastifyInstance) {
  app.get('/modes', { preHandler: [app.authenticate] }, async (req) => {
    const [user, modelSwipes] = await Promise.all([
      prisma.user.findUnique({ where: { id: req.user.sub } }),
      prisma.modelSwipeEvent.count({ where: { userId: req.user.sub, undone: false } }),
    ])
    return {
      ok: true,
      data: {
        modes: [
          { key: 'inspiration', titleKey: 'mode.inspiration.title', descriptionKey: 'mode.inspiration.description' },
          { key: 'listings', titleKey: 'mode.listings.title', descriptionKey: 'mode.listings.description' },
        ],
        current: user?.preferredDiscoveryMode ?? null,
        modelSwipeCount: modelSwipes,
      },
    }
  })

  app.post('/mode', { preHandler: [app.authenticate] }, async (req) => {
    const body = z.object({ mode: z.enum(['inspiration', 'listings']) }).parse(req.body)
    await prisma.user.update({
      where: { id: req.user.sub },
      data: { preferredDiscoveryMode: body.mode },
    })
    return { ok: true }
  })
}
