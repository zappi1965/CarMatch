import React, { useState } from 'react'
import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'expo-router'
import { api } from '../lib/api'
import { colors, radius, spacing, typography } from '../lib/theme'
import { formatKm, formatPrice, type ListingDto, type ListingInsights } from '../lib/types'
import { Badge } from './ui'
import { ScoreDial } from './ScoreDial'

/**
 * Quartett-Karte im Mockup-Design:
 * Vorderseite — Bild, Traumwagen-Badge, Titel + Herz, Preis, Fakten-Zeile,
 * Chips, "Mehr ›". Rückseite — zweispaltige Datentabelle, Score-Ringe (0–10),
 * Marktpreis-Zeile und CTA-Leiste (Anfragen / Zum Inserat / Favorit).
 */
export function VehicleCard({
  listing,
  distanceKm,
  isSponsored,
  dreamCandidate,
  explanationText,
  monthlyCostTotal,
  onOpenedMore,
}: {
  listing: ListingDto
  distanceKm?: number | null
  isSponsored?: boolean
  dreamCandidate?: boolean
  explanationText?: string
  monthlyCostTotal?: number
  onOpenedMore?: () => void
}) {
  const { t } = useTranslation()
  const router = useRouter()
  const flip = useSharedValue(0)
  const [showBack, setShowBack] = useState(false)
  const [insights, setInsights] = useState<ListingInsights | null>(null)
  const [isFavorite, setIsFavorite] = useState(false)

  const toggle = () => {
    const next = showBack ? 0 : 1
    if (!showBack) {
      onOpenedMore?.()
      // Kaufhilfe (Scores, Marktpreis) lazy laden, sobald die Rückseite aufgeht
      if (!insights) void api.get<ListingInsights>(`/vehicles/${listing.id}`).then(setInsights).catch(() => {})
    }
    setShowBack(!showBack)
    flip.value = withTiming(next, { duration: 420 })
  }

  const addFavorite = () => {
    setIsFavorite(true)
    void api.post('/favorites', { listingId: listing.id }).catch(() => setIsFavorite(false))
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
  const scoreOf = (key: string) => insights?.scores.find((s) => s.key === key)

  return (
    <View style={{ flex: 1 }}>
      {/* ── Vorderseite ── */}
      <Animated.View style={[styles.card, frontStyle]}>
        <View style={styles.imageWrap}>
          <Image source={{ uri: listing.images[0] }} style={styles.image} resizeMode="cover" />
          <View style={styles.imageBadges}>
            {dreamCandidate ? <Badge label={`◆ ${t('mockup.dreamCandidate').toUpperCase()}`} tone="gold" /> : null}
            {(listing.imagesAreDemo || listing.provider === 'demo') ? <Badge label={t('discover.demoBadge')} tone="warn" /> : null}
            {isSponsored ? <Badge label={t('discover.sponsored')} tone="gold" /> : null}
          </View>
          {listing.imageAttribution ? (
            <Text style={styles.attribution}>{listing.imageAttribution}</Text>
          ) : null}
        </View>

        <View style={styles.front}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[typography.title, { color: colors.text, flex: 1 }]} numberOfLines={1}>
              {listing.make} {listing.model} {listing.variant ?? ''}
            </Text>
            <Pressable onPress={addFavorite} hitSlop={8} style={styles.heartButton}>
              <Text style={{ color: isFavorite ? colors.like : colors.textMuted, fontSize: 18 }}>
                {isFavorite ? '♥' : '♡'}
              </Text>
            </Pressable>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing(2.5), marginTop: spacing(1) }}>
            <Text style={[typography.price, { color: colors.text }]}>
              {formatPrice(listing.price, listing.currency)}
            </Text>
            {monthlyCostTotal != null ? (
              <Text style={[typography.badge, { color: colors.gold }]}>
                {t('costs.perMonth', { amount: monthlyCostTotal })}
              </Text>
            ) : null}
          </View>

          <View style={styles.factsRow}>
            <Fact glyph="◷" value={listing.year != null ? String(listing.year) : '–'} />
            <Fact glyph="◎" value={formatKm(listing.mileage)} />
            {listing.city ? <Fact glyph="⌖" value={listing.city} /> : null}
            {distanceKm != null && Number.isFinite(distanceKm) ? (
              <Fact glyph="➤" value={t('card.distance', { km: distanceKm })} />
            ) : null}
          </View>

          <View style={styles.badgeRow}>
            {listing.powerHp != null ? <Chip label={`${listing.powerHp} ${t('common.hp')}`} /> : null}
            {transmission ? <Chip label={transmission} /> : null}
            {fuel ? <Chip label={fuel} /> : null}
            <Chip label={listing.sellerType === 'DEALER' ? t('card.dealer') : t('card.private')} />
          </View>

          {explanationText ? (
            <Text style={[typography.badge, { color: colors.textFaint, marginTop: spacing(2) }]} numberOfLines={2}>
              {explanationText}
            </Text>
          ) : null}
        </View>

        <Pressable onPress={toggle} style={styles.morePill} hitSlop={8}>
          <Text style={[typography.badge, { color: colors.text }]}>{t('mockup.more')} ›</Text>
        </Pressable>
      </Animated.View>

      {/* ── Rückseite ── */}
      <Animated.View style={[styles.card, styles.back, backStyle]}>
        <ScrollView contentContainerStyle={{ paddingBottom: spacing(4) }}>
          <View style={styles.backImageWrap}>
            <Image source={{ uri: listing.images[1] ?? listing.images[0] }} style={styles.image} resizeMode="cover" />
            <Pressable onPress={toggle} style={styles.backButton} hitSlop={8}>
              <Text style={{ color: colors.text, fontSize: 16 }}>‹</Text>
            </Pressable>
          </View>

          <View style={{ padding: spacing(4) }}>
            <Text style={[typography.title, { color: colors.text, marginBottom: spacing(3) }]}>
              {listing.make} {listing.model} {listing.variant ?? ''}
            </Text>

            {/* Zweispaltige Datentabelle (Mockup) */}
            <View style={styles.specGrid}>
              <View style={styles.specColumn}>
                <Spec label={t('card.year')} value={str(listing.year, t)} />
                <Spec label={t('card.firstRegistration')} value={listing.firstRegistration ?? t('card.unknown')} />
                <Spec label={t('card.mileage')} value={formatKm(listing.mileage)} />
                <Spec
                  label={t('card.power')}
                  value={listing.powerHp != null ? `${listing.powerHp} ${t('common.hp')} / ${listing.powerKw ?? '–'} kW` : t('card.unknown')}
                />
                <Spec label={t('card.zeroToHundred')} value={listing.specs?.zeroToHundred != null ? `${listing.specs.zeroToHundred} s` : t('card.unknown')} />
                <Spec label={t('card.topSpeed')} value={listing.specs?.topSpeed != null ? `${listing.specs.topSpeed} km/h` : t('card.unknown')} />
                <Spec label={t('card.fuel')} value={fuel ?? t('card.unknown')} />
                <Spec
                  label={t('card.consumption')}
                  value={listing.consumptionL100 != null && listing.consumptionL100 > 0 ? `${listing.consumptionL100} l/100 km` : t('card.unknown')}
                />
                <Spec label={t('card.co2')} value={listing.co2GKm != null ? `${listing.co2GKm} g/km` : t('card.unknown')} />
              </View>
              <View style={[styles.specColumn, styles.specColumnRight]}>
                <Spec label={t('card.transmission')} value={transmission ?? t('card.unknown')} />
                <Spec label={t('card.drivetrain')} value={listing.drivetrain ?? t('card.unknown')} />
                <Spec label={t('card.bodyType')} value={listing.bodyType ? t(`filters.bodyValues.${listing.bodyType}`, listing.bodyType) : t('card.unknown')} />
                <Spec label={t('card.doors')} value={str(listing.doors, t)} />
                <Spec label={t('card.seats')} value={str(listing.seats, t)} />
                <Spec label={t('card.color')} value={listing.color ?? t('card.unknown')} />
                <Spec label={t('card.seller')} value={listing.sellerType === 'DEALER' ? t('card.dealer') : t('card.private')} />
                <Spec label={t('location.title')} value={listing.city ?? t('card.unknown')} />
                <Spec label={t('card.previousOwners')} value={str(listing.previousOwners, t)} />
              </View>
            </View>

            {/* Score-Kacheln mit Ring-Gauge */}
            {insights ? (
              <View style={{ flexDirection: 'row', gap: spacing(2), marginTop: spacing(4) }}>
                {scoreOf('performance') ? (
                  <ScoreDial label={t('scores.performance')} value={scoreOf('performance')!.value} confidence={scoreOf('performance')!.confidence} color={colors.like} estimatedLabel={t('card.estimated')} />
                ) : null}
                {scoreOf('everyday') ? (
                  <ScoreDial label={t('scores.everyday')} value={scoreOf('everyday')!.value} confidence={scoreOf('everyday')!.confidence} color={colors.info} estimatedLabel={t('card.estimated')} />
                ) : null}
                {scoreOf('priceValue') ? (
                  <ScoreDial label={t('scores.priceValue')} value={scoreOf('priceValue')!.value} confidence={scoreOf('priceValue')!.confidence} color={colors.gold} estimatedLabel={t('card.estimated')} />
                ) : null}
              </View>
            ) : null}

            {/* Marktpreis-Zeile */}
            {insights ? (
              <View style={styles.marketRow}>
                <Text style={[typography.body, { color: colors.textMuted }]}>⚖ {t('mockup.marketPrice')}:</Text>
                <Text
                  style={[typography.body, {
                    fontWeight: '600',
                    color:
                      insights.priceAssessment.verdict === 'GOOD_DEAL' ? colors.like
                      : insights.priceAssessment.verdict === 'EXPENSIVE' ? colors.warn
                      : insights.priceAssessment.verdict === 'FAIR' ? colors.like
                      : colors.textFaint,
                  }]}
                >
                  {t(`price.${insights.priceAssessment.verdict}`).toLowerCase()}
                </Text>
              </View>
            ) : null}

            {/* CTA-Leiste */}
            <View style={{ flexDirection: 'row', gap: spacing(2), marginTop: spacing(4) }}>
              <Pressable style={[styles.cta, styles.ctaPrimary]} onPress={() => router.push(`/vehicle/${listing.id}`)}>
                <Text style={[typography.body, { color: '#141519', fontWeight: '700' }]}>✉ {t('actions.contact')}</Text>
              </Pressable>
              {listing.sourceUrl ? (
                <Pressable style={styles.cta} onPress={() => void Linking.openURL(listing.sourceUrl!)}>
                  <Text style={[typography.body, { color: colors.text }]}>{t('actions.toListing')}</Text>
                </Pressable>
              ) : null}
              <Pressable style={styles.cta} onPress={addFavorite}>
                <Text style={[typography.body, { color: isFavorite ? colors.like : colors.text }]}>
                  {isFavorite ? '♥' : '♡'}
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  )
}

