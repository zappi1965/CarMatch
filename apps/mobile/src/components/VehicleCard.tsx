import React, { useState } from 'react'
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { useTranslation } from 'react-i18next'
import { colors, radius, spacing, typography } from '../lib/theme'
import { formatKm, formatPrice, type ListingDto } from '../lib/types'
import { Badge, Row } from './ui'

/**
 * Quartett-Karte: Vorderseite mit großem Bild + Keyfacts,
 * "Mehr"-Flip zur Rückseite mit vollständigen technischen Daten.
 */
export function VehicleCard({
  listing,
  distanceKm,
  isSponsored,
  explanationText,
  onOpenedMore,
}: {
  listing: ListingDto
  distanceKm?: number | null
  isSponsored?: boolean
  explanationText?: string
  onOpenedMore?: () => void
}) {
  const { t } = useTranslation()
  const flip = useSharedValue(0)
  const [showBack, setShowBack] = useState(false)

  const toggle = () => {
    const next = showBack ? 0 : 1
    if (!showBack) onOpenedMore?.()
    setShowBack(!showBack)
    flip.value = withTiming(next, { duration: 420 })
  }

  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1200 }, { rotateY: `${interpolate(flip.value, [0, 1], [0, 180])}deg` }],
    backfaceVisibility: 'hidden',
  }))
  const backStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1200 }, { rotateY: `${interpolate(flip.value, [0, 1], [180, 360])}deg` }],
    backfaceVisibility: 'hidden',
  }))

  const fuel = listing.fuelType ? t(`filters.fuelValues.${listing.fuelType}`, listing.fuelType) : null
  const transmission = listing.transmission
    ? t(`filters.transmissionValues.${listing.transmission}`, listing.transmission)
    : null

  return (
    <View style={styles.wrap}>
      {/* Vorderseite */}
      <Animated.View style={[styles.card, frontStyle]}>
        <View style={styles.imageWrap}>
          <Image source={{ uri: listing.images[0] }} style={styles.image} resizeMode="cover" />
          <View style={styles.imageBadges}>
            {listing.imagesAreDemo && <Badge label={t('discover.demoBadge')} tone="warn" />}
            {isSponsored && <Badge label={t('discover.sponsored')} tone="gold" />}
          </View>
        </View>

        <View style={styles.front}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1, paddingRight: spacing(2) }}>
              <Text style={[typography.label, { color: colors.textMuted }]}>
                {listing.make}
                {listing.variant ? ` · ${listing.variant}` : ''}
              </Text>
              <Text style={[typography.title, { color: colors.text }]} numberOfLines={1}>
                {listing.model}
              </Text>
            </View>
            <Text style={[typography.price, { color: colors.gold }]}>{formatPrice(listing.price, listing.currency)}</Text>
          </View>

          <View style={styles.factsRow}>
            <Fact label={t('card.year')} value={listing.year != null ? String(listing.year) : '–'} />
            <Fact label={t('card.mileage')} value={formatKm(listing.mileage)} />
            <Fact label={t('card.power')} value={listing.powerHp != null ? `${listing.powerHp} ${t('common.hp')}` : '–'} />
          </View>

          <View style={styles.badgeRow}>
            {fuel ? <Badge label={fuel} /> : null}
            {transmission ? <Badge label={transmission} /> : null}
            <Badge label={listing.sellerType === 'DEALER' ? t('card.dealer') : t('card.private')} />
            {listing.city ? (
              <Badge
                label={distanceKm != null && Number.isFinite(distanceKm) ? `${listing.city} · ${t('card.distance', { km: distanceKm })}` : listing.city}
              />
            ) : null}
          </View>

          {explanationText ? (
            <Text style={[typography.badge, { color: colors.textFaint, marginTop: spacing(2) }]} numberOfLines={2}>
              {explanationText}
            </Text>
          ) : null}
        </View>

        <Pressable onPress={toggle} style={styles.moreButton} hitSlop={8}>
          <Text style={[typography.badge, { color: colors.text }]}>{t('discover.more')} ↺</Text>
        </Pressable>
      </Animated.View>

      {/* Rückseite: vollständige technische Daten */}
      <Animated.View style={[styles.card, styles.back, backStyle]}>
        <ScrollView contentContainerStyle={{ padding: spacing(4), paddingBottom: spacing(12) }}>
          <Text style={[typography.label, { color: colors.textMuted }]}>{listing.make}</Text>
          <Text style={[typography.title, { color: colors.text, marginBottom: spacing(3) }]}>
            {listing.model} {listing.variant ?? ''}
          </Text>

          <Row label={t('card.year')} value={listing.year != null ? String(listing.year) : t('card.unknown')} />
          <Row label={t('card.firstRegistration')} value={listing.firstRegistration ?? t('card.unknown')} />
          <Row label={t('card.mileage')} value={formatKm(listing.mileage)} />
          <Row
            label={t('card.power')}
            value={listing.powerHp != null ? `${listing.powerHp} ${t('common.hp')} (${listing.powerKw ?? '–'} kW)` : t('card.unknown')}
          />
          <Row label={t('card.displacement')} value={listing.displacementCcm != null ? `${listing.displacementCcm} ccm` : t('card.unknown')} />
          <Row label={t('card.fuel')} value={fuel ?? t('card.unknown')} />
          <Row
            label={t('card.consumption')}
            value={listing.consumptionL100 != null ? (listing.consumptionL100 === 0 ? '–' : `${listing.consumptionL100} l/100km`) : t('card.unknown')}
          />
          <Row label={t('card.co2')} value={listing.co2GKm != null ? `${listing.co2GKm} g/km` : t('card.unknown')} />
          <Row label={t('card.transmission')} value={transmission ?? t('card.unknown')} />
          <Row label={t('card.drivetrain')} value={listing.drivetrain ?? t('card.unknown')} />
          <Row label={t('card.bodyType')} value={listing.bodyType ? t(`filters.bodyValues.${listing.bodyType}`, listing.bodyType) : t('card.unknown')} />
          <Row label={t('card.doors')} value={listing.doors != null ? String(listing.doors) : t('card.unknown')} />
          <Row label={t('card.seats')} value={listing.seats != null ? String(listing.seats) : t('card.unknown')} />
          <Row label={t('card.color')} value={listing.color ?? t('card.unknown')} />
          <Row label={t('card.interior')} value={listing.interior ?? t('card.unknown')} />
          <Row label={t('card.inspection')} value={listing.inspectionValidUntil ?? t('card.unknown')} />
          <Row label={t('card.accidentFree')} value={triState(listing.accidentFree, t)} />
          <Row label={t('card.previousOwners')} value={listing.previousOwners != null ? String(listing.previousOwners) : t('card.unknown')} />
          <Row label={t('card.serviceHistory')} value={triState(listing.fullServiceHistory, t)} />
          <Row label={t('card.warranty')} value={triState(listing.warranty, t)} />
          <Row label={t('card.seller')} value={listing.sellerType === 'DEALER' ? t('card.dealer') : t('card.private')} />

          {listing.specs ? (
            <>
              <Text style={[typography.label, { color: colors.textMuted, marginTop: spacing(4), marginBottom: spacing(1) }]}>
                {t('scores.performance')}
                {!listing.specs.verified ? ` (${t('card.notVerified')})` : ''}
              </Text>
              {listing.specs.zeroToHundred != null && <Row label={t('card.zeroToHundred')} value={`${listing.specs.zeroToHundred} s`} />}
              {listing.specs.topSpeed != null && <Row label={t('card.topSpeed')} value={`${listing.specs.topSpeed} km/h`} />}
              {listing.specs.weightKg != null && <Row label={t('card.weight')} value={`${listing.specs.weightKg} kg`} />}
              {listing.specs.trunkVolumeL != null && <Row label={t('card.trunk')} value={`${listing.specs.trunkVolumeL} l`} />}
              {listing.specs.electricRangeKm != null && <Row label={t('card.range')} value={`${listing.specs.electricRangeKm} km`} />}
              {listing.specs.batteryCapacityKwh != null && <Row label={t('card.battery')} value={`${listing.specs.batteryCapacityKwh} kWh`} />}
            </>
          ) : null}

          {listing.features?.length ? (
            <>
              <Text style={[typography.label, { color: colors.textMuted, marginTop: spacing(4), marginBottom: spacing(2) }]}>
                {t('card.features')}
              </Text>
              <View style={styles.badgeRow}>
                {listing.features.map((f) => (
                  <Badge key={f} label={f} />
                ))}
              </View>
            </>
          ) : null}
        </ScrollView>

        <Pressable onPress={toggle} style={styles.moreButton} hitSlop={8}>
          <Text style={[typography.badge, { color: colors.text }]}>↩</Text>
        </Pressable>
      </Animated.View>
    </View>
  )
}

function triState(v: boolean | null | undefined, t: (k: string) => string): string {
  return v == null ? t('card.unknown') : v ? t('card.yes') : t('card.no')
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={[typography.label, { color: colors.textFaint }]}>{label}</Text>
      <Text style={[typography.body, { color: colors.text, fontWeight: '600', marginTop: 2 }]}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  card: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
  },
  back: { backgroundColor: colors.surface },
  imageWrap: { flex: 1, backgroundColor: colors.surface },
  image: { width: '100%', height: '100%' },
  imageBadges: {
    position: 'absolute',
    top: spacing(3),
    left: spacing(3),
    flexDirection: 'row',
    gap: spacing(2),
  },
  front: { padding: spacing(4), paddingTop: spacing(2) },
  factsRow: {
    flexDirection: 'row',
    marginTop: spacing(3),
    paddingTop: spacing(3),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.cardBorder,
  },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(1.5), marginTop: spacing(3) },
  moreButton: {
    position: 'absolute',
    top: spacing(3),
    right: spacing(3),
    backgroundColor: colors.overlay,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(1.5),
    borderRadius: radius.pill,
  },
})
