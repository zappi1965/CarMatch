import React, { useCallback, useState } from 'react'
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { api } from '../../src/lib/api'
import { colors, radius, spacing, typography } from '../../src/lib/theme'
import { formatKm, formatPrice, type ListingDto } from '../../src/lib/types'
import { Badge, CTAButton, EmptyState, LoadingState } from '../../src/components/ui'

interface FavoriteDto {
  id: string
  createdAt: string
  listing: ListingDto
}

/** Favoriten-Garage: gespeicherte Fahrzeuge, Preisverlauf, Entfernen. */
export default function GarageScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const [favorites, setFavorites] = useState<FavoriteDto[] | null>(null)

  useFocusEffect(
    useCallback(() => {
      api
        .get<FavoriteDto[]>('/favorites')
        .then(setFavorites)
        .catch(() => setFavorites([]))
    }, []),
  )

  if (favorites === null) return <LoadingState label={t('common.loading')} />

  if (favorites.length === 0) {
    return (
      <EmptyState title={t('garage.empty')} hint={t('garage.emptyHint')}>
        <CTAButton label={t('garage.startDiscovering')} onPress={() => router.navigate('/')} />
      </EmptyState>
    )
  }

  return (
    <FlatList
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: spacing(4), gap: spacing(3) }}
      data={favorites}
      keyExtractor={(f) => f.id}
      renderItem={({ item }) => {
        const prevPrice = item.listing.priceHistory?.[0]?.price
        const dropped = prevPrice != null && prevPrice > item.listing.price
        return (
          <Pressable
            style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
            onPress={() => router.push(`/vehicle/${item.listing.id}`)}
          >
            <Image source={{ uri: item.listing.images[0] }} style={styles.thumb} />
            <View style={{ flex: 1, padding: spacing(3) }}>
              <Text style={[typography.label, { color: colors.textMuted }]}>
                {item.listing.make}
              </Text>
              <Text
                style={[typography.body, { color: colors.text, fontWeight: '700' }]}
                numberOfLines={1}
              >
                {item.listing.model} {item.listing.variant ?? ''}
              </Text>
              <Text
                style={[typography.body, { color: colors.gold, fontWeight: '700', marginTop: 2 }]}
              >
                {formatPrice(item.listing.price, item.listing.currency)}
              </Text>
              <Text style={[typography.badge, { color: colors.textFaint, marginTop: 2 }]}>
                {item.listing.year ?? '–'} · {formatKm(item.listing.mileage)} ·{' '}
                {item.listing.city ?? ''}
              </Text>
              <View style={{ flexDirection: 'row', gap: spacing(1.5), marginTop: spacing(2) }}>
                {dropped && <Badge label={t('garage.priceDropped')} tone="gold" />}
                {!item.listing.isAvailable && <Badge label={t('push.favoriteGone')} tone="warn" />}
                {item.listing.imagesAreDemo && (
                  <Badge label={t('discover.demoBadge')} tone="warn" />
                )}
              </View>
            </View>
            <Pressable
              hitSlop={10}
              onPress={() => {
                void api
                  .delete(`/favorites/${item.id}`)
                  .then(() => setFavorites((prev) => prev?.filter((f) => f.id !== item.id) ?? null))
              }}
              style={{ padding: spacing(3) }}
            >
              <Text style={{ color: colors.textFaint, fontSize: 18 }}>✕</Text>
            </Pressable>
          </Pressable>
        )
      }}
    />
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
  },
  thumb: { width: 110, height: '100%', backgroundColor: colors.surface },
})
