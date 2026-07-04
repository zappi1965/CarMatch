import { describe, expect, it } from 'vitest'
import { estimateMonthlyCosts } from '../src/scores/monthlyCosts.js'

const REF = { referenceYear: 2026 }

describe('Monatskosten-Schätzung', () => {
  const m340i = {
    price: 54900, year: 2021, mileage: 48200, powerHp: 374,
    fuelType: 'PETROL', consumptionL100: 8.1, displacementCcm: 2998, co2GKm: 185,
  }
  const fiat = {
    price: 11490, year: 2021, mileage: 28600, powerHp: 70,
    fuelType: 'HYBRID', consumptionL100: 5.1, displacementCcm: 999, co2GKm: 118,
  }

  it('starker Benziner kostet monatlich deutlich mehr als Kleinwagen', () => {
    const a = estimateMonthlyCosts(m340i, REF)
    const b = estimateMonthlyCosts(fiat, REF)
    expect(a.total).toBeGreaterThan(b.total * 2)
    expect(a.total).toBe(a.depreciation + a.fuel + a.insurance + a.tax + a.maintenance)
  })

  it('E-Auto: keine Kfz-Steuer, Stromkosten statt Sprit', () => {
    const ev = estimateMonthlyCosts(
      { price: 32900, year: 2021, mileage: 61200, powerHp: 441, fuelType: 'ELECTRIC', consumptionL100: 0 },
      REF,
    )
    expect(ev.tax).toBe(0)
    // 12.000 km × 18 kWh/100 km × 0,35 €/kWh / 12 ≈ 63 €
    expect(ev.fuel).toBeGreaterThan(40)
    expect(ev.fuel).toBeLessThan(90)
  })

  it('vollständige Daten → hohe Konfidenz, fehlende Daten → niedrig', () => {
    expect(estimateMonthlyCosts(m340i, REF).confidence).toBeGreaterThanOrEqual(0.8)
    expect(estimateMonthlyCosts({ price: 20000 }, REF).confidence).toBeLessThan(0.5)
  })

  it('mehr Jahreskilometer erhöhen die Kraftstoffkosten linear', () => {
    const low = estimateMonthlyCosts(m340i, { ...REF, kmPerYear: 8000 })
    const high = estimateMonthlyCosts(m340i, { ...REF, kmPerYear: 24000 })
    expect(high.fuel).toBeCloseTo(low.fuel * 3, -1)
  })

  it('junges Auto verliert absolut mehr Wert als altes', () => {
    const young = estimateMonthlyCosts({ ...m340i, year: 2025 }, REF)
    const old = estimateMonthlyCosts({ ...m340i, price: 15000, year: 2012 }, REF)
    expect(young.depreciation).toBeGreaterThan(old.depreciation)
  })
})
