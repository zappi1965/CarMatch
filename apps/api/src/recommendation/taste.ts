/**
 * Taste-Engine (Hybrid): berechnet aus Modell-Swipes (Inspirationsmodus) und
 * Inserats-Signalen (Kaufmodus) ein gewichtetes Geschmacksprofil.
 *
 * Dokumentierte Signal-Gewichte (siehe Produkt-Spezifikation):
 *   Inspirationsmodus (Taste Signals)
 *     SUPERLIKE Modell        +10
 *     LIKE Modell              +5
 *     lange Verweildauer (>6s) +2
 *     Details/Mehr geöffnet    +2
 *     DISLIKE Modell           -5
 *     SKIP Modell              -1
 *     Duell gewonnen           +6   (Paarvergleich ist informationsreicher)
 *     Duell verloren           -2
 *   Kaufmodus (Purchase Signals)
 *     SUPERLIKE Inserat       +15
 *     LIKE Inserat             +8
 *     Favorit                 +12
 *     Kontaktanfrage          +20
 *     DISLIKE Inserat          -8
 *     kurzer SKIP              -1
 */

import type { SwipeAction } from '@carmatch/shared'

export interface TasteAttributes {
  make: string
  model?: string | null
  segment?: string | null
  bodyType?: string | null
  vehicleSize?: string | null
  fuelTypes?: string[] | null
  transmissionTypes?: string[] | null
  drivetrain?: string | null
  powerHpMid?: number | null // Mitte der Leistungsspanne bzw. konkrete PS
  priceMid?: number | null // Mitte der Preisspanne bzw. konkreter Preis
  tags?: string[] | null
}

export interface TasteSignal {
  kind: 'MODEL' | 'LISTING' | 'DUEL_WIN' | 'DUEL_LOSS'
  action: SwipeAction
  dwellTimeMs?: number | null
  openedDetails?: boolean
  openedMore?: boolean
  isFavorite?: boolean
  contactedDealer?: boolean
  attributes: TasteAttributes
}

export interface TasteProfile {
  makes: Record<string, number>
  models: Record<string, number>
  segments: Record<string, number>
  bodyTypes: Record<string, number>
  vehicleSizes: Record<string, number>
  fuelTypes: Record<string, number>
  transmissions: Record<string, number>
  drivetrains: Record<string, number>
  useCases: Record<string, number> // aus Tags: performance, family, alltag, …
  targetPowerHp?: number
  priceRange?: { min: number; max: number }
  dislikedPatterns: Record<string, number>
  strongPositive: string[] // z. B. "model:BMW M340i Touring"
  strongNegative: string[]
  signalCount: number
  /** 0–1: wächst mit Signalanzahl (belastbar ab ~20 Swipes) */
  confidence: number
}

export function emptyTasteProfile(): TasteProfile {
  return {
    makes: {}, models: {}, segments: {}, bodyTypes: {}, vehicleSizes: {},
    fuelTypes: {}, transmissions: {}, drivetrains: {}, useCases: {},
    dislikedPatterns: {}, strongPositive: [], strongNegative: [],
    signalCount: 0, confidence: 0,
  }
}

export function tasteSignalWeight(s: TasteSignal): number {
  if (s.kind === 'DUEL_WIN') return 6
  if (s.kind === 'DUEL_LOSS') return -2
  const base: Record<'MODEL' | 'LISTING', Record<SwipeAction, number>> = {
    MODEL: { SUPERLIKE: 10, LIKE: 5, DISLIKE: -5, SKIP: -1 },
    LISTING: { SUPERLIKE: 15, LIKE: 8, DISLIKE: -8, SKIP: -1 },
  }
  let w = base[s.kind][s.action]
  if (w > 0) {
    if (s.dwellTimeMs != null && s.dwellTimeMs > 6000) w += 2
    if (s.openedDetails || s.openedMore) w += 2
    if (s.isFavorite) w += 12
    if (s.contactedDealer) w += 20
  }
  return w
}

