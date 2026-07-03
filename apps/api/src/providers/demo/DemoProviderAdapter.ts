import type { NormalizedListing, SourceAttribution, VehicleFilters, LocationQuery } from '@carmatch/shared'
import { distanceKm } from '@carmatch/shared'
import type { DealerContact, VehicleProviderAdapter } from '../types.js'
import { demoListings } from './demoListings.js'

/**
 * DemoProviderAdapter — NUR für Entwicklung/Tests.
 * Liefert fiktive, klar gekennzeichnete Inserate (imagesAreDemo=true, provider="demo").
 * In Produktion durch config.ts blockiert.
 */
export class DemoProviderAdapter implements VehicleProviderAdapter {
  readonly key = 'demo'

  isConfigured(): boolean {
    return true
  }

  normalizeListing(raw: unknown): NormalizedListing {
    const r = raw as (typeof demoListings)[number]
    return {
      ...r,
      provider: this.key,
      currency: 'EUR',
      isAvailable: true,
      imagesAreDemo: true,
      rawData: undefined, // Demo-Daten sind bereits normalisiert
    }
  }

  async syncListings(): Promise<NormalizedListing[]> {
    return demoListings.map((l) => this.normalizeListing(l))
  }

  async searchListings(
    filters: VehicleFilters,
    location?: LocationQuery,
  ): Promise<NormalizedListing[]> {
    let results = await this.syncListings()
    if (filters.priceMin != null) results = results.filter((l) => l.price >= filters.priceMin!)
    if (filters.priceMax != null) results = results.filter((l) => l.price <= filters.priceMax!)
    if (filters.makes?.length)
      results = results.filter((l) =>
        filters.makes!.some((m) => m.toLowerCase() === l.make.toLowerCase()),
      )
    if (location?.point && location.radiusKm != null) {
      results = results.filter(
        (l) =>
          l.latitude != null &&
          l.longitude != null &&
          distanceKm(location.point!, { latitude: l.latitude, longitude: l.longitude }) <=
            location.radiusKm!,
      )
    }
    return results
  }

  async getListingDetails(providerListingId: string): Promise<NormalizedListing | null> {
    const found = demoListings.find((l) => l.providerListingId === providerListingId)
    return found ? this.normalizeListing(found) : null
  }

  async checkAvailability(): Promise<boolean> {
    return true
  }

  async getDealerContact(providerListingId: string): Promise<DealerContact | null> {
    const l = demoListings.find((x) => x.providerListingId === providerListingId)
    if (!l || !l.dealerName) return null
    return { name: l.dealerName, email: 'demo@example.invalid' }
  }

  getSourceAttribution(): SourceAttribution {
    return {
      provider: this.key,
      displayName: 'Demo-Daten',
      attributionText: 'Demo-Inserat — kein echtes Angebot',
      allowsPersistentStorage: true,
    }
  }
}
