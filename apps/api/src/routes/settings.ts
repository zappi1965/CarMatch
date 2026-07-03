import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../db.js'
import { geocoder } from '../geo/geocoding.js'
import { track } from '../services/analyticsService.js'

export async function settingsRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [app.authenticate] }, async (req) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user.sub },
      include: { locations: { where: { isCurrent: true }, take: 1 } },
    })
    if (!user) return { ok: false, error: 'NOT_FOUND' }
    return {
      ok: true,
      data: {
        locale: user.locale,
        country: user.country,
        personalizationEnabled: user.personalizationEnabled,
        analyticsConsent: user.analyticsConsent,
        scoresEnabled: user.scoresEnabled,
        pushCategories: user.pushCategories,
        location: user.locations[0] ?? null,
      },
    }
  })

  app.patch('/', { preHandler: [app.authenticate] }, async (req) => {
    const body = z
      .object({
        personalizationEnabled: z.boolean().optional(),
        analyticsConsent: z.boolean().optional(),
      })
      .parse(req.body)
    await prisma.user.update({ where: { id: req.user.sub }, data: body })
    return { ok: true }
  })

  /** Quartett-Scores einzeln ein-/ausblendbar. */
  app.patch('/scores', { preHandler: [app.authenticate] }, async (req) => {
    const body = z.object({ scoresEnabled: z.record(z.boolean()) }).parse(req.body)
    await prisma.user.update({
      where: { id: req.user.sub },
      data: { scoresEnabled: body.scoresEnabled },
    })
    return { ok: true }
  })

  app.patch('/language', { preHandler: [app.authenticate] }, async (req) => {
    const body = z.object({ locale: z.string().max(5), country: z.string().max(2).optional() }).parse(req.body)
    await prisma.user.update({ where: { id: req.user.sub }, data: body })
    return { ok: true }
  })

  /** Standort: GPS-Koordinaten oder PLZ/Ort (Geocoding). */
  app.patch('/location', { preHandler: [app.authenticate] }, async (req, reply) => {
    const body = z
      .object({
        latitude: z.number().min(-90).max(90).optional(),
        longitude: z.number().min(-180).max(180).optional(),
        postalCode: z.string().max(10).optional(),
        city: z.string().max(80).optional(),
        country: z.string().max(2).default('DE'),
        radiusKm: z.number().positive().max(2000).nullable().optional(),
      })
      .parse(req.body)

    let point: { latitude: number; longitude: number; city?: string; postalCode?: string } | null =
      body.latitude != null && body.longitude != null
        ? { latitude: body.latitude, longitude: body.longitude, city: body.city, postalCode: body.postalCode }
        : null
    if (!point && (body.postalCode || body.city)) {
      const r = await geocoder.geocode(body)
      if (r) point = r
    }
    if (!point) return reply.code(400).send({ ok: false, error: 'LOCATION_NOT_RESOLVED' })

    await prisma.userLocation.updateMany({
      where: { userId: req.user.sub },
      data: { isCurrent: false },
    })
    const loc = await prisma.userLocation.create({
      data: {
        userId: req.user.sub,
        latitude: point.latitude,
        longitude: point.longitude,
        postalCode: point.postalCode,
        city: point.city,
        country: body.country,
        radiusKm: body.radiusKm ?? null,
      },
    })
    return { ok: true, data: loc }
  })

  /** Push: Kategorien einzeln, Token-Registrierung nur nach Consent. */
  app.patch('/push', { preHandler: [app.authenticate] }, async (req) => {
    const body = z
      .object({
        pushCategories: z.record(z.boolean()).optional(),
        token: z.string().optional(),
        platform: z.enum(['ios', 'android', 'web']).optional(),
      })
      .parse(req.body)
    if (body.pushCategories) {
      await prisma.user.update({
        where: { id: req.user.sub },
        data: { pushCategories: body.pushCategories },
      })
      if (Object.values(body.pushCategories).some(Boolean)) await track('push_optin', req.user.sub)
    }
    if (body.token && body.platform) {
      await prisma.pushToken.upsert({
        where: { token: body.token },
        create: { userId: req.user.sub, token: body.token, platform: body.platform },
        update: { userId: req.user.sub },
      })
    }
    return { ok: true }
  })
}
