import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../db.js'
import { recalculateTasteProfile } from '../services/tasteProfileService.js'
import { track } from '../services/analyticsService.js'

/**
 * Duell-Modus: zwei Fahrzeugmodelle, Nutzer wählt eins.
 * Paarvergleiche liefern pro Interaktion mehr Präferenz-Information
 * als Einzel-Swipes (Gewichte: Sieger +6, Verlierer −2, siehe taste.ts).
 */
export async function duelRoutes(app: FastifyInstance) {
  /** Nächstes Duell-Paar: bevorzugt vergleichbare Preisklasse, sonst divers. */
  app.get('/next', { preHandler: [app.authenticate] }, async (req, reply) => {
    const models = await prisma.vehicleModel.findMany({ include: { specs: true } })
    if (models.length < 2) return reply.code(404).send({ ok: false, error: 'NOT_ENOUGH_MODELS' })

    // zuletzt duellierte Paare vermeiden
    const recent = await prisma.duelEvent.findMany({
      where: { userId: req.user.sub },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })
    const recentIds = new Set(recent.flatMap((d) => [d.winnerModelId, d.loserModelId]))
    const pool = models.filter((m) => !recentIds.has(m.id))
    const source = pool.length >= 2 ? pool : models

    const a = source[Math.floor(Math.random() * source.length)]!
    // Gegner: ähnliche Preisklasse (Faktor < 2.5), damit das Duell fair bleibt
    const priceMid = (m: typeof a) =>
      m.typicalUsedPriceMin != null && m.typicalUsedPriceMax != null
        ? (m.typicalUsedPriceMin + m.typicalUsedPriceMax) / 2
        : null
    const aPrice = priceMid(a)
    const opponents = source.filter((m) => {
      if (m.id === a.id) return false
      const p = priceMid(m)
      if (aPrice == null || p == null) return true
      const ratio = Math.max(aPrice, p) / Math.min(aPrice, p)
      return ratio <= 2.5
    })
    const b = (opponents.length > 0 ? opponents : source.filter((m) => m.id !== a.id))[
      Math.floor(Math.random() * (opponents.length > 0 ? opponents.length : source.length - 1))
    ]!
    return { ok: true, data: { a, b } }
  })

  app.post('/', { preHandler: [app.authenticate] }, async (req, reply) => {
    const body = z.object({ winnerModelId: z.string(), loserModelId: z.string() }).parse(req.body)
    if (body.winnerModelId === body.loserModelId)
      return reply.code(400).send({ ok: false, error: 'SAME_MODEL' })
    const count = await prisma.vehicleModel.count({
      where: { id: { in: [body.winnerModelId, body.loserModelId] } },
    })
    if (count !== 2) return reply.code(404).send({ ok: false, error: 'MODEL_NOT_FOUND' })

    await prisma.duelEvent.create({ data: { userId: req.user.sub, ...body } })
    const profile = await recalculateTasteProfile(req.user.sub)
    await track('duel_decided', req.user.sub)
    return { ok: true, data: { signalCount: profile.signalCount, confidence: profile.confidence } }
  })
}
