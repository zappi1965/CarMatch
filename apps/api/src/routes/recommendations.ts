import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../db.js'
import { discover, resetProfile } from '../services/recommendationService.js'
import { getTasteProfile, resetTasteProfile } from '../services/tasteProfileService.js'
import {
  generateRecommendationExplanation,
  scoreListingHybrid,
} from '../recommendation/hybridScoring.js'
import { geocoder } from '../geo/geocoding.js'

export async function recommendationRoutes(app: FastifyInstance) {
  /** Erklärung, warum ein Inserat empfohlen wird (i18n-Key + Parameter). */
  app.get('/explain/:vehicleId', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { vehicleId } = z.object({ vehicleId: z.string() }).parse(req.params)
    const listing = await prisma.vehicleListing.findUnique({ where: { id: vehicleId } })
    if (!listing) return reply.code(404).send({ ok: false, error: 'NOT_FOUND' })
    const taste = await getTasteProfile(req.user.sub)
    const breakdown = scoreListingHybrid(taste, { ...listing, sponsoredBoost: 0 }, { random: () => 0 })
    return { ok: true, data: generateRecommendationExplanation(taste, listing, breakdown) }
  })

  /**
   * CTA "Passende echte Angebote finden": Inserats-Feed rein aus dem
   * Geschmacksprofil, optional mit Preis/Standort/Radius-Overrides.
   */
  app.get('/listings-from-taste', { preHandler: [app.authenticate] }, async (req) => {
    const q = z
      .object({
        lat: z.coerce.number().optional(),
        lon: z.coerce.number().optional(),
        postalCode: z.string().max(10).optional(),
        radiusKm: z.coerce.number().positive().max(2000).optional(),
        priceMin: z.coerce.number().optional(),
        priceMax: z.coerce.number().optional(),
        limit: z.coerce.number().max(50).default(20),
      })
      .parse(req.query)

    let point = q.lat != null && q.lon != null ? { latitude: q.lat, longitude: q.lon } : undefined
    if (!point && q.postalCode) {
      const r = await geocoder.geocode({ postalCode: q.postalCode })
      if (r) point = { latitude: r.latitude, longitude: r.longitude }
    }
    // Filter haben Vorrang: kein Preis-Override → gelernter Preisbereich des Profils
    const taste = await getTasteProfile(req.user.sub)
    const priceMax = q.priceMax ?? taste.priceRange?.max
    const results = await discover({
      userId: req.user.sub,
      point,
      radiusKm: q.radiusKm ?? null,
      filters: { priceMin: q.priceMin, priceMax },
      limit: q.limit,
    })
    return { ok: true, data: results }
  })

  /** DSGVO: Empfehlungs- UND Geschmacksdaten vollständig zurücksetzen. */
  app.post('/reset', { preHandler: [app.authenticate] }, async (req) => {
    await resetProfile(req.user.sub)
    await resetTasteProfile(req.user.sub)
    return { ok: true }
  })
}
