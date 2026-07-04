import type { FastifyInstance } from 'fastify'
import { randomBytes } from 'node:crypto'
import { z } from 'zod'
import { prisma } from '../db.js'
import { track } from '../services/analyticsService.js'

/**
 * Gemeinsame Suche: Paar/Familie sucht zusammen. Beitritt per Einladungscode,
 * Match = Inserat, das mindestens zwei Mitglieder favorisiert haben
 * (das "Ihr beide mögt dieses Auto"-Moment).
 */
export async function circleRoutes(app: FastifyInstance) {
  app.post('/', { preHandler: [app.authenticate] }, async (req) => {
    const body = z.object({ name: z.string().min(1).max(60) }).parse(req.body)
    const inviteCode = randomBytes(4).toString('hex').toUpperCase().slice(0, 6)
    const circle = await prisma.searchCircle.create({
      data: { name: body.name, inviteCode, members: { create: { userId: req.user.sub } } },
    })
    await track('circle_created', req.user.sub)
    return { ok: true, data: { id: circle.id, name: circle.name, inviteCode } }
  })

  app.post('/join', { preHandler: [app.authenticate] }, async (req, reply) => {
    const body = z.object({ code: z.string().min(4).max(12) }).parse(req.body)
    const circle = await prisma.searchCircle.findUnique({
      where: { inviteCode: body.code.toUpperCase() },
    })
    if (!circle) return reply.code(404).send({ ok: false, error: 'INVALID_CODE' })
    await prisma.circleMember.upsert({
      where: { circleId_userId: { circleId: circle.id, userId: req.user.sub } },
      create: { circleId: circle.id, userId: req.user.sub },
      update: {},
    })
    await track('circle_joined', req.user.sub)
    return { ok: true, data: { id: circle.id, name: circle.name } }
  })

  /** Eigener Circle inkl. gemeinsamer Matches. */
  app.get('/me', { preHandler: [app.authenticate] }, async (req) => {
    const membership = await prisma.circleMember.findFirst({
      where: { userId: req.user.sub },
      include: { circle: { include: { members: true } } },
      orderBy: { joinedAt: 'desc' },
    })
    if (!membership) return { ok: true, data: null }

    const memberIds = membership.circle.members.map((m) => m.userId)
    const favorites = await prisma.favorite.findMany({
      where: { userId: { in: memberIds } },
      include: { listing: true },
    })

    // Match: von ≥ 2 verschiedenen Mitgliedern favorisiert
    const byListing = new Map<string, { listing: (typeof favorites)[number]['listing']; userIds: Set<string> }>()
    for (const f of favorites) {
      const entry = byListing.get(f.listingId) ?? { listing: f.listing, userIds: new Set<string>() }
      entry.userIds.add(f.userId)
      byListing.set(f.listingId, entry)
    }
    const matches = [...byListing.values()]
      .filter((e) => e.userIds.size >= 2)
      .map((e) => ({ ...e.listing, rawData: undefined, matchedBy: e.userIds.size }))

    // Vorschläge der anderen: deren Favoriten, die ich noch nicht geliked habe
    const mine = new Set(favorites.filter((f) => f.userId === req.user.sub).map((f) => f.listingId))
    const partnerPicks = [...byListing.values()]
      .filter((e) => !mine.has(e.listing.id) && e.userIds.size >= 1)
      .slice(0, 10)
      .map((e) => ({ ...e.listing, rawData: undefined }))

    return {
      ok: true,
      data: {
        id: membership.circle.id,
        name: membership.circle.name,
        inviteCode: membership.circle.inviteCode,
        memberCount: memberIds.length,
        matches,
        partnerPicks,
      },
    }
  })

  app.delete('/me', { preHandler: [app.authenticate] }, async (req) => {
    await prisma.circleMember.deleteMany({ where: { userId: req.user.sub } })
    return { ok: true }
  })
}
