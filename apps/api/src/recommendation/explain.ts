import type { RecommendationExplanation } from '@carmatch/shared'
import { COLD_START_THRESHOLD } from './scoring.js'
import type { UserPreferenceProfile } from './profile.js'

/**
 * Erklärbare Empfehlungen: liefert i18n-Key + Parameter,
 * damit die App die Erklärung in der Nutzersprache rendert.
 */
export function explainRecommendation(
  profile: UserPreferenceProfile,
  candidate: { make: string; bodyType?: string | null; fuelType?: string | null; powerHp?: number | null },
): RecommendationExplanation {
  if (profile.signalCount < COLD_START_THRESHOLD) {
    return { key: 'explain.coldStart', params: {} }
  }

  const topMake = topKey(profile.preferredMakes)
  const topBody = topKey(profile.preferredBodyTypes as Record<string, number>)
  const topFuel = topKey(profile.preferredFuelTypes as Record<string, number>)

  if (topMake && candidate.make === topMake) {
    return { key: 'explain.likedMake', params: { make: topMake } }
  }
  if (topBody && candidate.bodyType === topBody) {
    if (profile.targetPowerHp != null && (candidate.powerHp ?? 0) >= profile.targetPowerHp * 0.85) {
      return { key: 'explain.likedBodyAndPower', params: { bodyType: topBody } }
    }
    return { key: 'explain.likedBody', params: { bodyType: topBody } }
  }
  if (topFuel && candidate.fuelType === topFuel) {
    return { key: 'explain.likedFuel', params: { fuelType: topFuel } }
  }
  return { key: 'explain.similarTaste', params: {} }
}

function topKey(map: Record<string, number>): string | undefined {
  let best: string | undefined
  let bestVal = 0
  for (const [k, v] of Object.entries(map)) {
    if (v > bestVal) {
      best = k
      bestVal = v
    }
  }
  return best
}
