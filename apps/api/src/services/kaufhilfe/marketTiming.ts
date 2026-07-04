import type { MarketTimingInsight } from '@carmatch/shared'

const avg = (xs: number[]) =>
  xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : undefined
const pct = (current: number, base?: number) =>
  base ? Math.round(((current - base) / base) * 1000) / 10 : undefined

export function seasonalHintForModel(model: string, bodyType?: string | null) {
  const m = model.toLowerCase()
  if (bodyType === 'CONVERTIBLE' || m.includes('mx-5') || m.includes('911'))
    return 'Cabrio-/Sportwagenpreise fallen häufig ab Oktober und ziehen im Frühjahr an.'
  if (bodyType === 'SUV')
    return 'SUVs bleiben im Winter stabiler, gute Deals entstehen oft bei Modellwechseln.'
  if (m.includes('tesla') || m.includes('ioniq'))
    return 'E-Auto-Preise reagieren stark auf Förderungen, Leasingrückläufer und Akku-Updates.'
  return 'Gute Kaufzeitpunkte entstehen oft zum Quartalsende und nach großen Modellwechseln.'
}

export function buildMarketTimingInsight(params: {
  currentPrice: number
  model: string
  bodyType?: string | null
  history: Array<{ price: number; date: Date }>
  monthlyBudget?: number | null
}): MarketTimingInsight {
  const now = Date.now()
  const days = (d: Date) => (now - d.getTime()) / 86_400_000
  const p30 = avg(params.history.filter((h) => days(h.date) <= 30).map((h) => h.price))
  const p90 = avg(params.history.filter((h) => days(h.date) <= 90).map((h) => h.price))
  const p365 = avg(params.history.filter((h) => days(h.date) <= 365).map((h) => h.price))
  const diff = pct(params.currentPrice, p365)
  const sorted = [...params.history].sort((a, b) => a.date.getTime() - b.date.getTime())
  const first90 =
    avg(sorted.slice(0, Math.max(1, Math.floor(sorted.length / 3))).map((h) => h.price)) ??
    params.currentPrice
  const last90 = p90 ?? params.currentPrice
  const monthlyDrop =
    sorted.length > 1
      ? (first90 - last90) / Math.max(1, (days(sorted[0]!.date) - days(sorted.at(-1)!.date)) / 30)
      : 0
  const trendDirection =
    monthlyDrop > params.currentPrice * 0.006
      ? 'falling'
      : monthlyDrop < -params.currentPrice * 0.004
        ? 'rising'
        : 'stable'
  const targetBudgetMonths =
    params.monthlyBudget && monthlyDrop > 10
      ? Math.max(0, Math.ceil((params.currentPrice - params.monthlyBudget) / monthlyDrop))
      : null
  const waitAdvice =
    diff != null && diff <= -5
      ? `Aktuell ${Math.abs(diff)} % unter Jahresschnitt – eher guter Zeitpunkt.`
      : trendDirection === 'falling'
        ? `Preistrend fällt. Warten kann sinnvoll sein${targetBudgetMonths != null ? `; Zielpreis in ca. ${targetBudgetMonths} Monaten.` : '.'}`
        : 'Preis wirkt stabil – bei passendem Auto eher Zustand/Historie priorisieren.'
  return {
    averagePrice30d: p30,
    averagePrice90d: p90,
    averagePrice365d: p365,
    currentVsYearAveragePercent: diff,
    trendDirection,
    seasonalHint: seasonalHintForModel(params.model, params.bodyType),
    bestBuyingMonths:
      params.bodyType === 'CONVERTIBLE'
        ? ['Oktober', 'November', 'Dezember']
        : ['März', 'Juni', 'Dezember'],
    targetBudgetMonths,
    waitAdvice,
  }
}
