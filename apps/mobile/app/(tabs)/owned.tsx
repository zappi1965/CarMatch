import React, { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { api } from '../../src/lib/api'
import { colors, radius, spacing, typography } from '../../src/lib/theme'
import { CTAButton } from '../../src/components/ui'
export default function OwnedGarageScreen() {
  const [cars, setCars] = useState<any[]>([])
  const [make, setMake] = useState('BMW')
  const [model, setModel] = useState('330d Coupé')
  const load = () =>
    api
      .get<any[]>('/owned-garage')
      .then(setCars)
      .catch(() => setCars([]))
  useEffect(load, [])
  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: spacing(4), gap: spacing(4) }}
    >
      <Text style={[typography.display, { color: colors.text }]}>Persönliche Garage</Text>
      <Text style={[typography.body, { color: colors.textMuted }]}>
        Speichere dein gekauftes Auto, Erinnerungen und später den Verkaufswert.
      </Text>
      <View style={styles.box}>
        <TextInput value={make} onChangeText={setMake} style={styles.input} />
        <TextInput value={model} onChangeText={setModel} style={styles.input} />
        <CTAButton
          label="Auto hinzufügen"
          onPress={() =>
            api
              .post('/owned-garage', {
                make,
                model,
                year: 2011,
                purchasePrice: 18500,
                currentMileage: 148000,
                tuvDate: '2027-04-01',
              })
              .then(load)
          }
        />
      </View>
      {cars.map((c) => (
        <View key={c.id} style={styles.box}>
          <Text style={[typography.title, { color: colors.text }]}>
            {c.make} {c.model}
          </Text>
          <Text style={[typography.price, { color: colors.gold }]}>
            Marktwert ca. {c.currentMarketValue?.toLocaleString('de-DE') ?? '–'} €
          </Text>
          <Text style={[typography.badge, { color: colors.textMuted }]}>{c.nextReminder}</Text>
        </View>
      ))}
    </ScrollView>
  )
}
const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing(4),
    gap: spacing(3),
  },
  input: {
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.sm,
    padding: spacing(3),
  },
})
