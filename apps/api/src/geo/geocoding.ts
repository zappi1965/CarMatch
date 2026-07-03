import type { GeoPoint } from '@carmatch/shared'
import { config } from '../config.js'

export interface GeocodeResult extends GeoPoint {
  city?: string
  postalCode?: string
  country: string
}

/**
 * Geocoding-Abstraktion: PLZ/Ort → Koordinaten.
 * MVP: lokale PLZ-Tabelle (Norddeutschland + Großstädte) als Offline-Fallback.
 * Produktion: echter Anbieter via MAPS_GEOCODING_API_KEY (Interface bleibt gleich).
 */
export interface GeocodingProvider {
  geocode(query: { postalCode?: string; city?: string; country?: string }): Promise<GeocodeResult | null>
}

const LOCAL_TABLE: Array<{ plzPrefix: string; city: string; lat: number; lon: number }> = [
  { plzPrefix: '18',  city: 'Rostock',        lat: 54.0924, lon: 12.1407 },
  { plzPrefix: '19',  city: 'Schwerin',       lat: 53.6355, lon: 11.4012 },
  { plzPrefix: '17',  city: 'Neubrandenburg', lat: 53.5575, lon: 13.2610 },
  { plzPrefix: '23',  city: 'Lübeck',         lat: 53.8655, lon: 10.6866 },
  { plzPrefix: '20',  city: 'Hamburg',        lat: 53.5511, lon: 9.9937 },
  { plzPrefix: '21',  city: 'Hamburg',        lat: 53.4600, lon: 9.9800 },
  { plzPrefix: '22',  city: 'Hamburg',        lat: 53.5900, lon: 10.0100 },
  { plzPrefix: '24',  city: 'Kiel',           lat: 54.3233, lon: 10.1228 },
  { plzPrefix: '28',  city: 'Bremen',         lat: 53.0793, lon: 8.8017 },
  { plzPrefix: '30',  city: 'Hannover',       lat: 52.3759, lon: 9.7320 },
  { plzPrefix: '10',  city: 'Berlin',         lat: 52.5200, lon: 13.4050 },
  { plzPrefix: '12',  city: 'Berlin',         lat: 52.4400, lon: 13.4500 },
  { plzPrefix: '80',  city: 'München',        lat: 48.1351, lon: 11.5820 },
  { plzPrefix: '50',  city: 'Köln',           lat: 50.9375, lon: 6.9603 },
  { plzPrefix: '60',  city: 'Frankfurt',      lat: 50.1109, lon: 8.6821 },
  { plzPrefix: '70',  city: 'Stuttgart',      lat: 48.7758, lon: 9.1829 },
  { plzPrefix: '01',  city: 'Dresden',        lat: 51.0504, lon: 13.7373 },
  { plzPrefix: '04',  city: 'Leipzig',        lat: 51.3397, lon: 12.3731 },
  { plzPrefix: '40',  city: 'Düsseldorf',     lat: 51.2277, lon: 6.7735 },
  { plzPrefix: '90',  city: 'Nürnberg',       lat: 49.4521, lon: 11.0767 },
]

class LocalGeocoder implements GeocodingProvider {
  async geocode(q: { postalCode?: string; city?: string; country?: string }): Promise<GeocodeResult | null> {
    if (q.postalCode) {
      const hit = LOCAL_TABLE.find((r) => q.postalCode!.startsWith(r.plzPrefix))
      if (hit) return { latitude: hit.lat, longitude: hit.lon, city: hit.city, postalCode: q.postalCode, country: q.country ?? 'DE' }
    }
    if (q.city) {
      const c = q.city.toLowerCase()
      const hit = LOCAL_TABLE.find((r) => r.city.toLowerCase() === c)
      if (hit) return { latitude: hit.lat, longitude: hit.lon, city: hit.city, country: q.country ?? 'DE' }
    }
    return null
  }
}

/**
 * Externer Anbieter (z. B. Google/HERE/Nominatim-kommerziell) — wird aktiviert,
 * sobald MAPS_GEOCODING_API_KEY gesetzt ist. TODO v0.2: konkreten Anbieter anbinden.
 */
class ApiGeocoder implements GeocodingProvider {
  async geocode(q: { postalCode?: string; city?: string; country?: string }): Promise<GeocodeResult | null> {
    // Fallback auf lokale Tabelle, bis der Anbieter angebunden ist
    return new LocalGeocoder().geocode(q)
  }
}

export const geocoder: GeocodingProvider = config.MAPS_GEOCODING_API_KEY
  ? new ApiGeocoder()
  : new LocalGeocoder()
