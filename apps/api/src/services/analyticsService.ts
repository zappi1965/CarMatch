import { prisma } from '../db.js'

/**
 * Datenschutzfreundliches Tracking: nur Ereignistypen + minimale Metadaten,
 * keine Inhalte, keine Gerätekennungen. userId optional (anonym möglich).
 */
export async function track(
  type: string,
  userId?: string | null,
  meta?: Record<string, string | number | boolean>,
): Promise<void> {
  try {
    await prisma.analyticsEvent.create({ data: { type, userId: userId ?? null, meta } })
  } catch {
    // Analytics darf nie einen Request scheitern lassen
  }
}

/** Kennzahlen fürs Admin-Panel (Business-Metriken aus dem Prompt-Katalog). */
export async function getStats() {
  const dayAgo = new Date(Date.now() - 86_400_000)
  const monthAgo = new Date(Date.now() - 30 * 86_400_000)

  const [dau, mau, swipes, likes, superlikes, dislikes, favorites, detailOpens, moreOpens, leads, savedSearches, pushOptIns, totalUsers, totalListings] =
    await Promise.all([
      prisma.analyticsEvent.groupBy({ by: ['userId'], where: { createdAt: { gte: dayAgo }, userId: { not: null } } }).then((r) => r.length),
      prisma.analyticsEvent.groupBy({ by: ['userId'], where: { createdAt: { gte: monthAgo }, userId: { not: null } } }).then((r) => r.length),
      prisma.swipeEvent.count({ where: { undone: false } }),
      prisma.swipeEvent.count({ where: { action: 'LIKE', undone: false } }),
      prisma.swipeEvent.count({ where: { action: 'SUPERLIKE', undone: false } }),
      prisma.swipeEvent.count({ where: { action: 'DISLIKE', undone: false } }),
      prisma.favorite.count(),
      prisma.swipeEvent.count({ where: { openedDetails: true } }),
      prisma.swipeEvent.count({ where: { openedMore: true } }),
      prisma.lead.count(),
      prisma.savedSearch.count(),
      prisma.analyticsEvent.count({ where: { type: 'push_optin' } }),
      prisma.user.count(),
      prisma.vehicleListing.count({ where: { isAvailable: true } }),
    ])

  const mostLiked = await prisma.swipeEvent.groupBy({
    by: ['listingId'],
    where: { action: { in: ['LIKE', 'SUPERLIKE'] }, undone: false },
    _count: true,
    orderBy: { _count: { listingId: 'desc' } },
    take: 5,
  })

  return {
    dau, mau, totalUsers, totalListings,
    swipes, likes, superlikes, dislikes, favorites,
    detailOpens, moreOpens, leads, savedSearches, pushOptIns,
    leadConversionRate: likes > 0 ? Math.round((leads / likes) * 1000) / 10 : 0,
    mostLikedListingIds: mostLiked.map((m) => m.listingId),
  }
}
