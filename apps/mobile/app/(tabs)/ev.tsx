import React, { useState } from 'react'
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { api } from '../../src/lib/api'
import { colors, radius, spacing, typography } from '../../src/lib/theme'
import { CTAButton } from '../../src/components/ui'
export default function EvCheckScreen() {
  const [daily, setDaily] = useState('40')
  const [weekly, setWeekly] = useState('320')
  const [result, setResult] = useState<any>(null)
  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: spacing(4), gap: spacing(4) }}
    >
      <Text style={[typography.display, { color: colors.text }]}>E-Auto Check</Text>
      <Text style={[typography.body, { color: colors.textMuted }]}>
        Passt ein E-Auto zu deinem Alltag?
      </Text>
      <View style={styles.box}>
        <TextInput
          value={daily}
          onChangeText={setDaily}
          keyboardType="numeric"
          placeholder="Tägliche Pendelstrecke"
          placeholderTextColor={colors.textFaint}
          style={styles.input}
        />
        <TextInput
          value={weekly}
          onChangeText={setWeekly}
          keyboardType="numeric"
          placeholder="Wochenkilometer"
          placeholderTextColor={colors.textFaint}
          style={styles.input}
        />
        <CTAButton
          label="Alltag prüfen"
          onPress={() =>
            api
              .post('/ev-check', {
                dailyCommuteKm: Number(daily),
                weeklyKm: Number(weekly),
                longestRegularKm: 180,
                homeCharging: true,
                workCharging: false,
                housingType: 'owned_parking',
              })
              .then(setResult)
          }
        />
      </View>
      {result ? (
        <View style={styles.box}>
          <Text style={[typography.label, { color: colors.textMuted }]}>Ergebnis</Text>
          <Text style={[typography.display, { color: colors.gold }]}>
            {result.result.score}/100
          </Text>
          <Text style={[typography.body, { color: colors.text }]}>
            {result.result.recommendation}
          </Text>
          <Text style={[typography.badge, { color: colors.textMuted }]}>
            ca. {result.result.weeklyEnergyKwh} kWh/Woche · {result.result.weeklyChargingSessions}{' '}
            Ladevorgänge
          </Text>
        </View>
      ) : null}
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
