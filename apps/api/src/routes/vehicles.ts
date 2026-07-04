import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import type { VehicleFilters } from '@carmatch/shared'
import { prisma } from '../db.js'
import { discover } from '../services/recommendationService.js'
import { buildWhere, geoWhere, filterByExactRadius, getListingWithInsights } from '../services/vehicleService.js'
import { geocoder } from '../geo/geocoding.js'
import { track } from '../services/analyticsService.js'

const locationSchema = z.object({
  lat: z.coerce.number().min(-90).max(90).optional(),
  lon: z.coerce.number().min(-180).max(180).optional(),
  postalCode: z.string().max(10).optional(),
  city: z.string().max(80).optional(),
  radiusKm: z.coerce.number().positive().max(2000).optional(),
})

const filtersSchema = z.object({
  priceMin: z.coerce.number().optional(),
  priceMax: z.coerce.number().optional(),
  makes: z.union([z.string(), z.array(z.string())]).optional(),
  models: z.union([z.string(), z.array(z.string())]).optional(),
  yearMin: z.coerce.number().optional(),
  yearMax: z.coerce.number().optional(),
  mileageMin: z.coerce.number().optional(),
  mileageMax: z.coerce.number().optional(),
  powerHpMin: z.coerce.number().optional(),
  powerHpMax: z.coerce.number().optional(),
  fuelTypes: z.union([z.string(), z.array(z.string())]).optional(),
  transmissions: z.union([z.string(), z.array(z.string())]).optional(),
  drivetrains: z.union([z.string(), z.array(z.string())]).optional(),
  bodyTypes: z.union([z.string(), z.array(z.string())]).optional(),
  seatsMin: z.coerce.number().optional(),
  doorsMin: z.coerce.number().optional(),
  sellerType: z.enum(['DEALER', 'PRIVATE']).optional(),
  accidentFreeOnly: z.coerce.boolean().optional(),
  fullServiceHistoryOnly: z.coerce.boolean().optional(),
  financingAvailable: z.coerce.boolean().optional(),
  electricRangeMinKm: z.coerce.number().optional(),
  sort: z.enum(['RELEVANCE', 'PRICE_ASC', 'PRICE_DESC', 'DISTANCE', 'NEWEST', 'MILEAGE']).optional(),
})

const arr = (v: string | string[] | undefined) =>
  v == null ? undefined : Array.isArray(v) ? v : v.split(',').filter(Boolean)

function parseFilters(q: z.infer<typeof filtersSchema>): VehicleFilters {
  return {
    ...q,
    makes: arr(q.makes),
    models: arr(q.models),
    fuelTypes: arr(q.fuelTypes) as VehicleFilters['fuelTypes'],
    transmissions: arr(q.transmissions) as VehicleFilters['transmissions'],
    drivetrains: arr(q.drivetrains) as VehicleFilters['drivetrains'],
    bodyTypes: arr(q.bodyTypes) as VehicleFilters['bodyTypes'],
  }
}

async function resolvePoint(loc: z.infer<typeof locationSchema>) {
  if (loc.lat != null && loc.lon != null) return { latitude: loc.lat, longitude: loc.lon }
  if (loc.postalCode || loc.city) {
    const r = await geocoder.geocode({ postalCode: loc.postalCode, city: loc.city })
    if (r) return { latitude: r.latitude, longitude: r.longitude }
  }
  return undefined
}

