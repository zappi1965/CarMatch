import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../db.js'
import { calculateMonthlyOwnershipCost } from '../services/kaufhilfe/monthlyCost.js'
import { updateProfileFromSwipe } from '../services/recommendationService.js'

function withCost(listing: any, budget?: number | null) {
  return {
    ...listing,
    rawData: undefined,
    monthlyCost: calculateMonthlyOwnershipCost({
      price: listing.price,
      year: listing.year,
      mileage: listing.mileage,
      powerHp: listing.powerHp,
      fuelType: listing.fuelType,
      consumptionL100: listing.consumptionL100 ?? listing.specs?.consumptionL100,
      energyConsumptionKwh100: listing.specs?.consumptionL100,
      co2GKm: listing.co2GKm,
      displacementCcm: listing.displacementCcm,
      bodyType: listing.bodyType,
      userMonthlyBudgetEur: budget,
    }),
  }
}

export async function duelRoutes(app: FastifyInstance) {
  async function nextPair(req: any, reply: any) {
    const user = await prisma.user.findUnique({ where: { id: req.user.sub } })
    const rows = await prisma.vehicleListing.findMany({
      where: { isAvailable: true },
      include: { specs: true },
      orderBy: [{ qualityScore: 'desc' }, { createdAt: 'desc' }],
      take: 80,
    })
    const pool = rows.sort(() => Math.random() - 0.5).slice(0, 2)
    if (pool.length < 2) {
      return reply.code(404).send({ ok: false, error: 'NOT_ENOUGH_LISTINGS_FOR_DUEL' })
    }
    return {
      ok: true,
      data: {
        left: withCost(pool[0], user?.monthlyBudgetEur),
        right: withCost(pool[1], user?.monthlyBudgetEur),
      },
    }
  }

  app.get('/next', { preHandler: [app.authenticate] }, nextPair)
  // Alias für die neue Demo-UI und spätere semantische API.
  app.get('/pair', { preHandler: [app.authenticate] }, nextPair)

  app.post('/vote', { preHandler: [app.authenticate] }, async (req) => {
    const body = z
      .object({
        winnerListingId: z.string().optional(),
        loserListingId: z.string().optional(),
        // UI-Alias: in der App werden Inserate als Vehicles bezeichnet.
        winnerVehicleId: z.string().optional(),
        loserVehicleId: z.string().optional(),
        bothUninteresting: z.boolean().optional(),
      })
      .parse(req.body)

    const winnerListingId = body.winnerListingId ?? body.winnerVehicleId
    const loserListingId = body.loserListingId ?? body.loserVehicleId

    if (body.bothUninteresting && winnerListingId && loserListingId) {
      await prisma.swipeEvent.createMany({
        data: [winnerListingId, loserListingId].map((listingId) => ({
          userId: req.user.sub,
          listingId,
          action: 'SKIP' as const,
        })),
      })
      return { ok: true, data: { skipped: true } }
    }

    if (!winnerListingId || !loserListingId) {
      return { ok: false, error: 'WINNER_AND_LOSER_REQUIRED' }
    }

    const signal = await prisma.duelSignal.create({
      data: { userId: req.user.sub, winnerListingId, loserListingId, weight: 3.5 },
    })
    // Paarvergleich zusätzlich als starke LIKE/DISLIKE-Signale in das bestehende Profil einspeisen.
    const winSwipe = await prisma.swipeEvent.create({
      data: {
        userId: req.user.sub,
        listingId: winnerListingId,
        action: 'SUPERLIKE',
        dwellTimeMs: 3500,
      },
    })
    const loseSwipe = await prisma.swipeEvent.create({
      data: {
        userId: req.user.sub,
        listingId: loserListingId,
        action: 'DISLIKE',
        dwellTimeMs: 3500,
      },
    })
    await updateProfileFromSwipe(req.user.sub, winSwipe.id)
    await updateProfileFromSwipe(req.user.sub, loseSwipe.id)
    return { ok: true, data: signal }
  })

  app.post('/skip', { preHandler: [app.authenticate] }, async (req) => {
    const body = z.object({ leftListingId: z.string(), rightListingId: z.string() }).parse(req.body)
    await prisma.swipeEvent.createMany({
      data: [body.leftListingId, body.rightListingId].map((listingId) => ({
        userId: req.user.sub,
        listingId,
        action: 'SKIP' as const,
      })),
    })
    return { ok: true, data: { skipped: true } }
  })
}
