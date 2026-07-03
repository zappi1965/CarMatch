import type {
  NormalizedListing,
  SourceAttribution,
  VehicleFilters,
  LocationQuery,
} from '@carmatch/shared'

export interface DealerContact {
  name?: string
  phone?: string
  email?: string
  address?: string
}

/**
 * Einheitliche Schnittstelle für alle Inseratsquellen.
 *
 * Regeln:
 * - Nur rechtlich saubere Zugänge (offizielle APIs, Partner-Feeds, lizenzierte Daten).
 * - Kein Scraping, keine Umgehung von Bot-Schutz oder Nutzungsbedingungen.
 * - Jede Quelle liefert ihre eigene Attribution (getSourceAttribution) und ist
 *   per ENV (ENABLED_PROVIDERS) deaktivierbar.
 */
export interface VehicleProviderAdapter {
  /** eindeutiger Provider-Key, z. B. "mobile_de" */
  readonly key: string
  /** Ist der Adapter konfiguriert (Credentials vorhanden) und nutzbar? */
  isConfigured(): boolean
  searchListings(
    filters: VehicleFilters,
    location?: LocationQuery,
  ): Promise<NormalizedListing[]>
  getListingDetails(providerListingId: string): Promise<NormalizedListing | null>
  /** Vollsynchronisation für den Import-Worker. */
  syncListings(): Promise<NormalizedListing[]>
  normalizeListing(rawListing: unknown): NormalizedListing
  checkAvailability(providerListingId: string): Promise<boolean>
  getDealerContact(providerListingId: string): Promise<DealerContact | null>
  getSourceAttribution(): SourceAttribution
}
