import { describe, expect, it } from 'vitest'
import { computeVehicleScores } from '../src/scores/vehicleScores.js'

const m340i = {
  powerHp: 374, weightKg: 1885, zeroToHundred: 4.5, bodyType: 'WAGON',
  fuelType: 'PETROL', transmission: 'AUTOMATIC', drivetrain: 'AWD',
  seats: 5, doors: 5, trunkVolumeL: 500, consumptionL100: 8.1, co2GKm: 185,
  price: 54900, mileage: 48200, year: 2021,
  features: ['AHK', 'HUD', 'Harman Kardon'],
  comparablesCount: 5, medianPricePerHp: 150,
}

const fiat500 = {
  powerHp: 70, weightKg: 980, zeroToHundred: 13.8, bodyType: 'HATCHBACK' as const,
  fuelType: 'HYBRID', transmission: 'MANUAL', drivetrain: 'FWD',
  seats: 4, doors: 3, trunkVolumeL: 185, consumptionL100: 5.1,
  price: 11490, mileage: 28600, year: 2021,
}

describe('Quartett-Scores', () => {
  const get = (scores: ReturnType<typeof computeVehicleScores>, key: string) =>
    scores.find((s) => s.key === key)

  it('Performance: M340i deutlich über Fiat 500', () => {
    const a = get(computeVehicleScores(m340i), 'performance')!
    const b = get(computeVehicleScores(fiat500), 'performance')!
    expect(a.value).toBeGreaterThan(80)
    expect(b.value).toBeLessThan(20)
    expect(a.confidence).toBeGreaterThanOrEqual(0.8) // 0-100-Wert vorhanden
  })

  it('Werte bleiben in [0, 100]', () => {
    for (const s of [...computeVehicleScores(m340i), ...computeVehicleScores(fiat500)]) {
      expect(s.value).toBeGreaterThanOrEqual(0)
      expect(s.value).toBeLessThanOrEqual(100)
      expect(s.confidence).toBeGreaterThan(0)
      expect(s.confidence).toBeLessThanOrEqual(1)
    }
  })

  it('fehlende Daten senken die Konfidenz statt Werte zu erfinden', () => {
    const sparse = computeVehicleScores({ powerHp: 136, price: 9900 })
    const perf = get(sparse, 'performance')!
    expect(perf.confidence).toBeLessThan(0.5) // UI zeigt "geschätzt"
    expect(get(sparse, 'efficiency')).toBeUndefined() // ohne Verbrauch kein Effizienz-Score
  })

  it('Unterhaltskosten: sparsamer Kleinwagen schlägt starken Benziner', () => {
    const a = get(computeVehicleScores(fiat500), 'runningCosts')!
    const b = get(computeVehicleScores(m340i), 'runningCosts')!
    expect(a.value).toBeGreaterThan(b.value)
  })

  it('Familien-Score: 7-Sitzer-SUV über Zweisitzer-Coupé', () => {
    const suv = computeVehicleScores({ ...m340i, bodyType: 'SUV', seats: 7 })
    const coupe = computeVehicleScores({ ...m340i, bodyType: 'COUPE', seats: 2, doors: 2 })
    expect(get(suv, 'family')!.value).toBeGreaterThan(get(coupe, 'family')!.value + 30)
  })
})
