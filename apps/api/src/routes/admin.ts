import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../db.js'
import { getAllAdapters } from '../providers/registry.js'
import { enabledProviders } from '../config.js'
import { getStats } from '../services/analyticsService.js'
import { syncAllProviders } from '../jobs/syncListings.js'
import { getProfile } from '../services/recommendationService.js'

/** Admin-API — geschützt durch requireAdmin (JWT role=ADMIN oder ADMIN_TOKEN). */
export async function adminRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.requireAdmin)

  app.get('/providers', async () => {
    const states = await prisma.providerState.findMany()
    return {
      ok: true,
      data: getAllAdapters().map((a) => ({
        key: a.key,
        enabled: enabledProviders.includes(a.key),
        configured: a.isConfigured(),
        attribution: a.getSourceAttribution(),
        state: states.find((s) => s.provider === a.key) ?? null,
      })),
    }
  })

  app.post('/providers/sync', async () => {
    const result = await syncAllProviders()
    return { ok: true, data: result }
  })

  app.get('/listings', async (req) => {
    const q = z
      .object({
        page: z.coerce.number().min(1).default(1),
        pageSize: z.coerce.number().max(100).default(25),
        provider: z.string().optional(),
        query: z.string().optional(),
      })
      .parse(req.query)
    const where = {
      ...(q.provider ? { provider: q.provider } : {}),
      ...(q.query
        ? { OR: [{ title: { contains: q.query, mode: 'insensitive' as const } }, { make: { contains: q.query, mode: 'insensitive' as const } }] }
        : {}),
    }
    const [rows, total] = await Promise.all([
      prisma.vehicleListing.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
        include: { specs: { select: { confidence: true, source: true, verified: true } } },
      }),
      prisma.vehicleListing.count({ where }),
    ])
    return { ok: true, data: rows.map((r) => ({ ...r, rawData: undefined })), total }
  })

  /** Manuelle Datenkorrektur + Enrichment-Verifizierung. */
  app.patch('/listings/:id/specs', async (req, reply) => {
    const { id } = z.object({ id: z.string() }).parse(req.params)
    const body = z
      .object({
        zeroToHundred: z.number().nullable().optional(),
        topSpeed: z.number().nullable().optional(),
        weightKg: z.number().nullable().optional(),
        trunkVolumeL: z.number().nullable().optional(),
        verified: z.boolean().optional(),
      })
      .parse(req.body)
    const listing = await prisma.vehicleListing.findUnique({ where: { id } })
    if (!listing) return reply.code(404).send({ ok: false, error: 'NOT_FOUND' })
    const specs = await prisma.vehicleSpecs.upsert({
      where: { listingId: id },
      create: { listingId: id, ...body, confidence: 1, source: 'manual_admin' },
      update: { ...body, ...(body.verified ? { confidence: 1, source: 'manual_admin' } : {}) },
    })
    return { ok: true, data: specs }
  })

  app.get('/users', async (req) => {
    const q = z.object({ page: z.coerce.number().min(1).default(1) }).parse(req.query)
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (q.page - 1) * 25,
      take: 25,
      select: {
        id: true, email: true, authProvider: true, role: true, locale: true,
        createdAt: true, _count: { select: { swipes: true, favorites: true, leads: true } },
      },
    })
    return { ok: true, data: users }
  })

  /** Recommendation-Debugging: Profil + letzte Ergebnisse eines Nutzers. */
  app.get('/recommendations/debug', async (req) => {
    const q = z.object({ userId: z.string() }).parse(req.query)
    const [profile, results] = await Promise.all([
      getProfile(q.userId),
      prisma.recommendationResult.findMany({
        where: { userId: q.userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: { listing: { select: { title: true, make: true, bodyType: true, price: true } } },
      }),
    ])
    return { ok: true, data: { profile, results } }
  })

  app.get('/import-logs', async () => {
    const logs = await prisma.importLog.findMany({ orderBy: { startedAt: 'desc' }, take: 50 })
    return { ok: true, data: logs }
  })

  app.get('/leads', async () => {
    const leads = await prisma.lead.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        listing: { select: { title: true, provider: true } },
        dealer: { select: { name: true } },
      },
    })
    return { ok: true, data: leads }
  })

  app.get('/stats', async () => ({ ok: true, data: await getStats() }))

  /** Hybrid: Fahrzeugmodelle mit Like/Dislike-Bilanz und Match-Zahlen. */
  app.get('/vehicle-models', async () => {
    const models = await prisma.vehicleModel.findMany({
      include: {
        _count: { select: { listingMatches: true } },
        modelSwipes: { where: { undone: false }, select: { action: true } },
      },
      orderBy: [{ make: 'asc' }, { model: 'asc' }],
    })
    return {
      ok: true,
      data: models.map((m) => ({
        id: m.id,
        make: m.make,
        model: m.model,
        variant: m.variant,
        segment: m.segment,
        source: m.source,
        imagesAreDemo: m.imagesAreDemo,
        likes: m.modelSwipes.filter((s) => s.action === 'LIKE' || s.action === 'SUPERLIKE').length,
        dislikes: m.modelSwipes.filter((s) => s.action === 'DISLIKE').length,
        listingMatches: m._count.listingMatches,
      })),
    }
  })

  app.post('/vehicle-models/rebuild-matches', async () => {
    const { rebuildModelListingMatches } = await import('../services/modelMatchService.js')
    return { ok: true, data: await rebuildModelListingMatches() }
  })

  /** Hybrid: Geschmacksprofile (anonymisiert auf Kennzahlen) + Insights. */
  app.get('/taste-profiles', async () => {
    const profiles = await prisma.userTasteProfile.findMany({
      orderBy: { lastUpdatedAt: 'desc' },
      take: 50,
    })
    return {
      ok: true,
      data: profiles.map((p) => ({
        userId: p.userId,
        signalCount: p.signalCount,
        confidence: p.confidence,
        summaryText: p.summaryText,
        topMakes: Object.entries((p.preferredMakesJson as Record<string, number>) ?? {})
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([k]) => k),
        lastUpdatedAt: p.lastUpdatedAt,
      })),
    }
  })

  app.get('/feature-flags', async () => ({
    ok: true,
    data: await prisma.featureFlag.findMany(),
  }))

  app.put('/feature-flags/:key', async (req) => {
    const { key } = z.object({ key: z.string() }).parse(req.params)
    const body = z.object({ enabled: z.boolean(), note: z.string().optional() }).parse(req.body)
    const flag = await prisma.featureFlag.upsert({
      where: { key },
      create: { key, ...body },
      update: body,
    })
    return { ok: true, data: flag }
  })
}
