import type { FastifyInstance } from 'fastify'
import { prisma } from '../db.js'
import {
  getTasteProfile,
  recalculateTasteProfile,
  resetTasteProfile,
} from '../services/tasteProfileService.js'
import { TASTE_SUMMARY_THRESHOLD, topEntries } from '../recommendation/taste.js'

export async function tasteProfileRoutes(app: FastifyInstance) {
  /** Geschmacksprofil des Nutzers (für Summary-Screen). */
  app.get('/me', { preHandler: [app.authenticate] }, async (req) => {
    const [row, profile] = await Promise.all([
      prisma.userTasteProfile.findUnique({ where: { userId: req.user.sub } }),
      getTasteProfile(req.user.sub),
    ])
    return {
      ok: true,
      data: {
        summaryText: row?.summaryText ?? null,
        confidence: profile.confidence,
        signalCount: profile.signalCount,
        summaryReady: profile.signalCount >= TASTE_SUMMARY_THRESHOLD,
        threshold: TASTE_SUMMARY_THRESHOLD,
        topMakes: topEntries(profile.makes, 3).map(([k]) => k),
        topSegments: topEntries(profile.segments, 3).map(([k]) => k),
        topBodyTypes: topEntries(profile.bodyTypes, 3).map(([k]) => k),
        targetPowerHp: profile.targetPowerHp ?? null,
        priceRange: profile.priceRange ?? null,
      },
    }
  })

  app.get('/insights', { preHandler: [app.authenticate] }, async (req) => {
    const insights = await prisma.tasteProfileInsight.findMany({
      where: { userId: req.user.sub },
      orderBy: { confidence: 'desc' },
    })
    return { ok: true, data: insights }
  })

  app.post('/recalculate', { preHandler: [app.authenticate] }, async (req) => {
    const profile = await recalculateTasteProfile(req.user.sub)
    return { ok: true, data: { signalCount: profile.signalCount, confidence: profile.confidence } }
  })

  /** DSGVO: Geschmacksprofil + Modell-Swipes löschen. */
  app.post('/reset', { preHandler: [app.authenticate] }, async (req) => {
    await resetTasteProfile(req.user.sub)
    return { ok: true }
  })
}
