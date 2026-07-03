import type { GeoPoint, ScoreBreakdown } from '@carmatch/shared'
import { distanceKm } from '@carmatch/shared'
import { normalizedAffinity, type UserPreferenceProfile } from './profile.js'

/** Kandidat für das Scoring — Teilmenge des DB-Listings. */
export interface ScoringCandidate {
  id: string
  make: string
  model: string
  bodyType?: string | null
  fuelType?: string | null
  transmission?: string | null
  drivetrain?: string | null
  sellerType?: string | null
  price: number
  mileage?: number | null
  powerHp?: number | null
  year?: number | null
  latitude?: number | null
  longitude?: number | null
  createdAt: Date
  qualityScore: number
  /** aktiver Sponsored-Boost (0 wenn nicht gesponsert) — bleibt getrennt */
  sponsoredBoost?: number
}

export interface ScoringContext {
  userPoint?: GeoPoint
  radiusKm?: number | null
  now?: Date
  /** Marken/Bodytypes der zuletzt gezeigten Karten → Diversity-Malus bei Wiederholung */
  recentlyShownKeys?: string[]
  /** deterministischer Zufall für Tests */
  random?: () => number
}

/** Gauß-förmiger Fit: 1 bei Zielwert, fällt mit Abstand (sigma relativ). */
export function rangeFit(value: number | null | undefined, target: number | undefined, sigmaRel = 0.35): number {
  if (value == null || target == null || target <= 0) return 0
  const rel = (value - target) / (target * sigmaRel)
  return Math.exp(-0.5 * rel * rel)
}

const EXPLORATION_EPSILON = 0.08
/** Ab dieser Signalzahl gilt der Nutzer als personalisierbar (Cold-Start-Grenze). */
export const COLD_START_THRESHOLD = 8

export function scoreCandidate(
  profile: UserPreferenceProfile,
  c: ScoringCandidate,
  ctx: ScoringContext = {},
): ScoreBreakdown {
  const now = ctx.now ?? new Date()
  const rand = ctx.random ?? Math.random
  const personalized = profile.signalCount >= COLD_START_THRESHOLD

  // 1) Content-Match: gewichtete Nutzerpräferenzen über Fahrzeugattribute
  let contentMatch = 0
  if (personalized) {
    contentMatch =
      0.3 * normalizedAffinity(profile.preferredMakes, c.make) +
      0.15 * normalizedAffinity(profile.preferredModels, `${c.make} ${c.model}`) +
      0.2 * normalizedAffinity(profile.preferredBodyTypes as Record<string, number>, c.bodyType) +
      0.12 * normalizedAffinity(profile.preferredFuelTypes as Record<string, number>, c.fuelType) +
      0.08 * normalizedAffinity(profile.preferredTransmissions as Record<string, number>, c.transmission) +
      0.05 * normalizedAffinity(profile.preferredDrivetrains as Record<string, number>, c.drivetrain) +
      0.1 * rangeFit(c.powerHp, profile.targetPowerHp) +
      0.08 * rangeFit(c.mileage, profile.targetMileage, 0.6) +
      0.07 * (c.year != null && profile.targetYear != null ? rangeFit(c.year - 2000, profile.targetYear - 2000, 0.25) : 0)

    // wiederholt disliked-te Muster abwerten
    for (const [pattern, count] of Object.entries(profile.dislikedPatterns)) {
      if (count < 2) continue
      const [kind, value] = pattern.split(':')
      const matches =
        (kind === 'bodyType' && c.bodyType === value) ||
        (kind === 'make' && c.make === value) ||
        (kind === 'fuelType' && c.fuelType === value)
      if (matches) contentMatch -= Math.min(0.3, 0.1 * count)
    }
  }

  // 2) Price-Fit: Nähe zum gelernten Preisziel (Cold-Start: neutral)
  const priceFit = personalized ? rangeFit(c.price, profile.targetPrice, 0.45) : 0.3

  // 3) Distance-Boost: näher = besser, linear bis Radius
  let distanceBoost = 0
  if (ctx.userPoint && c.latitude != null && c.longitude != null) {
    const d = distanceKm(ctx.userPoint, { latitude: c.latitude, longitude: c.longitude })
    const max = ctx.radiusKm ?? 250
    distanceBoost = Math.max(0, 1 - d / max)
  }

  // 4) Freshness: neue Inserate leicht bevorzugen (7-Tage-Halbwertszeit)
  const ageDays = (now.getTime() - c.createdAt.getTime()) / 86_400_000
  const freshnessBoost = Math.exp(-ageDays / 7)

  // 5) Diversity: kürzlich gezeigte Marke/Karosserie leicht abwerten
  let diversityBoost = 0
  const keys = ctx.recentlyShownKeys ?? []
  const makeSeen = keys.filter((k) => k === `make:${c.make}`).length
  const bodySeen = keys.filter((k) => k === `body:${c.bodyType}`).length
  diversityBoost = -Math.min(0.25, 0.06 * makeSeen + 0.04 * bodySeen)

  // 6) Exploration: kleiner Zufallsbonus, damit der Feed nicht konvergiert
  const explorationBonus = rand() * EXPLORATION_EPSILON

  const organicTotal =
    0.45 * contentMatch +
    0.15 * priceFit +
    0.12 * distanceBoost +
    0.08 * freshnessBoost +
    diversityBoost +
    0.1 * c.qualityScore +
    explorationBonus

  // 7) Sponsored-Boost: strikt additiv & separat ausgewiesen — nie im organicTotal
  const sponsoredBoost = c.sponsoredBoost ?? 0

  return {
    contentMatch: round(contentMatch),
    priceFit: round(priceFit),
    distanceBoost: round(distanceBoost),
    freshnessBoost: round(freshnessBoost),
    diversityBoost: round(diversityBoost),
    qualityScore: round(c.qualityScore),
    explorationBonus: round(explorationBonus),
    sponsoredBoost: round(sponsoredBoost),
    organicTotal: round(organicTotal),
    finalTotal: round(organicTotal + sponsoredBoost),
  }
}

function round(n: number): number {
  return Math.round(n * 1000) / 1000
}
