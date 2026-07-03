import type { BodyType, Drivetrain, FuelType, SellerType, Transmission } from './listing.js'

export interface GeoPoint {
  latitude: number
  longitude: number
}

export type SearchSort = 'RELEVANCE' | 'PRICE_ASC' | 'PRICE_DESC' | 'DISTANCE' | 'NEWEST' | 'MILEAGE'

/** Vollständiger Such-/Filtersatz — identisch in App, API und gespeicherten Suchen. */
export interface VehicleFilters {
  priceMin?: number
  priceMax?: number
  makes?: string[]
  models?: string[]
  yearMin?: number
  yearMax?: number
  mileageMin?: number
  mileageMax?: number
  powerHpMin?: number
  powerHpMax?: number
  fuelTypes?: FuelType[]
  transmissions?: Transmission[]
  drivetrains?: Drivetrain[]
  bodyTypes?: BodyType[]
  seatsMin?: number
  doorsMin?: number
  colors?: string[]
  sellerType?: SellerType
  accidentFreeOnly?: boolean
  inspectionValid?: boolean
  fullServiceHistoryOnly?: boolean
  financingAvailable?: boolean
  electricRangeMinKm?: number
  sort?: SearchSort
}

export interface LocationQuery {
  point?: GeoPoint
  postalCode?: string
  city?: string
  country?: string
  /** null/undefined = landesweit */
  radiusKm?: number
}

export const RADIUS_OPTIONS_KM = [10, 25, 50, 100, 250, null] as const
