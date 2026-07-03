import type { SpecsQuery, SpecsResult, VehicleSpecsSource } from './types.js'

/**
 * Lokale Spezifikationstabelle mit öffentlich bekannten Herstellerangaben
 * gängiger Modelle. Dient als Demo-/Fallback-Quelle des Enrichments.
 * Match über Marke+Modell (+ Leistungsnähe), Konfidenz entsprechend begrenzt.
 */
interface SpecRow {
  make: string
  model: string
  minHp?: number
  maxHp?: number
  specs: Omit<SpecsResult, 'confidence' | 'source'>
}

const SPECS_TABLE: SpecRow[] = [
  { make: 'bmw', model: 'm340i', specs: { zeroToHundred: 4.5, topSpeed: 250, weightKg: 1885, trunkVolumeL: 500, consumptionL100: 8.1 } },
  { make: 'bmw', model: 'x3', minHp: 249, maxHp: 340, specs: { zeroToHundred: 5.8, topSpeed: 240, weightKg: 1990, trunkVolumeL: 550, consumptionL100: 6.6 } },
  { make: 'bmw', model: '118i', specs: { zeroToHundred: 8.5, topSpeed: 212, weightKg: 1440, trunkVolumeL: 360, consumptionL100: 5.9 } },
  { make: 'volkswagen', model: 'golf', minHp: 261, maxHp: 310, specs: { zeroToHundred: 5.6, topSpeed: 267, weightKg: 1461, trunkVolumeL: 374, consumptionL100: 7.5 } },
  { make: 'volkswagen', model: 't-roc', maxHp: 190, specs: { zeroToHundred: 8.4, topSpeed: 205, weightKg: 1420, trunkVolumeL: 445, consumptionL100: 6.0 } },
  { make: 'volkswagen', model: 'multivan', specs: { zeroToHundred: 9.7, topSpeed: 202, weightKg: 2300, trunkVolumeL: 4300, consumptionL100: 7.3 } },
  { make: 'porsche', model: '718 cayman', minHp: 280, maxHp: 320, specs: { zeroToHundred: 5.1, topSpeed: 275, weightKg: 1405, trunkVolumeL: 425, consumptionL100: 8.9 } },
  { make: 'audi', model: 'a4 avant', minHp: 190, maxHp: 210, specs: { zeroToHundred: 7.0, topSpeed: 246, weightKg: 1720, trunkVolumeL: 495, consumptionL100: 5.2 } },
  { make: 'audi', model: 'rs3', specs: { zeroToHundred: 3.8, topSpeed: 250, weightKg: 1570, trunkVolumeL: 282, consumptionL100: 8.8 } },
  { make: 'mazda', model: 'mx-5', specs: { zeroToHundred: 6.8, topSpeed: 219, weightKg: 1113, trunkVolumeL: 127, consumptionL100: 6.9 } },
  { make: 'skoda', model: 'octavia combi', maxHp: 200, specs: { zeroToHundred: 8.7, topSpeed: 224, weightKg: 1505, trunkVolumeL: 640, consumptionL100: 4.8 } },
  { make: 'tesla', model: 'model 3', minHp: 400, specs: { zeroToHundred: 4.4, topSpeed: 233, weightKg: 1844, trunkVolumeL: 561, batteryCapacityKwh: 79, electricRangeKm: 560, chargingSpeedKw: 250 } },
  { make: 'hyundai', model: 'i30 n', specs: { zeroToHundred: 5.9, topSpeed: 250, weightKg: 1479, trunkVolumeL: 381, consumptionL100: 8.5 } },
  { make: 'hyundai', model: 'ioniq 5', minHp: 200, maxHp: 260, specs: { zeroToHundred: 7.3, topSpeed: 185, weightKg: 1985, trunkVolumeL: 527, batteryCapacityKwh: 77.4, electricRangeKm: 507, chargingSpeedKw: 220 } },
  { make: 'mercedes-benz', model: 'c 220 d', specs: { zeroToHundred: 7.4, topSpeed: 245, weightKg: 1735, trunkVolumeL: 490, consumptionL100: 5.0 } },
  { make: 'fiat', model: '500', maxHp: 80, specs: { zeroToHundred: 13.8, topSpeed: 167, weightKg: 980, trunkVolumeL: 185, consumptionL100: 5.1 } },
  { make: 'volvo', model: 'v60', minHp: 190, maxHp: 220, specs: { zeroToHundred: 7.8, topSpeed: 180, weightKg: 1750, trunkVolumeL: 519, consumptionL100: 6.3 } },
  { make: 'cupra', model: 'formentor', minHp: 300, specs: { zeroToHundred: 4.9, topSpeed: 250, weightKg: 1644, trunkVolumeL: 420, consumptionL100: 8.0 } },
  { make: 'ford', model: 'focus', minHp: 260, specs: { zeroToHundred: 5.7, topSpeed: 250, weightKg: 1508, trunkVolumeL: 375, consumptionL100: 8.6 } },
  { make: 'mini', model: 'cooper s', specs: { zeroToHundred: 6.7, topSpeed: 235, weightKg: 1330, trunkVolumeL: 211, consumptionL100: 6.4 } },
  { make: 'toyota', model: 'gr86', specs: { zeroToHundred: 6.3, topSpeed: 226, weightKg: 1275, trunkVolumeL: 226, consumptionL100: 8.7 } },
  { make: 'kia', model: 'sorento', specs: { zeroToHundred: 9.1, topSpeed: 202, weightKg: 1953, trunkVolumeL: 616, consumptionL100: 6.9 } },
  { make: 'opel', model: 'corsa', maxHp: 102, specs: { zeroToHundred: 13.2, topSpeed: 174, weightKg: 1090, trunkVolumeL: 309, consumptionL100: 5.4 } },
  { make: 'suzuki', model: 'swift sport', specs: { zeroToHundred: 9.1, topSpeed: 210, weightKg: 1025, trunkVolumeL: 265, consumptionL100: 5.6 } },
]

export class DemoSpecsSource implements VehicleSpecsSource {
  readonly key = 'demo_specs_table'

  isConfigured(): boolean {
    return true
  }

  async lookup(q: SpecsQuery): Promise<SpecsResult | null> {
    const make = q.make.toLowerCase()
    const model = q.model.toLowerCase()
    const row = SPECS_TABLE.find((r) => {
      if (r.make !== make) return false
      const modelMatch = model.includes(r.model) || r.model.includes(model)
      if (!modelMatch) return false
      if (q.powerHp != null) {
        if (r.minHp != null && q.powerHp < r.minHp) return false
        if (r.maxHp != null && q.powerHp > r.maxHp) return false
      }
      return true
    })
    if (!row) return null
    // Konfidenz: exakter Modellname + Leistungsband passt → 0.8; nur Modellname → 0.65
    const confidence = q.powerHp != null && (row.minHp != null || row.maxHp != null) ? 0.8 : 0.65
    return { ...row.specs, confidence, source: this.key }
  }
}
