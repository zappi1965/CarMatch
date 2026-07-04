import React, { useState } from 'react'
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { api } from '../../src/lib/api'
import { colors, radius, spacing, typography } from '../../src/lib/theme'
import { CTAButton } from '../../src/components/ui'
export default function SellScreen() {
  const [form, setForm] = useState({
    make: 'BMW',
    model: '330d',
    year: '2011',
    mileage: '148000',
    condition: 'good',
  })
  const [result, setResult] = useState<any>(null)
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))
  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: spacing(4), gap: spacing(4) }}
    >
      <Text style={[typography.display, { color: colors.text }]}>Was ist mein Auto wert?</Text>
      <Text style={[typography.body, { color: colors.textMuted }]}>
        Demo-Wertschätzung auf Basis von Modell, Alter, Laufleistung und Zustand.
      </Text>
      <View style={styles.box}>
        {Object.entries(form).map(([k, v]) => (
          <TextInput
            key={k}
            value={v}
            onChangeText={(x) => set(k, x)}
            placeholder={k}
            placeholderTextColor={colors.textFaint}
            style={styles.input}
          />
        ))}
        <CTAButton
          label="Marktwert schätzen"
          onPress={() =>
            api
              .post('/seller/estimate', {
                ...form,
                year: Number(form.year),
                mileage: Number(form.mileage),
              })
              .then(setResult)
          }
        />
      </View>
      {result ? (
        <View style={styles.box}>
          <Text style={[typography.label, { color: colors.textMuted }]}>Geschätzter Marktwert</Text>
          <Text style={[typography.display, { color: colors.gold }]}>
            {result.estimatedValueMin.toLocaleString('de-DE')}–
            {result.estimatedValueMax.toLocaleString('de-DE')} €
          </Text>
          <Text style={[typography.body, { color: colors.textMuted }]}>{result.cta}</Text>
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
