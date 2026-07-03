import { describe, expect, it } from 'vitest'
import { assessPrice, computeRiskFlags, computeQualityScore } from '../src/scores/priceAssessment.js'

const comparables = [
  { price: 50000 }, { price: 52000 }, { price: 54000 }, { price: 55000 }, { price: 58000 },
]

describe('Marktpreis-Einschätzung', () => {
  it('zu wenige Vergleiche → UNKNOWN mit niedriger Konfidenz', () => {
    const r = assessPrice({ price: 50000 }, [{ price: 51000 }])
    expect(r.verdict).toBe('UNKNOWN')
    expect(r.confidence).toBeLessThan(0.3)
  })

  it('deutlich unter Median → GOOD_DEAL', () => {
    const r = assessPrice({ price: 45000 }, comparables)
    expect(r.verdict).toBe('GOOD_DEAL')
    expect(r.deltaPercent).toBeLessThan(-10)
  })

  it('nahe Median → FAIR, deutlich darüber → EXPENSIVE', () => {
    expect(assessPrice({ price: 54500 }, comparables).verdict).toBe('FAIR')
    expect(assessPrice({ price: 65000 }, comparables).verdict).toBe('EXPENSIVE')
  })
})

describe('Risiko-Hinweise', () => {
  it('markiert hohe Laufleistung, viele Vorbesitzer, unklare Unfallhistorie', () => {
    const flags = computeRiskFlags({
      mileage: 218000, price: 9900, previousOwners: 4, accidentFree: null, warranty: false,
      year: 2016, fuelType: 'PETROL', transmission: 'MANUAL', firstRegistration: '2016-04',
    })
    const keys = flags.map((f) => f.key)
    expect(keys).toContain('HIGH_MILEAGE')
    expect(keys).toContain('MANY_PREVIOUS_OWNERS')
    expect(keys).toContain('ACCIDENT_HISTORY_UNCLEAR')
    expect(keys).toContain('NO_WARRANTY')
  })

  it('auffällig niedriger Preis nur mit belastbarer Vergleichsbasis', () => {
    const assessment = assessPrice({ price: 29900 }, [
      { price: 52000 }, { price: 54000 }, { price: 55000 }, { price: 56000 },
    ])
    const flags = computeRiskFlags(
      { mileage: 58000, price: 29900, previousOwners: 1, accidentFree: true, warranty: true, year: 2021, fuelType: 'PETROL', transmission: 'AUTOMATIC', firstRegistration: '2021-09' },
      assessment,
    )
    expect(flags.map((f) => f.key)).toContain('UNUSUALLY_LOW_PRICE')
  })

  it('vollständiges, sauberes Inserat hat keine Warnungen', () => {
    const flags = computeRiskFlags({
      mileage: 40000, price: 40000, previousOwners: 1, accidentFree: true, warranty: true,
      year: 2022, fuelType: 'DIESEL', transmission: 'AUTOMATIC', firstRegistration: '2022-05',
    })
    expect(flags.filter((f) => f.severity === 'WARN')).toHaveLength(0)
  })

  it('fehlende Angaben → MISSING_DATA', () => {
    const flags = computeRiskFlags({ price: 13900, accidentFree: null })
    expect(flags.map((f) => f.key)).toContain('MISSING_DATA')
  })
})

describe('Inserats-Qualität', () => {
  it('vollständige Inserate erhalten höheren Quality-Score', () => {
    const full = computeQualityScore({
      year: 2021, firstRegistration: '2021-06', mileage: 48200, powerHp: 374,
      fuelType: 'PETROL', transmission: 'AUTOMATIC', bodyType: 'WAGON', doors: 5,
      seats: 5, color: 'Blau', consumptionL100: 8.1, previousOwners: 1,
      accidentFree: true, inspectionValidUntil: '2027-06', fullServiceHistory: true,
      images: ['a', 'b', 'c', 'd', 'e'],
    })
    const sparse = computeQualityScore({ price: 13900, images: ['a'] })
    expect(full).toBeGreaterThan(0.9)
    expect(sparse).toBeLessThan(0.2)
  })
})
