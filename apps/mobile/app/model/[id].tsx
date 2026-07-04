import React, { useEffect, useState } from 'react'
import { FlatList, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
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

interface ReviewsDto {
  reviews: Array<{ id: string; rating: number; text: string | null; isOwner: boolean; createdAt: string }>
  averageRating: number | null
  count: number
}

/** "Ähnliche echte Angebote": passende Inserate zu einem Fahrzeugmodell. */
export default function ModelListingsScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const [model, setModel] = useState<VehicleModelDto | null>(null)
  const [matches, setMatches] = useState<ModelListingMatch[] | null>(null)
  const [reviews, setReviews] = useState<ReviewsDto | null>(null)
  const [myRating, setMyRating] = useState(0)
  const [myText, setMyText] = useState('')

  const loadReviews = () =>
    void api.get<ReviewsDto>(`/vehicle-models/${id}/reviews`).then(setReviews).catch(() => {})

  useEffect(() => {
    if (!id) return
    void api.get<VehicleModelDto>(`/vehicle-models/${id}`).then(setModel).catch(() => {})
    void api.get<ModelListingMatch[]>(`/vehicle-models/${id}/listings`).then(setMatches).catch(() => setMatches([]))
    loadReviews()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (!model || matches === null) return <LoadingState label={t('common.loading')} />

  const reviewsFooter = (
    <View style={styles.reviewBox}>
      <Text style={[typography.label, { color: colors.textMuted, marginBottom: spacing(2) }]}>
        {t('model.reviews')}
        {reviews?.averageRating != null ? ` · ★ ${reviews.averageRating} (${reviews.count})` : ''}
      </Text>
      {reviews && reviews.reviews.length > 0 ? (
        reviews.reviews.slice(0, 10).map((r) => (
          <View key={r.id} style={{ marginBottom: spacing(2.5) }}>
            <Text style={[typography.badge, { color: colors.gold }]}>
              {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
              {r.isOwner ? `  · ${t('model.isOwner')}` : ''}
            </Text>
            {r.text ? <Text style={[typography.body, { color: colors.textMuted, marginTop: 2 }]}>{r.text}</Text> : null}
          </View>
        ))
      ) : (
        <Text style={[typography.badge, { color: colors.textFaint }]}>{t('model.noReviews')}</Text>
      )}

      <Text style={[typography.label, { color: colors.textMuted, marginTop: spacing(3), marginBottom: spacing(2) }]}>
        {t('model.writeReview')}
      </Text>
      <View style={{ flexDirection: 'row', gap: spacing(1), marginBottom: spacing(2) }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable key={n} onPress={() => setMyRating(n)} hitSlop={6}>
            <Text style={{ fontSize: 26, color: n <= myRating ? colors.gold : colors.textFaint }}>
              {n <= myRating ? '★' : '☆'}
            </Text>
          </Pressable>
        ))}
      </View>
      <TextInput
        style={styles.reviewInput}
        placeholder={t('model.reviewPlaceholder')}
        placeholderTextColor={colors.textFaint}
        value={myText}
        onChangeText={setMyText}
        multiline
      />
      <Pressable
        style={[styles.submit, myRating === 0 && { opacity: 0.5 }]}
        disabled={myRating === 0}
        onPress={() =>
          void api
            .post(`/vehicle-models/${id}/reviews`, { rating: myRating, text: myText || undefined })
            .then(() => {
              setMyText('')
              loadReviews()
            })
        }
      >
        <Text style={[typography.body, { color: colors.text, fontWeight: '600' }]}>{t('actions.save')}</Text>
      </Pressable>
    </View>
  )

  if (matches.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <EmptyState title={t('search.noResults')} hint={t('taste.noListings')} />
        <View style={{ padding: spacing(4) }}>{reviewsFooter}</View>
      </View>
    )
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
      ListFooterComponent={reviewsFooter}
      renderItem={({ item }) => (
        <Pressable
          style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
          onPress={() => router.push(`/vehicle/${item.listing.id}`)}
        >
          <Image source={{ uri: item.listing.images[0] }} style={styles.thumb} />
          <View style={{ flex: 1, padding: spacing(3) }}>
            <Text style={[typography.body, { color: colors.text, fontWeight: '700' }]} numberOfLines={1}>
              {item.listing.title}
            </Text>
            <Text style={[typography.body, { color: colors.gold, fontWeight: '700' }]}>
              {formatPrice(item.listing.price, item.listing.currency)}
            </Text>
            <Text style={[typography.badge, { color: colors.textFaint, marginTop: 2 }]}>
              {item.listing.year ?? '–'} · {formatKm(item.listing.mileage)} · {item.listing.city ?? ''}
            </Text>
            <View style={{ flexDirection: 'row', gap: spacing(1.5), marginTop: spacing(1.5) }}>
              <Badge label={`${t('taste.matchReason')} ${Math.round(item.matchScore * 100)} %`} tone="gold" />
              {item.listing.imagesAreDemo ? <Badge label={t('discover.demoBadge')} tone="warn" /> : null}
            </View>
          </View>
        </Pressable>
      )}
    />
  )
}

const styles = StyleSheet.create({
  reviewBox: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing(4),
    marginTop: spacing(3),
  },
  reviewInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.sm,
    color: colors.text,
    padding: spacing(3),
    minHeight: 60,
    textAlignVertical: 'top',
  },
  submit: {
    alignItems: 'center',
    paddingVertical: spacing(2.5),
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surface,
    marginTop: spacing(2),
  },
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
