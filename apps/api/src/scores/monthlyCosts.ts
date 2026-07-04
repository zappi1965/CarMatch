/**
 * Monatskosten-Schätzung ("Was kostet mich dieses Auto wirklich im Monat?").
 *
 * Dokumentierte Heuristiken (Deutschland, konservative Richtwerte):
 * - Kraftstoffpreise: Benzin 1,85 €/l · Diesel 1,72 €/l · LPG 1,15 €/l ·
 *   CNG 1,35 €/kg · Strom 0,35 €/kWh (E-Auto ohne Verbrauchsangabe: 18 kWh/100 km)
 * - Wertverlust p. a. vom aktuellen Preis: Alter <3 J: 11 % · 3–6 J: 8 % ·
 *   7–10 J: 6 % · >10 J: 4 %
 * - Kfz-Steuer (vereinfacht): Benzin 2 €/100 ccm + 2 €/(g CO₂ > 95) ·
 *   Diesel 9,50 €/100 ccm + CO₂-Anteil · Elektro 0 €
 * - Versicherung (Proxy über Leistung): 40 € + 0,25 €/PS, gedeckelt 250 €/Monat
 * - Wartung/Verschleiß: 30 € + 8 €/Fahrzeugjahr + 20 € je 100.000 km Laufleistung
 *
 * Jede fehlende Angabe senkt die Konfidenz — die UI kennzeichnet < 0.5 als
 * "geschätzt". Keine Garantie-Aussagen; reine Orientierungswerte.
 */

export interface MonthlyCostInput {
  price: number
  year?: number | null
  mileage?: number | null
  powerHp?: number | null
  fuelType?: string | null
  consumptionL100?: number | null
  displacementCcm?: number | null
  co2GKm?: number | null
}

export interface MonthlyCostAssumptions {
  kmPerYear: number
  referenceYear: number
}

export interface MonthlyCostEstimate {
  depreciation: number
  fuel: number
  insurance: number
  tax: number
  maintenance: number
  total: number
  confidence: number
  assumptions: MonthlyCostAssumptions
}

const FUEL_PRICE: Record<string, number> = {
  PETROL: 1.85, DIESEL: 1.72, LPG: 1.15, CNG: 1.35,
  HYBRID: 1.85, PLUGIN_HYBRID: 1.85, ELECTRIC: 0.35,
}

export function estimateMonthlyCosts(
  v: MonthlyCostInput,
  opts: Partial<MonthlyCostAssumptions> = {},
): MonthlyCostEstimate {
  const kmPerYear = opts.kmPerYear ?? 12_000
  const referenceYear = opts.referenceYear ?? new Date().getFullYear()
  const age = v.year != null ? Math.max(0, referenceYear - v.year) : 6 // unbekannt → Mittelwert
  let known = 0
  const totalFields = 6

  // Wertverlust
  const rate = age < 3 ? 0.11 : age <= 6 ? 0.08 : age <= 10 ? 0.06 : 0.04
  const depreciation = (v.price * rate) / 12
  if (v.year != null) known++

  // Kraftstoff / Strom
  const fuelType = v.fuelType ?? 'PETROL'
  const unitPrice = FUEL_PRICE[fuelType] ?? 1.85
  let consumption = v.consumptionL100 ?? null
  if (fuelType === 'ELECTRIC') consumption = consumption && consumption > 0 ? consumption : 18
  if (consumption == null || consumption <= 0) consumption = fuelType === 'DIESEL' ? 6.0 : 7.0
  else known++
  if (v.fuelType != null) known++
  const fuel = (kmPerYear / 100) * consumption * unitPrice / 12

  // Steuer
  let tax = 0
  if (fuelType !== 'ELECTRIC') {
    const ccm = v.displacementCcm ?? 1800
    const co2 = v.co2GKm ?? 150
    const base = (ccm / 100) * (fuelType === 'DIESEL' ? 9.5 : 2)
    tax = (base + Math.max(0, co2 - 95) * 2) / 12
    if (v.displacementCcm != null) known++
    if (v.co2GKm != null) known++
  } else {
    known += 2 // E-Auto: Steuer sicher 0
  }

  // Versicherung (grober Leistungs-Proxy — echte Typklassen erst mit Datenanbieter)
  const insurance = Math.min(250, 40 + (v.powerHp ?? 150) * 0.25)
  if (v.powerHp != null) known++

  // Wartung
  const maintenance = 30 + age * 8 + ((v.mileage ?? 80_000) / 100_000) * 20

  const r = (n: number) => Math.round(n)
  const parts = {
    depreciation: r(depreciation),
    fuel: r(fuel),
    insurance: r(insurance),
    tax: r(tax),
    maintenance: r(maintenance),
  }
  return {
    ...parts,
    total: parts.depreciation + parts.fuel + parts.insurance + parts.tax + parts.maintenance,
    confidence: Math.round((known / totalFields) * 100) / 100,
    assumptions: { kmPerYear, referenceYear },
  }
}
