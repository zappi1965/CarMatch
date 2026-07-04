import React, { useCallback, useEffect, useState } from 'react'
import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { api } from '../src/lib/api'
import { colors, radius, spacing, typography } from '../src/lib/theme'
import { formatPrice, type VehicleModelDto } from '../src/lib/types'
import { Badge, LoadingState } from '../src/components/ui'

/**
 * Duell-Modus: zwei Fahrzeugmodelle, ein Tipp. Paarvergleiche trainieren
 * das Geschmacksprofil schneller als Einzel-Swipes (Sieger +6, Verlierer −2).
 */
export default function DuelScreen() {
  const { t } = useTranslation()
  const [pair, setPair] = useState<{ a: VehicleModelDto; b: VehicleModelDto } | null>(null)
  const [busy, setBusy] = useState(false)
  const [count, setCount] = useState(0)

  const load = useCallback(() => {
    setPair(null)
    void api.get<{ a: VehicleModelDto; b: VehicleModelDto }>('/duels/next').then(setPair).catch(() => {})
  }, [])

  useEffect(load, [load])

  const decide = async (winner: VehicleModelDto, loser: VehicleModelDto) => {
    if (busy) return
    setBusy(true)
    try {
      await api.post('/duels', { winnerModelId: winner.id, loserModelId: loser.id })
      setCount((c) => c + 1)
      load()
    } finally {
      setBusy(false)
    }
  }

  if (!pair) return <LoadingState label={t('common.loading')} />

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, padding: spacing(4), gap: spacing(3) }}>
      <Text style={[typography.body, { color: colors.textMuted, textAlign: 'center' }]}>
        {t('duel.subtitle')}
      </Text>
      <DuelCard model={pair.a} onPress={() => void decide(pair.a, pair.b)} />
      <Text style={[typography.title, { color: colors.textFaint, textAlign: 'center' }]}>VS</Text>
      <DuelCard model={pair.b} onPress={() => void decide(pair.b, pair.a)} />
      {count > 0 ? (
        <Text style={[typography.badge, { color: colors.gold, textAlign: 'center' }]}>
          ✦ {t('duel.decided')} ({count})
        </Text>
      ) : null}
    </View>
  )
}

function DuelCard({ model, onPress }: { model: VehicleModelDto; onPress: () => void }) {
  const { t } = useTranslation()
  const price =
    model.typicalUsedPriceMin != null && model.typicalUsedPriceMax != null
      ? `${formatPrice(model.typicalUsedPriceMin)} – ${formatPrice(model.typicalUsedPriceMax)}`
      : null
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { borderColor: colors.info }]}>
      <Image source={{ uri: model.imageUrls[0] }} style={styles.image} resizeMode="cover" />
      {model.imageAttribution ? <Text style={styles.attribution}>{model.imageAttribution}</Text> : null}
      <View style={{ padding: spacing(3) }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing(2) }}>
          <Text style={[typography.body, { color: colors.text, fontWeight: '700', flex: 1 }]} numberOfLines={1}>
            {model.make} {model.model} {model.variant ?? ''}
          </Text>
          {model.source === 'DEMO' ? <Badge label={t('discover.demoBadge')} tone="warn" /> : null}
        </View>
        <Text style={[typography.badge, { color: colors.textMuted, marginTop: 2 }]}>
          {model.segment ?? ''}
          {model.maxPowerHp != null ? ` · bis ${model.maxPowerHp} ${t('common.hp')}` : ''}
          {price ? ` · ${price}` : ''}
        </Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
  },
  image: { flex: 1, backgroundColor: colors.surface },
  attribution: { position: 'absolute', top: 4, right: 8, color: 'rgba(244,242,238,0.55)', fontSize: 9 },
})
