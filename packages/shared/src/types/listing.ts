export type FuelType =
  | 'PETROL'
  | 'DIESEL'
  | 'ELECTRIC'
  | 'HYBRID'
  | 'PLUGIN_HYBRID'
  | 'LPG'
  | 'CNG'
  | 'OTHER'

export type Transmission = 'MANUAL' | 'AUTOMATIC' | 'SEMI_AUTOMATIC'
export type Drivetrain = 'FWD' | 'RWD' | 'AWD'
export type SellerType = 'DEALER' | 'PRIVATE'

export type BodyType =
  | 'SEDAN'
  | 'WAGON'
  | 'SUV'
  | 'COUPE'
  | 'CONVERTIBLE'
  | 'HATCHBACK'
  | 'VAN'
  | 'PICKUP'
  | 'OTHER'

export type SwipeAction = 'LIKE' | 'DISLIKE' | 'SUPERLIKE' | 'SKIP'

export type LeadType =
  | 'GENERAL'
  | 'TEST_DRIVE'
  | 'FINANCE'
  | 'AVAILABILITY'
  | 'CALLBACK'
  | 'MESSAGE'

/** Normalisiertes Inserat — gemeinsames Format aller Provider-Adapter. */
export interface NormalizedListing {
  provider: string
  providerListingId: string
  /** Quelle-URL — intern gespeichert, in der UI nur hinter CTA "Zum Inserat". */
  sourceUrl?: string
  make: string
  model: string
  variant?: string
  title: string
  description?: string
  price: number
  currency: string
  year?: number
  firstRegistration?: string
  mileage?: number
  powerKw?: number
  powerHp?: number
  fuelType?: FuelType
  transmission?: Transmission
  drivetrain?: Drivetrain
  bodyType?: BodyType
  doors?: number
  seats?: number
  color?: string
  interior?: string
  features?: string[]
  consumptionL100?: number
  co2GKm?: number
  displacementCcm?: number
  previousOwners?: number
  accidentFree?: boolean | null
  inspectionValidUntil?: string
  fullServiceHistory?: boolean | null
  warranty?: boolean | null
  financingAvailable?: boolean | null
  images: string[]
  /** true, wenn Bilder Demo-Platzhalter sind (Kennzeichnungspflicht in der UI). */
  imagesAreDemo?: boolean
  sellerType: SellerType
  dealerName?: string
  latitude?: number
  longitude?: number
  postalCode?: string
  city?: string
  country: string
  isAvailable: boolean
  /** Provider-Rohdaten für Debugging/Re-Normalisierung. */
  rawData?: unknown
}

export interface SourceAttribution {
  provider: string
  displayName: string
  /** Pflichttext, der in der UI beim Inserat angezeigt wird. */
  attributionText: string
  logoUrl?: string
  termsUrl?: string
  /** Erlaubt die Quelle dauerhaftes Caching der Inhalte? */
  allowsPersistentStorage: boolean
}
