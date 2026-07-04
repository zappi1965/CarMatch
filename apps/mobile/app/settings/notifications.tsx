import React, { useEffect, useState } from 'react'
import { Platform, ScrollView, StyleSheet, Switch, Text, View } from 'react-native'
import * as Notifications from 'expo-notifications'
import { useTranslation } from 'react-i18next'
import { api } from '../../src/lib/api'
import { colors, radius, spacing, typography } from '../../src/lib/theme'

const CATEGORIES = [
  'newMatch',
  'priceDrop',
  'favoriteGone',
  'savedSearch',
  'dealerReply',
  'superMatch',
] as const

/**
 * Push-Einstellungen: Kategorien einzeln schaltbar (Consent-Pflicht).
 * Beim ersten Aktivieren wird die System-Berechtigung angefragt und der
 * Expo-Push-Token registriert.
 */
export default function NotificationSettingsScreen() {
  const { t } = useTranslation()
  const [categories, setCategories] = useState<Record<string, boolean>>({})

  useEffect(() => {
    api
      .get<{ pushCategories: Record<string, boolean> | null }>('/settings')
      .then((s) => setCategories(s.pushCategories ?? {}))
      .catch(() => {})
  }, [])

  const toggle = async (key: string, value: boolean) => {
    const next = { ...categories, [key]: value }
    setCategories(next)

    let token: string | undefined
    if (value && Platform.OS !== 'web') {
      const perm = await Notifications.requestPermissionsAsync()
      if (perm.granted) {
        token = (await Notifications.getExpoPushTokenAsync()).data
      }
    }
    void api
      .patch('/settings/push', {
        pushCategories: next,
        ...(token ? { token, platform: Platform.OS as 'ios' | 'android' } : {}),
      })
      .catch(() => {})
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: spacing(4) }}
    >
      <Text style={[typography.body, { color: colors.textMuted, marginBottom: spacing(4) }]}>
        {t('push.hint')}
      </Text>
      <View style={styles.box}>
        {CATEGORIES.map((key) => (
          <View key={key} style={styles.row}>
            <Text
              style={[typography.body, { color: colors.text, flex: 1, paddingRight: spacing(3) }]}
            >
              {t(`push.${key}`)}
            </Text>
            <Switch
              value={categories[key] ?? false}
              onValueChange={(v) => void toggle(key, v)}
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