const bump = (map: Record<string, number>, key: string | null | undefined, delta: number) => {
  if (!key) return
  map[key] = Math.round(((map[key] ?? 0) + delta) * 100) / 100
}

/** Mindest-Signalzahl, ab der eine Geschmackszusammenfassung gezeigt wird. */
export const TASTE_SUMMARY_THRESHOLD = 20
/** Betrag, ab dem ein Muster als starkes Signal gilt. */
const STRONG_SIGNAL_ABS = 15

export function buildTasteProfile(signals: TasteSignal[]): TasteProfile {
  const p = emptyTasteProfile()

  for (const s of signals) {
    const w = tasteSignalWeight(s)
    const a = s.attributes
    const modelKey = a.model ? `${a.make} ${a.model}` : a.make

    bump(p.makes, a.make, w)
    bump(p.models, modelKey, w)
    bump(p.segments, a.segment, w)
    bump(p.bodyTypes, a.bodyType, w)
    bump(p.vehicleSizes, a.vehicleSize, w)
    for (const f of a.fuelTypes ?? []) bump(p.fuelTypes, f, w / (a.fuelTypes!.length))
    for (const t of a.transmissionTypes ?? []) bump(p.transmissions, t, w / (a.transmissionTypes!.length))
    bump(p.drivetrains, a.drivetrain, w)
    for (const tag of a.tags ?? []) bump(p.useCases, tag, w)

    if (w > 0) {
      if (a.powerHpMid != null) {
        const alpha = Math.min(0.4, 0.03 * w)
        p.targetPowerHp = p.targetPowerHp == null ? a.powerHpMid : p.targetPowerHp + alpha * (a.powerHpMid - p.targetPowerHp)
      }
      if (a.priceMid != null) {
        const min = Math.round(a.priceMid * 0.7)
        const max = Math.round(a.priceMid * 1.2)
        p.priceRange = p.priceRange == null
          ? { min, max }
          : {
              min: Math.round(p.priceRange.min + 0.25 * (min - p.priceRange.min)),
              max: Math.round(p.priceRange.max + 0.25 * (max - p.priceRange.max)),
            }
      }
    }
    if (s.action === 'DISLIKE') {
      if (a.bodyType) bump(p.dislikedPatterns, `bodyType:${a.bodyType}`, 1)
      if (a.vehicleSize) bump(p.dislikedPatterns, `size:${a.vehicleSize}`, 1)
      bump(p.dislikedPatterns, `make:${a.make}`, 1)
    }
    p.signalCount += 1
  }

  for (const [key, val] of Object.entries(p.models)) {
    if (val >= STRONG_SIGNAL_ABS) p.strongPositive.push(`model:${key}`)
    if (val <= -STRONG_SIGNAL_ABS) p.strongNegative.push(`model:${key}`)
  }
  // Konfidenz: 0 bei 0 Signalen, ~0.5 bei 20, ~0.8 bei 50, asymptotisch → 1
  p.confidence = Math.round((1 - Math.exp(-p.signalCount / 28)) * 100) / 100
  return p
}

export function topEntries(map: Record<string, number>, n = 3): Array<[string, number]> {
  return Object.entries(map)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
}

/** normalisierte Affinität [-1, 1] relativ zum stärksten Betrag der Tabelle */
export function tasteAffinity(map: Record<string, number>, key?: string | null): number {
  if (!key) return 0
  const maxAbs = Math.max(1, ...Object.values(map).map((v) => Math.abs(v)))
  return (map[key] ?? 0) / maxAbs
}

/** strukturierte Insights (i18n-Keys) für die Taste-Summary-UI */
export interface TasteInsight {
  insightType: string
  titleKey: string
  params: Record<string, string | number>
  confidence: number
}

