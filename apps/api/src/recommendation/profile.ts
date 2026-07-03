import type { BodyType, FuelType, SwipeAction, Transmission, Drivetrain } from '@carmatch/shared'

/**
 * UserPreferenceProfile — gewichtete Präferenzen, gelernt aus Swipe-Signalen.
 * Wird als weightsJson in RecommendationProfile persistiert.
 */
export interface UserPreferenceProfile {
  preferredMakes: Record<string, number>
  preferredModels: Record<string, number>
  preferredBodyTypes: Partial<Record<BodyType, number>>
  preferredFuelTypes: Partial<Record<FuelType, number>>
  preferredTransmissions: Partial<Record<Transmission, number>>
  preferredDrivetrains: Partial<Record<Drivetrain, number>>
  /** gleitende Zielwerte (gewichteter Mittelwert der positiv bewerteten Fahrzeuge) */
  targetPrice?: number
  targetMileage?: number
  targetPowerHp?: number
  targetYear?: number
  preferredSellerType?: Record<string, number>
  /** Muster, die wiederholt disliked wurden, z. B. "bodyType:HATCHBACK" */
  dislikedPatterns: Record<string, number>
  /** Anzahl verarbeiteter Signale — steuert Cold-Start vs. Personalisierung */
  signalCount: number
}

export function emptyProfile(): UserPreferenceProfile {
  return {
    preferredMakes: {},
    preferredModels: {},
    preferredBodyTypes: {},
    preferredFuelTypes: {},
    preferredTransmissions: {},
    preferredDrivetrains: {},
    preferredSellerType: {},
    dislikedPatterns: {},
    signalCount: 0,
  }
}

export interface SwipeSignal {
  action: SwipeAction
  dwellTimeMs?: number | null
  openedDetails?: boolean
  openedMore?: boolean
  contactedDealer?: boolean
  isFavorite?: boolean
  listing: {
    make: string
    model: string
    bodyType?: BodyType | null
    fuelType?: FuelType | null
    transmission?: Transmission | null
    drivetrain?: Drivetrain | null
    sellerType?: string | null
    price: number
    mileage?: number | null
    powerHp?: number | null
    year?: number | null
  }
}

/** Basisgewicht je Aktion; Engagement-Signale verstärken. */
export function signalWeight(s: SwipeSignal): number {
  const base: Record<SwipeAction, number> = {
    LIKE: 1,
    SUPERLIKE: 2.5,
    DISLIKE: -1,
    SKIP: -0.15,
  }
  let w = base[s.action]
  if (w > 0) {
    if (s.openedDetails) w += 0.3
    if (s.openedMore) w += 0.4
    if (s.contactedDealer) w += 2
    if (s.isFavorite) w += 1.5
    // Verweildauer: > 6s deutet auf echtes Interesse (auch bei Dislike leicht positiv fürs Segment)
    if (s.dwellTimeMs != null && s.dwellTimeMs > 6000) w += 0.3
  }
  return w
}

function bump(map: Record<string, number>, key: string | null | undefined, delta: number) {
  if (!key) return
  map[key] = (map[key] ?? 0) + delta
}

/** Gleitender Zielwert: nähert sich positiv bewerteten Fahrzeugen an. */
function ema(current: number | undefined, value: number, weight: number): number {
  const alpha = Math.min(0.4, 0.15 * weight)
  return current == null ? value : current + alpha * (value - current)
}

/**
 * Baut das Präferenzprofil aus einer Liste von Signalen (inkrementell anwendbar).
 */
export function applySignals(
  profile: UserPreferenceProfile,
  signals: SwipeSignal[],
): UserPreferenceProfile {
  const p = structuredClone(profile)
  for (const s of signals) {
    const w = signalWeight(s)
    const l = s.listing
    bump(p.preferredMakes, l.make, w)
    bump(p.preferredModels, `${l.make} ${l.model}`, w)
    bump(p.preferredBodyTypes as Record<string, number>, l.bodyType ?? undefined, w)
    bump(p.preferredFuelTypes as Record<string, number>, l.fuelType ?? undefined, w)
    bump(p.preferredTransmissions as Record<string, number>, l.transmission ?? undefined, w)
    bump(p.preferredDrivetrains as Record<string, number>, l.drivetrain ?? undefined, w)
    bump(p.preferredSellerType!, l.sellerType ?? undefined, w)

    if (w > 0) {
      p.targetPrice = ema(p.targetPrice, l.price, w)
      if (l.mileage != null) p.targetMileage = ema(p.targetMileage, l.mileage, w)
      if (l.powerHp != null) p.targetPowerHp = ema(p.targetPowerHp, l.powerHp, w)
      if (l.year != null) p.targetYear = ema(p.targetYear, l.year, w)
    }

    if (s.action === 'DISLIKE') {
      if (l.bodyType) bump(p.dislikedPatterns, `bodyType:${l.bodyType}`, 1)
      bump(p.dislikedPatterns, `make:${l.make}`, 1)
      if (l.fuelType) bump(p.dislikedPatterns, `fuelType:${l.fuelType}`, 1)
    }
    p.signalCount += 1
  }
  return p
}

/** Normalisiert eine Gewichtstabelle auf [-1, 1] relativ zum stärksten Betrag. */
export function normalizedAffinity(map: Record<string, number>, key?: string | null): number {
  if (!key) return 0
  const maxAbs = Math.max(1, ...Object.values(map).map((v) => Math.abs(v)))
  return (map[key] ?? 0) / maxAbs
}
