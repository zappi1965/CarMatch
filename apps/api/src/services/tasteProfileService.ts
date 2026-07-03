import { prisma } from '../db.js'
import {
  buildTasteProfile,
  deriveTasteInsights,
  emptyTasteProfile,
  summarizeTasteProfile,
  type TasteProfile,
  type TasteSignal,
} from '../recommendation/taste.js'

/** Lädt alle Taste-Signale (Modell-Swipes + Inserats-Verhalten) eines Nutzers. */
async function loadSignals(userId: string): Promise<TasteSignal[]> {
  const [modelSwipes, listingSwipes, favorites] = await Promise.all([
    prisma.modelSwipeEvent.findMany({
      where: { userId, undone: false },
      include: { vehicleModel: true },
      orderBy: { createdAt: 'asc' },
      take: 500,
    }),
    prisma.swipeEvent.findMany({
      where: { userId, undone: false },
      include: { listing: true },
      orderBy: { createdAt: 'asc' },
      take: 500,
    }),
    prisma.favorite.findMany({ where: { userId }, select: { listingId: true } }),
  ])
  const favoriteIds = new Set(favorites.map((f) => f.listingId))

  const signals: TasteSignal[] = []
  for (const s of modelSwipes) {
    const m = s.vehicleModel
    signals.push({
      kind: 'MODEL',
      action: s.action,
      dwellTimeMs: s.dwellTimeMs,
      openedDetails: s.openedDetails,
      openedMore: s.openedMore,
      attributes: {
        make: m.make,
        model: [m.model, m.variant].filter(Boolean).join(' '),
        segment: m.segment,
        bodyType: m.bodyType,
        vehicleSize: m.vehicleSize,
        fuelTypes: (m.fuelTypes as string[] | null) ?? undefined,
        transmissionTypes: (m.transmissionTypes as string[] | null) ?? undefined,
        drivetrain: m.drivetrain,
        powerHpMid: m.minPowerHp != null && m.maxPowerHp != null ? (m.minPowerHp + m.maxPowerHp) / 2 : m.maxPowerHp,
        priceMid:
          m.typicalUsedPriceMin != null && m.typicalUsedPriceMax != null
            ? (m.typicalUsedPriceMin + m.typicalUsedPriceMax) / 2
            : null,
        tags: (m.tagsJson as string[] | null) ?? undefined,
      },
    })
  }
  for (const s of listingSwipes) {
    const l = s.listing
    signals.push({
      kind: 'LISTING',
      action: s.action,
      dwellTimeMs: s.dwellTimeMs,
      openedDetails: s.openedDetails,
      openedMore: s.openedMore,
      isFavorite: favoriteIds.has(l.id),
      contactedDealer: s.contactedDealer,
      attributes: {
        make: l.make,
        model: l.model,
        bodyType: l.bodyType,
        fuelTypes: l.fuelType ? [l.fuelType] : undefined,
        transmissionTypes: l.transmission ? [l.transmission] : undefined,
        drivetrain: l.drivetrain,
        powerHpMid: l.powerHp,
        priceMid: l.price,
      },
    })
  }
  return signals
}

