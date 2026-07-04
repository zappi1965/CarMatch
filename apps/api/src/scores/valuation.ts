/**
 * C2B-Fahrzeugbewertung ("Was ist mein Auto wert?") auf Basis der eigenen
 * Vergleichsinserate — dieselbe Datenbasis wie die Marktpreis-Einschätzung,
 * nur rückwärts angewandt.
 *
 * Anpassungslogik (dokumentiert, konservativ):
 * - Laufleistung: 4 Cent Wertdifferenz je km Abweichung, gedeckelt ±25 %
 * - Alter: 5 % je Jahr Differenz, gedeckelt ±20 %
 * - Ergebnis: Median der angepassten Vergleichspreise, Spanne ±8 %
 * - < 3 Vergleichsfahrzeuge → keine Schätzung (confidence entsprechend niedrig)
 */

export interface ValuationTarget {
  mileage?: number | null
  year?: number | null
}

export interface ValuationComparable {
  price: number
  mileage?: number | null
  year?: number | null
}

export interface ValuationResult {
  estimate: number | null
  low: number | null
  high: number | null
  comparablesCount: number
  confidence: number
}

export function adjustComparablePrice(comp: ValuationComparable, target: ValuationTarget): number {
  let price = comp.price
  if (comp.mileage != null && target.mileage != null) {
    const delta = (comp.mileage - target.mileage) * 0.04 // Vergleich lief mehr → Ziel ist mehr wert
    const cap = comp.price * 0.25
    price += Math.max(-cap, Math.min(cap, delta))
  }
  if (comp.year != null && target.year != null) {
    const factor = Math.max(-0.2, Math.min(0.2, (target.year - comp.year) * 0.05))
    price *= 1 + factor
  }
  return Math.round(price)
}

export function estimateVehicleValue(
  target: ValuationTarget,
  comparables: ValuationComparable[],
): ValuationResult {
  if (comparables.length < 3) {
    return { estimate: null, low: null, high: null, comparablesCount: comparables.length, confidence: 0.1 }
  }
  const adjusted = comparables.map((c) => adjustComparablePrice(c, target)).sort((a, b) => a - b)
  const median = adjusted[Math.floor(adjusted.length / 2)]!
  const confidence = Math.min(0.85, 0.3 + comparables.length * 0.05)
  return {
    estimate: Math.round(median / 100) * 100,
    low: Math.round((median * 0.92) / 100) * 100,
    high: Math.round((median * 1.08) / 100) * 100,
    comparablesCount: comparables.length,
    confidence,
  }
}
