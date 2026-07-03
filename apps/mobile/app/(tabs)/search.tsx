import React, { useCallback, useEffect, useState } from 'react'
import { FlatList, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import type { SearchSort } from '@carmatch/shared'
import { api, buildQuery } from '../../src/lib/api'
import { useSession } from '../../src/lib/store'
import { colors, radius, spacing, typography } from '../../src/lib/theme'
import { formatKm, formatPrice, type ListingDto } from '../../src/lib/types'
import { Badge, CTAButton, EmptyState, LoadingState } from '../../src/components/ui'

const SORTS: SearchSort[] = ['RELEVANCE', 'PRICE_ASC', 'PRICE_DESC', 'DISTANCE', 'NEWEST', 'MILEAGE']

/** Klassische Suche mit Volltext (Marke/Modell), Filtern und Sortierung. */
export default function SearchScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const { location, filters } = useSession()
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SearchSort>('RELEVANCE')
  const [results, setResults] = useState<Array<ListingDto & { distanceKm?: number }> | null>(null)

  const search = useCallback(async () => {
    setResults(null)
    try {
      const q = buildQuery({
        q: query.trim() || undefined,
        lat: location.latitude,
        lon: location.longitude,
        postalCode: location.latitude == null ? location.postalCode : undefined,
        radiusKm: location.radiusKm ?? undefined,
        sort,
        ...filters,
      })
      const data = await api.get<Array<ListingDto & { distanceKm?: number }>>(`/vehicles/search${q}`)
      setResults(data)
    } catch {
      setResults([])
    }
  }, [query, sort, location, filters])

  useEffect(() => {
    const handle = setTimeout(() => void search(), 350) // Debounce
    return () => clearTimeout(handle)
  }, [search])

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ padding: spacing(4), gap: spacing(3) }}>
        <TextInput
          style={styles.input}
          placeholder={t('search.placeholder')}
          placeholderTextColor={colors.textFaint}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
        />
        <View style={{ flexDirection: 'row', gap: spacing(2), flexWrap: 'wrap' }}>
          {SORTS.map((s) => (
            <Pressable key={s} onPress={() => setSort(s)}>
              <View style={[styles.chip, sort === s && styles.chipActive]}>
                <Text style={[typography.badge, { color: sort === s ? colors.text : colors.textMuted }]}>
                  {t(`search.sortOptions.${s}`)}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
        <CTAButton label={t('filters.title')} variant="secondary" onPress={() => router.push('/filters')} />
      </View>

      {results === null ? (
        <LoadingState label={t('common.loading')} />
      ) : results.length === 0 ? (
        <EmptyState title={t('search.noResults')} hint={t('search.noResultsHint')} />
      ) : (
        <FlatList
          contentContainerStyle={{ padding: spacing(4), paddingTop: 0, gap: spacing(3) }}
          data={results}
          keyExtractor={(l) => l.id}
          ListHeaderComponent={
            <Text style={[typography.badge, { color: colors.textFaint, marginBottom: spacing(2) }]}>
              {t('search.results', { count: results.length })}
            </Text>
          }
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [styles.result, pressed && { opacity: 0.85 }]}
              onPress={() => router.push(`/vehicle/${item.id}`)}
            >
              <Image source={{ uri: item.images[0] }} style={styles.thumb} />
              <View style={{ flex: 1, padding: spacing(3) }}>
                <Text style={[typography.body, { color: colors.text, fontWeight: '700' }]} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={[typography.body, { color: colors.gold, fontWeight: '700' }]}>
                  {formatPrice(item.price, item.currency)}
                </Text>
                <Text style={[typography.badge, { color: colors.textFaint, marginTop: 2 }]}>
                  {item.year ?? '–'} · {formatKm(item.mileage)} · {item.powerHp ?? '–'} {t('common.hp')}
                  {item.distanceKm != null && Number.isFinite(item.distanceKm) ? ` · ${item.distanceKm} km` : ''}
                </Text>
                {item.imagesAreDemo ? (
                  <View style={{ flexDirection: 'row', marginTop: spacing(1.5) }}>
                    <Badge label={t('discover.demoBadge')} tone="warn" />
                  </View>
                ) : null}
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.md,
    color: colors.text,
    paddingHorizontal: spacing(4),
    paddingVertical: spacing(3),
    fontSize: 15,
  },
  chip: {
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(1.5),
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  chipActive: { borderColor: colors.textMuted, backgroundColor: colors.surface },
  result: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
  },
  thumb: { width: 110, height: 92, backgroundColor: colors.surface },
})
