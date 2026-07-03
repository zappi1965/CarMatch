import { describe, expect, it } from 'vitest'
import {
  buildTasteProfile,
  deriveTasteInsights,
  summarizeTasteProfile,
  tasteSignalWeight,
  TASTE_SUMMARY_THRESHOLD,
  type TasteSignal,
} from '../src/recommendation/taste.js'

const sportsWagon = (make = 'BMW', model = 'M340i Touring'): TasteSignal['attributes'] => ({
  make, model, segment: 'Power-Kombi', bodyType: 'WAGON', vehicleSize: 'midsize',
  fuelTypes: ['PETROL'], transmissionTypes: ['AUTOMATIC'], drivetrain: 'AWD',
  powerHpMid: 374, priceMid: 52000, tags: ['performance', 'family'],
})

const cityCar = (): TasteSignal['attributes'] => ({
  make: 'Fiat', model: '500', segment: 'Stadtauto', bodyType: 'HATCHBACK', vehicleSize: 'small',
  fuelTypes: ['HYBRID'], transmissionTypes: ['MANUAL'], drivetrain: 'FWD',
  powerHpMid: 70, priceMid: 11000, tags: ['alltag'],
})

describe('Taste-Signal-Gewichte (dokumentierte Werte)', () => {
  it('Modell: Superlike +10, Like +5, Dislike -5, Skip -1', () => {
    expect(tasteSignalWeight({ kind: 'MODEL', action: 'SUPERLIKE', attributes: sportsWagon() })).toBe(10)
    expect(tasteSignalWeight({ kind: 'MODEL', action: 'LIKE', attributes: sportsWagon() })).toBe(5)
    expect(tasteSignalWeight({ kind: 'MODEL', action: 'DISLIKE', attributes: sportsWagon() })).toBe(-5)
    expect(tasteSignalWeight({ kind: 'MODEL', action: 'SKIP', attributes: sportsWagon() })).toBe(-1)
  })

  it('Inserat: Superlike +15, Like +8, Favorit +12, Kontakt +20 kumulativ', () => {
    expect(tasteSignalWeight({ kind: 'LISTING', action: 'SUPERLIKE', attributes: sportsWagon() })).toBe(15)
    expect(tasteSignalWeight({ kind: 'LISTING', action: 'LIKE', attributes: sportsWagon() })).toBe(8)
    expect(
      tasteSignalWeight({ kind: 'LISTING', action: 'LIKE', isFavorite: true, contactedDealer: true, attributes: sportsWagon() }),
    ).toBe(8 + 12 + 20)
    expect(tasteSignalWeight({ kind: 'LISTING', action: 'DISLIKE', attributes: sportsWagon() })).toBe(-8)
  })

  it('Verweildauer > 6s und geöffnete Details geben je +2 (nur bei positiven Signalen)', () => {
    expect(
      tasteSignalWeight({ kind: 'MODEL', action: 'LIKE', dwellTimeMs: 8000, openedMore: true, attributes: sportsWagon() }),
    ).toBe(5 + 2 + 2)
    expect(
      tasteSignalWeight({ kind: 'MODEL', action: 'DISLIKE', dwellTimeMs: 8000, attributes: sportsWagon() }),
    ).toBe(-5)
  })
})

describe('Taste-Profile-Berechnung', () => {
  const signals: TasteSignal[] = [
    ...Array.from({ length: 12 }, (): TasteSignal => ({ kind: 'MODEL', action: 'LIKE', attributes: sportsWagon() })),
    { kind: 'MODEL', action: 'SUPERLIKE', attributes: sportsWagon('Audi', 'RS6 Avant') },
    ...Array.from({ length: 8 }, (): TasteSignal => ({ kind: 'MODEL', action: 'DISLIKE', attributes: cityCar() })),
    { kind: 'LISTING', action: 'LIKE', isFavorite: true, attributes: sportsWagon('BMW', 'M340i') },
  ]

  it('lernt Marken, Segmente und Karosserien mit Vorzeichen', () => {
    const p = buildTasteProfile(signals)
    expect(p.makes['BMW']).toBeGreaterThan(0)
    expect(p.makes['Fiat']).toBeLessThan(0)
    expect(p.segments['Power-Kombi']).toBeGreaterThan(0)
    expect(p.bodyTypes['WAGON']).toBeGreaterThan(0)
    expect(p.dislikedPatterns['size:small']).toBe(8)
    expect(p.signalCount).toBe(signals.length)
  })

  it('Konfidenz wächst mit Signalanzahl', () => {
    const few = buildTasteProfile(signals.slice(0, 3))
    const many = buildTasteProfile(signals)
    expect(many.confidence).toBeGreaterThan(few.confidence)
    expect(many.confidence).toBeGreaterThan(0.4)
  })

  it('Ziel-Leistung und Preisbereich entstehen nur aus positiven Signalen', () => {
    const p = buildTasteProfile(signals)
    expect(p.targetPowerHp).toBeGreaterThan(300)
    expect(p.priceRange!.max).toBeGreaterThan(50000)
    // Dislikes auf 11.000-€-Stadtautos dürfen den Bereich nicht nach unten ziehen
    expect(p.priceRange!.min).toBeGreaterThan(20000)
  })

  it('Summary erst ab Schwellwert, dann datenbasiert', () => {
    expect(summarizeTasteProfile(buildTasteProfile(signals.slice(0, 5)), 'de')).toBeNull()
    const summary = summarizeTasteProfile(buildTasteProfile(signals), 'de')
    expect(summary).toContain('Power-Kombi')
    expect(summary).toContain('Automatik')
  })

  it('Insights erst ab Schwellwert, mit i18n-Keys', () => {
    expect(deriveTasteInsights(buildTasteProfile(signals.slice(0, 5)))).toHaveLength(0)
    const insights = deriveTasteInsights(buildTasteProfile(signals))
    expect(signals.length).toBeGreaterThanOrEqual(TASTE_SUMMARY_THRESHOLD)
    expect(insights.map((i) => i.insightType)).toContain('topSegment')
    expect(insights.every((i) => i.titleKey.startsWith('taste.insight.'))).toBe(true)
  })
})
