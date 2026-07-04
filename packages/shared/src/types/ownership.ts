import type { FuelType } from './listing.js'

export type BudgetFit = 'IN_BUDGET' | 'SLIGHTLY_OVER' | 'WELL_OVER' | 'UNKNOWN'

export interface MonthlyOwnershipCostBreakdown {
  depreciation: number
  insurance: number
  tax: number
  fuelOrEnergy: number
  maintenance: number
  financing: number
  total: number
  budgetFit: BudgetFit
  assumptions: string[]
}

export interface MonthlyCostInput {
  price: number
  year?: number | null
  mileage?: number | null
  powerHp?: number | null
  fuelType?: FuelType | string | null
  consumptionL100?: number | null
  energyConsumptionKwh100?: number | null
  co2GKm?: number | null
  displacementCcm?: number | null
  bodyType?: string | null
  userMonthlyBudgetEur?: number | null
  annualKm?: number | null
}

export interface MarketTimingInsight {
  averagePrice30d?: number
  averagePrice90d?: number
  averagePrice365d?: number
  currentVsYearAveragePercent?: number
  trendDirection: 'falling' | 'stable' | 'rising'
  seasonalHint?: string
  bestBuyingMonths?: string[]
  targetBudgetMonths?: number | null
  waitAdvice: string
}

export interface EvLifestyleResult {
  score: number
  verdict: 'good' | 'conditional' | 'difficult'
  weeklyEnergyKwh: number
  weeklyChargingSessions: number
  recommendedBatteryKwh: number
  winterRangeBufferPercent: number
  recommendation: string
}
