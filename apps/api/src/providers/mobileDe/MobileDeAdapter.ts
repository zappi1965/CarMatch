import type { NormalizedListing, SourceAttribution, VehicleFilters, LocationQuery } from '@carmatch/shared'
import { config } from '../../config.js'
import type { DealerContact, VehicleProviderAdapter } from '../types.js'
import { normalizeMobileDeAd, type MobileDeRawAd } from './normalize.js'

/**
 * mobile.de Search-API Adapter.
 *
 * WICHTIG (rechtlich): Die mobile.de Search-API ist eine Partner-API und erfordert
 * einen Vertrag mit mobile.de (https://services.mobile.de). Zugangsdaten kommen
 * per ENV (MOBILE_DE_API_USERNAME/PASSWORD). Ohne Credentials ist der Adapter
 * inaktiv (isConfigured() === false) — es findet KEIN Scraping statt.
 *
 * Nutzung der Daten unterliegt den API-Nutzungsbedingungen von mobile.de:
 * - Attribution wird pro Inserat gespeichert und in der UI angezeigt.
 * - sourceUrl verlinkt auf das Original-Inserat ("Zum Inserat"-CTA).
 * - Persistente Speicherung nur gemäß Vertrag (siehe allowsPersistentStorage).
 */
export class MobileDeAdapter implements VehicleProviderAdapter {
  readonly key = 'mobile_de'

  isConfigured(): boolean {
    return Boolean(config.MOBILE_DE_API_USERNAME && config.MOBILE_DE_API_PASSWORD)
  }

  private authHeader(): string {
    const cred = `${config.MOBILE_DE_API_USERNAME}:${config.MOBILE_DE_API_PASSWORD}`
    return `Basic ${Buffer.from(cred).toString('base64')}`
  }

  private async request(path: string, params: URLSearchParams): Promise<unknown> {
    const url = `${config.MOBILE_DE_API_BASE_URL}${path}?${params.toString()}`
    const res = await fetch(url, {
      headers: {
        Authorization: this.authHeader(),
        Accept: 'application/vnd.de.mobile.api+json',
      },
    })
    if (res.status === 429) {
      // Rate-Limit-Handling: einmaliger Retry nach Wartezeit
      await new Promise((r) => setTimeout(r, 2000))
      return this.request(path, params)
    }
    if (!res.ok) throw new Error(`mobile.de API ${res.status}: ${await res.text()}`)
    return res.json()
  }

  private buildParams(filters: VehicleFilters, location?: LocationQuery): URLSearchParams {
    const p = new URLSearchParams()
    p.set('classification', 'refdata/classes/Car')
    if (filters.priceMin != null) p.set('price.min', String(filters.priceMin))
    if (filters.priceMax != null) p.set('price.max', String(filters.priceMax))
    if (filters.mileageMax != null) p.set('mileage.max', String(filters.mileageMax))
    if (filters.yearMin != null) p.set('firstRegistrationDate.min', `${filters.yearMin}-01`)
    for (const make of filters.makes ?? []) p.append('makeModelDescription.make', make.toUpperCase())
    if (location?.point && location.radiusKm != null) {
      p.set('latitude', String(location.point.latitude))
      p.set('longitude', String(location.point.longitude))
      p.set('radius', String(location.radiusKm))
    } else if (location?.postalCode) {
      p.set('zipcode', location.postalCode)
      if (location.radiusKm != null) p.set('radius', String(location.radiusKm))
    }
    p.set('page.size', '100')
    return p
  }

  normalizeListing(rawListing: unknown): NormalizedListing {
    return normalizeMobileDeAd(rawListing as MobileDeRawAd)
  }

  async searchListings(
    filters: VehicleFilters,
    location?: LocationQuery,
  ): Promise<NormalizedListing[]> {
    if (!this.isConfigured()) return []
    const data = (await this.request('/search', this.buildParams(filters, location))) as {
      'search-result'?: { ads?: { ad?: MobileDeRawAd[] } }
      ads?: MobileDeRawAd[]
    }
    const ads = data['search-result']?.ads?.ad ?? data.ads ?? []
    return ads.map((a) => this.normalizeListing(a))
  }

  async syncListings(): Promise<NormalizedListing[]> {
    // MVP-Sync: breite Suche ohne Filter; Paginierung folgt in v0.2,
    // sobald echte Credentials für Integrationstests vorliegen.
    return this.searchListings({})
  }

  async getListingDetails(providerListingId: string): Promise<NormalizedListing | null> {
    if (!this.isConfigured()) return null
    try {
      const data = await this.request(`/ad/${providerListingId}`, new URLSearchParams())
      return this.normalizeListing(data)
    } catch {
      return null
    }
  }

  async checkAvailability(providerListingId: string): Promise<boolean> {
    return (await this.getListingDetails(providerListingId)) != null
  }

  async getDealerContact(providerListingId: string): Promise<DealerContact | null> {
    const details = await this.getListingDetails(providerListingId)
    if (!details) return null
    const raw = details.rawData as MobileDeRawAd
    return {
      name: raw.seller?.companyName,
      address: [raw.seller?.address?.zipcode, raw.seller?.address?.city].filter(Boolean).join(' '),
    }
  }

  getSourceAttribution(): SourceAttribution {
    return {
      provider: this.key,
      displayName: 'mobile.de',
      attributionText: 'Inserat von mobile.de',
      termsUrl: 'https://services.mobile.de',
      // Vertragsabhängig — konservativer Default: nur flüchtiges Caching
      allowsPersistentStorage: false,
    }
  }
}
