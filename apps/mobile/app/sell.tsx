import React, { useState } from 'react'
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { api } from '../src/lib/api'
import { colors, radius, spacing, typography } from '../src/lib/theme'
import { formatPrice } from '../src/lib/types'
import { CTAButton } from '../src/components/ui'

interface Valuation {
  estimate: number | null
  low: number | null
  high: number | null
  comparablesCount: number
  confidence: number
}

/** C2B: "Was ist mein Auto wert?" — Schätzung + Ankauf-Anfrage. */
export default function SellScreen() {
  const { t } = useTranslation()
  const [form, setForm] = useState({ make: '', model: '', year: '', mileage: '' })
  const [valuation, setValuation] = useState<Valuation | null>(null)
  const [requested, setRequested] = useState(false)
  const [busy, setBusy] = useState(false)

  const payload = () => ({
    make: form.make.trim(),
    model: form.model.trim(),
    year: form.year ? Number(form.year) : undefined,
    mileage: form.mileage ? Number(form.mileage) : undefined,
  })

  const estimate = async () => {
    setBusy(true)
    try {
      setValuation(await api.post<Valuation>('/sell/valuation', payload()))
    } catch {
      Alert.alert(t('common.error'))
    } finally {
      setBusy(false)
    }
  }

  const request = async () => {
    setBusy(true)
    try {
      await api.post('/sell/request', payload())
      setRequested(true)
    } catch {
      Alert.alert(t('common.error'))
    } finally {
      setBusy(false)
    }
  }

  const canSubmit = form.make.trim().length > 0 && form.model.trim().length > 0

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: spacing(5), gap: spacing(3) }}>
      <Text style={[typography.body, { color: colors.textMuted }]}>{t('sell.subtitle')}</Text>

      <TextInput style={styles.input} placeholder={t('owned.form.make')} placeholderTextColor={colors.textFaint}
        value={form.make} onChangeText={(v) => setForm({ ...form, make: v })} />
      <TextInput style={styles.input} placeholder={t('owned.form.model')} placeholderTextColor={colors.textFaint}
        value={form.model} onChangeText={(v) => setForm({ ...form, model: v })} />
      <View style={{ flexDirection: 'row', gap: spacing(3) }}>
        <TextInput style={[styles.input, { flex: 1 }]} placeholder={t('owned.form.year')} placeholderTextColor={colors.textFaint}
          keyboardType="numeric" value={form.year} onChangeText={(v) => setForm({ ...form, year: v.replace(/\D/g, '') })} />
        <TextInput style={[styles.input, { flex: 1 }]} placeholder={t('owned.form.mileage')} placeholderTextColor={colors.textFaint}
          keyboardType="numeric" value={form.mileage} onChangeText={(v) => setForm({ ...form, mileage: v.replace(/\D/g, '') })} />
      </View>

      <CTAButton label={t('sell.estimate')} onPress={() => void estimate()} disabled={!canSubmit || busy} />

      {valuation ? (
        valuation.estimate != null ? (
          <View style={styles.result}>
            <Text style={[typography.label, { color: colors.textMuted }]}>{t('sell.estimateResult')}</Text>
            <Text style={[typography.display, { color: colors.gold, marginVertical: spacing(1) }]}>
              {formatPrice(valuation.estimate)}
            </Text>
            <Text style={[typography.badge, { color: colors.textMuted }]}>
              {t('sell.range', { low: formatPrice(valuation.low!), high: formatPrice(valuation.high!) })}
            </Text>
            <Text style={[typography.badge, { color: colors.textFaint, marginTop: 2 }]}>
              {t('sell.basis', { count: valuation.comparablesCount, confidence: Math.round(valuation.confidence * 100) })}
            </Text>
            <Text style={[typography.badge, { color: colors.warn, marginTop: spacing(2) }]}>
              {t('sell.demoNote')}
            </Text>
            {!requested ? (
              <CTAButton label={t('sell.requestOffers')} onPress={() => void request()} style={{ marginTop: spacing(3) }} />
            ) : (
              <Text style={[typography.body, { color: colors.like, marginTop: spacing(3) }]}>✓ {t('sell.requested')}</Text>
            )}
          </View>
        ) : (
          <View style={styles.result}>
            <Text style={[typography.body, { color: colors.textMuted }]}>{t('sell.noEstimate')}</Text>
          </View>
        )
      ) : null}
    </ScrollView>
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
  },
  result: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.gold,
    padding: spacing(5),
  },
})
