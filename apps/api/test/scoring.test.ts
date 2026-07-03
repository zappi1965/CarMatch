import { describe, expect, it } from 'vitest'
import { applySignals, emptyProfile, type SwipeSignal } from '../src/recommendation/profile.js'
import { scoreCandidate, rangeFit, COLD_START_THRESHOLD, type ScoringCandidate } from '../src/recommendation/scoring.js'

const noRandom = { random: () => 0 }

function candidate(overrides: Partial<ScoringCandidate> = {}): ScoringCandidate {
  return {
    id: 'x', make: 'BMW', model: 'M340i', bodyType: 'WAGON', fuelType: 'PETROL',
    transmission: 'AUTOMATIC', drivetrain: 'AWD', sellerType: 'DEALER',
    price: 50000, mileage: 50000, powerHp: 374, year: 2021,
    latitude: 54.09, longitude: 12.14, createdAt: new Date(), qualityScore: 0.8,
    ...overrides,
  }
}

function trainedProfile() {
  const like = (l: Partial<SwipeSignal['listing']>): SwipeSignal => ({
    action: 'LIKE',
    listing: {
      make: 'BMW', model: 'M340i', bodyType: 'WAGON', fuelType: 'PETROL',
      transmission: 'AUTOMATIC', drivetrain: 'AWD', sellerType: 'DEALER',
      price: 50000, mileage: 50000, powerHp: 350, year: 2021, ...l,
    },
  })
  const signals = Array.from({ length: COLD_START_THRESHOLD + 2 }, () => like({}))
  signals.push({ action: 'DISLIKE', listing: { make: 'Fiat', model: '500', bodyType: 'HATCHBACK', fuelType: 'HYBRID', transmission: 'MANUAL', drivetrain: 'FWD', sellerType: 'DEALER', price: 11000, mileage: 28000, powerHp: 70, year: 2021 } })
  signals.push({ action: 'DISLIKE', listing: { make: 'Fiat', model: '500', bodyType: 'HATCHBACK', fuelType: 'HYBRID', transmission: 'MANUAL', drivetrain: 'FWD', sellerType: 'DEALER', price: 11000, mileage: 28000, powerHp: 70, year: 2021 } })
  return applySignals(emptyProfile(), signals)
}

describe('Hybrid-Scoring', () => {
  it('rangeFit: 1 am Zielwert, fällt mit Abstand', () => {
    expect(rangeFit(50000, 50000)).toBeCloseTo(1)
    expect(rangeFit(80000, 50000)!).toBeLessThan(rangeFit(55000, 50000)!)
    expect(rangeFit(null, 50000)).toBe(0)
  })

  it('passendes Fahrzeug schlägt disliketes Muster deutlich', () => {
    const profile = trainedProfile()
    const fit = scoreCandidate(profile, candidate(), noRandom)
    const misfit = scoreCandidate(
      profile,
      candidate({ make: 'Fiat', model: '500', bodyType: 'HATCHBACK', fuelType: 'HYBRID', transmission: 'MANUAL', drivetrain: 'FWD', powerHp: 70, price: 11000 }),
      noRandom,
    )
    expect(fit.organicTotal).toBeGreaterThan(misfit.organicTotal + 0.15)
    expect(misfit.contentMatch).toBeLessThan(0)
  })

  it('Cold-Start: ohne Signale zählt Qualität statt Content-Match', () => {
    const b = scoreCandidate(emptyProfile(), candidate(), noRandom)
    expect(b.contentMatch).toBe(0)
    expect(b.qualityScore).toBeCloseTo(0.8)
  })

  it('Distance-Boost bevorzugt nahe Fahrzeuge', () => {
    const profile = trainedProfile()
    const ctx = { userPoint: { latitude: 54.09, longitude: 12.14 }, radiusKm: 100, ...noRandom }
    const near = scoreCandidate(profile, candidate(), ctx)
    const far = scoreCandidate(profile, candidate({ latitude: 48.13, longitude: 11.58 }), ctx)
    expect(near.distanceBoost).toBeGreaterThan(far.distanceBoost)
  })

  it('Freshness-Boost bevorzugt neue Inserate', () => {
    const profile = trainedProfile()
    const fresh = scoreCandidate(profile, candidate(), noRandom)
    const old = scoreCandidate(profile, candidate({ createdAt: new Date(Date.now() - 30 * 86400000) }), noRandom)
    expect(fresh.freshnessBoost).toBeGreaterThan(old.freshnessBoost)
  })

  it('Diversity: kürzlich gezeigte Marke wird abgewertet', () => {
    const profile = trainedProfile()
    const repeated = scoreCandidate(profile, candidate(), {
      ...noRandom,
      recentlyShownKeys: ['make:BMW', 'make:BMW', 'make:BMW', 'body:WAGON'],
    })
    const fresh = scoreCandidate(profile, candidate(), { ...noRandom, recentlyShownKeys: [] })
    expect(repeated.diversityBoost).toBeLessThan(0)
    expect(repeated.finalTotal).toBeLessThan(fresh.finalTotal)
  })

  it('Sponsored-Boost bleibt strikt vom organischen Score getrennt', () => {
    const profile = trainedProfile()
    const organic = scoreCandidate(profile, candidate(), noRandom)
    const sponsored = scoreCandidate(profile, candidate({ sponsoredBoost: 0.2 }), noRandom)
    expect(sponsored.organicTotal).toBeCloseTo(organic.organicTotal, 5)
    expect(sponsored.sponsoredBoost).toBe(0.2)
    expect(sponsored.finalTotal).toBeCloseTo(sponsored.organicTotal + 0.2, 5)
  })
})
