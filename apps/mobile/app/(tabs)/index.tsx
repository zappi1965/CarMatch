import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import type { SwipeAction } from '@carmatch/shared'
import { api, buildQuery } from '../../src/lib/api'
import { useSession } from '../../src/lib/store'
import { colors, radius, spacing, typography } from '../../src/lib/theme'
import type { DiscoverItem, VehicleModelDto } from '../../src/lib/types'
import { SwipeDeck, type SwipeDeckHandle } from '../../src/components/SwipeDeck'
import { VehicleCard } from '../../src/components/VehicleCard'
import { VehicleModelCard } from '../../src/components/VehicleModelCard'
import { CardSkeleton, CTAButton, EmptyState } from '../../src/components/ui'

type Mode = 'inspiration' | 'listings' | null

/**
 * Discovery: zwei gleichberechtigte Einstiege —
 * "Autogeschmack entdecken" (Fahrzeugmodelle) und "Echte Angebote" (Inserate).
 * Web: Pfeiltasten = Swipe, Enter/Space = Mehr/Detail, Escape = zurück.
 */
export default function DiscoverScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const { location, filters } = useSession()
  const [mode, setMode] = useState<Mode>(null)
  const [items, setItems] = useState<DiscoverItem[]>([])
  const [models, setModels] = useState<VehicleModelDto[]>([])
  const [modelSwipeCount, setModelSwipeCount] = useState(0)
  const [summaryReady, setSummaryReady] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const deckRef = useRef<SwipeDeckHandle | null>(null)

  // gespeicherten Modus laden (kein Zwang — Selector bleibt bei null)
  useEffect(() => {
    api
      .get<{ current: Mode; modelSwipeCount: number }>('/discovery/modes')
      .then((d) => {
        setModelSwipeCount(d.modelSwipeCount)
        if (d.current) setMode(d.current)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const loadListings = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const q = buildQuery({
        lat: location.latitude,
        lon: location.longitude,
        postalCode: location.latitude == null ? location.postalCode : undefined,
        radiusKm: location.radiusKm ?? undefined,
        limit: 15,
        ...filters,
      })
      setItems(await api.get<DiscoverItem[]>(`/vehicles/discover${q}`))
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [location, filters])

  const loadModels = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const d = await api.get<{ models: VehicleModelDto[]; swipeCount: number }>(
        '/vehicle-models/discover?limit=15',
      )
      setModels(d.models)
      setModelSwipeCount(d.swipeCount)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (mode === 'listings') void loadListings()
    if (mode === 'inspiration') void loadModels()
  }, [mode, loadListings, loadModels])

  const selectMode = (m: Exclude<Mode, null>) => {
    setMode(m)
    void api.post('/discovery/mode', { mode: m }).catch(() => {})
  }

  const handleListingSwipe = useCallback(
    (item: DiscoverItem, action: SwipeAction, dwellTimeMs: number, openedMore: boolean) => {
      setItems((prev) => {
        const next = prev.filter((i) => i.listing.id !== item.listing.id)
        if (next.length <= 3) void loadListings()
        return next
      })
      void api.post('/swipes', { listingId: item.listing.id, action, dwellTimeMs, openedMore }).catch(() => {})
    },
    [loadListings],
  )

  const handleModelSwipe = useCallback(
    (model: VehicleModelDto, action: SwipeAction, dwellTimeMs: number, openedMore: boolean) => {
      setModels((prev) => {
        const next = prev.filter((m) => m.id !== model.id)
        if (next.length <= 3) void loadModels()
        return next
      })
      setModelSwipeCount((c) => c + 1)
      void api
        .post<{ summaryReady: boolean }>('/model-swipes', {
          vehicleModelId: model.id, action, dwellTimeMs, openedMore,
        })
        .then((d) => setSummaryReady(d.summaryReady))
        .catch(() => {})
    },
    [loadModels],
  )

  const undo = useCallback(() => {
    const path = mode === 'inspiration' ? '/model-swipes/undo' : '/swipes/undo'
    void api
      .post(path)
      .then(() => (mode === 'inspiration' ? loadModels() : loadListings()))
      .catch(() => {})
  }, [mode, loadModels, loadListings])

  // Web: Tastatursteuerung
  useEffect(() => {
    if (Platform.OS !== 'web' || !mode) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') deckRef.current?.swipe('LIKE')
      else if (e.key === 'ArrowLeft') deckRef.current?.swipe('DISLIKE')
      else if (e.key === 'ArrowUp') deckRef.current?.swipe('SUPERLIKE')
      else if ((e.key === 'Enter' || e.key === ' ') && mode === 'listings' && items[0]) {
        e.preventDefault()
        router.push(`/vehicle/${items[0].listing.id}`)
      } else if (e.key === 'Escape') setMode(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mode, items, router])

  const translateExplanation = useCallback(
    (item: DiscoverItem) => {
      const params = { ...item.explanation.params } as Record<string, string>
      if (params.bodyType) params.bodyType = t(`filters.bodyValues.${params.bodyType}`, params.bodyType)
      if (params.fuelType) params.fuelType = t(`filters.fuelValues.${params.fuelType}`, params.fuelType)
      return t(item.explanation.key, params)
    },
    [t],
  )

  // ── Mode-Selector ──
  if (mode === null) {
    return (
      <View style={[styles.screen, { padding: spacing(5), justifyContent: 'center', gap: spacing(4) }]}>
        <Text style={[typography.display, { color: colors.text, marginBottom: spacing(2) }]}>
          {t('mode.title')}
        </Text>
        <ModeCard
          glyph="◈"
          title={t('mode.inspiration.title')}
          description={t('mode.inspiration.description')}
          accent
          onPress={() => selectMode('inspiration')}
        />
        <ModeCard
          glyph="⌖"
          title={t('mode.listings.title')}
          description={t('mode.listings.description')}
          onPress={() => selectMode('listings')}
        />
        {modelSwipeCount > 0 ? (
          <Pressable onPress={() => router.push('/taste')}>
            <Text style={[typography.badge, { color: colors.gold, textAlign: 'center' }]}>
              {t('taste.modelsSwiped', { count: modelSwipeCount })} · {t('taste.viewProfile')} ›
            </Text>
          </Pressable>
        ) : null}
      </View>
    )
  }

  const isInspiration = mode === 'inspiration'
  const deckEmpty = isInspiration ? models.length === 0 : items.length === 0

  return (
    <View style={styles.screen}>
      {/* Kopfzeile: Modus-Umschalter + Standort/Filter */}
      <View style={styles.toolbar}>
        <View style={styles.segment}>
          <SegmentButton label={t('mode.switchInspiration')} active={isInspiration} onPress={() => selectMode('inspiration')} />
          <SegmentButton label={t('mode.switchListings')} active={!isInspiration} onPress={() => selectMode('listings')} />
        </View>
        {!isInspiration ? (
          <View style={{ flexDirection: 'row', gap: spacing(3) }}>
            <Pressable onPress={() => router.push('/location')} hitSlop={8}>
              <Text style={[typography.badge, { color: colors.textMuted }]}>⌖ {location.city ?? t('location.title')}</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/filters')} hitSlop={8}>
              <Text style={[typography.badge, { color: colors.textMuted }]}>{t('filters.title')} ⛭</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={() => router.push('/taste')} hitSlop={8}>
            <Text style={[typography.badge, { color: colors.gold }]}>{t('taste.title')} ›</Text>
          </Pressable>
        )}
      </View>

      {/* Taste-Fortschritt / Summary-Banner im Inspirationsmodus */}
      {isInspiration ? (
        summaryReady || modelSwipeCount >= 20 ? (
          <Pressable style={styles.summaryBanner} onPress={() => router.push('/taste')}>
            <Text style={[typography.body, { color: colors.text, fontWeight: '600' }]}>
              ✦ {t('taste.summaryReady')}
            </Text>
            <Text style={[typography.badge, { color: colors.gold }]}>{t('taste.viewProfile')} ›</Text>
          </Pressable>
        ) : (
          <View style={{ paddingHorizontal: spacing(4), paddingBottom: spacing(1) }}>
            <Text style={[typography.badge, { color: colors.textFaint }]}>
              {t('taste.progress', { count: modelSwipeCount, total: 20 })}
            </Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.min(100, (modelSwipeCount / 20) * 100)}%` }]} />
            </View>
          </View>
        )
      ) : null}

      <View style={styles.deckArea}>
        {loading && deckEmpty ? (
          <CardSkeleton />
        ) : error ? (
          <EmptyState title={t('common.offline')} hint={t('common.error')}>
            <CTAButton label={t('common.retry')} onPress={() => (isInspiration ? void loadModels() : void loadListings())} />
          </EmptyState>
        ) : deckEmpty ? (
          isInspiration ? (
            <EmptyState title={t('discover.empty')} hint={t('taste.summaryReady')}>
              <CTAButton label={t('taste.findListings')} onPress={() => selectMode('listings')} />
              <CTAButton label={t('taste.viewProfile')} variant="secondary" onPress={() => router.push('/taste')} />
            </EmptyState>
          ) : (
            <EmptyState title={t('discover.empty')} hint={t('discover.emptyHint')}>
              <CTAButton label={t('discover.expandRadius')} onPress={() => router.push('/location')} />
              <CTAButton label={t('discover.adjustFilters')} variant="secondary" onPress={() => router.push('/filters')} />
            </EmptyState>
          )
        ) : isInspiration ? (
          <SwipeDeck
            deckRef={deckRef}
            items={models}
            keyFor={(m) => m.id}
            onSwipe={handleModelSwipe}
            renderCard={(m, { onOpenedMore }) => (
              <VehicleModelCard
                model={m}
                onOpenedMore={onOpenedMore}
                onMoreLikeThis={() => deckRef.current?.swipe('SUPERLIKE')}
                onLessLikeThis={() => deckRef.current?.swipe('DISLIKE')}
              />
            )}
          />
        ) : (
          <SwipeDeck
            deckRef={deckRef}
            items={items}
            keyFor={(i) => i.listing.id}
            onSwipe={handleListingSwipe}
            renderCard={(i, { onOpenedMore }) => (
              <VehicleCard
                listing={i.listing}
                distanceKm={i.distanceKm}
                isSponsored={i.isSponsored}
                dreamCandidate={i.explanation.key === 'explain.similarModels'}
                explanationText={translateExplanation(i)}
                onOpenedMore={onOpenedMore}
              />
            )}
          />
        )}
      </View>

      {!deckEmpty && !loading ? (
        <View style={styles.actionsArea}>
          <View style={styles.actions}>
            <RoundButton glyph="↺" color={colors.textMuted} onPress={undo} accessibilityLabel={t('discover.undo')} />
            <RoundButton glyph="✕" color={colors.dislike} big onPress={() => deckRef.current?.swipe('DISLIKE')} accessibilityLabel={t('actions.dislike')} />
            <RoundButton glyph="★" color={colors.info} big onPress={() => deckRef.current?.swipe('SUPERLIKE')} accessibilityLabel={t('actions.superlike')} />
            <RoundButton glyph="♥" color={colors.like} big onPress={() => deckRef.current?.swipe('LIKE')} accessibilityLabel={t('actions.like')} />
            {!isInspiration ? (
              <RoundButton glyph="ℹ" color={colors.textMuted} onPress={() => items[0] && router.push(`/vehicle/${items[0].listing.id}`)} />
            ) : (
              <RoundButton glyph="✦" color={colors.gold} onPress={() => router.push('/taste')} />
            )}
          </View>
          <Text style={[typography.badge, { color: colors.textFaint, textAlign: 'center', letterSpacing: 1 }]}>
            ‹ {t('mockup.swipeHint').toUpperCase()} ›
          </Text>
        </View>
      ) : null}
    </View>
  )
}

function ModeCard({
  glyph, title, description, accent, onPress,
}: {
  glyph: string
  title: string
  description: string
  accent?: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.modeCard, accent && { borderColor: colors.gold }, pressed && { opacity: 0.8 }]}
    >
      <Text style={{ fontSize: 26, color: accent ? colors.gold : colors.textMuted }}>{glyph}</Text>
      <View style={{ flex: 1 }}>
        <Text style={[typography.title, { color: colors.text, fontSize: 18 }]}>{title}</Text>
        <Text style={[typography.body, { color: colors.textMuted, marginTop: spacing(1) }]}>{description}</Text>
      </View>
      <Text style={{ color: colors.textFaint, fontSize: 20 }}>›</Text>
    </Pressable>
  )
}

function SegmentButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.segmentBtn, active && styles.segmentBtnActive]}>
      <Text style={[typography.badge, { color: active ? colors.text : colors.textFaint }]}>{label}</Text>
    </Pressable>
  )
}

function RoundButton({
  glyph, color, onPress, big, accessibilityLabel,
}: {
  glyph: string
  color: string
  onPress: () => void
  big?: boolean
  accessibilityLabel?: string
}) {
  const size = big ? 60 : 46
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [
        styles.round,
        { width: size, height: size, borderRadius: size / 2, borderColor: color },
        pressed && { opacity: 0.6 },
      ]}
    >
      <Text style={{ color, fontSize: big ? 24 : 18 }}>{glyph}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(2),
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 3,
  },
  segmentBtn: { paddingHorizontal: spacing(3.5), paddingVertical: spacing(1.5), borderRadius: radius.pill },
  segmentBtnActive: { backgroundColor: colors.card },
  summaryBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: spacing(4),
    marginBottom: spacing(1),
    padding: spacing(3),
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.gold,
    backgroundColor: 'rgba(201,161,90,0.1)',
  },
  progressTrack: { height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.07)', marginTop: spacing(1.5) },
  progressFill: { height: 4, borderRadius: 2, backgroundColor: colors.gold },
  deckArea: { flex: 1, margin: spacing(4), marginTop: spacing(2) },
  actionsArea: { paddingBottom: spacing(3), gap: spacing(2) },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing(4),
  },
  round: {
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(4),
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing(5),
  },
})
