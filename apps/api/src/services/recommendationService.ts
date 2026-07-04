import type { GeoPoint, VehicleFilters } from '@carmatch/shared'
import { distanceKm } from '@carmatch/shared'
import { prisma } from '../db.js'
import { applySignals, emptyProfile, type UserPreferenceProfile } from '../recommendation/profile.js'
import {
  generateRecommendationExplanation,
  scoreListingHybrid,
} from '../recommendation/hybridScoring.js'
import { emptyTasteProfile } from '../recommendation/taste.js'
import { getTasteProfile } from './tasteProfileService.js'
import { buildWhere, geoWhere, filterByExactRadius } from './vehicleService.js'
import { calculateMonthlyOwnershipCost } from './kaufhilfe/monthlyCost.js'

/** Lädt (oder initialisiert) das persistierte Präferenzprofil. */
export async function getProfile(userId: string): Promise<UserPreferenceProfile> {
  const row = await prisma.recommendationProfile.findUnique({ where: { userId } })
  if (!row) return emptyProfile()
  const p = row.weightsJson as unknown as UserPreferenceProfile
  return { ...emptyProfile(), ...p, signalCount: row.signalCount }
}

/** Aktualisiert das Profil inkrementell nach neuen Swipes. */
export async function updateProfileFromSwipe(userId: string, swipeId: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user?.personalizationEnabled) return // Nutzer hat Personalisierung deaktiviert

  const swipe = await prisma.swipeEvent.findUnique({
    where: { id: swipeId },
    include: { listing: true },
  })
  if (!swipe || swipe.undone) return

  const isFavorite = Boolean(
    await prisma.favorite.findUnique({
      where: { userId_listingId: { userId, listingId: swipe.listingId } },
    }),
  )

  const profile = await getProfile(userId)
  const updated = applySignals(profile, [
    {
      action: swipe.action,
      dwellTimeMs: swipe.dwellTimeMs,
      openedDetails: swipe.openedDetails,
      openedMore: swipe.openedMore,
      contactedDealer: swipe.contactedDealer,
      isFavorite,
      listing: swipe.listing,
    },
  ])

  await prisma.recommendationProfile.upsert({
    where: { userId },
    create: {
      userId,
      weightsJson: updated as object,
      dislikedPatternsJson: updated.dislikedPatterns,
      signalCount: updated.signalCount,
    },
    update: {
      weightsJson: updated as object,
      dislikedPatternsJson: updated.dislikedPatterns,
      signalCount: updated.signalCount,
      lastUpdatedAt: new Date(),
    },
  })
}

export interface DiscoverOptions {
  userId: string
  point?: GeoPoint
  radiusKm?: number | null
  filters?: VehicleFilters
  limit?: number
}

/**
 * Discovery-Feed: Kandidaten laden (ungesehen, im Radius, Filter),
 * hybrid scoren, Ergebnis inkl. Erklärung + getrenntem Sponsored-Boost liefern.
 */
