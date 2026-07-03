/** Quartett-Scores pro Fahrzeug. 0–100, mit Konfidenz — nie Fantasiewerte ohne Kennzeichnung. */
export type VehicleScoreKey =
  | 'performance'
  | 'everyday'
  | 'priceValue'
  | 'runningCosts'
  | 'rarity'
  | 'comfort'
  | 'fun'
  | 'efficiency'
  | 'family'
  | 'longDistance'

export interface VehicleScore {
  key: VehicleScoreKey
  /** 0–100 */
  value: number
  /** 0–1: wie belastbar die Datengrundlage ist. < 0.5 → UI zeigt "geschätzt". */
  confidence: number
}

export type PriceAssessmentVerdict = 'GOOD_DEAL' | 'FAIR' | 'EXPENSIVE' | 'UNKNOWN'

export interface PriceAssessment {
  verdict: PriceAssessmentVerdict
  /** Abweichung vom Vergleichsmedian in %, negativ = günstiger. */
  deltaPercent?: number
  comparablesCount: number
  confidence: number
}

export type RiskFlagKey =
  | 'HIGH_MILEAGE'
  | 'UNUSUALLY_LOW_PRICE'
  | 'MANY_PREVIOUS_OWNERS'
  | 'MISSING_DATA'
  | 'ACCIDENT_HISTORY_UNCLEAR'
  | 'NO_WARRANTY'

export interface RiskFlag {
  key: RiskFlagKey
  severity: 'INFO' | 'WARN'
}

/** Score-Aufschlüsselung einer Empfehlung — organisch und bezahlt strikt getrennt. */
export interface ScoreBreakdown {
  contentMatch: number
  priceFit: number
  distanceBoost: number
  freshnessBoost: number
  diversityBoost: number
  qualityScore: number
  explorationBonus: number
  /** Bezahlter Boost — separat gespeichert, in UI als "Gesponsert" gekennzeichnet. */
  sponsoredBoost: number
  organicTotal: number
  finalTotal: number
}

export interface RecommendationExplanation {
  /** i18n-Key, z. B. 'explain.likedBodyAndPower' */
  key: string
  params: Record<string, string | number>
}
