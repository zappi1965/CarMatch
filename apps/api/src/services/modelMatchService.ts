import { prisma } from '../db.js'
import type { VehicleModel, VehicleListing } from '@prisma/client'

/**
 * Model-zu-Inserat-Matching: verknüpft generelle Fahrzeugmodelle mit echten
 * Inseraten ("Ähnliche echte Angebote finden").
 *
 * Match-Kriterien (nachvollziehbar, konservativ):
 *  - Marke muss übereinstimmen (case-insensitive)        → Basis 0.4
 *  - Modellname enthält den Modell-/Variantennamen       → +0.35
 *  - Leistung innerhalb der Modell-Spanne (±15 %)        → +0.15
 *  - Karosserieform stimmt überein                       → +0.10
 * Nur Matches ≥ 0.6 werden gespeichert; ≥ 0.75 setzt vehicleModelId am Inserat.
 */
export function computeModelListingMatch(
  model: Pick<VehicleModel, 'make' | 'model' | 'variant' | 'bodyType' | 'minPowerHp' | 'maxPowerHp'>,
  listing: Pick<VehicleListing, 'make' | 'model' | 'variant' | 'title' | 'bodyType' | 'powerHp'>,
): { score: number; reasons: string[] } {
  const reasons: string[] = []
  const norm = (s: string | null | undefined) =>
    (s ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

  // Marken-Stamm: "Mercedes-AMG" und "Mercedes-Benz" teilen den Stamm "mercedes"
  const stem = (s: string) => norm(s).split(' ')[0] ?? ''
  const makeMatch = norm(listing.make) === norm(model.make) || stem(listing.make) === stem(model.make)
  if (!makeMatch) return { score: 0, reasons: [] }
  let score = 0.4
  reasons.push('make')

  const modelTokens = [model.model, model.variant].filter(Boolean).map((t) => norm(t as string))
  const haystack = `${norm(listing.model)} ${norm(listing.variant)} ${norm(listing.title)}`
  if (modelTokens.some((tok) => tok && haystack.includes(tok))) {
    score += 0.35
    reasons.push('model')
  }

  if (
    listing.powerHp != null &&
    model.minPowerHp != null &&
    model.maxPowerHp != null &&
    listing.powerHp >= model.minPowerHp * 0.85 &&
    listing.powerHp <= model.maxPowerHp * 1.15
  ) {
    score += 0.15
    reasons.push('power')
  }

  if (listing.bodyType != null && listing.bodyType === model.bodyType) {
    score += 0.1
    reasons.push('bodyType')
  }
  return { score: Math.round(score * 100) / 100, reasons }
}

const MATCH_MIN = 0.6
const LINK_MIN = 0.75

/** Matcht alle Modelle gegen den aktuellen Inseratsbestand (nach Sync/Seed). */
export async function rebuildModelListingMatches(): Promise<{ matches: number }> {
  const [models, listings] = await Promise.all([
    prisma.vehicleModel.findMany(),
    prisma.vehicleListing.findMany({ where: { isAvailable: true } }),
  ])

  let count = 0
  for (const model of models) {
    for (const listing of listings) {
      const { score, reasons } = computeModelListingMatch(model, listing)
      if (score < MATCH_MIN) continue
      await prisma.vehicleModelToListingMatch.upsert({
        where: { vehicleModelId_listingId: { vehicleModelId: model.id, listingId: listing.id } },
        create: { vehicleModelId: model.id, listingId: listing.id, matchScore: score, matchReasonJson: reasons },
        update: { matchScore: score, matchReasonJson: reasons },
      })
      if (score >= LINK_MIN && listing.vehicleModelId !== model.id) {
        await prisma.vehicleListing.update({
          where: { id: listing.id },
          data: { vehicleModelId: model.id, modelMatchConfidence: score, modelMatchReason: reasons.join(',') },
        })
      }
      count++
    }
  }
  return { matches: count }
}