export async function vehicleRoutes(app: FastifyInstance) {
  /** Discovery-Feed für das Swipen — personalisiert, umkreisbasiert. */
  app.get('/discover', { preHandler: [app.authenticate] }, async (req) => {
    const q = locationSchema.merge(filtersSchema).merge(z.object({ limit: z.coerce.number().max(50).optional() })).parse(req.query)
    const point = await resolvePoint(q)
    const results = await discover({
      userId: req.user.sub,
      point,
      radiusKm: q.radiusKm ?? null,
      filters: parseFilters(q),
      limit: q.limit ?? 20,
    })
    return { ok: true, data: results }
  })

  /** Klassische Suche mit Filtern und Sortierung. */
  app.get('/search', async (req) => {
    const q = locationSchema
      .merge(filtersSchema)
      .merge(
        z.object({
          q: z.string().max(80).optional(),
          page: z.coerce.number().min(1).default(1),
          pageSize: z.coerce.number().max(50).default(20),
        }),
      )
      .parse(req.query)
    const filters = parseFilters(q)
    const point = await resolvePoint(q)

    const where = {
      ...buildWhere(filters),
      ...(point && q.radiusKm != null ? geoWhere(point, q.radiusKm) : {}),
      // Freitext: Marke, Modell oder Titel
      ...(q.q
        ? {
            OR: [
              { make: { contains: q.q, mode: 'insensitive' as const } },
              { model: { contains: q.q, mode: 'insensitive' as const } },
              { title: { contains: q.q, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    }
    const orderBy =
      filters.sort === 'PRICE_ASC' ? { price: 'asc' as const }
      : filters.sort === 'PRICE_DESC' ? { price: 'desc' as const }
      : filters.sort === 'MILEAGE' ? { mileage: 'asc' as const }
      : { createdAt: 'desc' as const }

    const rows = await prisma.vehicleListing.findMany({
      where,
      orderBy,
      skip: (q.page - 1) * q.pageSize,
      take: q.pageSize,
    })
    const withDistance =
      point && q.radiusKm != null
        ? filterByExactRadius(rows, point, q.radiusKm)
        : rows.map((r) => ({ ...r, distanceKm: undefined as number | undefined }))

    const sorted =
      filters.sort === 'DISTANCE' && point
        ? [...withDistance].sort((a, b) => (a.distanceKm ?? 1e9) - (b.distanceKm ?? 1e9))
        : withDistance

    await track('search_used', undefined, { hasLocation: Boolean(point) })
    return { ok: true, data: sorted.map((r) => ({ ...r, rawData: undefined })), page: q.page }
  })

  /** Filteroptionen (Marken/Modelle aus Bestand) für die Filter-UI. */
  app.get('/filters/options', async () => {
    const makes = await prisma.vehicleListing.groupBy({
      by: ['make'],
      where: { isAvailable: true },
      _count: true,
      orderBy: { _count: { make: 'desc' } },
    })
    return {
      ok: true,
      data: {
        makes: makes.map((m) => ({ value: m.make, count: m._count })),
        fuelTypes: ['PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID', 'PLUGIN_HYBRID', 'LPG', 'CNG'],
        transmissions: ['MANUAL', 'AUTOMATIC', 'SEMI_AUTOMATIC'],
        bodyTypes: ['SEDAN', 'WAGON', 'SUV', 'COUPE', 'CONVERTIBLE', 'HATCHBACK', 'VAN', 'PICKUP'],
        drivetrains: ['FWD', 'RWD', 'AWD'],
        radiusOptions: [10, 25, 50, 100, 250, null],
      },
    }
  })

  /** Detail inkl. Kaufhilfe (Scores, Preisbewertung, Risiken, Attribution). */
  app.get('/:id', async (req, reply) => {
    const { id } = z.object({ id: z.string() }).parse(req.params)
    const q = locationSchema.parse(req.query)
    const point = await resolvePoint(q)
    const listing = await getListingWithInsights(id, point, req.user?.sub)
    if (!listing) return reply.code(404).send({ ok: false, error: 'NOT_FOUND' })
    await track('detail_open', undefined, { listingId: id })
    return { ok: true, data: listing }
  })

  /** "Mehr"-Ansicht: vollständige technische Daten (Quartett-Rückseite). */
  app.get('/:id/more', async (req, reply) => {
    const { id } = z.object({ id: z.string() }).parse(req.params)
    const listing = await prisma.vehicleListing.findUnique({
      where: { id },
      include: { specs: true, dealer: true },
    })
    if (!listing) return reply.code(404).send({ ok: false, error: 'NOT_FOUND' })
    await track('more_open', undefined, { listingId: id })
    return { ok: true, data: { ...listing, rawData: undefined } }
  })
}
