import { describe, expect, it } from 'vitest'
import { buildTasteProfile, type TasteSignal } from '../src/recommendation/taste.js'
import {
  generateRecommendationExplanation,
  scoreListingHybrid,
} from '../src/recommendation/hybridScoring.js'
import type { ScoringCandidate } from '../src/recommendation/scoring.js'

const noRandom = { random: () => 0 }

function trainedTaste() {
  const like = (attrs: Partial<TasteSignal['attributes']>): TasteSignal => ({
    kind: 'MODEL',
    action: 'LIKE',
    attributes: {
      make: 'BMW', model: 'M340i Touring', segment: 'Power-Kombi', bodyType: 'WAGON',
      vehicleSize: 'midsize', fuelTypes: ['PETROL'], transmissionTypes: ['AUTOMATIC'],
      drivetrain: 'AWD', powerHpMid: 374, priceMid: 52000, tags: ['performance'], ...attrs,
    },
  })
  return buildTasteProfile([
    ...Array.from({ length: 10 }, () => like({})),
    { ...like({ make: 'Audi', model: 'RS6 Avant', powerHpMid: 600, priceMid: 100000 }), action: 'SUPERLIKE' },
    { kind: 'MODEL', action: 'DISLIKE', attributes: { make: 'Fiat', model: '500', bodyType: 'HATCHBACK', vehicleSize: 'small', powerHpMid: 70, priceMid: 11000 } },
    { kind: 'MODEL', action: 'DISLIKE', attributes: { make: 'Fiat', model: '500', bodyType: 'HATCHBACK', vehicleSize: 'small', powerHpMid: 70, priceMid: 11000 } },
  ])
}

function candidate(overrides: Partial<ScoringCandidate> = {}): ScoringCandidate {
  return {
    id: 'l1', make: 'BMW', model: 'M340i', bodyType: 'WAGON', fuelType: 'PETROL',
    transmission: 'AUTOMATIC', drivetrain: 'AWD', sellerType: 'DEALER',
    price: 54900, mileage: 48200, powerHp: 374, year: 2021,
    latitude: 54.09, longitude: 12.14, createdAt: new Date(), qualityScore: 0.8,
    ...overrides,
  }
}

describe('Hybrid Recommendation Scoring (40/25/15/10/5/5)', () => {
  it('Geschmackspassung dominiert: passendes Inserat schlägt Misfit deutlich', () => {
    const taste = trainedTaste()
    const fit = scoreListingHybrid(taste, candidate(), noRandom)
    const misfit = scoreListingHybrid(
      taste,
      candidate({ make: 'Fiat', model: '500', bodyType: 'HATCHBACK', transmission: 'MANUAL', drivetrain: 'FWD', powerHp: 70, price: 11000 }),
      noRandom,
    )
    expect(fit.tasteScore).toBeGreaterThan(0.4)
    expect(misfit.tasteScore).toBeLessThan(0)
    expect(fit.finalTotal).toBeGreaterThan(misfit.finalTotal + 0.2)
  })

  it('Cold Start: neutraler TasteScore, Qualität/Frische tragen', () => {
    const empty = buildTasteProfile([])
    const b = scoreListingHybrid(empty, candidate(), noRandom)
    expect(b.tasteScore).toBeCloseTo(0.35)
    expect(b.qualityScore).toBe(0.8)
  })

  it('Kontext-Fit: Inserat im gelernten Preisbereich und nah = besser', () => {
    const taste = trainedTaste()
    const ctx = { userPoint: { latitude: 54.09, longitude: 12.14 }, radiusKm: 100, ...noRandom }
    const nearInBudget = scoreListingHybrid(taste, candidate(), ctx)
    const farOverBudget = scoreListingHybrid(
      taste,
      candidate({ price: 160000, latitude: 48.13, longitude: 11.58 }),
      ctx,
    )
    expect(nearInBudget.contextFit).toBeGreaterThan(farOverBudget.contextFit)
  })

  it('Sponsored-Boost bleibt vom organischen Score getrennt', () => {
    const taste = trainedTaste()
    const organic = scoreListingHybrid(taste, candidate(), noRandom)
    const sponsored = scoreListingHybrid(taste, candidate({ sponsoredBoost: 0.15 }), noRandom)
    expect(sponsored.organicTotal).toBeCloseTo(organic.organicTotal, 5)
    expect(sponsored.finalTotal).toBeCloseTo(organic.organicTotal + 0.15, 5)
  })

  it('Deal-Faktor: günstiger als Vergleichsmedian erhöht den Score', () => {
    const taste = trainedTaste()
    const goodDeal = scoreListingHybrid(taste, candidate(), { ...noRandom, priceDeltaPercent: -15 })
    const expensive = scoreListingHybrid(taste, candidate(), { ...noRandom, priceDeltaPercent: 15 })
    expect(goodDeal.dealFactor).toBeGreaterThan(expensive.dealFactor)
  })

  it('Diversity: wiederholte Marken werden abgewertet', () => {
    const taste = trainedTaste()
    const repeated = scoreListingHybrid(taste, candidate(), { ...noRandom, recentlyShownKeys: ['make:BMW', 'make:BMW', 'body:WAGON'] })
    const fresh = scoreListingHybrid(taste, candidate(), { ...noRandom, recentlyShownKeys: [] })
    expect(repeated.finalTotal).toBeLessThan(fresh.finalTotal)
  })
})

describe('generateRecommendationExplanation', () => {
  it('Cold Start → Lern-Hinweis', () => {
    const empty = buildTasteProfile([])
    const b = scoreListingHybrid(empty, candidate(), noRandom)
    expect(generateRecommendationExplanation(empty, candidate(), b).key).toBe('explain.coldStart')
  })

  it('verweist auf konkret gelikte Modelle, wenn das Inserat dazu passt', () => {
    const taste = trainedTaste()
    const b = scoreListingHybrid(taste, candidate(), noRandom)
    const e = generateRecommendationExplanation(taste, candidate(), b)
    expect(e.key).toBe('explain.similarModels')
    expect(String(e.params.models)).toContain('BMW M340i')
  })

  it('fällt auf Segment-Erklärung zurück, wenn kein Modell-Match', () => {
    const taste = trainedTaste()
    const volvo = candidate({ make: 'Volvo', model: 'V60', powerHp: 300 })
    const b = scoreListingHybrid(taste, volvo, noRandom)
    const e = generateRecommendationExplanation(taste, volvo, { ...b, matchedModelKeys: [] })
    expect(['explain.likedSegment', 'explain.powerAndTransmission', 'explain.similarTaste']).toContain(e.key)
  })
})