export async function discover(opts: DiscoverOptions) {
  const { userId, point, radiusKm, filters = {}, limit = 20 } = opts

  const swiped = await prisma.swipeEvent.findMany({
    where: { userId, undone: false },
    select: { listingId: true },
  })
  const swipedIds = swiped.map((s) => s.listingId)

  // zuletzt gezeigte Empfehlungen → Diversity-Malus für gleiche Marke/Karosserie
  const recent = await prisma.recommendationResult.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 15,
    include: { listing: { select: { make: true, bodyType: true } } },
  })
  const recentlyShownKeys = recent.flatMap((r) => [
    `make:${r.listing.make}`,
    `body:${r.listing.bodyType}`,
  ])

  const where = {
    ...buildWhere(filters),
    ...(point && radiusKm != null ? geoWhere(point, radiusKm) : {}),
    id: { notIn: swipedIds.slice(0, 5000) },
  }

  const candidatesRaw = await prisma.vehicleListing.findMany({
    where,
    include: { sponsored: { where: { status: 'ACTIVE' } } },
    take: 300,
    orderBy: { createdAt: 'desc' },
  })

  const candidates =
    point && radiusKm != null ? filterByExactRadius(candidatesRaw, point, radiusKm) : candidatesRaw

  // Hybrid: Geschmacksprofil (Inspirationsmodus + Inseratsverhalten)
  const user = await prisma.user.findUnique({ where: { id: userId } })
  const personalization = user?.personalizationEnabled !== false
  const taste = personalization ? await getTasteProfile(userId) : emptyTasteProfile()

  const scored = candidates.map((c) => {
    const breakdown = scoreListingHybrid(
      taste,
      { ...c, sponsoredBoost: c.sponsored.reduce((acc, s) => Math.max(acc, s.boost), 0) },
      { userPoint: point, radiusKm, recentlyShownKeys },
    )
    const estimatedMonthly = calculateMonthlyOwnershipCost({
      price: c.price, year: c.year, mileage: c.mileage, powerHp: c.powerHp,
      fuelType: c.fuelType, consumptionL100: c.consumptionL100, co2GKm: c.co2GKm,
      displacementCcm: c.displacementCcm, bodyType: c.bodyType,
      userMonthlyBudgetEur: user?.monthlyBudgetEur,
    })
    if (user?.monthlyBudgetEur) {
      const overRatio = estimatedMonthly.total / user.monthlyBudgetEur
      const penalty = overRatio <= 1 ? 0.04 : overRatio <= 1.15 ? -0.04 : -0.14
      breakdown.contextFit = Math.max(0, Math.min(1, breakdown.contextFit + penalty))
      breakdown.organicTotal = Math.round((breakdown.organicTotal + penalty) * 1000) / 1000
      breakdown.finalTotal = Math.round((breakdown.organicTotal + breakdown.sponsoredBoost) * 1000) / 1000
    }
    return { listing: c, breakdown }
  })

  scored.sort((a, b) => b.breakdown.finalTotal - a.breakdown.finalTotal)
  const top = scored.slice(0, limit)

  const explain = (t: (typeof top)[number]) => {
    const dist =
      point && t.listing.latitude != null && t.listing.longitude != null
        ? distanceKm(point, { latitude: t.listing.latitude, longitude: t.listing.longitude })
        : null
    return generateRecommendationExplanation(taste, t.listing, t.breakdown, dist)
  }

  // Ergebnisse für Debugging/Erklärbarkeit persistieren
  await prisma.recommendationResult.createMany({
    data: top.map((t) => ({
      userId,
      listingId: t.listing.id,
      score: t.breakdown.organicTotal,
      sponsoredBoost: t.breakdown.sponsoredBoost,
      explanationJson: explain(t) as object,
      scoreBreakdownJson: t.breakdown as unknown as object,
    })),
  })

  return top.map((t) => {
    const monthlyCost = calculateMonthlyOwnershipCost({
      price: t.listing.price,
      year: t.listing.year,
      mileage: t.listing.mileage,
      powerHp: t.listing.powerHp,
      fuelType: t.listing.fuelType,
      consumptionL100: t.listing.consumptionL100,
      co2GKm: t.listing.co2GKm,
      displacementCcm: t.listing.displacementCcm,
      bodyType: t.listing.bodyType,
      userMonthlyBudgetEur: user?.monthlyBudgetEur,
    })
    return {
      listing: { ...t.listing, rawData: undefined, sponsored: undefined, monthlyCost },
      distanceKm: 'distanceKm' in t.listing ? (t.listing as { distanceKm?: number }).distanceKm : null,
      explanation: explain(t),
      isSponsored: t.breakdown.sponsoredBoost > 0,
      scoreBreakdown: t.breakdown,
    }
  })
}

/** DSGVO: Nutzer kann sein Empfehlungsprofil vollständig zurücksetzen. */
export async function resetProfile(userId: string): Promise<void> {
  await prisma.recommendationProfile.deleteMany({ where: { userId } })
  await prisma.recommendationResult.deleteMany({ where: { userId } })
}
