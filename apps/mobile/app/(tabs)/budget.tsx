import React, { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { api } from '../../src/lib/api'
import { colors, radius, spacing, typography } from '../../src/lib/theme'
import { CTAButton } from '../../src/components/ui'
export default function BudgetScreen() {
  const [budget, setBudget] = useState('450')
  const [saved, setSaved] = useState(false)
  useEffect(() => {
    api
      .get<{ monthlyBudgetEur: number }>('/budget')
      .then((d) => setBudget(String(d.monthlyBudgetEur)))
      .catch(() => {})
  }, [])
  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: spacing(4), gap: spacing(4) }}
    >
      <Text style={[typography.display, { color: colors.text }]}>Monatsbudget</Text>
      <Text style={[typography.body, { color: colors.textMuted }]}>
        CarMatch bewertet Autos nicht nur nach Kaufpreis, sondern nach realer monatlicher Belastung.
      </Text>
      <View style={styles.box}>
        <Text style={[typography.label, { color: colors.textMuted }]}>Budget pro Monat</Text>
        <TextInput
          keyboardType="numeric"
          value={budget}
          onChangeText={setBudget}
          style={styles.input}
        />
        <CTAButton
          label="Budget speichern"
          onPress={() =>
            api.patch('/budget', { monthlyBudgetEur: Number(budget) }).then(() => setSaved(true))
          }
        />
        {saved ? (
          <Text style={[typography.badge, { color: colors.like }]}>
            ✓ Budget gespeichert – Empfehlungen werden bevorzugt danach sortiert.
          </Text>
        ) : null}
      </View>
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
    fontSize: 28,
    fontWeight: '800',
  },
})
