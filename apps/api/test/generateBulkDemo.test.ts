import { describe, expect, it } from 'vitest'
import { generateBulkDemoListings } from '../src/providers/demo/generateBulkDemo.js'

describe('Demo-Bulk-Generator', () => {
  it('erzeugt die gewünschte Anzahl gültiger Inserate', () => {
    const listings = generateBulkDemoListings(800)
    expect(listings).toHaveLength(800)
    for (const l of listings.slice(0, 50)) {
      expect(l.provider).toBe('demo')
      expect(l.price).toBeGreaterThan(2000)
      expect(l.make.length).toBeGreaterThan(0)
      expect(l.powerHp).toBeGreaterThan(0)
      expect(l.latitude).toBeGreaterThan(47)
      expect(l.latitude).toBeLessThan(56)
      expect(['DEALER', 'PRIVATE']).toContain(l.sellerType)
    }
  })

  it('ist deterministisch (gleicher Seed → gleiche Daten)', () => {
    const a = generateBulkDemoListings(100, 42)
    const b = generateBulkDemoListings(100, 42)
    expect(a[0]).toEqual(b[0])
    expect(a[99]!.price).toBe(b[99]!.price)
  })

  it('unterschiedliche Seeds erzeugen unterschiedliche Preise', () => {
    const a = generateBulkDemoListings(100, 1)
    const b = generateBulkDemoListings(100, 2)
    const samePrices = a.filter((x, i) => x.price === b[i]!.price).length
    expect(samePrices).toBeLessThan(100)
  })

  it('IDs sind eindeutig', () => {
    const listings = generateBulkDemoListings(500)
    const ids = new Set(listings.map((l) => l.providerListingId))
    expect(ids.size).toBe(500)
  })

  it('Kilometerstand korreliert plausibel mit dem Alter', () => {
    const listings = generateBulkDemoListings(1000)
    const withYear = listings.filter((l) => l.year != null && l.mileage != null)
    // ältere Fahrzeuge haben im Schnitt mehr km
    const old = withYear.filter((l) => l.year! <= 2018)
    const young = withYear.filter((l) => l.year! >= 2022)
    const avg = (a: typeof old) => a.reduce((s, l) => s + l.mileage!, 0) / a.length
    expect(avg(old)).toBeGreaterThan(avg(young))
  })

  it('nutzt echte Wikimedia-Fotos mit Attribution, wo verfügbar', () => {
    const listings = generateBulkDemoListings(200)
    const withPhoto = listings.filter((l) => !l.imagesAreDemo)
    expect(withPhoto.length).toBeGreaterThan(0)
    for (const l of withPhoto) {
      expect(l.images.length).toBeGreaterThan(0)
      expect(l.imageAttribution).toContain('Wikimedia')
    }
  })
})
