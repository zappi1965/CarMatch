import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../db.js'

export async function budgetRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [app.authenticate] }, async (req) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user.sub },
      select: { monthlyBudgetEur: true },
    })
    return { ok: true, data: { monthlyBudgetEur: user?.monthlyBudgetEur ?? 450 } }
  })

  app.patch('/', { preHandler: [app.authenticate] }, async (req) => {
    const { monthlyBudgetEur } = z
      .object({ monthlyBudgetEur: z.number().int().min(100).max(5000) })
      .parse(req.body)
    const user = await prisma.user.update({
      where: { id: req.user.sub },
      data: { monthlyBudgetEur },
      select: { monthlyBudgetEur: true },
    })
    return { ok: true, data: user }
  })
}
