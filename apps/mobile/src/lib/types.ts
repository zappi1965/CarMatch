import type {
  PriceAssessment,
  RecommendationExplanation,
  RiskFlag,
  VehicleScore,
} from '@carmatch/shared'

/** Inserat, wie es die API liefert (DB-Form, ohne rawData). */
export interface ListingDto {
  id: string
  provider: string
  make: string
  model: string
  variant?: string | null
  title: string
  description?: string | null
  price: number
  currency: string
  year?: number | null
  firstRegistration?: string | null
  mileage?: number | null
  powerKw?: number | null
  powerHp?: number | null
  fuelType?: string | null
  transmission?: string | null
  drivetrain?: string | null
  bodyType?: string | null
  doors?: number | null
  seats?: number | null
  color?: string | null
  interior?: string | null
  features?: string[] | null
  consumptionL100?: number | null
  co2GKm?: number | null
  displacementCcm?: number | null
  previousOwners?: number | null
  accidentFree?: boolean | null
  inspectionValidUntil?: string | null
  fullServiceHistory?: boolean | null
  warranty?: boolean | null
  financingAvailable?: boolean | null
  images: string[]
  imagesAreDemo: boolean
  sellerType: string
  city?: string | null
  postalCode?: string | null
  country: string
  isAvailable: boolean
  sourceUrl?: string | null
  createdAt: string
  specs?: SpecsDto | null
  priceHistory?: Array<{ price: number; recordedAt: string }>
}

export interface SpecsDto {
  zeroToHundred?: number | null
  topSpeed?: number | null
  weightKg?: number | null
  trunkVolumeL?: number | null
  batteryCapacityKwh?: number | null
  electricRangeKm?: number | null
  confidence: number
  source?: string | null
  verified: boolean
}

export interface DiscoverItem {
  listing: ListingDto
  distanceKm?: number | null
  explanation: RecommendationExplanation
  isSponsored: boolean
}

export interface ListingInsights extends ListingDto {
  distanceKm?: number | null
  priceAssessment: PriceAssessment
  riskFlags: RiskFlag[]
  scores: VehicleScore[]
  attribution?: { displayName: string; attributionText: string } | null
  isSponsored: boolean
}

export const formatPrice = (price: number, currency = 'EUR') =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency, maximumFractionDigits: 0 }).format(price)

export const formatKm = (km?: number | null) =>
  km == null ? '–' : `${new Intl.NumberFormat('de-DE').format(km)} km`
