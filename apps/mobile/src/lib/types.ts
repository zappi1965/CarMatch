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
  imageAttribution?: string | null
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

export interface MonthlyCostsDto {
  depreciation: number
  fuel: number
  insurance: number
  tax: number
  maintenance: number
  total: number
  confidence: number
  assumptions: { kmPerYear: number }
}

export interface MarketTrendDto {
  trendPercent: number | null
  direction: 'FALLING' | 'RISING' | 'STABLE' | 'UNKNOWN'
  sampleSize: number
  confidence: number
  seasonalHint: string | null
}

export interface DiscoverItem {
  listing: ListingDto
  distanceKm?: number | null
  explanation: RecommendationExplanation
  isSponsored: boolean
  monthlyCosts?: MonthlyCostsDto
}

export interface ListingInsights extends ListingDto {
  distanceKm?: number | null
  priceAssessment: PriceAssessment
  riskFlags: RiskFlag[]
  scores: VehicleScore[]
  monthlyCosts?: MonthlyCostsDto
  marketTrend?: MarketTrendDto
  attribution?: { displayName: string; attributionText: string } | null
  isSponsored: boolean
}

/** Generelles Fahrzeugmodell (Inspirationsmodus) — kein Inserat. */
export interface VehicleModelDto {
  id: string
  make: string
  model: string
  generation?: string | null
  variant?: string | null
  productionStartYear?: number | null
  productionEndYear?: number | null
  bodyType?: string | null
  vehicleSize?: string | null
  segment?: string | null
  doors?: number | null
  seats?: number | null
  drivetrain?: string | null
  fuelTypes?: string[] | null
  transmissionTypes?: string[] | null
  minPowerHp?: number | null
  maxPowerHp?: number | null
  typicalUsedPriceMin?: number | null
  typicalUsedPriceMax?: number | null
  imageUrls: string[]
  imagesAreDemo: boolean
  description?: string | null
  strengthsJson?: string[] | null
  weaknessesJson?: string[] | null
  tagsJson?: string[] | null
  knownIssuesJson?: string[] | null
  imageAttribution?: string | null
  infoUrl?: string | null
  source: string
  specs?: {
    zeroToHundred?: number | null
    topSpeed?: number | null
    weightKg?: number | null
    trunkVolumeL?: number | null
    consumptionL100?: number | null
    electricRangeKm?: number | null
  } | null
}

export interface TasteSummaryDto {
  summaryText: string | null
  confidence: number
  signalCount: number
  summaryReady: boolean
  threshold: number
  topMakes: string[]
  topSegments: string[]
  topBodyTypes: string[]
  targetPowerHp: number | null
  priceRange: { min: number; max: number } | null
}

export interface TasteInsightDto {
  id: string
  insightType: string
  titleKey: string
  paramsJson: Record<string, string | number> | null
  confidence: number
}

export const formatPrice = (price: number, currency = 'EUR') =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency, maximumFractionDigits: 0 }).format(price)

export const formatKm = (km?: number | null) =>
  km == null ? '–' : `${new Intl.NumberFormat('de-DE').format(km)} km`