/** Neuberechnung + Persistierung von Profil, Summary und Insights. */
export async function recalculateTasteProfile(userId: string): Promise<TasteProfile> {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user?.personalizationEnabled) return emptyTasteProfile()

  const signals = await loadSignals(userId)
  const profile = buildTasteProfile(signals)
  const locale = user.locale === 'de' ? 'de' : 'en'
  const summaryText = summarizeTasteProfile(profile, locale)
  const insights = deriveTasteInsights(profile)

  await prisma.$transaction([
    prisma.userTasteProfile.upsert({
      where: { userId },
      create: {
        userId,
        preferredMakesJson: profile.makes,
        preferredModelsJson: profile.models,
        preferredSegmentsJson: profile.segments,
        preferredBodyTypesJson: profile.bodyTypes,
        preferredVehicleSizesJson: profile.vehicleSizes,
        preferredFuelTypesJson: profile.fuelTypes,
        preferredTransmissionsJson: profile.transmissions,
        preferredDrivetrainsJson: profile.drivetrains,
        preferredPowerRangeJson: profile.targetPowerHp != null ? { targetHp: profile.targetPowerHp } : undefined,
        preferredPriceRangeJson: profile.priceRange ?? undefined,
        preferredUseCasesJson: profile.useCases,
        dislikedPatternsJson: profile.dislikedPatterns,
        strongPositiveSignalsJson: profile.strongPositive,
        strongNegativeSignalsJson: profile.strongNegative,
        confidence: profile.confidence,
        summaryText,
        signalCount: profile.signalCount,
      },
      update: {
        preferredMakesJson: profile.makes,
        preferredModelsJson: profile.models,
        preferredSegmentsJson: profile.segments,
        preferredBodyTypesJson: profile.bodyTypes,
        preferredVehicleSizesJson: profile.vehicleSizes,
        preferredFuelTypesJson: profile.fuelTypes,
        preferredTransmissionsJson: profile.transmissions,
        preferredDrivetrainsJson: profile.drivetrains,
        preferredPowerRangeJson: profile.targetPowerHp != null ? { targetHp: profile.targetPowerHp } : undefined,
        preferredPriceRangeJson: profile.priceRange ?? undefined,
        preferredUseCasesJson: profile.useCases,
        dislikedPatternsJson: profile.dislikedPatterns,
        strongPositiveSignalsJson: profile.strongPositive,
        strongNegativeSignalsJson: profile.strongNegative,
        confidence: profile.confidence,
        summaryText,
        signalCount: profile.signalCount,
        lastUpdatedAt: new Date(),
      },
    }),
    prisma.tasteProfileInsight.deleteMany({ where: { userId } }),
    prisma.tasteProfileInsight.createMany({
      data: insights.map((i) => ({
        userId,
        insightType: i.insightType,
        titleKey: i.titleKey,
        paramsJson: i.params,
        confidence: i.confidence,
      })),
    }),
  ])
  return profile
}

/** Lädt das persistierte Profil in die In-Memory-Form der Taste-Engine. */
export async function getTasteProfile(userId: string): Promise<TasteProfile> {
  const row = await prisma.userTasteProfile.findUnique({ where: { userId } })
  if (!row) return emptyTasteProfile()
  const powerRange = row.preferredPowerRangeJson as { targetHp?: number } | null
  return {
    makes: (row.preferredMakesJson as Record<string, number> | null) ?? {},
    models: (row.preferredModelsJson as Record<string, number> | null) ?? {},
    segments: (row.preferredSegmentsJson as Record<string, number> | null) ?? {},
    bodyTypes: (row.preferredBodyTypesJson as Record<string, number> | null) ?? {},
    vehicleSizes: (row.preferredVehicleSizesJson as Record<string, number> | null) ?? {},
    fuelTypes: (row.preferredFuelTypesJson as Record<string, number> | null) ?? {},
    transmissions: (row.preferredTransmissionsJson as Record<string, number> | null) ?? {},
    drivetrains: (row.preferredDrivetrainsJson as Record<string, number> | null) ?? {},
    useCases: (row.preferredUseCasesJson as Record<string, number> | null) ?? {},
    targetPowerHp: powerRange?.targetHp,
    priceRange: (row.preferredPriceRangeJson as { min: number; max: number } | null) ?? undefined,
    dislikedPatterns: (row.dislikedPatternsJson as Record<string, number> | null) ?? {},
    strongPositive: (row.strongPositiveSignalsJson as string[] | null) ?? [],
    strongNegative: (row.strongNegativeSignalsJson as string[] | null) ?? [],
    signalCount: row.signalCount,
    confidence: row.confidence,
  }
}

/** DSGVO: Geschmacksprofil, Insights und Modell-Swipes vollständig löschen. */
export async function resetTasteProfile(userId: string): Promise<void> {
  await prisma.$transaction([
    prisma.userTasteProfile.deleteMany({ where: { userId } }),
    prisma.tasteProfileInsight.deleteMany({ where: { userId } }),
    prisma.modelSwipeEvent.deleteMany({ where: { userId } }),
  ])
}