const str = (v: number | null | undefined, t: (k: string) => string) =>
  v != null ? String(v) : t('card.unknown')

function Fact({ glyph, value }: { glyph: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <Text style={{ color: colors.textFaint, fontSize: 13 }}>{glyph}</Text>
      <Text style={[typography.body, { color: colors.textMuted, fontSize: 13 }]}>{value}</Text>
    </View>
  )
}

function Chip({ label }: { label: string }) {
  return (
    <View style={styles.chip}>
      <Text style={[typography.badge, { color: colors.textMuted }]}>{label}</Text>
    </View>
  )
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.specRow}>
      <Text style={[typography.badge, { color: colors.textMuted, flex: 1 }]}>{label}:</Text>
      <Text style={[typography.badge, { color: colors.text, fontWeight: '600', textAlign: 'right', flexShrink: 0, maxWidth: '55%' }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
  },
  back: { backgroundColor: colors.surface },
  imageWrap: { flex: 1, backgroundColor: colors.surface, margin: spacing(2.5), marginBottom: 0, borderRadius: radius.md, overflow: 'hidden' },
  backImageWrap: { height: 150, backgroundColor: colors.bg, margin: spacing(2.5), borderRadius: radius.md, overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  imageBadges: { position: 'absolute', top: spacing(3), left: spacing(3), flexDirection: 'row', gap: spacing(2) },
  attribution: {
    position: 'absolute', bottom: 4, right: 8,
    color: 'rgba(244,242,238,0.55)', fontSize: 9,
  },
  front: { padding: spacing(4), paddingTop: spacing(3) },
  factsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(3.5), marginTop: spacing(3) },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(1.5), marginTop: spacing(3) },
  chip: {
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(1.5),
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  morePill: {
    position: 'absolute',
    bottom: spacing(3),
    right: spacing(3),
    backgroundColor: colors.overlay,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: spacing(3.5),
    paddingVertical: spacing(2),
    borderRadius: radius.pill,
  },
  heartButton: {
    width: 38, height: 38, borderRadius: 19,
    borderWidth: 1, borderColor: colors.cardBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  backButton: {
    position: 'absolute', top: spacing(2.5), left: spacing(2.5),
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center',
  },
  specGrid: { flexDirection: 'row', gap: spacing(3) },
  specColumn: { flex: 1 },
  specColumnRight: { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: colors.cardBorder, paddingLeft: spacing(3) },
  specRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing(1.75) },
  marketRow: {
    flexDirection: 'row', gap: spacing(2), alignItems: 'center',
    marginTop: spacing(3), paddingTop: spacing(3),
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.cardBorder,
  },
  cta: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: spacing(3),
    paddingHorizontal: spacing(3),
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.card,
  },
  ctaPrimary: { backgroundColor: colors.text, borderColor: colors.text, flexGrow: 2 },
})
