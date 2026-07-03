import { describe, expect, it } from 'vitest'
import { boundingBox, distanceKm, withinRadius } from '@carmatch/shared'

const ROSTOCK = { latitude: 54.0924, longitude: 12.1407 }
const SCHWERIN = { latitude: 53.6355, longitude: 11.4012 }
const HAMBURG = { latitude: 53.5511, longitude: 9.9937 }

describe('Geo/Radius-Logik', () => {
  it('berechnet realistische Distanzen (Rostock–Schwerin ≈ 69 km)', () => {
    const d = distanceKm(ROSTOCK, SCHWERIN)
    expect(d).toBeGreaterThan(60)
    expect(d).toBeLessThan(80)
  })

  it('Distanz zu sich selbst ist 0', () => {
    expect(distanceKm(ROSTOCK, ROSTOCK)).toBe(0)
  })

  it('withinRadius filtert korrekt', () => {
    expect(withinRadius(ROSTOCK, SCHWERIN, 100)).toBe(true)
    expect(withinRadius(ROSTOCK, SCHWERIN, 50)).toBe(false)
    expect(withinRadius(ROSTOCK, HAMBURG, 100)).toBe(false) // ~150 km
  })

  it('boundingBox umschließt den Radius', () => {
    const box = boundingBox(ROSTOCK, 50)
    expect(box.minLat).toBeLessThan(ROSTOCK.latitude)
    expect(box.maxLat).toBeGreaterThan(ROSTOCK.latitude)
    // Punkt innerhalb des Radius liegt in der Box
    const near = { latitude: 54.3, longitude: 12.3 }
    expect(near.latitude).toBeGreaterThan(box.minLat)
    expect(near.latitude).toBeLessThan(box.maxLat)
    expect(near.longitude).toBeGreaterThan(box.minLon)
    expect(near.longitude).toBeLessThan(box.maxLon)
  })
})
