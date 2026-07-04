import React, { useCallback, useState } from 'react'
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { api } from '../../src/lib/api'
import { colors, radius, spacing, typography } from '../../src/lib/theme'
import { formatKm, formatPrice, type ListingDto } from '../../src/lib/types'
import { Badge, CTAButton, EmptyState, LoadingState } from '../../src/components/ui'

interface FavoriteDto { id: string; listing: ListingDto }
interface GoalDto {
  id: string; title: string; targetPrice: number; currentBudget: number; monthlySaving: number
  trendPercent: number | null; monthsToGoal: number | null
}
interface OwnedDto {
  id: string; make: string; model: string; year: number | null; mileage: number | null
  purchasePrice: number | null; inspectionUntil: string | null; inspectionDue: boolean
  valuation: { estimate: number | null; confidence: number }
  trendPercent: number | null
}
interface CircleDto {
  id: string; name: string; inviteCode: string; memberCount: number
  matches: Array<ListingDto & { matchedBy: number }>
  partnerPicks: ListingDto[]
}

/**
 * Garage: Favoriten + Sparziele + "Mein Auto" (Besitzphase) + Gemeinsame Suche.
 * Begleitet den ganzen Zyklus: entdecken → sparen → besitzen → verkaufen.
 */
export default function GarageScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const [favorites, setFavorites] = useState<FavoriteDto[] | null>(null)
  const [goals, setGoals] = useState<GoalDto[]>([])
  const [owned, setOwned] = useState<OwnedDto[]>([])
  const [circle, setCircle] = useState<CircleDto | null>(null)
  const [circleName, setCircleName] = useState('')
  const [joinCode, setJoinCode] = useState('')

  useFocusEffect(
    useCallback(() => {
      api.get<FavoriteDto[]>('/favorites').then(setFavorites).catch(() => setFavorites([]))
      api.get<GoalDto[]>('/garage/savings-goals').then(setGoals).catch(() => {})
      api.get<OwnedDto[]>('/garage/owned').then(setOwned).catch(() => {})
      api.get<CircleDto | null>('/circles/me').then(setCircle).catch(() => {})
    }, []),
  )

  if (favorites === null) return <LoadingState label={t('common.loading')} />

  const empty = favorites.length === 0 && goals.length === 0 && owned.length === 0 && !circle

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: spacing(4), gap: spacing(3), paddingBottom: spacing(10) }}
    >
      {empty ? (
        <EmptyState title={t('garage.empty')} hint={t('garage.emptyHint')}>
          <CTAButton label={t('garage.startDiscovering')} onPress={() => router.navigate('/')} />
        </EmptyState>
      ) : null}

      {/* ── Favoriten ── */}
      {favorites.map((item) => (
        <Pressable
          key={item.id}
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
              {!item.listing.isAvailable ? <Badge label={t('push.favoriteGone')} tone="warn" /> : null}
              {item.listing.provider === 'demo' ? <Badge label={t('discover.demoBadge')} tone="warn" /> : null}
            </View>
          </View>
          <Pressable
            hitSlop={10}
            onPress={() => {
              void api.delete(`/favorites/${item.id}`).then(() =>
                setFavorites((prev) => prev?.filter((f) => f.id !== item.id) ?? null),
              )
            }}
            style={{ padding: spacing(3) }}
          >
            <Text style={{ color: colors.textFaint, fontSize: 18 }}>✕</Text>
          </Pressable>
        </Pressable>
      ))}

      {/* ── Sparziele ── */}
      <SectionHeader label={`🎯 ${t('goals.title')}`} />
      {goals.length === 0 ? (
        <Text style={[typography.badge, { color: colors.textFaint }]}>{t('goals.empty')}</Text>
      ) : (
        goals.map((g) => (
          <View key={g.id} style={styles.box}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={[typography.body, { color: colors.text, fontWeight: '700', flex: 1 }]} numberOfLines={1}>
                {g.title}
              </Text>
              <Pressable
                hitSlop={10}
                onPress={() =>
                  void api
                    .delete(`/garage/savings-goals/${g.id}`)
                    .then(() => setGoals((p) => p.filter((x) => x.id !== g.id)))
                }
              >
                <Text style={{ color: colors.textFaint }}>✕</Text>
              </Pressable>
            </View>
            <Text style={[typography.body, { color: colors.gold, fontWeight: '700', marginTop: 2 }]}>
              {t('goals.target')}: {formatPrice(g.targetPrice)}
            </Text>
            <Text style={[typography.badge, { color: colors.textMuted, marginTop: spacing(1) }]}>
              {g.monthsToGoal === 0
                ? t('goals.forecastNow')
                : g.monthsToGoal == null
                  ? t('goals.forecastNever')
                  : t('goals.forecast', { monthly: g.monthlySaving, months: g.monthsToGoal })}
            </Text>
            {g.trendPercent != null && g.trendPercent < -1.5 ? (
              <Text style={[typography.badge, { color: colors.like, marginTop: 2 }]}>
                ↓ {t('goals.trendDown', { percent: Math.abs(g.trendPercent) })}
              </Text>
            ) : null}
          </View>
        ))
      )}

      {/* ── Mein Auto (Besitzphase) ── */}
      <SectionHeader label={`🔑 ${t('owned.title')}`} />
      {owned.map((v) => (
        <View key={v.id} style={styles.box}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={[typography.body, { color: colors.text, fontWeight: '700' }]}>
              {v.make} {v.model} {v.year ? `(${v.year})` : ''}
            </Text>
            <Pressable
              hitSlop={10}
              onPress={() =>
                void api.delete(`/garage/owned/${v.id}`).then(() => setOwned((p) => p.filter((x) => x.id !== v.id)))
              }
            >
              <Text style={{ color: colors.textFaint }}>✕</Text>
            </Pressable>
          </View>
          {v.valuation.estimate != null ? (
            <>
              <Text style={[typography.badge, { color: colors.textMuted, marginTop: spacing(1) }]}>
                {t('owned.currentValue')}
              </Text>
              <Text style={[typography.title, { color: colors.gold }]}>{formatPrice(v.valuation.estimate)}</Text>
              {v.purchasePrice != null ? (
                <Text
                  style={[typography.badge, { color: v.valuation.estimate >= v.purchasePrice ? colors.like : colors.textMuted }]}
                >
                  {t('owned.delta')}: {v.valuation.estimate >= v.purchasePrice ? '+' : ''}
                  {formatPrice(v.valuation.estimate - v.purchasePrice)}
                </Text>
              ) : null}
            </>
          ) : (
            <Text style={[typography.badge, { color: colors.textFaint, marginTop: spacing(1) }]}>
              {t('owned.noEstimate')}
            </Text>
          )}
          {v.inspectionDue ? (
            <View style={{ flexDirection: 'row', marginTop: spacing(2) }}>
              <Badge label={`⚠︎ ${t('owned.inspectionDue')}`} tone="warn" />
            </View>
          ) : null}
        </View>
      ))}
      <CTAButton label={`+ ${t('owned.add')}`} variant="secondary" onPress={() => router.push('/owned-add')} />

      {/* ── Gemeinsame Suche ── */}
      <SectionHeader label={`♥ ${t('circle.title')}`} />
      {!circle ? (
        <View style={styles.box}>
          <Text style={[typography.badge, { color: colors.textMuted, marginBottom: spacing(3) }]}>
            {t('circle.hint')}
          </Text>
          <View style={{ flexDirection: 'row', gap: spacing(2) }}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder={t('circle.namePlaceholder')}
              placeholderTextColor={colors.textFaint}
              value={circleName}
              onChangeText={setCircleName}
            />
            <CTAButton
              label={t('circle.create')}
              variant="secondary"
              disabled={!circleName.trim()}
              onPress={() =>
                void api
                  .post('/circles', { name: circleName.trim() })
                  .then(() => api.get<CircleDto | null>('/circles/me').then(setCircle))
              }
            />
          </View>
          <View style={{ flexDirection: 'row', gap: spacing(2), marginTop: spacing(2) }}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder={t('circle.codePlaceholder')}
              placeholderTextColor={colors.textFaint}
              autoCapitalize="characters"
              value={joinCode}
              onChangeText={setJoinCode}
            />
            <CTAButton
              label={t('circle.join')}
              variant="secondary"
              disabled={joinCode.trim().length < 4}
              onPress={() =>
                void api
                  .post('/circles/join', { code: joinCode.trim() })
                  .then(() => api.get<CircleDto | null>('/circles/me').then(setCircle))
                  .catch(() => Alert.alert(t('common.error')))
              }
            />
          </View>
        </View>
      ) : (
        <View style={styles.box}>
          <Text style={[typography.body, { color: colors.text, fontWeight: '700' }]}>{circle.name}</Text>
          <Text style={[typography.badge, { color: colors.gold, marginTop: 2 }]}>
            {t('circle.inviteCode', { code: circle.inviteCode })} · {t('circle.members', { count: circle.memberCount })}
          </Text>

          <Text style={[typography.label, { color: colors.textMuted, marginTop: spacing(3), marginBottom: spacing(2) }]}>
            {t('circle.matches')}
          </Text>
          {circle.matches.length === 0 ? (
            <Text style={[typography.badge, { color: colors.textFaint }]}>{t('circle.noMatches')}</Text>
          ) : (
            circle.matches.map((m) => (
              <Pressable key={m.id} style={styles.matchRow} onPress={() => router.push(`/vehicle/${m.id}`)}>
                <Text style={{ color: colors.like }}>♥</Text>
                <Text style={[typography.body, { color: colors.text, flex: 1 }]} numberOfLines={1}>
                  {m.title}
                </Text>
                <Text style={[typography.badge, { color: colors.gold }]}>{formatPrice(m.price)}</Text>
              </Pressable>
            ))
          )}

          {circle.partnerPicks.length > 0 ? (
            <>
              <Text
                style={[typography.label, { color: colors.textMuted, marginTop: spacing(3), marginBottom: spacing(2) }]}
              >
                {t('circle.partnerPicks')}
              </Text>
              {circle.partnerPicks.slice(0, 5).map((m) => (
                <Pressable key={m.id} style={styles.matchRow} onPress={() => router.push(`/vehicle/${m.id}`)}>
                  <Text style={{ color: colors.textFaint }}>♡</Text>
                  <Text style={[typography.body, { color: colors.textMuted, flex: 1 }]} numberOfLines={1}>
                    {m.title}
                  </Text>
                </Pressable>
              ))}
            </>
          ) : null}

          <CTAButton
            label={t('circle.leave')}
            variant="ghost"
            onPress={() => void api.delete('/circles/me').then(() => setCircle(null))}
          />
        </View>
      )}
    </ScrollView>
  )
}

function SectionHeader({ label }: { label: string }) {
  return <Text style={[typography.label, { color: colors.textMuted, marginTop: spacing(3) }]}>{label}</Text>
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
  box: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing(4),
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.sm,
    color: colors.text,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(2.5),
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2.5),
    paddingVertical: spacing(2),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.cardBorder,
  },
})
