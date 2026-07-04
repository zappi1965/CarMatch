import React, { useEffect, useState } from 'react'
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { api } from '../../src/lib/api'
import { colors, radius, spacing, typography } from '../../src/lib/theme'
import { formatPrice, type VehicleModelDto } from '../../src/lib/types'
export default function ModelsScreen() {
  const [models, setModels] = useState<VehicleModelDto[]>([])
  const router = useRouter()
  useEffect(() => {
    api
      .get<{ models: VehicleModelDto[] }>('/vehicle-models/discover?limit=500')
      .then((d) => setModels(d.models))
      .catch(() => {})
  }, [])
  return (
    <FlatList
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: spacing(4), gap: spacing(3) }}
      data={models}
      keyExtractor={(m) => m.id}
      ListHeaderComponent={
        <Text style={[typography.display, { color: colors.text, marginBottom: spacing(3) }]}>
          Modellwissen
        </Text>
      }
      renderItem={({ item }) => (
        <Pressable style={styles.card} onPress={() => router.push(`/model/${item.id}`)}>
          <Image source={{ uri: item.imageUrls[0] }} style={styles.img} />
          <View style={{ padding: spacing(3), flex: 1 }}>
            <Text style={[typography.title, { color: colors.text }]}>
              {item.make} {item.model}
            </Text>
            <Text style={[typography.body, { color: colors.textMuted }]} numberOfLines={2}>
              {item.description}
            </Text>
            <Text style={[typography.badge, { color: colors.gold, marginTop: spacing(1) }]}>
              {formatPrice(item.typicalUsedPriceMin ?? 0, 'EUR')}–
              {formatPrice(item.typicalUsedPriceMax ?? 0, 'EUR')}
            </Text>
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
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  img: { width: 110, height: 120, backgroundColor: colors.surface },
})
