/**
 * Hybrid Recommendation Scoring: verbindet das Geschmacksprofil aus dem
 * Inspirationsmodus mit dem Inseratsverhalten.
 *
 * FinalRecommendationScore =
 *   40 % Geschmackspassung (TasteScore)
 * + 25 % Filter-/Preis-/Standortpassung
 * + 15 % Inseratsqualität
 * + 10 % Frische
 * +  5 % Diversity
 * +  5 % Marktpreis-/Deal-Faktor
 *
 * Sponsored-Boost bleibt strikt separat (nie im organischen Score) und wird
 * in der UI als "Gesponsert" markiert. Filter haben Vorrang: gefiltert wird
 * VOR dem Scoring — Empfehlungen können Filter nicht aushebeln.
 */

import type { GeoPoint } from '@carmatch/shared'
import { distanceKm } from '@carmatch/shared'
import { tasteAffinity, type TasteProfile } from './taste.js'
import { rangeFit, type ScoringCandidate, type ScoringContext } from './scoring.js'

export interface HybridScoreBreakdown {
  tasteScore: number // 0..1 Geschmackspassung
  contextFit: number // 0..1 Preis/Standort/Filterumfeld
  qualityScore: number
  freshnessBoost: number
  diversityBoost: number // -1..0 Malus
  dealFactor: number // 0..1 aus Marktpreis-Delta
  explorationBonus: number
  organicTotal: number
  sponsoredBoost: number
  finalTotal: number
  /** Modelle, die zur Passung beigetragen haben (für Erklärungen) */
  matchedModelKeys: string[]
}

export interface HybridContext extends ScoringContext {
  /** Marktpreis-Delta in % (negativ = günstiger als Vergleich), falls bekannt */
  priceDeltaPercent?: number | null
}

const EXPLORATION_EPSILON = 0.05

