import { describe, expect, it } from 'vitest'
import { adjustComparablePrice, estimateVehicleValue } from '../src/scores/valuation.js'

describe('C2B-Fahrzeugbewertung', () => {
  it('Vergleichsfahrzeug mit mehr Kilometern wertet das Zielfahrzeug auf', () => {
    const adjusted = adjustComparablePrice(
      { price: 30000, mileage: 120000, year: 2020 },
      { mileage: 60000, year: 2020 },
    )
    expect(adjusted).toBe(30000 + 60000 * 0.04) // 32.400
  })

  it('Laufleistungs-Anpassung ist auf ±25 % gedeckelt', () => {
    const adjusted = adjustComparablePrice(
      { price: 20000, mileage: 400000, year: 2020 },
      { mileage: 0, year: 2020 },
    )
    expect(adjusted).toBe(25000)
  })

  it('jüngeres Zielfahrzeug ist mehr wert (5 %/Jahr, Cap ±20 %)', () => {
    const newer = adjustComparablePrice({ price: 30000, year: 2018 }, { year: 2022 })
    expect(newer).toBe(36000)
    const capped = adjustComparablePrice({ price: 30000, year: 2010 }, { year: 2024 })
    expect(capped).toBe(36000) // gedeckelt bei +20 %
  })

  it('unter 3 Vergleichen keine Schätzung', () => {
    const r = estimateVehicleValue({ mileage: 50000, year: 2021 }, [{ price: 30000 }])
    expect(r.estimate).toBeNull()
    expect(r.confidence).toBeLessThanOrEqual(0.1)
  })

  it('Median-Schätzung mit Spanne und wachsender Konfidenz', () => {
    const comps = [
      { price: 28000, mileage: 50000, year: 2021 },
      { price: 30000, mileage: 50000, year: 2021 },
      { price: 32000, mileage: 50000, year: 2021 },
      { price: 31000, mileage: 50000, year: 2021 },
      { price: 29000, mileage: 50000, year: 2021 },
    ]
    const r = estimateVehicleValue({ mileage: 50000, year: 2021 }, comps)
    expect(r.estimate).toBe(30000)
    expect(r.low).toBeLessThan(r.estimate!)
    expect(r.high).toBeGreaterThan(r.estimate!)
    expect(r.confidence).toBeGreaterThan(0.5)
  })
})
