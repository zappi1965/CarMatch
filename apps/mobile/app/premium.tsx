import React from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { colors, radius, spacing, typography } from '../src/lib/theme'

const FEATURES = ['superlikes', 'alerts', 'searches', 'market', 'compare'] as const

/**
 * Premium — bewusst nur Vorschau (v0.6 laut Roadmap). Ehrlich kommuniziert:
 * kein toter Kauf-Button, die Kern-App bleibt ohne Premium voll nutzbar.
 */
export default function PremiumScreen() {
  const { t } = useTranslation()
  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: spacing(5), gap: spacing(4) }}>
      <Text style={[typography.body, { color: colors.textMuted }]}>{t('premium.subtitle')}</Text>
      <View style={styles.box}>
        {FEATURES.map((f) => (
          <View key={f} style={styles.row}>
            <Text style={{ color: colors.gold, marginRight: spacing(3) }}>◆</Text>
            <Text style={[typography.body, { color: colors.text }]}>{t(`premium.features.${f}`)}</Text>
          </View>
        ))}
      </View>
      <View style={styles.notice}>
        <Text style={[typography.body, { color: colors.textMuted }]}>{t('premium.notAvailable')}</Text>
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
    padding: spacing(2),
  },
  row: { flexDirection: 'row', alignItems: 'center', padding: spacing(3) },
  notice: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.gold,
    padding: spacing(4),
    backgroundColor: 'rgba(201,161,90,0.08)',
  },
})
