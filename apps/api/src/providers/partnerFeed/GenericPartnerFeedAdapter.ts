import type { NormalizedListing, SourceAttribution, VehicleFilters } from '@carmatch/shared'
import { config } from '../../config.js'
import type { DealerContact, VehicleProviderAdapter } from '../types.js'

/**
 * GenericPartnerFeedAdapter — liest einen JSON-Feed von Partnern/Händlern.
 *
 * Feed-Format: Array von Objekten, die bereits dem NormalizedListing-Schema
 * entsprechen (Feld `provider` wird überschrieben). Damit können Händler in
 * Phase 2/3 ihr Inventar per einfacher JSON-URL bereitstellen, bevor ein
 * echtes Händler-Dashboard existiert.
 *
 * Konfiguration: PARTNER_FEED_URL (HTTPS-Endpunkt des Partners).
 */
export class GenericPartnerFeedAdapter implements VehicleProviderAdapter {
  readonly key = 'partner_feed'

  isConfigured(): boolean {
    return Boolean(config.PARTNER_FEED_URL)
  }

  normalizeListing(rawListing: unknown): NormalizedListing {
    const r = rawListing as Partial<NormalizedListing>
    if (!r.providerListingId || !r.make || !r.title || r.price == null) {
      throw new Error('Partner-Feed-Eintrag unvollständig (providerListingId, make, title, price nötig)')
    }
    return {
      provider: this.key,
      providerListingId: r.providerListingId,
      sourceUrl: r.sourceUrl,
      make: r.make,
      model: r.model ?? '',
      variant: r.variant,
      title: r.title,
      description: r.description,
      price: r.price,
      currency: r.currency ?? 'EUR',
      year: r.year,
      firstRegistration: r.firstRegistration,
      mileage: r.mileage,
      powerKw: r.powerKw,
      powerHp: r.powerHp ?? (r.powerKw != null ? Math.round(r.powerKw * 1.35962) : undefined),
      fuelType: r.fuelType,
      transmission: r.transmission,
      drivetrain: r.drivetrain,
      bodyType: r.bodyType,
      doors: r.doors,
      seats: r.seats,
      color: r.color,
      interior: r.interior,
      features: r.features,
      consumptionL100: r.consumptionL100,
      co2GKm: r.co2GKm,
      displacementCcm: r.displacementCcm,
      previousOwners: r.previousOwners,
      accidentFree: r.accidentFree ?? null,
      inspectionValidUntil: r.inspectionValidUntil,
      fullServiceHistory: r.fullServiceHistory ?? null,
      warranty: r.warranty ?? null,
      financingAvailable: r.financingAvailable ?? null,
      images: r.images ?? [],
      imagesAreDemo: false,
      sellerType: r.sellerType ?? 'DEALER',
      dealerName: r.dealerName,
      latitude: r.latitude,
      longitude: r.longitude,
      postalCode: r.postalCode,
      city: r.city,
      country: r.country ?? 'DE',
      isAvailable: r.isAvailable ?? true,
      rawData: rawListing,
    }
  }

  async syncListings(): Promise<NormalizedListing[]> {
    if (!this.isConfigured()) return []
    const res = await fetch(config.PARTNER_FEED_URL!)
    if (!res.ok) throw new Error(`Partner-Feed ${res.status}`)
    const data = (await res.json()) as unknown[]
    const out: NormalizedListing[] = []
    for (const raw of data) {
      try {
        out.push(this.normalizeListing(raw))
      } catch {
        // fehlerhafte Einträge überspringen; Import-Log zählt Differenz
      }
    }
    return out
  }

  async searchListings(_filters: VehicleFilters): Promise<NormalizedListing[]> {
    // Feed-basierte Quelle: Suche läuft über die lokale DB nach dem Sync.
    return []
  }

  async getListingDetails(providerListingId: string): Promise<NormalizedListing | null> {
    const all = await this.syncListings()
    return all.find((l) => l.providerListingId === providerListingId) ?? null
  }

  async checkAvailability(providerListingId: string): Promise<boolean> {
    return (await this.getListingDetails(providerListingId)) != null
  }

  async getDealerContact(providerListingId: string): Promise<DealerContact | null> {
    const l = await this.getListingDetails(providerListingId)
    return l?.dealerName ? { name: l.dealerName } : null
  }

  getSourceAttribution(): SourceAttribution {
    return {
      provider: this.key,
      displayName: 'Partner-Feed',
      attributionText: 'Inserat eines Partnerhändlers',
      allowsPersistentStorage: true,
    }
  }
}
