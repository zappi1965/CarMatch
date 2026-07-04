import React, { useEffect, useState } from 'react'
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { api } from '../../src/lib/api'
import { colors, radius, spacing, typography } from '../../src/lib/theme'
import { formatKm, formatPrice, type ListingDto, type VehicleModelDto } from '../../src/lib/types'
import { Badge, EmptyState, LoadingState } from '../../src/components/ui'

interface ModelListingMatch {
  matchScore: number
  matchReasons: string[]
  listing: ListingDto
}

/** "Ähnliche echte Angebote": passende Inserate zu einem Fahrzeugmodell. */
export default function ModelListingsScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const [model, setModel] = useState<VehicleModelDto | null>(null)
  const [matches, setMatches] = useState<ModelListingMatch[] | null>(null)

  useEffect(() => {
    if (!id) return
    void api
      .get<VehicleModelDto>(`/vehicle-models/${id}`)
      .then(setModel)
      .catch(() => {})
    void api
      .get<ModelListingMatch[]>(`/vehicle-models/${id}/listings`)
      .then(setMatches)
      .catch(() => setMatches([]))
  }, [id])

  if (!model || matches === null) return <LoadingState label={t('common.loading')} />

  if (matches.length === 0) {
    return <EmptyState title={t('search.noResults')} hint={t('taste.noListings')} />
  }

  return (
    <FlatList
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: spacing(4), gap: spacing(3) }}
      data={matches}
      keyExtractor={(m) => m.listing.id}
      ListHeaderComponent={
        <Text style={[typography.title, { color: colors.text, marginBottom: spacing(2) }]}>
          {[model.make, model.model, model.variant].filter(Boolean).join(' ')}
        </Text>
      }
      renderItem={({ item }) => (
        <Pressable
          style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
          onPress={() => router.push(`/vehicle/${item.listing.id}`)}
        >
          <Image source={{ uri: item.listing.images[0] }} style={styles.thumb} />
          <View style={{ flex: 1, padding: spacing(3) }}>
            <Text
              style={[typography.body, { color: colors.text, fontWeight: '700' }]}
              numberOfLines={1}
            >
              {item.listing.title}
            </Text>
            <Text style={[typography.body, { color: colors.gold, fontWeight: '700' }]}>
              {formatPrice(item.listing.price, item.listing.currency)}
            </Text>
            <Text style={[typography.badge, { color: colors.textFaint, marginTop: 2 }]}>
              {item.listing.year ?? '–'} · {formatKm(item.listing.mileage)} ·{' '}
              {item.listing.city ?? ''}
            </Text>
            <View style={{ flexDirection: 'row', gap: spacing(1.5), marginTop: spacing(1.5) }}>
              <Badge
                label={`${t('taste.matchReason')} ${Math.round(item.matchScore * 100)} %`}
                tone="gold"
              />
              {item.listing.imagesAreDemo ? (
                <Badge label={t('discover.demoBadge')} tone="warn" />
              ) : null}
            </View>
          </View>
        </Pressable>
      )}
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
  thumb: { width: 110, height: 96, backgroundColor: colors.surface },
})
