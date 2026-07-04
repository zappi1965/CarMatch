import React, { useCallback, useEffect, useState } from 'react'
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { api } from '../../src/lib/api'
import { colors, radius, spacing, typography } from '../../src/lib/theme'
import { formatKm, formatPrice, type ListingDto } from '../../src/lib/types'
import { CTAButton, LoadingState } from '../../src/components/ui'

type DuelCar = ListingDto & { monthlyCost?: { total: number; budgetFit: string } }

export default function DuelScreen() {
  const [left, setLeft] = useState<DuelCar | null>(null)
  const [right, setRight] = useState<DuelCar | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    api
      .get<{ left: DuelCar; right: DuelCar }>('/duels/next')
      .then((d) => {
        setLeft(d.left)
        setRight(d.right)
      })
      .finally(() => setLoading(false))
  }, [])
  useEffect(load, [load])
  const vote = (winner: DuelCar, loser: DuelCar) =>
    api
      .post('/duels/vote', { winnerListingId: winner.id, loserListingId: loser.id })
      .then(load)
      .catch(load)
  if (loading || !left || !right) return <LoadingState label="Duell wird geladen" />
  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: spacing(4), gap: spacing(4) }}
    >
      <Text style={[typography.display, { color: colors.text }]}>Duell-Modus</Text>
      <Text style={[typography.body, { color: colors.textMuted }]}>
        Wähle spontan das bessere Auto. Ein Duell zählt stärker als ein normaler Swipe.
      </Text>
      <View style={styles.row}>
        <DuelCard car={left} onPress={() => vote(left, right)} />
        <DuelCard car={right} onPress={() => vote(right, left)} />
      </View>
      <CTAButton
        label="Beide uninteressant"
        variant="secondary"
        onPress={() =>
          api.post('/duels/skip', { leftListingId: left.id, rightListingId: right.id }).then(load)
        }
      />
    </ScrollView>
  )
}
function DuelCard({ car, onPress }: { car: DuelCar; onPress: () => void }) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Image source={{ uri: car.images[0] }} style={styles.image} />
      <View style={{ padding: spacing(3), gap: spacing(1.5) }}>
        <Text style={[typography.title, { color: colors.text, fontSize: 17 }]}>
          {car.make} {car.model}
        </Text>
        <Text style={[typography.price, { color: colors.gold, fontSize: 22 }]}>
          {car.monthlyCost
            ? `ca. ${car.monthlyCost.total} €/Monat`
            : formatPrice(car.price, car.currency)}
        </Text>
        <Text style={[typography.badge, { color: colors.textMuted }]}>
          {formatPrice(car.price, car.currency)} · {car.powerHp ?? '–'} PS
        </Text>
        <Text style={[typography.badge, { color: colors.textMuted }]}>
          {car.year ?? '–'} · {formatKm(car.mileage)}
        </Text>
        <Text style={[typography.badge, { color: colors.textMuted }]}>
          {car.consumptionL100 ?? '–'} l/100 km · {car.bodyType ?? ''}
        </Text>
        <Text style={[typography.label, { color: colors.like, marginTop: spacing(2) }]}>
          Dieses Auto gewinnt ›
        </Text>
      </View>
    </Pressable>
  )
}
const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing(3) },
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
  },
  image: { width: '100%', height: 170, backgroundColor: colors.surface },
})
