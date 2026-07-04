import { describe, expect, it } from 'vitest'
import { computeTrend, monthsUntilAffordable } from '../src/scores/marketTrend.js'

describe('Markttrend', () => {
  it('fallende Preise werden erkannt', () => {
    const r = computeTrend([27000, 27500, 26800, 27200], [30000, 29500, 30500])
    expect(r.direction).toBe('FALLING')
    expect(r.trendPercent).toBeLessThan(-5)
  })

  it('zu wenig Daten → UNKNOWN mit niedriger Konfidenz', () => {
    const r = computeTrend([27000], [30000, 29500, 30500])
    expect(r.direction).toBe('UNKNOWN')
    expect(r.confidence).toBeLessThanOrEqual(0.1)
  })

  it('Saison-Hinweis: Cabrio im Winter', () => {
    const winter = computeTrend([20000, 21000, 20500], [20000, 21000, 20500], 'CONVERTIBLE', 12)
    const summer = computeTrend([20000, 21000, 20500], [20000, 21000, 20500], 'CONVERTIBLE', 7)
    expect(winter.seasonalHint).toBe('WINTER_CONVERTIBLE')
    expect(summer.seasonalHint).toBeNull()
  })
})

describe('Sparziel-Prognose', () => {
  it('Budget reicht bereits → 0 Monate', () => {
    expect(monthsUntilAffordable(30000, 32000, 0, null)).toBe(0)
  })

  it('konstanter Preis: 12.000 € Lücke bei 500 €/Monat → 24 Monate', () => {
    expect(monthsUntilAffordable(30000, 18000, 500, 0)).toBe(24)
  })

  it('fallende Preise verkürzen die Wartezeit', () => {
    const flat = monthsUntilAffordable(60000, 30000, 500, 0)!
    const falling = monthsUntilAffordable(60000, 30000, 500, -10)!
    expect(falling).toBeLessThan(flat)
  })

  it('unerreichbar in 5 Jahren → null', () => {
    expect(monthsUntilAffordable(200000, 0, 100, 5)).toBeNull()
  })
})
