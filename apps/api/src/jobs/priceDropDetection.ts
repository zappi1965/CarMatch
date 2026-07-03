import { prisma } from '../db.js'
import { sendPushToUser } from '../services/notification/notificationService.js'

/**
 * Preisalarm: benachrichtigt Nutzer, deren Favoriten günstiger geworden sind,
 * und meldet Favoriten, die nicht mehr verfügbar sind.
 */
export async function detectPriceDropsAndGone(): Promise<void> {
  const favorites = await prisma.favorite.findMany({
    include: {
      listing: { include: { priceHistory: { orderBy: { recordedAt: 'desc' }, take: 1 } } },
    },
  })

  for (const fav of favorites) {
    const prev = fav.listing.priceHistory[0]
    // Preisverfall: letzter historischer Preis > aktueller Preis und Änderung jünger als 24h
    if (
      prev &&
      prev.price > fav.listing.price &&
      Date.now() - prev.recordedAt.getTime() < 24 * 3600_000
    ) {
      await sendPushToUser(fav.userId, 'priceDrop', {
        title: 'Preis gefallen',
        body: `${fav.listing.title}: jetzt ${fav.listing.price.toLocaleString('de-DE')} € (vorher ${prev.price.toLocaleString('de-DE')} €)`,
        data: { listingId: fav.listingId },
      })
    }
    if (!fav.listing.isAvailable) {
      await sendPushToUser(fav.userId, 'favoriteGone', {
        title: 'Favorit nicht mehr verfügbar',
        body: `${fav.listing.title} ist nicht mehr online.`,
        data: { listingId: fav.listingId },
      })
    }
  }
}
