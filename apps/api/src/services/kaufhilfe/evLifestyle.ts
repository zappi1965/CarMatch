import type { EvLifestyleResult } from '@carmatch/shared'

export function calculateEvLifestyleCheck(input: {
  dailyCommuteKm: number
  weeklyKm: number
  longestRegularKm?: number | null
  homeCharging: boolean
  workCharging: boolean
  housingType: string
  consumptionKwh100?: number | null
  electricRangeKm?: number | null
}): EvLifestyleResult {
  const consumption = input.consumptionKwh100 ?? 18.5
  const weeklyEnergyKwh = Math.round((input.weeklyKm / 100) * consumption * 10) / 10
  const range = input.electricRangeKm ?? 380
  const winterRange = range * 0.7
  const longest = input.longestRegularKm ?? input.dailyCommuteKm
  let score = 45
  if (input.homeCharging) score += 30
  if (input.workCharging) score += 12
  if (input.dailyCommuteKm <= winterRange * 0.45) score += 15
  if (longest > winterRange * 0.85) score -= 25
  if (!input.homeCharging && !input.workCharging) score -= 20
  if (input.housingType.includes('street')) score -= 10
  score = Math.max(0, Math.min(100, Math.round(score)))
  const verdict = score >= 72 ? 'good' : score >= 48 ? 'conditional' : 'difficult'
  const recommendation =
    verdict === 'good'
      ? 'E-Auto passt gut. Wallbox oder Laden bei Arbeit macht den Alltag sehr entspannt.'
      : verdict === 'conditional'
        ? 'E-Auto kann passen, aber Ladeplanung und Winterreichweite sollten geprüft werden.'
        : 'E-Auto wirkt im Alltag eher schwierig. Hybrid oder feste Lademöglichkeit prüfen.'
  return {
    score,
    verdict,
    weeklyEnergyKwh,
    weeklyChargingSessions: Math.max(1, Math.ceil(weeklyEnergyKwh / 45)),
    recommendedBatteryKwh: Math.ceil((longest * consumption) / 100 / 0.7),
    winterRangeBufferPercent: Math.round(((winterRange - longest) / Math.max(1, longest)) * 100),
    recommendation,
  }
}
