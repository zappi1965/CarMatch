import React from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { api } from '../../src/lib/api'
import { useSession } from '../../src/lib/store'
import { colors, radius, spacing, typography } from '../../src/lib/theme'

/** Profil & Einstellungen: Sprache, Standort, Scores, Push, Datenschutz, Konto. */
export default function SettingsScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const { isGuest, clearSession } = useSession()
  const [personalization, setPersonalization] = React.useState(true)

  React.useEffect(() => {
    api
      .get<{ personalizationEnabled: boolean }>('/settings')
      .then((s) => setPersonalization(s.personalizationEnabled))
      .catch(() => {})
  }, [])

  const togglePersonalization = (value: boolean) => {
    setPersonalization(value)
    void api.patch('/settings', { personalizationEnabled: value }).catch(() => {})
  }

  const resetRecommendations = () => {
    void api.post('/recommendations/reset').then(() => Alert.alert(t('settings.resetDone')))
  }

  const deleteAccount = () => {
    Alert.alert(t('settings.deleteAccount'), t('settings.deleteConfirm'), [
      { text: t('actions.cancel'), style: 'cancel' },
      {
        text: t('settings.deleteAccount'),
        style: 'destructive',
        onPress: () => void api.delete('/auth/me').then(() => clearSession()),
      },
    ])
  }

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: spacing(4), gap: spacing(3) }}>
      {isGuest ? (
        <Pressable style={styles.guestBanner} onPress={() => router.push('/auth')}>
          <Text style={[typography.body, { color: colors.text, fontWeight: '600' }]}>{t('auth.guestActive')}</Text>
          <Text style={[typography.badge, { color: colors.textMuted, marginTop: 2 }]}>{t('auth.upgradeHint')}</Text>
        </Pressable>
      ) : null}

      <Section>
        <Item label={t('settings.location')} onPress={() => router.push('/location')} />
        <Item label={t('settings.language')} onPress={() => router.push('/settings/language')} />
        <Item label={t('settings.scores')} onPress={() => router.push('/settings/scores')} />
        <Item label={t('settings.notifications')} onPress={() => router.push('/settings/notifications')} />
      </Section>

      <Section>
        <View style={styles.item}>
          <View style={{ flex: 1, paddingRight: spacing(3) }}>
            <Text style={[typography.body, { color: colors.text }]}>{t('settings.personalization')}</Text>
            <Text style={[typography.badge, { color: colors.textFaint, marginTop: 2 }]}>
              {t('settings.personalizationHint')}
            </Text>
          </View>
          <Switch
            value={personalization}
            onValueChange={togglePersonalization}
            trackColor={{ true: colors.like, false: colors.cardBorder }}
          />
        </View>
        <Item label={t('settings.resetRecommendations')} onPress={resetRecommendations} />
      </Section>

      <Section>
        <Item label={t('settings.premium')} onPress={() => router.push('/premium')} badge={t('actions.comingSoon')} />
      </Section>

      <Section>
        {!isGuest ? <Item label={t('auth.logout')} onPress={() => clearSession()} /> : null}
        <Item label={t('settings.deleteAccount')} onPress={deleteAccount} destructive />
      </Section>
    </ScrollView>
  )
}

function Section({ children }: { children: React.ReactNode }) {
  return <View style={styles.section}>{children}</View>
}

function Item({
  label, onPress, badge, destructive,
}: {
  label: string
  onPress: () => void
  badge?: string
  destructive?: boolean
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.item, pressed && { opacity: 0.7 }]}>
      <Text style={[typography.body, { color: destructive ? colors.dislike : colors.text }]}>{label}</Text>
      <Text style={[typography.badge, { color: colors.textFaint }]}>{badge ?? '›'}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing(4),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.cardBorder,
  },
  guestBanner: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.gold,
    padding: spacing(4),
  },
})
