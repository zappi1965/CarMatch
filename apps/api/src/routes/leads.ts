import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import type { LeadType } from '@prisma/client'
import { prisma } from '../db.js'
import { track } from '../services/analyticsService.js'

const leadSchema = z.object({
  listingId: z.string(),
  message: z.string().max(2000).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().max(30).optional(),
})

/**
 * Händler-Leads: Kern der Monetarisierung. Jede Anfrage wird gespeichert und
 * getrackt (monetizationStatus für spätere Abrechnung). Der Versand an den
 * Händler folgt in v0.2 (E-Mail/API), MVP persistiert und markiert die Swipe-
 * Historie (contactedDealer) als starkes Recommendation-Signal.
 */
export async function leadRoutes(app: FastifyInstance) {
  const createLead = (type: LeadType) => async (req: FastifyRequest, reply: FastifyReply) => {
    const body = leadSchema.parse(req.body)
    const listing = await prisma.vehicleListing.findUnique({ where: { id: body.listingId } })
    if (!listing) return reply.code(404).send({ ok: false, error: 'LISTING_NOT_FOUND' })

    const lead = await prisma.lead.create({
      data: {
        userId: req.user.sub,
        listingId: body.listingId,
        dealerId: listing.dealerId,
        type,
        message: body.message,
        contactEmail: body.contactEmail,
        contactPhone: body.contactPhone,
      },
    })

    // Kontaktanfrage = stärkstes positives Signal für das Empfehlungsprofil
    await prisma.swipeEvent.updateMany({
      where: { userId: req.user.sub, listingId: body.listingId },
      data: { contactedDealer: true },
    })
    await track('lead_created', req.user.sub, { type, provider: listing.provider })
    return { ok: true, data: { id: lead.id, status: lead.status } }
  }

  app.post('/contact', { preHandler: [app.authenticate] }, createLead('GENERAL'))
  app.post('/test-drive', { preHandler: [app.authenticate] }, createLead('TEST_DRIVE'))
  app.post('/finance', { preHandler: [app.authenticate] }, createLead('FINANCE'))
  app.post('/availability', { preHandler: [app.authenticate] }, createLead('AVAILABILITY'))
  app.post('/callback', { preHandler: [app.authenticate] }, createLead('CALLBACK'))

  app.get('/', { preHandler: [app.authenticate] }, async (req) => {
    const leads = await prisma.lead.findMany({
      where: { userId: req.user.sub },
      orderBy: { createdAt: 'desc' },
      include: { listing: { select: { title: true, make: true, model: true, price: true } } },
    })
    return { ok: true, data: leads }
  })
}
