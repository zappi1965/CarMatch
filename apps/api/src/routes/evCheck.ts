import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../db.js'
import { calculateEvLifestyleCheck } from '../services/kaufhilfe/evLifestyle.js'

export async function evCheckRoutes(app: FastifyInstance) {
  async function runCheck(req: any) {
    const body = z
      .object({
        dailyCommuteKm: z.number(),
        weeklyKm: z.number(),
        longestRegularKm: z.number().optional(),
        homeCharging: z.boolean(),
        workCharging: z.boolean(),
        housingType: z.string(),
        preferredListingId: z.string().optional(),
      })
      .parse(req.body)
    const listing = body.preferredListingId
      ? await prisma.vehicleListing.findUnique({
          where: { id: body.preferredListingId },
          include: { specs: true },
        })
      : null
    const result = calculateEvLifestyleCheck({
      ...body,
      consumptionKwh100: listing?.specs?.consumptionL100 ?? null,
      electricRangeKm: listing?.specs?.electricRangeKm ?? null,
    })
    await prisma.evLifestyleCheck.create({
      data: {
        ...body,
        userId: req.user.sub,
        preferredListingId: body.preferredListingId,
        resultJson: result as object,
      },
    })
    const recommendations = await prisma.vehicleListing.findMany({
      where: { fuelType: 'ELECTRIC', isAvailable: true },
      take: 3,
      orderBy: { price: 'asc' },
    })
    return { ok: true, data: { result, recommendations } }
  }

  app.post('/', { preHandler: [app.authenticate] }, runCheck)
  app.post('/check', { preHandler: [app.authenticate] }, runCheck)
}
