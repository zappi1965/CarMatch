import React, { useCallback, useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import type { SwipeAction } from '@carmatch/shared'
import { api, buildQuery } from '../../src/lib/api'
import { useSession } from '../../src/lib/store'
import { colors, spacing, typography } from '../../src/lib/theme'
import type { DiscoverItem } from '../../src/lib/types'
import { SwipeDeck } from '../../src/components/SwipeDeck'
import { CardSkeleton, CTAButton, EmptyState } from '../../src/components/ui'

/** Swipe Discovery — der Kern-Screen. */
export default function DiscoverScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const { location, filters } = useSession()
  const [items, setItems] = useState<DiscoverItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const load = useCallback(async () => {
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
      const data = await api.get<DiscoverItem[]>(`/vehicles/discover${q}`)
      setItems(data)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [location, filters])

  useEffect(() => {
    void load()
  }, [load])

  const handleSwipe = useCallback(
    (item: DiscoverItem, action: SwipeAction, dwellTimeMs: number, openedMore: boolean) => {
      setItems((prev) => prev.filter((i) => i.listing.id !== item.listing.id))
      void api
        .post('/swipes', { listingId: item.listing.id, action, dwellTimeMs, openedMore })
        .catch(() => {})
      // Nachschub laden, bevor das Deck leer ist
      setItems((prev) => {
        if (prev.length <= 3) void load()
        return prev
      })
    },
    [load],
  )

  const undo = useCallback(() => {
    void api
      .post<{ undoneListingId: string }>('/swipes/undo')
      .then(() => load())
      .catch(() => {})
  }, [load])

  const translateExplanation = useCallback(
    (item: DiscoverItem) => {
      const params = { ...item.explanation.params } as Record<string, string>
      if (params.bodyType) params.bodyType = t(`filters.bodyValues.${params.bodyType}`, params.bodyType)
      if (params.fuelType) params.fuelType = t(`filters.fuelValues.${params.fuelType}`, params.fuelType)
      return t(item.explanation.key, params)
    },
    [t],
  )

  const locationLabel = location.city
    ? t('location.current', {
        city: location.city,
        radius: location.radiusKm != null ? `${location.radiusKm} km` : t('location.nationwide'),
      })
    : t('location.title')

  return (
    <View style={styles.screen}>
      <View style={styles.toolbar}>
        <Pressable onPress={() => router.push('/location')} hitSlop={8}>
          <Text style={[typography.badge, { color: colors.textMuted }]}>📍 {locationLabel}</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/filters')} hitSlop={8}>
          <Text style={[typography.badge, { color: colors.textMuted }]}>{t('filters.title')} ⛭</Text>
        </Pressable>
      </View>

      <View style={styles.deckArea}>
        {loading && items.length === 0 ? (
          <CardSkeleton />
        ) : error ? (
          <EmptyState title={t('common.offline')} hint={t('common.error')}>
            <CTAButton label={t('common.retry')} onPress={() => void load()} />
          </EmptyState>
        ) : items.length === 0 ? (
          <EmptyState title={t('discover.empty')} hint={t('discover.emptyHint')}>
            <CTAButton label={t('discover.expandRadius')} onPress={() => router.push('/location')} />
            <CTAButton label={t('discover.adjustFilters')} variant="secondary" onPress={() => router.push('/filters')} />
          </EmptyState>
        ) : (
          <SwipeDeck items={items} onSwipe={handleSwipe} translateExplanation={translateExplanation} />
        )}
      </View>

      {items.length > 0 && !loading ? (
        <View style={styles.actions}>
          <RoundButton glyph="↺" color={colors.textMuted} onPress={undo} accessibilityLabel={t('discover.undo')} />
          <RoundButton
            glyph="✕"
            color={colors.dislike}
            big
            onPress={() => items[0] && handleSwipe(items[0], 'DISLIKE', 0, false)}
            accessibilityLabel={t('actions.dislike')}
          />
          <RoundButton
            glyph="★"
            color={colors.accent}
            onPress={() => items[0] && handleSwipe(items[0], 'SUPERLIKE', 0, false)}
            accessibilityLabel={t('actions.superlike')}
          />
          <RoundButton
            glyph="♥"
            color={colors.like}
            big
            onPress={() => items[0] && handleSwipe(items[0], 'LIKE', 0, false)}
            accessibilityLabel={t('actions.like')}
          />
          <RoundButton
            glyph="ℹ"
            color={colors.info}
            onPress={() => items[0] && router.push(`/vehicle/${items[0].listing.id}`)}
          />
        </View>
      ) : null}
    </View>
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
  const size = big ? 62 : 50
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
      <Text style={{ color, fontSize: big ? 26 : 20 }}>{glyph}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(2),
  },
  deckArea: { flex: 1, margin: spacing(4), marginTop: spacing(1) },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing(4),
    paddingBottom: spacing(4),
  },
  round: {
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
})
