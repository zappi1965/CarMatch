import type { VehicleFilters, LocationQuery } from '@carmatch/shared'
import { distanceKm } from '@carmatch/shared'
import { prisma } from '../db.js'
import { buildWhere } from '../services/vehicleService.js'
import { getProfile } from '../services/recommendationService.js'
import { scoreCandidate, COLD_START_THRESHOLD } from '../recommendation/scoring.js'
import { sendPushToUser } from '../services/notification/notificationService.js'

/**
 * Traumwagen-Push: prüft neue Inserate gegen gespeicherte Suchen und
 * Empfehlungsprofile. Push nur bei aktivierter Kategorie (Consent).
 */
export async function notifySavedSearchMatches(newListingIds: string[]): Promise<void> {
  const searches = await prisma.savedSearch.findMany({
    where: { alertsEnabled: true },
    include: { user: { include: { locations: { where: { isCurrent: true }, take: 1 } } } },
  })

  for (const search of searches) {
    const stored = search.filterJson as { filters?: VehicleFilters; location?: LocationQuery }
    const filters = stored.filters ?? (stored as VehicleFilters)
    const matches = await prisma.vehicleListing.findMany({
      where: { ...buildWhere(filters), id: { in: newListingIds } },
      take: 3,
    })

    for (const m of matches) {
      const loc = search.user.locations[0]
      let distText = ''
      if (loc && m.latitude != null && m.longitude != null) {
        const d = distanceKm(
          { latitude: loc.latitude, longitude: loc.longitude },
          { latitude: m.latitude, longitude: m.longitude },
        )
        if (loc.radiusKm != null && d > loc.radiusKm) continue // außerhalb des Umkreises
        distText = `, ${Math.round(d)} km entfernt`
      }
      await sendPushToUser(search.userId, 'savedSearch', {
        title: 'Neuer Treffer für deine Suche',
        body: `${m.title}${distText} — ${m.price.toLocaleString('de-DE')} €`,
        data: { listingId: m.id },
      })
    }
    if (matches.length > 0) {
      await prisma.savedSearch.update({
        where: { id: search.id },
        data: { lastNotifiedAt: new Date() },
      })
    }
  }

  // Traumwagen-Kandidaten: neue Inserate mit sehr hohem Profil-Match
  const profiles = await prisma.recommendationProfile.findMany({
    where: { signalCount: { gte: COLD_START_THRESHOLD } },
    include: { user: { include: { locations: { where: { isCurrent: true }, take: 1 } } } },
  })
  const newListings = await prisma.vehicleListing.findMany({ where: { id: { in: newListingIds } } })

  for (const p of profiles) {
    const profile = await getProfile(p.userId)
    const loc = p.user.locations[0]
    for (const l of newListings) {
      const breakdown = scoreCandidate(profile, { ...l, sponsoredBoost: 0 }, {
        userPoint: loc ? { latitude: loc.latitude, longitude: loc.longitude } : undefined,
        radiusKm: loc?.radiusKm,
        random: () => 0, // deterministisch: kein Explorationsbonus bei Push-Entscheidung
      })
      if (breakdown.organicTotal >= 0.55) {
        await sendPushToUser(p.userId, 'newMatch', {
          title: 'Traumwagen-Kandidat gefunden',
          body: `${l.title} passt stark zu deinem Geschmack.`,
          data: { listingId: l.id },
        })
      }
    }
  }
}
