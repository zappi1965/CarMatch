import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../db.js'

function estimateValue(input: {
  make: string
  model: string
  year: number
  mileage: number
  condition: string
}) {
  const baseByMake: Record<string, number> = {
    Porsche: 76000,
    BMW: 42000,
    Audi: 39000,
    'Mercedes-Benz': 41000,
    Tesla: 35000,
    Volkswagen: 26000,
    Mazda: 24000,
    Volvo: 36000,
    Hyundai: 31000,
    Kia: 31000,
  }
  const base = baseByMake[input.make] ?? 25000
  const age = Math.max(0, new Date().getFullYear() - input.year)
  const ageFactor = Math.pow(0.88, age)
  const mileageFactor = Math.max(0.35, 1 - input.mileage / 280000)
  const conditionFactor =
    input.condition === 'excellent'
      ? 1.08
      : input.condition === 'good'
        ? 1
        : input.condition === 'fair'
          ? 0.88
          : 0.75
  const mid = Math.round(base * ageFactor * mileageFactor * conditionFactor)
  return { min: Math.round(mid * 0.9), max: Math.round(mid * 1.12) }
}

export async function sellerRoutes(app: FastifyInstance) {
  app.post('/estimate', { preHandler: [app.authenticate] }, async (req) => {
    const body = z
      .object({
        make: z.string(),
        model: z.string(),
        year: z.number().int(),
        mileage: z.number().int(),
        fuelType: z.string().optional(),
        condition: z.string().default('good'),
        contactName: z.string().optional(),
        contactEmail: z.string().email().optional(),
        contactPhone: z.string().optional(),
      })
      .parse(req.body)
    const { min, max } = estimateValue(body)
    const lead = await prisma.sellerLead.create({
      data: {
        ...body,
        fuelType: body.fuelType as never,
        userId: req.user.sub,
        estimatedValueMin: min,
        estimatedValueMax: max,
      },
    })
    return {
      ok: true,
      data: {
        leadId: lead.id,
        estimatedValueMin: min,
        estimatedValueMax: max,
        comparableHint: 'Demo-Schätzung aus Modell, Alter, Laufleistung und Zustand.',
        cta: 'Wir können dich später mit passenden Ankauf-Händlern verbinden.',
      },
    }
  })
}
