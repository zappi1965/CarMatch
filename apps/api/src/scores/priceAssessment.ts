import type { PriceAssessment, RiskFlag } from '@carmatch/shared'

/**
 * Marktpreis-Einschätzung gegen Vergleichsfahrzeuge im eigenen Bestand.
 * Bewusst konservativ: wenige Vergleichsdaten → "UNKNOWN" statt riskanter Behauptung.
 */
export interface Comparable {
  price: number
  mileage?: number | null
  year?: number | null
}

export function assessPrice(
  listing: { price: number; mileage?: number | null; year?: number | null },
  comparables: Comparable[],
): PriceAssessment {
  // Mindestens 3 Vergleiche, sonst keine Aussage ("Schätzung auf Basis vergleichbarer Fahrzeuge" braucht Basis)
  if (comparables.length < 3) {
    return { verdict: 'UNKNOWN', comparablesCount: comparables.length, confidence: 0.1 }
  }

  // grobe Laufleistungs-Korrektur: 0,05 €-Wertanteil pro km Differenz zum Median ist zu spezifisch —
  // stattdessen Vergleich auf Preisbasis mit ±25%-Toleranzbändern um den Median.
  const prices = comparables.map((c) => c.price).sort((a, b) => a - b)
  const median = prices[Math.floor(prices.length / 2)]!
  const deltaPercent = Math.round(((listing.price - median) / median) * 1000) / 10

  const confidence = Math.min(0.9, 0.3 + comparables.length * 0.06)
  let verdict: PriceAssessment['verdict']
  if (deltaPercent <= -10) verdict = 'GOOD_DEAL'
  else if (deltaPercent >= 12) verdict = 'EXPENSIVE'
  else verdict = 'FAIR'

  return { verdict, deltaPercent, comparablesCount: comparables.length, confidence }
}

/**
 * Risiko-/Hinweisbereich: ehrliche Kaufhilfe ohne rechtlich riskante Behauptungen.
 * Nur Hinweise auf Datenlage & Auffälligkeiten, keine Urteile.
 */
export function computeRiskFlags(l: {
  mileage?: number | null
  price: number
  previousOwners?: number | null
  accidentFree?: boolean | null
  warranty?: boolean | null
  year?: number | null
  fuelType?: string | null
  transmission?: string | null
  firstRegistration?: string | null
}, priceAssessment?: PriceAssessment): RiskFlag[] {
  const flags: RiskFlag[] = []
  if (l.mileage != null && l.mileage > 180_000) flags.push({ key: 'HIGH_MILEAGE', severity: 'WARN' })
  if (
    priceAssessment &&
    priceAssessment.verdict !== 'UNKNOWN' &&
    (priceAssessment.deltaPercent ?? 0) <= -30
  ) {
    flags.push({ key: 'UNUSUALLY_LOW_PRICE', severity: 'WARN' })
  }
  if (l.previousOwners != null && l.previousOwners >= 4)
    flags.push({ key: 'MANY_PREVIOUS_OWNERS', severity: 'WARN' })
  if (l.accidentFree == null) flags.push({ key: 'ACCIDENT_HISTORY_UNCLEAR', severity: 'INFO' })
  if (l.warranty === false) flags.push({ key: 'NO_WARRANTY', severity: 'INFO' })

  const missing = [l.mileage, l.year, l.fuelType, l.transmission, l.firstRegistration].filter(
    (x) => x == null,
  ).length
  if (missing >= 2) flags.push({ key: 'MISSING_DATA', severity: 'INFO' })
  return flags
}

/** Inserats-Qualität 0–1: Datenvollständigkeit als Proxy. */
export function computeQualityScore(l: Record<string, unknown>): number {
  const fields = [
    'year', 'firstRegistration', 'mileage', 'powerHp', 'fuelType', 'transmission',
    'bodyType', 'doors', 'seats', 'color', 'consumptionL100', 'previousOwners',
    'accidentFree', 'inspectionValidUntil', 'fullServiceHistory',
  ]
  const present = fields.filter((f) => l[f] != null).length
  const imgCount = Array.isArray(l.images) ? (l.images as unknown[]).length : 0
  return Math.round(((present / fields.length) * 0.8 + Math.min(1, imgCount / 5) * 0.2) * 100) / 100
}
