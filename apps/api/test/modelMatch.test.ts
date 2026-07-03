import { describe, expect, it } from 'vitest'
import { computeModelListingMatch } from '../src/services/modelMatchService.js'

const m340iModel = {
  make: 'BMW', model: 'M340i', variant: 'Touring', bodyType: 'WAGON' as const,
  minPowerHp: 374, maxPowerHp: 374,
}

describe('Model-zu-Inserat-Matching', () => {
  it('volle Übereinstimmung → hoher Score mit Begründungen', () => {
    const { score, reasons } = computeModelListingMatch(m340iModel, {
      make: 'BMW', model: 'M340i', variant: 'xDrive Touring', title: 'BMW M340i xDrive Touring',
      bodyType: 'WAGON', powerHp: 374,
    })
    expect(score).toBeGreaterThanOrEqual(0.9)
    expect(reasons).toEqual(expect.arrayContaining(['make', 'model', 'power', 'bodyType']))
  })

  it('andere Marke → kein Match', () => {
    const { score } = computeModelListingMatch(m340iModel, {
      make: 'Audi', model: 'RS4', variant: null, title: 'Audi RS4 Avant', bodyType: 'WAGON', powerHp: 450,
    })
    expect(score).toBe(0)
  })

  it('gleiche Marke, anderes Modell → unter Speicher-Schwelle (0.6)', () => {
    const { score } = computeModelListingMatch(m340iModel, {
      make: 'BMW', model: '118i', variant: null, title: 'BMW 118i Advantage', bodyType: 'HATCHBACK', powerHp: 136,
    })
    expect(score).toBeLessThan(0.6)
  })

  it('Mercedes-AMG matcht Mercedes-Benz-Inserate über den Marken-Stamm', () => {
    const { score, reasons } = computeModelListingMatch(
      { make: 'Mercedes-AMG', model: 'C63', variant: null, bodyType: 'SEDAN', minPowerHp: 476, maxPowerHp: 510 },
      { make: 'Mercedes-Benz', model: 'C 63 AMG', variant: null, title: 'Mercedes-Benz C63 AMG', bodyType: 'SEDAN', powerHp: 476 },
    )
    expect(reasons).toContain('make')
    expect(score).toBeGreaterThanOrEqual(0.6)
  })

  it('Leistung außerhalb ±15 % der Spanne gibt keinen Power-Bonus', () => {
    const { reasons } = computeModelListingMatch(m340iModel, {
      make: 'BMW', model: 'M340i', variant: null, title: 'BMW M340i (getunt)', bodyType: 'WAGON', powerHp: 520,
    })
    expect(reasons).not.toContain('power')
  })
})
