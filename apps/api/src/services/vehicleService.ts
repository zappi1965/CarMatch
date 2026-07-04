import type { GeoPoint, VehicleFilters } from '@carmatch/shared'
import { boundingBox, distanceKm } from '@carmatch/shared'
import type { Prisma } from '@prisma/client'
import { prisma } from '../db.js'
import { assessPrice, computeRiskFlags } from '../scores/priceAssessment.js'
import { computeVehicleScores } from '../scores/vehicleScores.js'
import { getAdapter } from '../providers/registry.js'
import { calculateMonthlyOwnershipCost } from './kaufhilfe/monthlyCost.js'
import { buildMarketTimingInsight } from './kaufhilfe/marketTiming.js'

/** Prisma-Where aus dem gemeinsamen Filterobjekt. */
export function buildWhere(filters: VehicleFilters): Prisma.VehicleListingWhereInput {
  const where: Prisma.VehicleListingWhereInput = { isAvailable: true }
  if (filters.priceMin != null || filters.priceMax != null)
    where.price = { gte: filters.priceMin ?? undefined, lte: filters.priceMax ?? undefined }
  if (filters.makes?.length) where.make = { in: filters.makes, mode: 'insensitive' }
  if (filters.models?.length) where.model = { in: filters.models, mode: 'insensitive' }
  if (filters.yearMin != null || filters.yearMax != null)
    where.year = { gte: filters.yearMin ?? undefined, lte: filters.yearMax ?? undefined }
  if (filters.mileageMin != null || filters.mileageMax != null)
    where.mileage = { gte: filters.mileageMin ?? undefined, lte: filters.mileageMax ?? undefined }
  if (filters.powerHpMin != null || filters.powerHpMax != null)
    where.powerHp = { gte: filters.powerHpMin ?? undefined, lte: filters.powerHpMax ?? undefined }
  if (filters.fuelTypes?.length) where.fuelType = { in: filters.fuelTypes }
  if (filters.transmissions?.length) where.transmission = { in: filters.transmissions }
  if (filters.drivetrains?.length) where.drivetrain = { in: filters.drivetrains }
  if (filters.bodyTypes?.length) where.bodyType = { in: filters.bodyTypes }
  if (filters.seatsMin != null) where.seats = { gte: filters.seatsMin }
  if (filters.doorsMin != null) where.doors = { gte: filters.doorsMin }
  if (filters.colors?.length) where.color = { in: filters.colors, mode: 'insensitive' }
  if (filters.sellerType) where.sellerType = filters.sellerType
  if (filters.accidentFreeOnly) where.accidentFree = true
  if (filters.fullServiceHistoryOnly) where.fullServiceHistory = true
  if (filters.financingAvailable) where.financingAvailable = true
  if (filters.electricRangeMinKm != null)
    where.specs = { is: { electricRangeKm: { gte: filters.electricRangeMinKm } } }
  return where
}

/** Radius-Filter: SQL-Bounding-Box (Index) + exakte Haversine-Nachprüfung. */
export function geoWhere(point: GeoPoint, radiusKm: number): Prisma.VehicleListingWhereInput {
  const box = boundingBox(point, radiusKm)
  return {
    latitude: { gte: box.minLat, lte: box.maxLat },
    longitude: { gte: box.minLon, lte: box.maxLon },
  }
}

export function filterByExactRadius<T extends { latitude: number | null; longitude: number | null }>(
  listings: T[],
  point: GeoPoint,
  radiusKm: number,
): Array<T & { distanceKm: number }> {
  return listings
    .map((l) => ({
      ...l,
      distanceKm:
        l.latitude != null && l.longitude != null
          ? Math.round(distanceKm(point, { latitude: l.latitude, longitude: l.longitude }) * 10) / 10
          : Number.POSITIVE_INFINITY,
    }))
    .filter((l) => l.distanceKm <= radiusKm)
}

