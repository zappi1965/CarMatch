import { describe, expect, it } from 'vitest'
import { evCheck } from '../src/scores/evCheck.js'

describe('E-Auto-Alltagscheck', () => {
  it('Pendler mit Heimladen und großer Reichweite → FITS', () => {
    const r = evCheck({ electricRangeKm: 500, dailyKm: 60, homeCharging: true })
    expect(r.verdict).toBe('FITS')
    expect(r.usableRangeKm).toBe(320) // 500 × 0.8 × 0.8
    expect(r.daysPerCharge).toBeGreaterThanOrEqual(5)
  })

  it('Tagesstrecke über nutzbarer Reichweite → CHALLENGING', () => {
    const r = evCheck({ electricRangeKm: 300, dailyKm: 250, homeCharging: true })
    expect(r.verdict).toBe('CHALLENGING')
  })

  it('ohne Heimladen zählt die Zahl der Ladestopps pro Woche', () => {
    const fits = evCheck({ electricRangeKm: 550, dailyKm: 30, homeCharging: false })
    const tight = evCheck({ electricRangeKm: 350, dailyKm: 80, homeCharging: false })
    expect(fits.verdict).toBe('FITS')
    expect(['TIGHT', 'CHALLENGING']).toContain(tight.verdict)
    expect(tight.chargesPerWeek).toBeGreaterThan(fits.chargesPerWeek)
  })
})
