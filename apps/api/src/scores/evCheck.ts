/**
 * E-Auto-Alltagscheck: passt ein konkretes E-Auto zum Pendel-Alltag?
 * Konservativ gerechnet: nutzbare Reichweite = 80 % WLTP (Winter/Puffer),
 * Laden im Alltag nur bis 80 % Akkustand eingeplant.
 */
export interface EvCheckInput {
  electricRangeKm: number
  dailyKm: number
  homeCharging: boolean
}

export type EvVerdict = 'FITS' | 'TIGHT' | 'CHALLENGING'

export interface EvCheckResult {
  verdict: EvVerdict
  usableRangeKm: number
  chargesPerWeek: number
  daysPerCharge: number
}

export function evCheck(input: EvCheckInput): EvCheckResult {
  const usableRangeKm = Math.round(input.electricRangeKm * 0.8 * 0.8) // 80 % WLTP × Laden bis 80 %
  const weeklyKm = input.dailyKm * 6 // 6 Fahrtage als konservative Woche
  const chargesPerWeek = Math.max(0, Math.round((weeklyKm / usableRangeKm) * 10) / 10)
  const daysPerCharge = input.dailyKm > 0 ? Math.floor(usableRangeKm / input.dailyKm) : 99

  let verdict: EvVerdict
  if (input.dailyKm > usableRangeKm) {
    verdict = 'CHALLENGING' // Tagesstrecke übersteigt nutzbare Reichweite
  } else if (input.homeCharging) {
    verdict = daysPerCharge >= 1 ? 'FITS' : 'TIGHT'
  } else {
    // ohne Heimladen: mehr als 2 Ladestopps/Woche wird unbequem
    verdict = chargesPerWeek <= 1 ? 'FITS' : chargesPerWeek <= 2.5 ? 'TIGHT' : 'CHALLENGING'
  }
  return { verdict, usableRangeKm, chargesPerWeek, daysPerCharge }
}