/** Vergleichsfahrzeuge für Marktpreis-Einschätzung: gleiche Marke+Modell, ±2 Jahre. */
export async function findComparables(listing: {
  id: string
  make: string
  model: string
  year: number | null
}) {
  return prisma.vehicleListing.findMany({
    where: {
      id: { not: listing.id },
      isAvailable: true,
      make: { equals: listing.make, mode: 'insensitive' },
      model: { equals: listing.model, mode: 'insensitive' },
      ...(listing.year != null ? { year: { gte: listing.year - 2, lte: listing.year + 2 } } : {}),
    },
    select: { price: true, mileage: true, year: true, powerHp: true },
    take: 50,
  })
}

/** Detailansicht inkl. Kaufhilfe (Preisbewertung, Risiken, Quartett-Scores, Attribution). */
export async function getListingWithInsights(id: string, userPoint?: GeoPoint, userId?: string) {
  const listing = await prisma.vehicleListing.findUnique({
    where: { id },
    include: { specs: true, dealer: true, sponsored: { where: { status: 'ACTIVE' } }, modelMatches: { include: { vehicleModel: { include: { knowledge: true } } }, take: 1 } },
  })
  if (!listing) return null

  const comparables = await findComparables(listing)
  const user = userId ? await prisma.user.findUnique({ where: { id: userId }, select: { monthlyBudgetEur: true } }) : null
  const priceAssessment = assessPrice(listing, comparables)
  const riskFlags = computeRiskFlags(listing, priceAssessment)
  const pricesPerHp = comparables
    .filter((c) => c.powerHp != null && c.powerHp > 0)
    .map((c) => c.price / c.powerHp!)
    .sort((a, b) => a - b)
  const medianPricePerHp = pricesPerHp.length >= 3 ? pricesPerHp[Math.floor(pricesPerHp.length / 2)] : undefined

  const scores = computeVehicleScores({
    powerHp: listing.powerHp,
    weightKg: listing.specs?.weightKg,
    zeroToHundred: listing.specs?.zeroToHundred,
    bodyType: listing.bodyType,
    fuelType: listing.fuelType,
    transmission: listing.transmission,
    drivetrain: listing.drivetrain,
    seats: listing.seats,
    doors: listing.doors,
    trunkVolumeL: listing.specs?.trunkVolumeL,
    consumptionL100: listing.consumptionL100 ?? listing.specs?.consumptionL100,
    co2GKm: listing.co2GKm,
    price: listing.price,
    mileage: listing.mileage,
    year: listing.year,
    electricRangeKm: listing.specs?.electricRangeKm,
    features: (listing.features as string[] | null) ?? undefined,
    comparablesCount: comparables.length,
    medianPricePerHp,
  })

  const monthlyCost = calculateMonthlyOwnershipCost({
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
    userMonthlyBudgetEur: user?.monthlyBudgetEur,
  })
  const priceHistory = await prisma.vehiclePriceHistory.findMany({ where: { OR: [{ listingId: listing.id }, { modelId: listing.vehicleModelId ?? undefined }] }, orderBy: { date: 'asc' }, take: 60 })
  const marketTiming = buildMarketTimingInsight({ currentPrice: listing.price, model: `${listing.make} ${listing.model}`, bodyType: listing.bodyType, history: priceHistory.map((h) => ({ price: h.price, date: h.date })), monthlyBudget: user?.monthlyBudgetEur })
  const modelKnowledge = listing.modelMatches[0]?.vehicleModel.knowledge ?? null

  const attribution = getAdapter(listing.provider)?.getSourceAttribution() ?? null
  const dist =
    userPoint && listing.latitude != null && listing.longitude != null
      ? Math.round(distanceKm(userPoint, { latitude: listing.latitude, longitude: listing.longitude }) * 10) / 10
      : null

  return {
    ...listing,
    rawData: undefined, // Rohdaten nicht an Clients ausliefern
    distanceKm: dist,
    priceAssessment,
    monthlyCost,
    marketTiming,
    modelKnowledge,
    riskFlags,
    scores,
    attribution,
    isSponsored: listing.sponsored.length > 0,
  }
}
