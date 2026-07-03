import type { BodyType, FuelType, NormalizedListing, Transmission } from '@carmatch/shared'

/**
 * Normalisierung für die mobile.de Search-API (Anzeigen-Datenformat der offiziellen
 * Partner-/Search-API, JSON-Repräsentation).
 *
 * Feldnamen folgen dem dokumentierten "ad"-Objekt der mobile.de Search-API
 * (https://services.mobile.de/docs/search-api.html). Zugriff erfordert einen
 * Partnervertrag mit mobile.de — siehe MobileDeAdapter.
 */

// mobile.de Kraftstoff-Kürzel → internes Enum
const FUEL_MAP: Record<string, FuelType> = {
  PETROL: 'PETROL',
  DIESEL: 'DIESEL',
  ELECTRICITY: 'ELECTRIC',
  HYBRID: 'HYBRID',
  HYBRID_DIESEL: 'HYBRID',
  LPG: 'LPG',
  CNG: 'CNG',
}

const GEARBOX_MAP: Record<string, Transmission> = {
  MANUAL_GEAR: 'MANUAL',
  AUTOMATIC_GEAR: 'AUTOMATIC',
  SEMIAUTOMATIC_GEAR: 'SEMI_AUTOMATIC',
}

const CATEGORY_MAP: Record<string, BodyType> = {
  Limousine: 'SEDAN',
  Kombi: 'WAGON',
  SUV: 'SUV',
  Gelaendewagen: 'SUV',
  Sportwagen: 'COUPE',
  Coupe: 'COUPE',
  Cabrio: 'CONVERTIBLE',
  Kleinwagen: 'HATCHBACK',
  Van: 'VAN',
  Kleinbus: 'VAN',
  Pickup: 'PICKUP',
}

export interface MobileDeRawAd {
  mobileAdId?: number | string
  detailPageUrl?: string
  make?: string
  model?: string
  modelDescription?: string
  price?: { consumerPriceGross?: string | number; currency?: string }
  firstRegistration?: string // Format "YYYYMM"
  mileage?: number
  power?: number // kW
  fuel?: string
  gearbox?: string
  category?: string
  doorCount?: string
  seats?: number
  exteriorColor?: string
  features?: string[]
  consumptionCombined?: number
  emissionCo2?: number
  cubicCapacity?: number
  numberOfPreviousOwners?: number
  damageUnrepaired?: boolean
  accidentDamaged?: boolean
  fullServiceHistory?: boolean
  warranty?: boolean
  images?: Array<{ xxl?: string; xl?: string; l?: string }>
  seller?: {
    type?: string // DEALER | FOR_SALE_BY_OWNER
    companyName?: string
    address?: { zipcode?: string; city?: string; countryCode?: string }
    coordinates?: { latitude?: number; longitude?: number }
  }
}

export function normalizeMobileDeAd(raw: MobileDeRawAd): NormalizedListing {
  const priceRaw = raw.price?.consumerPriceGross
  const price = typeof priceRaw === 'string' ? Math.round(parseFloat(priceRaw)) : Math.round(priceRaw ?? 0)
  const firstReg = raw.firstRegistration
    ? `${raw.firstRegistration.slice(0, 4)}-${raw.firstRegistration.slice(4, 6)}`
    : undefined
  const year = raw.firstRegistration ? parseInt(raw.firstRegistration.slice(0, 4), 10) : undefined
  const powerKw = raw.power
  const seller = raw.seller

  return {
    provider: 'mobile_de',
    providerListingId: String(raw.mobileAdId ?? ''),
    sourceUrl: raw.detailPageUrl,
    make: raw.make ?? 'Unbekannt',
    model: raw.model ?? '',
    variant: raw.modelDescription,
    title: [raw.make, raw.model, raw.modelDescription].filter(Boolean).join(' ') || 'Fahrzeug',
    price,
    currency: raw.price?.currency ?? 'EUR',
    year,
    firstRegistration: firstReg,
    mileage: raw.mileage,
    powerKw,
    powerHp: powerKw != null ? Math.round(powerKw * 1.35962) : undefined,
    fuelType: raw.fuel ? (FUEL_MAP[raw.fuel] ?? 'OTHER') : undefined,
    transmission: raw.gearbox ? GEARBOX_MAP[raw.gearbox] : undefined,
    bodyType: raw.category ? (CATEGORY_MAP[raw.category] ?? 'OTHER') : undefined,
    doors: raw.doorCount ? parseInt(raw.doorCount, 10) || undefined : undefined,
    seats: raw.seats,
    color: raw.exteriorColor,
    features: raw.features,
    consumptionL100: raw.consumptionCombined,
    co2GKm: raw.emissionCo2,
    displacementCcm: raw.cubicCapacity,
    previousOwners: raw.numberOfPreviousOwners,
    accidentFree:
      raw.accidentDamaged == null && raw.damageUnrepaired == null
        ? null
        : !(raw.accidentDamaged || raw.damageUnrepaired),
    fullServiceHistory: raw.fullServiceHistory ?? null,
    warranty: raw.warranty ?? null,
    images: (raw.images ?? [])
      .map((i) => i.xxl ?? i.xl ?? i.l)
      .filter((u): u is string => Boolean(u)),
    imagesAreDemo: false,
    sellerType: seller?.type === 'FOR_SALE_BY_OWNER' ? 'PRIVATE' : 'DEALER',
    dealerName: seller?.companyName,
    latitude: seller?.coordinates?.latitude,
    longitude: seller?.coordinates?.longitude,
    postalCode: seller?.address?.zipcode,
    city: seller?.address?.city,
    country: seller?.address?.countryCode ?? 'DE',
    isAvailable: true,
    rawData: raw,
  }
}
