import React, { useState } from 'react'
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'expo-router'
import { colors, radius, spacing, typography } from '../lib/theme'
import { formatPrice, type VehicleModelDto } from '../lib/types'
import { Badge } from './ui'

/**
 * Inspirationsmodus-Karte: generelles Fahrzeugmodell (kein Inserat).
 * Vorderseite — Bild, Segment, typische Preisspanne, Keyfacts.
 * Rückseite — Stärken/Schwächen, technische Eckdaten, CTAs
 * ("Ähnliche echte Angebote finden", "Mehr wie dieses Auto", "Weniger davon").
 */
export function VehicleModelCard({
  model,
  onOpenedMore,
  onMoreLikeThis,
  onLessLikeThis,
}: {
  model: VehicleModelDto
  onOpenedMore?: () => void
  onMoreLikeThis?: () => void
  onLessLikeThis?: () => void
}) {
  const { t } = useTranslation()
  const router = useRouter()
  const flip = useSharedValue(0)
  const [showBack, setShowBack] = useState(false)

  const toggle = () => {
    if (!showBack) onOpenedMore?.()
    setShowBack(!showBack)
    flip.value = withTiming(showBack ? 0 : 1, { duration: 420 })
  }

  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1200 }, { rotateY: `${interpolate(flip.value, [0, 1], [0, 180])}deg` }],
    backfaceVisibility: 'hidden',
  }))
  const backStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1200 }, { rotateY: `${interpolate(flip.value, [0, 1], [180, 360])}deg` }],
    backfaceVisibility: 'hidden',
  }))

  const title = [model.make, model.model, model.variant].filter(Boolean).join(' ')
  const yearsLabel =
    model.productionStartYear != null
      ? `${model.productionStartYear}–${model.productionEndYear ?? ''}`
      : null

  const powerLabel =
    model.minPowerHp != null && model.maxPowerHp != null
      ? model.minPowerHp === model.maxPowerHp
        ? `${model.maxPowerHp} ${t('common.hp')}`
        : `${model.minPowerHp}–${model.maxPowerHp} ${t('common.hp')}`
      : null

  const priceLabel =
    model.typicalUsedPriceMin != null && model.typicalUsedPriceMax != null
      ? `${formatPrice(model.typicalUsedPriceMin)} – ${formatPrice(model.typicalUsedPriceMax)}`
      : null

  return (
    <View style={{ flex: 1 }}>
      {/* ── Vorderseite ── */}
      <Animated.View style={[styles.card, frontStyle]}>
        <View style={styles.imageWrap}>
          <Image source={{ uri: model.imageUrls[0] }} style={styles.image} resizeMode="cover" />
          <View style={styles.imageBadges}>
            {model.source === 'DEMO' ? <Badge label={t('discover.demoBadge')} tone="warn" /> : null}
            {model.segment ? <Badge label={model.segment} tone="gold" /> : null}
          </View>
        </View>

        <View style={{ padding: spacing(4), paddingTop: spacing(3) }}>
          <Text style={[typography.label, { color: colors.textMuted }]}>{model.make}</Text>
          <Text style={[typography.title, { color: colors.text }]} numberOfLines={1}>
            {[model.model, model.variant].filter(Boolean).join(' ')}
          </Text>
          {priceLabel ? (
            <Text style={[typography.body, { color: colors.gold, fontWeight: '700', marginTop: spacing(1) }]}>
              {priceLabel}
            </Text>
          ) : null}
          {yearsLabel ? (
            <Text style={[typography.badge, { color: colors.textFaint, marginTop: 2 }]}>
              {t('taste.productionYears')}: {yearsLabel}
            </Text>
          ) : null}

          <View style={styles.badgeRow}>
            {powerLabel ? <Chip label={powerLabel} /> : null}
            {(model.fuelTypes ?? []).slice(0, 2).map((f) => (
              <Chip key={f} label={t(`filters.fuelValues.${f}`, f)} />
            ))}
            {(model.transmissionTypes ?? []).slice(0, 1).map((tr) => (
              <Chip key={tr} label={t(`filters.transmissionValues.${tr}`, tr)} />
            ))}
            {model.bodyType ? <Chip label={t(`filters.bodyValues.${model.bodyType}`, model.bodyType)} /> : null}
          </View>

          {(model.tagsJson ?? []).length ? (
            <View style={[styles.badgeRow, { marginTop: spacing(2) }]}>
              {(model.tagsJson ?? []).map((tag) => (
                <Badge key={tag} label={tag} />
              ))}
            </View>
          ) : null}
        </View>

        <Pressable onPress={toggle} style={styles.morePill} hitSlop={8}>
          <Text style={[typography.badge, { color: colors.text }]}>{t('mockup.more')} ›</Text>
        </Pressable>
      </Animated.View>

      {/* ── Rückseite ── */}
      <Animated.View style={[styles.card, styles.back, backStyle]}>
        <ScrollView contentContainerStyle={{ padding: spacing(4), paddingBottom: spacing(4) }}>
          <Text style={[typography.label, { color: colors.textMuted }]}>{model.segment ?? model.make}</Text>
          <Text style={[typography.title, { color: colors.text, marginBottom: spacing(2) }]}>{title}</Text>
          {model.description ? (
            <Text style={[typography.body, { color: colors.textMuted, marginBottom: spacing(3) }]}>
              {model.description}
            </Text>
          ) : null}

          <View style={styles.specGrid}>
            <View style={{ flex: 1 }}>
              {model.specs?.zeroToHundred != null && <Spec label={t('card.zeroToHundred')} value={`${model.specs.zeroToHundred} s`} />}
              {model.specs?.topSpeed != null && <Spec label={t('card.topSpeed')} value={`${model.specs.topSpeed} km/h`} />}
              {model.specs?.weightKg != null && <Spec label={t('card.weight')} value={`${model.specs.weightKg} kg`} />}
            </View>
            <View style={{ flex: 1 }}>
              {model.specs?.trunkVolumeL != null && <Spec label={t('card.trunk')} value={`${model.specs.trunkVolumeL} l`} />}
              {model.specs?.consumptionL100 != null && <Spec label={t('card.consumption')} value={`${model.specs.consumptionL100} l/100 km`} />}
              {model.specs?.electricRangeKm != null && <Spec label={t('card.range')} value={`${model.specs.electricRangeKm} km`} />}
              {model.seats != null && <Spec label={t('card.seats')} value={String(model.seats)} />}
            </View>
          </View>

          {(model.strengthsJson ?? []).length ? (
            <>
              <Text style={[typography.label, { color: colors.like, marginTop: spacing(3), marginBottom: spacing(1.5) }]}>
                {t('taste.strengths')}
              </Text>
              {(model.strengthsJson ?? []).map((s) => (
                <Text key={s} style={[typography.body, { color: colors.textMuted, marginBottom: 3 }]}>+ {s}</Text>
              ))}
            </>
          ) : null}
          {(model.weaknessesJson ?? []).length ? (
            <>
              <Text style={[typography.label, { color: colors.warn, marginTop: spacing(3), marginBottom: spacing(1.5) }]}>
                {t('taste.weaknesses')}
              </Text>
              {(model.weaknessesJson ?? []).map((s) => (
                <Text key={s} style={[typography.body, { color: colors.textMuted, marginBottom: 3 }]}>– {s}</Text>
              ))}
            </>
          ) : null}

          <View style={{ gap: spacing(2), marginTop: spacing(4) }}>
            <Pressable style={[styles.cta, styles.ctaPrimary]} onPress={() => router.push(`/model/${model.id}`)}>
              <Text style={[typography.body, { color: '#141519', fontWeight: '700' }]}>
                {t('taste.findSimilarListings')}
              </Text>
            </Pressable>
            <View style={{ flexDirection: 'row', gap: spacing(2) }}>
              <Pressable style={styles.cta} onPress={onMoreLikeThis}>
                <Text style={[typography.body, { color: colors.like }]}>{t('taste.moreLikeThis')}</Text>
              </Pressable>
              <Pressable style={styles.cta} onPress={onLessLikeThis}>
                <Text style={[typography.body, { color: colors.dislike }]}>{t('taste.lessLikeThis')}</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>

        <Pressable onPress={toggle} style={styles.backButton} hitSlop={8}>
          <Text style={{ color: colors.text, fontSize: 16 }}>‹</Text>
        </Pressable>
      </Animated.View>
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
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing(1.5) }}>
      <Text style={[typography.badge, { color: colors.textMuted }]}>{label}:</Text>
      <Text style={[typography.badge, { color: colors.text, fontWeight: '600' }]}>{value}</Text>
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
  image: { width: '100%', height: '100%' },
  imageBadges: { position: 'absolute', top: spacing(3), left: spacing(3), flexDirection: 'row', gap: spacing(2) },
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
  backButton: {
    position: 'absolute', top: spacing(3), left: spacing(3),
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.overlay, alignItems: 'center', justifyContent: 'center',
  },
  specGrid: { flexDirection: 'row', gap: spacing(4) },
  cta: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing(3),
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.card,
  },
  ctaPrimary: { backgroundColor: colors.text, borderColor: colors.text },
})
