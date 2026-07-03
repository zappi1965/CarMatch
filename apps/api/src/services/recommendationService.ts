import type { GeoPoint, VehicleFilters } from '@carmatch/shared'
import { prisma } from '../db.js'
import { applySignals, emptyProfile, type UserPreferenceProfile } from '../recommendation/profile.js'
import { scoreCandidate } from '../recommendation/scoring.js'
import { explainRecommendation } from '../recommendation/explain.js'
import { buildWhere, geoWhere, filterByExactRadius } from './vehicleService.js'

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

  const profile = await getProfile(userId)
  const user = await prisma.user.findUnique({ where: { id: userId } })
  const personalization = user?.personalizationEnabled !== false

  const scored = candidates.map((c) => {
    const breakdown = scoreCandidate(
      personalization ? profile : emptyProfile(),
      {
        ...c,
        sponsoredBoost: c.sponsored.reduce((acc, s) => Math.max(acc, s.boost), 0),
      },
      { userPoint: point, radiusKm, recentlyShownKeys },
    )
    return { listing: c, breakdown }
  })

  scored.sort((a, b) => b.breakdown.finalTotal - a.breakdown.finalTotal)
  const top = scored.slice(0, limit)

  // Ergebnisse für Debugging/Erklärbarkeit persistieren
  await prisma.recommendationResult.createMany({
    data: top.map((t) => ({
      userId,
      listingId: t.listing.id,
      score: t.breakdown.organicTotal,
      sponsoredBoost: t.breakdown.sponsoredBoost,
      explanationJson: explainRecommendation(profile, t.listing) as object,
      scoreBreakdownJson: t.breakdown as unknown as object,
    })),
  })

  return top.map((t) => ({
    listing: { ...t.listing, rawData: undefined, sponsored: undefined },
    distanceKm: 'distanceKm' in t.listing ? (t.listing as { distanceKm?: number }).distanceKm : null,
    explanation: explainRecommendation(profile, t.listing),
    isSponsored: t.breakdown.sponsoredBoost > 0,
    scoreBreakdown: t.breakdown,
  }))
}

/** DSGVO: Nutzer kann sein Empfehlungsprofil vollständig zurücksetzen. */
export async function resetProfile(userId: string): Promise<void> {
  await prisma.recommendationProfile.deleteMany({ where: { userId } })
  await prisma.recommendationResult.deleteMany({ where: { userId } })
}
