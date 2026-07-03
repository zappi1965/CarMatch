import React, { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import type { VehicleScoreKey } from '@carmatch/shared'
import { api } from '../../src/lib/api'
import { colors, radius, spacing, typography } from '../../src/lib/theme'

const ALL_SCORES: VehicleScoreKey[] = [
  'performance', 'everyday', 'priceValue', 'runningCosts', 'rarity',
  'comfort', 'fun', 'efficiency', 'family', 'longDistance',
]

/** Score-Einstellungen: Nutzer wählt, welche Quartett-Werte angezeigt werden. */
export default function ScoreSettingsScreen() {
  const { t } = useTranslation()
  const [enabled, setEnabled] = useState<Record<string, boolean>>(
    Object.fromEntries(ALL_SCORES.map((k) => [k, true])),
  )

  useEffect(() => {
    api
      .get<{ scoresEnabled: Record<string, boolean> | null }>('/settings')
      .then((s) => {
        if (s.scoresEnabled) setEnabled((prev) => ({ ...prev, ...s.scoresEnabled }))
      })
      .catch(() => {})
  }, [])

  const toggle = (key: string, value: boolean) => {
    const next = { ...enabled, [key]: value }
    setEnabled(next)
    void api.patch('/settings/scores', { scoresEnabled: next }).catch(() => {})
  }

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: spacing(4) }}>
      <Text style={[typography.body, { color: colors.textMuted, marginBottom: spacing(4) }]}>
        {t('settings.scoresHint')}
      </Text>
      <View style={styles.box}>
        {ALL_SCORES.map((key) => (
          <View key={key} style={styles.row}>
            <Text style={[typography.body, { color: colors.text }]}>{t(`scores.${key}`)}</Text>
            <Switch
              value={enabled[key] ?? true}
              onValueChange={(v) => toggle(key, v)}
              trackColor={{ true: colors.like, false: colors.cardBorder }}
            />
          </View>
        ))}
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
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing(4),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.cardBorder,
  },
})
