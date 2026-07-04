import { describe, expect, it } from 'vitest'
import { buildTasteProfile, tasteSignalWeight, type TasteSignal } from '../src/recommendation/taste.js'

const panamera: TasteSignal['attributes'] = {
  make: 'Porsche', model: 'Panamera', segment: 'Sportlimousine', bodyType: 'SEDAN',
  vehicleSize: 'large', fuelTypes: ['PETROL'], transmissionTypes: ['AUTOMATIC'],
  drivetrain: 'AWD', powerHpMid: 500, priceMid: 90000, tags: ['performance', 'luxury'],
}
const fiat: TasteSignal['attributes'] = {
  make: 'Fiat', model: '500', segment: 'Stadtauto', bodyType: 'HATCHBACK',
  vehicleSize: 'small', fuelTypes: ['HYBRID'], transmissionTypes: ['MANUAL'],
  drivetrain: 'FWD', powerHpMid: 70, priceMid: 11000, tags: ['alltag'],
}

describe('Duell-Signale (Paarvergleich)', () => {
  it('Gewichte: Sieger +6, Verlierer −2 (dokumentiert in taste.ts)', () => {
    expect(tasteSignalWeight({ kind: 'DUEL_WIN', action: 'LIKE', attributes: panamera })).toBe(6)
    expect(tasteSignalWeight({ kind: 'DUEL_LOSS', action: 'DISLIKE', attributes: fiat })).toBe(-2)
  })

  it('Duell-Sieger stärkt das Profil mehr als ein einfacher Modell-Like', () => {
    const likeWeight = tasteSignalWeight({ kind: 'MODEL', action: 'LIKE', attributes: panamera })
    const duelWeight = tasteSignalWeight({ kind: 'DUEL_WIN', action: 'LIKE', attributes: panamera })
    expect(duelWeight).toBeGreaterThan(likeWeight)
  })

  it('wiederholte Duell-Siege bauen ein konsistentes Profil auf', () => {
    const signals: TasteSignal[] = []
    for (let i = 0; i < 5; i++) {
      signals.push({ kind: 'DUEL_WIN', action: 'LIKE', attributes: panamera })
      signals.push({ kind: 'DUEL_LOSS', action: 'DISLIKE', attributes: fiat })
    }
    const p = buildTasteProfile(signals)
    expect(p.makes['Porsche']).toBeGreaterThan(0)
    expect(p.makes['Fiat']).toBeLessThan(0)
    expect(p.segments['Sportlimousine']).toBeGreaterThan(0)
    expect(p.signalCount).toBe(10)
    // Verlierer-Malus ist bewusst milder als ein aktiver Dislike (−2 vs. −5)
    expect(Math.abs(p.makes['Fiat']!)).toBeLessThan(Math.abs(p.makes['Porsche']!))
  })
})
