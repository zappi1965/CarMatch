import type { VehicleScore, VehicleScoreKey } from '@carmatch/shared'

/**
 * Quartett-Scores: nachvollziehbar aus Fahrzeugdaten berechnet, nie Fantasiewerte.
 * Fehlende Daten senken die Konfidenz (UI zeigt < 0.5 als "geschätzt").
 */
export interface ScoreInput {
  powerHp?: number | null
  weightKg?: number | null
  zeroToHundred?: number | null
  bodyType?: string | null
  fuelType?: string | null
  transmission?: string | null
  drivetrain?: string | null
  seats?: number | null
  doors?: number | null
  trunkVolumeL?: number | null
  consumptionL100?: number | null
  co2GKm?: number | null
  price: number
  mileage?: number | null
  year?: number | null
  electricRangeKm?: number | null
  features?: string[] | null
  /** Anzahl vergleichbarer Fahrzeuge im Bestand (für Seltenheit) */
  comparablesCount?: number
  /** Median-Preis-pro-PS der Vergleichsgruppe (für Preis-Leistung) */
  medianPricePerHp?: number
}

/** clamp auf 0..100 */
const c100 = (n: number) => Math.max(0, Math.min(100, Math.round(n)))

export function computeVehicleScores(v: ScoreInput): VehicleScore[] {
  const scores: VehicleScore[] = []
  const push = (key: VehicleScoreKey, value: number, confidence: number) =>
    scores.push({ key, value: c100(value), confidence: Math.round(confidence * 100) / 100 })

  // Performance: 0–100 aus 0-100-Zeit (falls vorhanden), sonst Leistung/Gewicht bzw. nur PS
  if (v.zeroToHundred != null) {
    // 3s → 100, 15s → 0
    push('performance', ((15 - v.zeroToHundred) / 12) * 100, 0.9)
  } else if (v.powerHp != null && v.weightKg != null) {
    const hpPerTon = v.powerHp / (v.weightKg / 1000)
    push('performance', ((hpPerTon - 50) / 250) * 100, 0.7)
  } else if (v.powerHp != null) {
    push('performance', ((v.powerHp - 60) / 440) * 100, 0.45)
  }

  // Spaßfaktor: Leistung + Handschaltung/RWD + Fahrzeugtyp
  if (v.powerHp != null) {
    let fun = ((v.powerHp - 80) / 340) * 70
    if (v.transmission === 'MANUAL') fun += 10
    if (v.drivetrain === 'RWD') fun += 12
    if (v.bodyType === 'COUPE' || v.bodyType === 'CONVERTIBLE') fun += 15
    if (v.bodyType === 'VAN') fun -= 15
    const conf = v.transmission && v.drivetrain && v.bodyType ? 0.8 : 0.5
    push('fun', fun, conf)
  }

  // Alltagstauglichkeit: Sitze, Türen, Kofferraum, Verbrauch, Karosserie
  {
    let everyday = 40
    let known = 0
    if (v.seats != null) { everyday += (v.seats - 2) * 6; known++ }
    if (v.doors != null) { everyday += v.doors >= 4 ? 10 : -5; known++ }
    if (v.trunkVolumeL != null) { everyday += Math.min(20, v.trunkVolumeL / 30); known++ }
    if (v.consumptionL100 != null && v.consumptionL100 > 0) { everyday += Math.max(-10, 10 - v.consumptionL100); known++ }
    if (v.fuelType === 'ELECTRIC') everyday += 5
    if (v.bodyType === 'WAGON' || v.bodyType === 'SUV' || v.bodyType === 'VAN') everyday += 10
    if (v.bodyType === 'COUPE' || v.bodyType === 'CONVERTIBLE') everyday -= 15
    push('everyday', everyday, Math.min(0.85, 0.3 + known * 0.15))
  }

  // Effizienz: Verbrauch/CO₂ bzw. E-Auto
  if (v.fuelType === 'ELECTRIC') {
    push('efficiency', 90, 0.8)
  } else if (v.consumptionL100 != null && v.consumptionL100 > 0) {
    push('efficiency', ((12 - v.consumptionL100) / 8) * 100, 0.85)
  }

  // Unterhaltskosten (niedrig = hoher Score): Verbrauch, Leistung (Versicherung/Steuer-Proxy), Alter
  {
    let cost = 70
    let known = 0
    if (v.consumptionL100 != null && v.consumptionL100 > 0) { cost -= (v.consumptionL100 - 5) * 6; known++ }
    if (v.fuelType === 'ELECTRIC') { cost += 10; known++ }
    if (v.powerHp != null) { cost -= Math.max(0, (v.powerHp - 150) / 15); known++ }
    if (v.year != null) { cost -= Math.max(0, (2026 - v.year - 4) * 1.5); known++ }
    push('runningCosts', cost, Math.min(0.75, 0.25 + known * 0.15))
  }

  // Preis-Leistung: Preis pro PS vs. Vergleichsgruppe
  if (v.powerHp != null && v.medianPricePerHp != null && v.medianPricePerHp > 0) {
    const pph = v.price / v.powerHp
    const ratio = pph / v.medianPricePerHp // < 1 = besser als Median
    push('priceValue', (1.6 - ratio) * 62.5, Math.min(0.85, 0.4 + (v.comparablesCount ?? 0) * 0.05))
  } else if (v.powerHp != null) {
    const pph = v.price / v.powerHp
    // grobe Heuristik ohne Vergleichsgruppe: 100 €/PS sehr gut, 300 €/PS schwach
    push('priceValue', ((300 - pph) / 200) * 100, 0.35)
  }

  // Familienfreundlichkeit
  if (v.seats != null) {
    let family = (v.seats - 3) * 18 + 30
    if (v.bodyType === 'VAN') family += 20
    if (v.bodyType === 'WAGON' || v.bodyType === 'SUV') family += 12
    if (v.doors != null && v.doors <= 3) family -= 20
    push('family', family, v.bodyType ? 0.75 : 0.5)
  }

  // Langstrecke: Reichweite/Tank, Komfortmerkmale, Karosserie
  {
    let ld = 50
    let known = 0
    if (v.fuelType === 'ELECTRIC') {
      if (v.electricRangeKm != null) { ld = (v.electricRangeKm / 600) * 100; known += 2 }
      else { ld = 45; known++ }
    } else if (v.fuelType === 'DIESEL') { ld += 20; known++ }
    if (v.bodyType === 'WAGON' || v.bodyType === 'SEDAN' || v.bodyType === 'SUV') { ld += 10; known++ }
    if (hasFeature(v, ['ACC', 'HUD', 'Pilot Assist', 'Autopilot'])) ld += 10
    push('longDistance', ld, Math.min(0.7, 0.3 + known * 0.15))
  }

  // Komfort: Ausstattung + Getriebe + Karosserie
  {
    let comfort = 45
    if (v.transmission === 'AUTOMATIC') comfort += 12
    if (hasFeature(v, ['Leder', 'Pano', 'Standheizung', 'Harman Kardon', 'Bose', 'B&O', 'Burmester', 'MBUX', 'HUD'])) comfort += 15
    if (v.bodyType === 'SUV' || v.bodyType === 'SEDAN' || v.bodyType === 'VAN') comfort += 8
    push('comfort', comfort, v.features?.length ? 0.6 : 0.35)
  }

  // Seltenheit: wenige Vergleichsangebote im Bestand = seltener
  if (v.comparablesCount != null) {
    push('rarity', ((10 - Math.min(10, v.comparablesCount)) / 10) * 100, 0.6)
  }

  return scores
}

function hasFeature(v: ScoreInput, names: string[]): boolean {
  const fl = (v.features ?? []).map((f) => f.toLowerCase())
  return names.some((n) => fl.some((f) => f.includes(n.toLowerCase())))
}