export function scoreListingHybrid(
  taste: TasteProfile,
  c: ScoringCandidate & { segment?: string | null },
  ctx: HybridContext = {},
): HybridScoreBreakdown {
  const now = ctx.now ?? new Date()
  const rand = ctx.random ?? Math.random
  const personalized = taste.confidence >= 0.15 // ~ ab 5 Signalen

  // 1) TasteScore: gewichtete Attribut-Affinitäten aus dem Geschmacksprofil
  let tasteScore = 0.35 // neutraler Cold-Start-Wert
  const matchedModelKeys: string[] = []
  if (personalized) {
    const modelKey = `${c.make} ${c.model}`
    const makeAff = tasteAffinity(taste.makes, c.make)
    const modelAff = tasteAffinity(taste.models, modelKey)
    const bodyAff = tasteAffinity(taste.bodyTypes, c.bodyType)
    const fuelAff = tasteAffinity(taste.fuelTypes, c.fuelType)
    const transAff = tasteAffinity(taste.transmissions, c.transmission)
    const driveAff = tasteAffinity(taste.drivetrains, c.drivetrain)
    const powerFit = rangeFit(c.powerHp, taste.targetPowerHp, 0.4)

    tasteScore =
      0.26 * makeAff + 0.2 * modelAff + 0.2 * bodyAff +
      0.1 * fuelAff + 0.08 * transAff + 0.06 * driveAff + 0.1 * powerFit

    // wiederholt abgelehnte Muster dämpfen
    for (const [pattern, count] of Object.entries(taste.dislikedPatterns)) {
      if (count < 2) continue
      const [kind, value] = pattern.split(':')
      if ((kind === 'bodyType' && c.bodyType === value) || (kind === 'make' && c.make === value)) {
        tasteScore -= Math.min(0.3, 0.1 * count)
      }
    }
    if (modelAff > 0.4) matchedModelKeys.push(modelKey)
    for (const key of taste.strongPositive) {
      const name = key.replace('model:', '')
      if (name !== modelKey && (name.startsWith(c.make) || (c.bodyType && tasteAffinity(taste.bodyTypes, c.bodyType) > 0.5))) {
        matchedModelKeys.push(name)
      }
    }
    tasteScore = Math.max(-1, Math.min(1, tasteScore))
  }

  // 2) Kontext-Fit: Preis im gelernten Bereich + Nähe zum Standort
  let priceFit = 0.5
  if (personalized && taste.priceRange && c.price > 0) {
    const { min, max } = taste.priceRange
    priceFit = c.price >= min && c.price <= max ? 1 : rangeFit(c.price, (min + max) / 2, 0.5)
  }
  let distanceFit = 0.5
  if (ctx.userPoint && c.latitude != null && c.longitude != null) {
    const d = distanceKm(ctx.userPoint as GeoPoint, { latitude: c.latitude, longitude: c.longitude })
    distanceFit = Math.max(0, 1 - d / (ctx.radiusKm ?? 250))
  }
  const contextFit = 0.6 * priceFit + 0.4 * distanceFit

  // 3–4) Qualität + Frische
  const ageDays = (now.getTime() - c.createdAt.getTime()) / 86_400_000
  const freshnessBoost = Math.exp(-ageDays / 7)

  // 5) Diversity-Malus für zuletzt gezeigte Marken/Karosserien
  const keys = ctx.recentlyShownKeys ?? []
  const repeats = keys.filter((k) => k === `make:${c.make}` || k === `body:${c.bodyType}`).length
  const diversityBoost = -Math.min(1, 0.2 * repeats)

  // 6) Deal-Faktor aus Marktpreis-Einschätzung
  const dealFactor =
    ctx.priceDeltaPercent == null ? 0.5 : Math.max(0, Math.min(1, 0.5 - ctx.priceDeltaPercent / 40))

  const explorationBonus = rand() * EXPLORATION_EPSILON

  const organicTotal =
    0.4 * tasteScore + 0.25 * contextFit + 0.15 * c.qualityScore +
    0.1 * freshnessBoost + 0.05 * diversityBoost + 0.05 * dealFactor + explorationBonus

  const sponsoredBoost = c.sponsoredBoost ?? 0

  const r = (n: number) => Math.round(n * 1000) / 1000
  return {
    tasteScore: r(tasteScore),
    contextFit: r(contextFit),
    qualityScore: r(c.qualityScore),
    freshnessBoost: r(freshnessBoost),
    diversityBoost: r(diversityBoost),
    dealFactor: r(dealFactor),
    explorationBonus: r(explorationBonus),
    organicTotal: r(organicTotal),
    sponsoredBoost: r(sponsoredBoost),
    finalTotal: r(organicTotal + sponsoredBoost),
    matchedModelKeys: [...new Set(matchedModelKeys)].slice(0, 3),
  }
}

/**
 * Erklärbare Empfehlung: erzeugt i18n-Key + Parameter aus Profil, Inserat
 * und Score-Breakdown (generateRecommendationExplanation der Spezifikation).
 */
export function generateRecommendationExplanation(
  taste: TasteProfile,
  listing: { make: string; bodyType?: string | null; transmission?: string | null; powerHp?: number | null; price: number },
  breakdown: HybridScoreBreakdown,
  distanceKmValue?: number | null,
): { key: string; params: Record<string, string | number> } {
  if (taste.confidence < 0.15) return { key: 'explain.coldStart', params: {} }

  if (breakdown.matchedModelKeys.length > 0) {
    return { key: 'explain.similarModels', params: { models: breakdown.matchedModelKeys.join(', ') } }
  }
  const topSegment = Object.entries(taste.segments).sort((a, b) => b[1] - a[1])[0]
  if (topSegment && topSegment[1] > 0 && breakdown.tasteScore > 0.3) {
    return { key: 'explain.likedSegment', params: { segment: topSegment[0] } }
  }
  if (taste.targetPowerHp != null && taste.targetPowerHp >= 250 && (listing.powerHp ?? 0) >= taste.targetPowerHp * 0.85 && listing.transmission === 'AUTOMATIC') {
    return { key: 'explain.powerAndTransmission', params: { hp: Math.round(taste.targetPowerHp / 50) * 50 } }
  }
  if (distanceKmValue != null && taste.priceRange && listing.price <= taste.priceRange.max) {
    return { key: 'explain.distanceAndPrice', params: { km: Math.round(distanceKmValue) } }
  }
  if (breakdown.tasteScore > 0.25) return { key: 'explain.similarTaste', params: {} }
  return { key: 'explain.exploration', params: {} }
}
