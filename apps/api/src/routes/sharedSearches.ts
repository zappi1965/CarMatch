import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../db.js'

const code = () => Math.random().toString(36).slice(2, 8).toUpperCase()

export async function sharedSearchRoutesV2(app: FastifyInstance) {
  app.get('/', { preHandler: [app.authenticate] }, async (req) => {
    const memberships = await prisma.sharedSearchMember.findMany({
      where: { userId: req.user.sub },
      include: { search: { include: { members: true, signals: { include: { listing: true } } } } },
    })
    return { ok: true, data: memberships.map((m) => m.search) }
  })
  app.post('/', { preHandler: [app.authenticate] }, async (req) => {
    const { name, displayName } = z
      .object({
        name: z.string().min(1).default('Gemeinsame Suche'),
        displayName: z.string().default('Ich'),
      })
      .parse(req.body ?? {})
    const search = await prisma.sharedSearch.create({
      data: {
        name,
        ownerUserId: req.user.sub,
        inviteCode: code(),
        members: { create: { userId: req.user.sub, displayName, role: 'owner' } },
      },
      include: { members: true },
    })
    return { ok: true, data: search }
  })
  app.post('/join', { preHandler: [app.authenticate] }, async (req) => {
    const { inviteCode, displayName } = z
      .object({ inviteCode: z.string(), displayName: z.string().default('Partner') })
      .parse(req.body)
    const search = await prisma.sharedSearch.findUnique({ where: { inviteCode } })
    if (!search) return { ok: false, error: 'INVITE_NOT_FOUND' }
    await prisma.sharedSearchMember.upsert({
      where: { sharedSearchId_userId: { sharedSearchId: search.id, userId: req.user.sub } },
      create: { sharedSearchId: search.id, userId: req.user.sub, displayName },
      update: { displayName },
    })
    return { ok: true, data: search }
  })
  app.post('/:id/signal', { preHandler: [app.authenticate] }, async (req) => {
    const { id } = z.object({ id: z.string() }).parse(req.params)
    const { listingId, signalType } = z
      .object({
        listingId: z.string(),
        signalType: z.enum(['like', 'dislike', 'veto', 'duel_win', 'duel_loss']),
      })
      .parse(req.body)
    const signal = await prisma.sharedVehicleSignal.upsert({
      where: {
        sharedSearchId_userId_listingId: { sharedSearchId: id, userId: req.user.sub, listingId },
      },
      create: { sharedSearchId: id, userId: req.user.sub, listingId, signalType },
      update: { signalType },
    })
    return { ok: true, data: signal }
  })
}
