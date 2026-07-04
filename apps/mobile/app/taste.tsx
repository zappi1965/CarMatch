import React, { useCallback, useState } from 'react'
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { api, buildQuery } from '../src/lib/api'
import { useSession } from '../src/lib/store'
import { colors, radius, spacing, typography } from '../src/lib/theme'
import {
  formatPrice,
  type DiscoverItem,
  type TasteInsightDto,
  type TasteSummaryDto,
} from '../src/lib/types'
import { CTAButton, LoadingState } from '../src/components/ui'

/**
 * TasteProfileSummary: Geschmackszusammenfassung, Insights und der zentrale
 * CTA "Passende echte Angebote finden" (nutzt /recommendations/listings-from-taste).
 */
export default function TasteProfileScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const { location } = useSession()
  const [summary, setSummary] = useState<TasteSummaryDto | null>(null)
  const [insights, setInsights] = useState<TasteInsightDto[]>([])
  const [topMatches, setTopMatches] = useState<DiscoverItem[]>([])

  useFocusEffect(
    useCallback(() => {
      void api
        .get<TasteSummaryDto>('/taste-profile/me')
        .then((s) => {
          setSummary(s)
          if (s.summaryReady) {
            void api
              .get<TasteInsightDto[]>('/taste-profile/insights')
              .then(setInsights)
              .catch(() => {})
            const q = buildQuery({
              lat: location.latitude,
              lon: location.longitude,
              radiusKm: location.radiusKm ?? undefined,
              limit: 3,
            })
            void api
              .get<DiscoverItem[]>(`/recommendations/listings-from-taste${q}`)
              .then(setTopMatches)
              .catch(() => {})
          }
        })
        .catch(() => {})
    }, [location]),
  )

  if (!summary) return <LoadingState label={t('common.loading')} />

  const translateInsight = (i: TasteInsightDto) => {
    const params = { ...(i.paramsJson ?? {}) } as Record<string, string | number>
    if (typeof params.bodyTypes === 'string') {
      params.bodyTypes = String(params.bodyTypes)
        .split(',')
        .map((b) => t(`filters.bodyValues.${b}`, b))
        .join(', ')
    }
    if (typeof params.transmission === 'string')
      params.transmission = t(
        `filters.transmissionValues.${params.transmission}`,
        String(params.transmission),
      )
    if (typeof params.max === 'number') params.max = params.max.toLocaleString('de-DE')
    return t(i.titleKey, params)
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: spacing(4), gap: spacing(4) }}
    >
      {!summary.summaryReady ? (
        <>
          <Text style={[typography.body, { color: colors.textMuted }]}>{t('taste.learning')}</Text>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(100, (summary.signalCount / summary.threshold) * 100)}%` },
              ]}
            />
          </View>
          <Text style={[typography.badge, { color: colors.textFaint }]}>
            {t('taste.progress', { count: summary.signalCount, total: summary.threshold })}
          </Text>
          <CTAButton label={t('mode.inspiration.title')} onPress={() => router.back()} />
        </>
      ) : (
        <>
          {summary.summaryText ? (
            <View style={styles.summaryBox}>
              <Text
                style={[typography.title, { color: colors.text, fontSize: 18, lineHeight: 26 }]}
              >
                {summary.summaryText}
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing(2),
                  marginTop: spacing(3),
                }}
              >
                <View style={[styles.progressTrack, { flex: 1 }]}>
                  <View style={[styles.progressFill, { width: `${summary.confidence * 100}%` }]} />
                </View>
                <Text style={[typography.badge, { color: colors.textFaint }]}>
                  {t('taste.confidence')} {Math.round(summary.confidence * 100)} %
                </Text>
              </View>
            </View>
          ) : null}

          {insights.map((i) => (
            <View key={i.id} style={styles.insight}>
              <Text style={{ color: colors.gold, marginRight: spacing(3) }}>✦</Text>
              <Text style={[typography.body, { color: colors.text, flex: 1 }]}>
                {translateInsight(i)}
              </Text>
            </View>
          ))}

          <CTAButton
            label={t('taste.findListings')}
            onPress={() => {
              void api.post('/discovery/mode', { mode: 'listings' }).catch(() => {})
              router.back()
            }}
          />

          {topMatches.length > 0 ? (
            <>
              <Text style={[typography.label, { color: colors.textMuted }]}>
                {t('taste.topMatches')}
              </Text>
              {topMatches.map((m) => (
                <Pressable
                  key={m.listing.id}
                  style={styles.match}
                  onPress={() => router.push(`/vehicle/${m.listing.id}`)}
                >
                  <Image source={{ uri: m.listing.images[0] }} style={styles.matchImg} />
                  <View style={{ flex: 1, padding: spacing(3) }}>
                    <Text
                      style={[typography.body, { color: colors.text, fontWeight: '600' }]}
                      numberOfLines={1}
                    >
                      {m.listing.title}
                    </Text>
                    <Text style={[typography.body, { color: colors.gold, fontWeight: '700' }]}>
                      {formatPrice(m.listing.price, m.listing.currency)}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </>
          ) : null}
        </>
      )}

      {/* Datenschutz: Profil zurücksetzen (löscht Modell-Swipes + Profil) */}
      <CTAButton
        label={t('settings.resetRecommendations')}
        variant="ghost"
        onPress={() => {
          void api.post('/taste-profile/reset').then(() => router.back())
        }}
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  summaryBox: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.gold,
    padding: spacing(5),
  },
  insight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing(4),
  },
  progressTrack: { height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.08)' },
  progressFill: { height: 5, borderRadius: 3, backgroundColor: colors.gold },
  match: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
  },
  matchImg: { width: 96, height: 70, backgroundColor: colors.surface },
})
