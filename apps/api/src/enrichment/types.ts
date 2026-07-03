export interface SpecsQuery {
  make: string
  model: string
  variant?: string | null
  year?: number | null
  powerHp?: number | null
  fuelType?: string | null
}

export interface SpecsResult {
  zeroToHundred?: number
  topSpeed?: number
  weightKg?: number
  lengthMm?: number
  widthMm?: number
  heightMm?: number
  trunkVolumeL?: number
  consumptionL100?: number
  co2GKm?: number
  batteryCapacityKwh?: number
  electricRangeKm?: number
  chargingSpeedKw?: number
  /** 0–1: Match-Sicherheit. < 0.6 wird nicht automatisch übernommen. */
  confidence: number
  source: string
}

/**
 * Abstrakte Enrichment-Quelle für technische Fahrzeugdaten.
 * Implementierungen: DemoSpecsSource (lokale Tabelle), später lizenzierte
 * Anbieter (z. B. DAT, JATO, vehicle-specs-APIs) via VEHICLE_SPECS_API_KEY.
 */
export interface VehicleSpecsSource {
  readonly key: string
  isConfigured(): boolean
  lookup(query: SpecsQuery): Promise<SpecsResult | null>
}
