import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../db.js'
import { estimateVehicleValue } from '../scores/valuation.js'
import { track } from '../services/analyticsService.js'

const vehicleSchema = z.object({
  make: z.string().min(1).max(60),
  model: z.string().min(1).max(60),
  variant: z.string().max(80).optional(),
  year: z.number().int().min(1950).max(2030).optional(),
  mileage: z.number().int().nonnegative().optional(),
  powerHp: z.number().int().positive().optional(),
  fuelType: z.enum(['PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID', 'PLUGIN_HYBRID', 'LPG', 'CNG', 'OTHER']).optional(),
})

async function valuate(input: z.infer<typeof vehicleSchema>) {
  const comparables = await prisma.vehicleListing.findMany({
    where: {
      isAvailable: true,
      make: { equals: input.make, mode: 'insensitive' },
      model: { contains: input.model, mode: 'insensitive' },
      ...(input.year != null ? { year: { gte: input.year - 3, lte: input.year + 3 } } : {}),
    },
    select: { price: true, mileage: true, year: true },
    take: 50,
  })
  return estimateVehicleValue(input, comparables)
}

/**
 * C2B ("Was ist mein Auto wert?"): Bewertung aus eigenen Vergleichsinseraten,
 * optional als Ankauf-Lead speicherbar (SellRequest — spätere Händler-Monetarisierung).
 */
export async function sellRoutes(app: FastifyInstance) {
  app.post('/valuation', { preHandler: [app.authenticate] }, async (req) => {
    const body = vehicleSchema.parse(req.body)
    const result = await valuate(body)
    await track('sell_valuation', req.user.sub, { hasEstimate: result.estimate != null })
    return { ok: true, data: result }
  })

  /** Ankauf-Angebote anfordern → gespeicherter, später abrechenbarer Lead. */
  app.post('/request', { preHandler: [app.authenticate] }, async (req) => {
    const body = vehicleSchema.extend({ contactEmail: z.string().email().optional() }).parse(req.body)
    const valuation = await valuate(body)
    const request = await prisma.sellRequest.create({
      data: {
        userId: req.user.sub,
        ...body,
        estimatedValue: valuation.estimate,
        estimateConfidence: valuation.confidence,
      },
    })
    await track('sell_request_created', req.user.sub)
    return { ok: true, data: { id: request.id, valuation } }
  })

  app.get('/requests', { preHandler: [app.authenticate] }, async (req) => {
    const rows = await prisma.sellRequest.findMany({
      where: { userId: req.user.sub },
      orderBy: { createdAt: 'desc' },
    })
    return { ok: true, data: rows }
  })
}