export function deriveTasteInsights(p: TasteProfile): TasteInsight[] {
  const insights: TasteInsight[] = []
  if (p.signalCount < TASTE_SUMMARY_THRESHOLD) return insights

  const seg = topEntries(p.segments, 1)[0]
  if (seg) insights.push({ insightType: 'topSegment', titleKey: 'taste.insight.topSegment', params: { segment: seg[0] }, confidence: p.confidence })

  const makes = topEntries(p.makes, 2)
  if (makes.length) {
    insights.push({
      insightType: 'topMakes', titleKey: 'taste.insight.topMakes',
      params: { makes: makes.map(([k]) => k).join(', ') }, confidence: p.confidence,
    })
  }
  const bodies = topEntries(p.bodyTypes, 2)
  if (bodies.length)
    insights.push({ insightType: 'topBodyTypes', titleKey: 'taste.insight.topBodyTypes', params: { bodyTypes: bodies.map(([k]) => k).join(',') }, confidence: p.confidence })

  if (p.targetPowerHp != null && p.targetPowerHp >= 250)
    insights.push({ insightType: 'powerPreference', titleKey: 'taste.insight.highPower', params: { hp: Math.round(p.targetPowerHp / 10) * 10 }, confidence: p.confidence })

  const trans = topEntries(p.transmissions, 1)[0]
  if (trans) insights.push({ insightType: 'transmission', titleKey: 'taste.insight.transmission', params: { transmission: trans[0] }, confidence: p.confidence * 0.9 })

  if (p.priceRange)
    insights.push({ insightType: 'priceRange', titleKey: 'taste.insight.priceRange', params: { max: Math.round(p.priceRange.max / 1000) * 1000 }, confidence: p.confidence * 0.8 })

  const dislikedSize = Object.entries(p.dislikedPatterns).find(([k, v]) => k === 'size:small' && v >= 2)
  if (dislikedSize)
    insights.push({ insightType: 'dislikedSmall', titleKey: 'taste.insight.dislikedSmall', params: {}, confidence: p.confidence * 0.8 })

  return insights
}

/** Kurze Text-Zusammenfassung (de/en) aus dem Profil — datenbasiert, nicht hart codiert. */
export function summarizeTasteProfile(p: TasteProfile, locale: 'de' | 'en' = 'de'): string | null {
  if (p.signalCount < TASTE_SUMMARY_THRESHOLD) return null
  const seg = topEntries(p.segments, 2).map(([k]) => k)
  const trans = topEntries(p.transmissions, 1)[0]?.[0]
  const fuels = topEntries(p.fuelTypes, 2).map(([k]) => k)
  const parts: string[] = []

  const fuelLabel = (f: string, de: boolean) =>
    ({ PETROL: de ? 'Benzin' : 'petrol', DIESEL: 'Diesel', ELECTRIC: de ? 'Elektro' : 'electric', HYBRID: 'Hybrid', PLUGIN_HYBRID: 'Plug-in-Hybrid' })[f] ?? f

  if (locale === 'de') {
    if (seg.length) parts.push(seg.join(' und '))
    if (trans === 'AUTOMATIC') parts.push('Automatik')
    if (p.targetPowerHp != null && p.targetPowerHp >= 250) parts.push(`${Math.round(p.targetPowerHp / 50) * 50}+ PS`)
    if (fuels.length) parts.push(`eher ${fuels.map((f) => fuelLabel(f, true)).join('/')}`)
    if (p.priceRange) parts.push(`bis ca. ${Math.round(p.priceRange.max / 1000)}.000 €`)
    return parts.length ? `Dein Autogeschmack: ${parts.join(', ')}.` : null
  }
  if (seg.length) parts.push(seg.join(' and '))
  if (trans === 'AUTOMATIC') parts.push('automatic')
  if (p.targetPowerHp != null && p.targetPowerHp >= 250) parts.push(`${Math.round(p.targetPowerHp / 50) * 50}+ hp`)
  if (fuels.length) parts.push(`mostly ${fuels.map((f) => fuelLabel(f, false)).join('/')}`)
  if (p.priceRange) parts.push(`up to ~€${Math.round(p.priceRange.max / 1000)}k`)
  return parts.length ? `Your car taste: ${parts.join(', ')}.` : null
}
