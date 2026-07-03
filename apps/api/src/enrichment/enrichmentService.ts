import { prisma } from '../db.js'
import { DemoSpecsSource } from './demoSpecsSource.js'
import type { VehicleSpecsSource } from './types.js'

/**
 * VehicleSpecs-Enrichment: ergänzt fehlende technische Daten aus konfigurierten
 * Quellen. Werte unter MIN_CONFIDENCE werden NICHT übernommen — lieber Lücke
 * als falsche Angabe. Quelle + Konfidenz werden gespeichert; manuelle
 * Korrektur/Verifizierung erfolgt im Admin-Panel (verified-Flag).
 */
const MIN_CONFIDENCE = 0.6

const sources: VehicleSpecsSource[] = [
  new DemoSpecsSource(),
  // TODO v0.4: lizenzierte Spezifikationsquelle via VEHICLE_SPECS_API_KEY ergänzen
]

export async function enrichListing(listingId: string): Promise<boolean> {
  const listing = await prisma.vehicleListing.findUnique({ where: { id: listingId } })
  if (!listing) return false

  const existing = await prisma.vehicleSpecs.findUnique({ where: { listingId } })
  if (existing?.verified) return false // manuell bestätigte Daten nie überschreiben

  for (const source of sources) {
    if (!source.isConfigured()) continue
    const result = await source.lookup({
      make: listing.make,
      model: listing.model,
      variant: listing.variant,
      year: listing.year,
      powerHp: listing.powerHp,
      fuelType: listing.fuelType,
    })
    if (!result || result.confidence < MIN_CONFIDENCE) continue

    await prisma.vehicleSpecs.upsert({
      where: { listingId },
      create: {
        listingId,
        zeroToHundred: result.zeroToHundred,
        topSpeed: result.topSpeed,
        weightKg: result.weightKg,
        lengthMm: result.lengthMm,
        widthMm: result.widthMm,
        heightMm: result.heightMm,
        trunkVolumeL: result.trunkVolumeL,
        consumptionL100: result.consumptionL100 ?? listing.consumptionL100,
        co2GKm: result.co2GKm ?? listing.co2GKm,
        batteryCapacityKwh: result.batteryCapacityKwh,
        electricRangeKm: result.electricRangeKm,
        chargingSpeedKw: result.chargingSpeedKw,
        confidence: result.confidence,
        source: result.source,
      },
      update: {
        zeroToHundred: result.zeroToHundred,
        topSpeed: result.topSpeed,
        weightKg: result.weightKg,
        trunkVolumeL: result.trunkVolumeL,
        batteryCapacityKwh: result.batteryCapacityKwh,
        electricRangeKm: result.electricRangeKm,
        chargingSpeedKw: result.chargingSpeedKw,
        confidence: result.confidence,
        source: result.source,
      },
    })
    return true
  }
  return false
}
