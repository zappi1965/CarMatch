import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../db.js'

export async function ownedGarageRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [app.authenticate] }, async (req) => {
    const vehicles = await prisma.ownedVehicle.findMany({
      where: { userId: req.user.sub },
      include: { events: { orderBy: { date: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    })
    return {
      ok: true,
      data: vehicles.map((v) => ({
        ...v,
        currentMarketValue: v.purchasePrice ? Math.round(v.purchasePrice * 0.88) : null,
        nextReminder: v.tuvDate ? 'TÜV prüfen' : 'Ölservice bald fällig',
      })),
    }
  })
  app.post('/', { preHandler: [app.authenticate] }, async (req) => {
    const body = z
      .object({
        make: z.string(),
        model: z.string(),
        year: z.number().optional(),
        purchaseDate: z.string().optional(),
        purchasePrice: z.number().optional(),
        mileageAtPurchase: z.number().optional(),
        currentMileage: z.number().optional(),
        tuvDate: z.string().optional(),
        listingId: z.string().optional(),
      })
      .parse(req.body)
    const vehicle = await prisma.ownedVehicle.create({
      data: {
        ...body,
        userId: req.user.sub,
        purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : undefined,
        tuvDate: body.tuvDate ? new Date(body.tuvDate) : undefined,
      },
    })
    return { ok: true, data: vehicle }
  })
  app.post('/:id/events', { preHandler: [app.authenticate] }, async (req) => {
    const { id } = z.object({ id: z.string() }).parse(req.params)
    const body = z
      .object({
        type: z.string(),
        title: z.string(),
        date: z.string(),
        cost: z.number().optional(),
        note: z.string().optional(),
      })
      .parse(req.body)
    const event = await prisma.garageEvent.create({
      data: { ...body, ownedVehicleId: id, date: new Date(body.date) },
    })
    return { ok: true, data: event }
  })
}
