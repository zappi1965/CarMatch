import type { NormalizedListing, SourceAttribution, VehicleFilters } from '@carmatch/shared'
import { config } from '../../config.js'
import type { DealerContact, VehicleProviderAdapter } from '../types.js'

/**
 * AutoScout24 — DEAKTIVIERTER PLACEHOLDER.
 *
 * Status (Stand MVP): AutoScout24 bietet keine öffentlich buchbare Such-/Read-API
 * für Dritte an. Die vorhandenen AS24-APIs (Listing Creation / Dealer-Import)
 * richten sich an Händler, die eigene Inserate einstellen, nicht an Aggregatoren.
 *
 * TODO für eine spätere Anbindung (v0.2+):
 * 1. Partnerschaft/Lizenzvertrag mit AutoScout24 (Schibsted/AS24 Media) klären.
 * 2. Erst nach schriftlicher Freigabe: API-Client + normalizeListing implementieren.
 * 3. Attribution & Speicherregeln aus dem Vertrag in getSourceAttribution abbilden.
 *
 * BEWUSST NICHT implementiert: Scraping der Website, Nutzung interner/inoffizieller
 * Endpunkte oder Umgehung von Bot-Schutz — das verstößt gegen die Nutzungsbedingungen.
 */
export class AutoScout24Adapter implements VehicleProviderAdapter {
  readonly key = 'autoscout24'

  isConfigured(): boolean {
    // Bleibt false, bis eine rechtlich nutzbare API vorliegt.
    // AUTOSCOUT_API_KEY ist als ENV vorbereitet, schaltet aber bewusst nichts frei.
    void config.AUTOSCOUT_API_KEY
    return false
  }

  async searchListings(_filters: VehicleFilters): Promise<NormalizedListing[]> {
    return []
  }

  async syncListings(): Promise<NormalizedListing[]> {
    return []
  }

  async getListingDetails(): Promise<NormalizedListing | null> {
    return null
  }

  normalizeListing(): NormalizedListing {
    throw new Error('AutoScout24-Adapter ist nicht aktiviert (keine lizenzierte API vorhanden)')
  }

  async checkAvailability(): Promise<boolean> {
    return false
  }

  async getDealerContact(): Promise<DealerContact | null> {
    return null
  }

  getSourceAttribution(): SourceAttribution {
    return {
      provider: this.key,
      displayName: 'AutoScout24',
      attributionText: 'Inserat von AutoScout24',
      allowsPersistentStorage: false,
    }
  }
}
