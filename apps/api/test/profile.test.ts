import { describe, expect, it } from 'vitest'
import { applySignals, emptyProfile, signalWeight, type SwipeSignal } from '../src/recommendation/profile.js'

const wagon = (make = 'BMW'): SwipeSignal['listing'] => ({
  make, model: 'M340i', bodyType: 'WAGON', fuelType: 'PETROL',
  transmission: 'AUTOMATIC', drivetrain: 'AWD', sellerType: 'DEALER',
  price: 50000, mileage: 50000, powerHp: 374, year: 2021,
})

describe('UserPreferenceProfile', () => {
  it('Super-Like wiegt stärker als Like, Dislike negativ', () => {
    expect(signalWeight({ action: 'SUPERLIKE', listing: wagon() })).toBeGreaterThan(
      signalWeight({ action: 'LIKE', listing: wagon() }),
    )
    expect(signalWeight({ action: 'DISLIKE', listing: wagon() })).toBeLessThan(0)
    expect(Math.abs(signalWeight({ action: 'SKIP', listing: wagon() }))).toBeLessThan(0.5)
  })

  it('Engagement (Details, Kontakt) verstärkt positive Signale', () => {
    const plain = signalWeight({ action: 'LIKE', listing: wagon() })
    const engaged = signalWeight({
      action: 'LIKE', openedMore: true, contactedDealer: true, dwellTimeMs: 9000, listing: wagon(),
    })
    expect(engaged).toBeGreaterThan(plain + 2)
  })

  it('lernt Marken- und Karosserie-Präferenzen aus Likes', () => {
    const signals: SwipeSignal[] = [
      { action: 'LIKE', listing: wagon('BMW') },
      { action: 'LIKE', listing: wagon('BMW') },
      { action: 'SUPERLIKE', listing: wagon('Audi') },
      { action: 'DISLIKE', listing: { ...wagon('Fiat'), bodyType: 'HATCHBACK', powerHp: 70, price: 11000 } },
    ]
    const p = applySignals(emptyProfile(), signals)
    expect(p.preferredMakes['BMW']).toBeGreaterThan(0)
    expect(p.preferredMakes['Fiat']).toBeLessThan(0)
    expect(p.preferredBodyTypes['WAGON']).toBeGreaterThan(0)
    expect(p.dislikedPatterns['bodyType:HATCHBACK']).toBe(1)
    expect(p.signalCount).toBe(4)
  })

  it('Zielpreis nähert sich positiv bewerteten Fahrzeugen an', () => {
    const p = applySignals(emptyProfile(), [
      { action: 'LIKE', listing: { ...wagon(), price: 30000 } },
      { action: 'LIKE', listing: { ...wagon(), price: 34000 } },
    ])
    expect(p.targetPrice).toBeGreaterThan(29000)
    expect(p.targetPrice).toBeLessThan(35000)
  })

  it('Dislikes verändern den Zielpreis nicht', () => {
    const base = applySignals(emptyProfile(), [{ action: 'LIKE', listing: { ...wagon(), price: 30000 } }])
    const after = applySignals(base, [{ action: 'DISLIKE', listing: { ...wagon(), price: 90000 } }])
    expect(after.targetPrice).toBe(base.targetPrice)
  })
})
