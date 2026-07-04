import React, { useState } from 'react'
import { Alert, ScrollView, StyleSheet, TextInput, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { api } from '../src/lib/api'
import { colors, radius, spacing } from '../src/lib/theme'
import { CTAButton } from '../src/components/ui'

/** "Mein Auto" hinzufügen — startet die Besitzphase (Wertverlauf, TÜV). */
export default function OwnedAddScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const [form, setForm] = useState({ make: '', model: '', year: '', mileage: '', powerHp: '', purchasePrice: '', inspectionUntil: '' })
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    setBusy(true)
    try {
      await api.post('/garage/owned', {
        make: form.make.trim(),
        model: form.model.trim(),
        year: form.year ? Number(form.year) : undefined,
        mileage: form.mileage ? Number(form.mileage) : undefined,
        powerHp: form.powerHp ? Number(form.powerHp) : undefined,
        purchasePrice: form.purchasePrice ? Number(form.purchasePrice) : undefined,
        inspectionUntil: /^\d{4}-\d{2}$/.test(form.inspectionUntil) ? form.inspectionUntil : undefined,
      })
      router.back()
    } catch {
      Alert.alert(t('common.error'))
    } finally {
      setBusy(false)
    }
  }

  const field = (key: keyof typeof form, placeholder: string, numeric = false) => (
    <TextInput
      style={styles.input}
      placeholder={placeholder}
      placeholderTextColor={colors.textFaint}
      keyboardType={numeric ? 'numeric' : 'default'}
      value={form[key]}
      onChangeText={(v) => setForm({ ...form, [key]: numeric ? v.replace(/\D/g, '') : v })}
    />
  )

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: spacing(5), gap: spacing(3) }}>
      {field('make', t('owned.form.make'))}
      {field('model', t('owned.form.model'))}
      <View style={{ flexDirection: 'row', gap: spacing(3) }}>
        <View style={{ flex: 1 }}>{field('year', t('owned.form.year'), true)}</View>
        <View style={{ flex: 1 }}>{field('mileage', t('owned.form.mileage'), true)}</View>
      </View>
      <View style={{ flexDirection: 'row', gap: spacing(3) }}>
        <View style={{ flex: 1 }}>{field('powerHp', t('owned.form.power'), true)}</View>
        <View style={{ flex: 1 }}>{field('purchasePrice', t('owned.form.price'), true)}</View>
      </View>
      {field('inspectionUntil', t('owned.form.inspection'))}
      <CTAButton
        label={t('actions.save')}
        onPress={() => void submit()}
        disabled={busy || !form.make.trim() || !form.model.trim()}
      />
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
})
