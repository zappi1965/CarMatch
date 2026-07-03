import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../db.js'

const savedSearchSchema = z.object({
  name: z.string().min(1).max(80),
  filterJson: z.record(z.unknown()),
  alertsEnabled: z.boolean().optional(),
})

export async function savedSearchRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [app.authenticate] }, async (req) => {
    const rows = await prisma.savedSearch.findMany({
      where: { userId: req.user.sub },
      orderBy: { createdAt: 'desc' },
    })
    return { ok: true, data: rows }
  })

  app.post('/', { preHandler: [app.authenticate] }, async (req) => {
    const body = savedSearchSchema.parse(req.body)
    const row = await prisma.savedSearch.create({
      data: { userId: req.user.sub, ...body, filterJson: body.filterJson as object },
    })
    return { ok: true, data: row }
  })

  app.delete('/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { id } = z.object({ id: z.string() }).parse(req.params)
    const row = await prisma.savedSearch.findUnique({ where: { id } })
    if (!row || row.userId !== req.user.sub)
      return reply.code(404).send({ ok: false, error: 'NOT_FOUND' })
    await prisma.savedSearch.delete({ where: { id } })
    return { ok: true }
  })
}
