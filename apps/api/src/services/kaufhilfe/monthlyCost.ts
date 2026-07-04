import type { BudgetFit, MonthlyCostInput, MonthlyOwnershipCostBreakdown } from '@carmatch/shared'

const round = (n: number) => Math.round(n)
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n))

export function estimateDepreciation(v: MonthlyCostInput): number {
  const age = v.year ? Math.max(0, new Date().getFullYear() - v.year) : 5
  const fuel = String(v.fuelType ?? '').toUpperCase()
  const baseRate = fuel === 'ELECTRIC' ? 0.13 : fuel.includes('HYBRID') ? 0.105 : 0.095
  const ageFactor = age <= 2 ? 1.15 : age <= 6 ? 0.85 : 0.48
  const mileageFactor = (v.mileage ?? 75000) > 150000 ? 0.7 : 1
  return round((v.price * baseRate * ageFactor * mileageFactor) / 12)
}

export function estimateInsurance(v: MonthlyCostInput): number {
  const hp = v.powerHp ?? 150
  const sport = hp >= 400 ? 1.75 : hp >= 300 ? 1.45 : hp >= 220 ? 1.2 : 1
  const premium = v.price > 70000 ? 1.35 : v.price > 45000 ? 1.15 : 1
  return round(clamp(65 * sport * premium, 45, 260))
}

export function estimateTax(v: MonthlyCostInput): number {
  const fuel = String(v.fuelType ?? '').toUpperCase()
  if (fuel === 'ELECTRIC') return 0
  const ccm = v.displacementCcm ?? (v.powerHp && v.powerHp > 280 ? 3000 : 2000)
  const co2 = v.co2GKm ?? (fuel === 'DIESEL' ? 145 : 170)
  const engineTax = fuel === 'DIESEL' ? (ccm / 100) * 9.5 : (ccm / 100) * 2
  const co2Tax = Math.max(0, co2 - 95) * 2
  return round((engineTax + co2Tax) / 12)
}

export function estimateFuelOrEnergyCost(v: MonthlyCostInput): number {
  const annualKm = v.annualKm ?? 12000
  const fuel = String(v.fuelType ?? '').toUpperCase()
  if (fuel === 'ELECTRIC') {
    const kwh100 = v.energyConsumptionKwh100 ?? 18.5
    return round(((annualKm / 100) * kwh100 * 0.39) / 12)
  }
  const l100 =
    v.consumptionL100 && v.consumptionL100 > 0 ? v.consumptionL100 : fuel === 'DIESEL' ? 6.2 : 8.0
  const pricePerLiter = fuel === 'DIESEL' ? 1.72 : 1.85
  return round(((annualKm / 100) * l100 * pricePerLiter) / 12)
}

export function estimateMaintenance(v: MonthlyCostInput): number {
  const hp = v.powerHp ?? 150
  const age = v.year ? Math.max(0, new Date().getFullYear() - v.year) : 5
  const mileage = v.mileage ?? 75000
  const base = hp >= 450 ? 220 : hp >= 300 ? 150 : hp >= 220 ? 115 : 80
  const ageAdd = age > 8 ? 35 : age > 5 ? 20 : 0
  const mileageAdd = mileage > 150000 ? 45 : mileage > 100000 ? 25 : 0
  return round(base + ageAdd + mileageAdd)
}

export function estimateFinancing(v: MonthlyCostInput): number {
  // Demo: Kapitalbindung/Finanzierungseffekt 4,5 % p.a., nicht als Rate über Kaufpreis gerechnet.
  return round((v.price * 0.045) / 12)
}

export function budgetFit(total: number, budget?: number | null): BudgetFit {
  if (!budget || budget <= 0) return 'UNKNOWN'
  if (total <= budget) return 'IN_BUDGET'
  if (total <= budget * 1.15) return 'SLIGHTLY_OVER'
  return 'WELL_OVER'
}

export function calculateMonthlyOwnershipCost(v: MonthlyCostInput): MonthlyOwnershipCostBreakdown {
  const depreciation = estimateDepreciation(v)
  const insurance = estimateInsurance(v)
  const tax = estimateTax(v)
  const fuelOrEnergy = estimateFuelOrEnergyCost(v)
  const maintenance = estimateMaintenance(v)
  const financing = estimateFinancing(v)
  const total = round(depreciation + insurance + tax + fuelOrEnergy + maintenance + financing)
  return {
    depreciation,
    insurance,
    tax,
    fuelOrEnergy,
    maintenance,
    financing,
    total,
    budgetFit: budgetFit(total, v.userMonthlyBudgetEur),
    assumptions: [
      `${v.annualKm ?? 12000} km/Jahr`,
      'Demo-Schätzung: echte Versicherungs-/Steuer-/Finanzdaten später austauschbar',
      'Wertverlust aus Preis, Alter, Antrieb und Laufleistung approximiert',
    ],
  }
}
