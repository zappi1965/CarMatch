/**
 * Markttrend & Kauf-Timing aus der eigenen Preishistorie:
 * Vergleich aktueller Durchschnittspreis vs. Referenzzeitraum (≥ 45 Tage alt).
 * Plus dokumentierte Saison-Hinweise (z. B. Cabrios im Winter günstiger).
 */

export interface TrendResult {
  trendPercent: number | null // negativ = Preise fallen
  direction: 'FALLING' | 'RISING' | 'STABLE' | 'UNKNOWN'
  sampleSize: number
  confidence: number
  seasonalHint: 'WINTER_CONVERTIBLE' | 'SPRING_SUV' | null
}

export function computeTrend(
  currentPrices: number[],
  pastPrices: number[],
  bodyType?: string | null,
  month: number = new Date().getMonth() + 1,
): TrendResult {
  const seasonalHint =
    bodyType === 'CONVERTIBLE' && [10, 11, 12, 1, 2].includes(month)
      ? 'WINTER_CONVERTIBLE'
      : bodyType === 'SUV' && [3, 4].includes(month)
        ? 'SPRING_SUV'
        : null

  if (currentPrices.length < 3 || pastPrices.length < 3) {
    return { trendPercent: null, direction: 'UNKNOWN', sampleSize: currentPrices.length, confidence: 0.1, seasonalHint }
  }
  const avg = (a: number[]) => a.reduce((s, x) => s + x, 0) / a.length
  const trendPercent = Math.round(((avg(currentPrices) - avg(pastPrices)) / avg(pastPrices)) * 1000) / 10
  const direction = trendPercent <= -1.5 ? 'FALLING' : trendPercent >= 1.5 ? 'RISING' : 'STABLE'
  const confidence = Math.min(0.85, 0.25 + Math.min(currentPrices.length, pastPrices.length) * 0.05)
  return { trendPercent, direction, sampleSize: currentPrices.length, confidence, seasonalHint }
}

/**
 * Sparziel-Prognose: In wie vielen Monaten ist das Ziel erreichbar?
 * Preis wird mit dem Jahres-Trend fortgeschrieben; max. 60 Monate Horizont.
 */
export function monthsUntilAffordable(
  targetPrice: number,
  currentBudget: number,
  monthlySaving: number,
  trendPercentPerYear: number | null,
): number | null {
  if (currentBudget >= targetPrice) return 0
  const monthlyTrend = (trendPercentPerYear ?? 0) / 100 / 12
  let price = targetPrice
  let budget = currentBudget
  for (let month = 1; month <= 60; month++) {
    budget += monthlySaving
    price *= 1 + monthlyTrend
    if (budget >= price) return month
  }
  return null // in 5 Jahren nicht erreichbar
}
