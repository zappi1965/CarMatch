import { prisma } from '../db.js'
import { getActiveAdapters } from '../providers/registry.js'
import { computeQualityScore } from '../scores/priceAssessment.js'
import { enrichListing } from '../enrichment/enrichmentService.js'
import { notifySavedSearchMatches } from './savedSearchAlerts.js'

/**
 * Listing-Sync: holt alle aktiven Provider, normalisiert, upsertet.
 * - Preisänderungen → PriceHistory (für Preisalarm)
 * - nicht mehr gelieferte Inserate → isAvailable=false (Verfügbarkeitscheck)
 * - neue Inserate → Enrichment + Saved-Search-Alerts
 */
export async function syncAllProviders() {
  const summary: Array<{ provider: string; imported: number; updated: number; deactivated: number; error?: string }> = []

  for (const adapter of getActiveAdapters()) {
    const log = await prisma.importLog.create({
      data: { provider: adapter.key, status: 'running' },
    })
    try {
      const listings = await adapter.syncListings()
      let imported = 0
      let updated = 0
      const seenIds: string[] = []
      const newListingIds: string[] = []

      for (const l of listings) {
        seenIds.push(l.providerListingId)
        const existing = await prisma.vehicleListing.findUnique({
          where: { provider_providerListingId: { provider: l.provider, providerListingId: l.providerListingId } },
        })
        const data = {
          sourceUrl: l.sourceUrl,
          make: l.make, model: l.model, variant: l.variant, title: l.title,
          description: l.description, price: l.price, currency: l.currency,
          year: l.year, firstRegistration: l.firstRegistration, mileage: l.mileage,
          powerKw: l.powerKw, powerHp: l.powerHp, fuelType: l.fuelType,
          transmission: l.transmission, drivetrain: l.drivetrain, bodyType: l.bodyType,
          doors: l.doors, seats: l.seats, color: l.color, interior: l.interior,
          features: l.features, consumptionL100: l.consumptionL100, co2GKm: l.co2GKm,
          displacementCcm: l.displacementCcm, previousOwners: l.previousOwners,
          accidentFree: l.accidentFree, inspectionValidUntil: l.inspectionValidUntil,
          fullServiceHistory: l.fullServiceHistory, warranty: l.warranty,
          financingAvailable: l.financingAvailable, images: l.images,
          imagesAreDemo: l.imagesAreDemo ?? false, imageAttribution: l.imageAttribution,
          sellerType: l.sellerType,
          latitude: l.latitude, longitude: l.longitude, postalCode: l.postalCode,
          city: l.city, country: l.country, isAvailable: true,
          qualityScore: computeQualityScore(l as unknown as Record<string, unknown>),
          rawData: l.rawData as object | undefined,
          lastSyncedAt: new Date(),
        }

        if (existing) {
          if (existing.price !== l.price) {
            await prisma.priceHistory.create({
              data: { listingId: existing.id, price: existing.price },
            })
          }
          await prisma.vehicleListing.update({ where: { id: existing.id }, data })
          updated++
        } else {
          // Händler anlegen/zuordnen, falls vom Provider geliefert
          let dealerId: string | undefined
          if (l.sellerType === 'DEALER' && l.dealerName) {
            const dealer = await prisma.dealer.upsert({
              where: { id: `${l.provider}:${l.dealerName}` },
              create: { id: `${l.provider}:${l.dealerName}`, name: l.dealerName, source: l.provider, city: l.city },
              update: {},
            })
            dealerId = dealer.id
          }
          const created = await prisma.vehicleListing.create({
            data: { ...data, provider: l.provider, providerListingId: l.providerListingId, dealerId },
          })
          newListingIds.push(created.id)
          imported++
        }
      }

      // Verfügbarkeitscheck: alles, was der Provider nicht mehr liefert, deaktivieren
      const { count: deactivated } = await prisma.vehicleListing.updateMany({
        where: { provider: adapter.key, providerListingId: { notIn: seenIds }, isAvailable: true },
        data: { isAvailable: false },
      })

      for (const id of newListingIds) await enrichListing(id)
      if (newListingIds.length > 0) await notifySavedSearchMatches(newListingIds)

      await prisma.importLog.update({
        where: { id: log.id },
        data: { status: 'ok', imported, updated, deactivated, finishedAt: new Date() },
      })
      await prisma.providerState.upsert({
        where: { provider: adapter.key },
        create: { provider: adapter.key, lastSyncAt: new Date() },
        update: { lastSyncAt: new Date(), lastError: null },
      })
      summary.push({ provider: adapter.key, imported, updated, deactivated })
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      await prisma.importLog.update({
        where: { id: log.id },
        data: { status: 'error', errorText: msg, finishedAt: new Date() },
      })
      await prisma.providerState.upsert({
        where: { provider: adapter.key },
        create: { provider: adapter.key, lastError: msg },
        update: { lastError: msg },
      })
      summary.push({ provider: adapter.key, imported: 0, updated: 0, deactivated: 0, error: msg })
    }
  }
  return summary
}
