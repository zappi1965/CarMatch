import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../db.js'
import { getProfile, resetProfile } from '../services/recommendationService.js'
import { explainRecommendation } from '../recommendation/explain.js'

export async function recommendationRoutes(app: FastifyInstance) {
  /** Erklärung, warum ein Fahrzeug empfohlen wird (i18n-Key + Parameter). */
  app.get('/explain/:vehicleId', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { vehicleId } = z.object({ vehicleId: z.string() }).parse(req.params)
    const listing = await prisma.vehicleListing.findUnique({ where: { id: vehicleId } })
    if (!listing) return reply.code(404).send({ ok: false, error: 'NOT_FOUND' })
    const profile = await getProfile(req.user.sub)
    return { ok: true, data: explainRecommendation(profile, listing) }
  })

  /** DSGVO: Empfehlungs-/Tracking-Daten zurücksetzen. */
  app.post('/reset', { preHandler: [app.authenticate] }, async (req) => {
    await resetProfile(req.user.sub)
    return { ok: true }
  })
}
