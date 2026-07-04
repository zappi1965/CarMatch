import { prisma } from '../db.js'
import { computeTrend, type TrendResult } from '../scores/marketTrend.js'

/**
 * Markttrend je Modell aus dem eigenen Bestand:
 * aktuelle Preise (verfügbare Inserate) vs. historische Preise (PriceHistory
 * älter als 45 Tage). Wächst automatisch mit der Datenbasis.
 */
export async function getModelTrend(make: string, model: string): Promise<TrendResult> {
  const cutoff = new Date(Date.now() - 45 * 86400_000)
  const [current, past] = await Promise.all([
    prisma.vehicleListing.findMany({
      where: {
        isAvailable: true,
        make: { equals: make, mode: 'insensitive' },
        model: { contains: model, mode: 'insensitive' },
      },
      select: { price: true, bodyType: true },
      take: 100,
    }),
    prisma.priceHistory.findMany({
      where: {
        recordedAt: { lt: cutoff },
        listing: {
          make: { equals: make, mode: 'insensitive' },
          model: { contains: model, mode: 'insensitive' },
        },
      },
      select: { price: true },
      take: 200,
    }),
  ])
  return computeTrend(
    current.map((c) => c.price),
    past.map((p) => p.price),
    current[0]?.bodyType,
  )
}
