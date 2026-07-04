import React, { useState } from 'react'
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { api, ApiError } from '../src/lib/api'
import { useSession } from '../src/lib/store'
import { colors, radius, spacing, typography } from '../src/lib/theme'
import { CTAButton } from '../src/components/ui'

/**
 * Login/Registrierung. Gastmodus ist der Default (kein Zwang);
 * ein Gast-Konto wird beim Registrieren nahtlos übernommen (upgrade-guest).
 * Apple/Google: UI vorhanden, serverseitig vorbereitet — native OAuth-Flows
 * werden mit den Store-Builds (EAS) aktiviert.
 */
export default function AuthScreen() {
  const { t, i18n } = useTranslation()
  const router = useRouter()
  const { isGuest, setSession } = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (mode: 'login' | 'register') => {
    setBusy(true)
    try {
      const path =
        mode === 'login' ? '/auth/login' : isGuest ? '/auth/upgrade-guest' : '/auth/register'
      const res = await api.post<{ token: string; user: { id: string } }>(path, {
        email: email.trim().toLowerCase(),
        password,
        locale: i18n.language,
      })
      setSession(res.token, res.user.id, false)
      router.back()
    } catch (e) {
      const code = e instanceof ApiError ? e.code : 'ERROR'
      Alert.alert(t(`auth.errors.${code}`, t('common.error')))
    } finally {
      setBusy(false)
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, padding: spacing(5), gap: spacing(3) }}>
      <Text style={[typography.body, { color: colors.textMuted, marginBottom: spacing(2) }]}>
        {t('auth.subtitle')}
      </Text>

      <TextInput
        style={styles.input}
        placeholder={t('auth.email')}
        placeholderTextColor={colors.textFaint}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder={t('auth.password')}
        placeholderTextColor={colors.textFaint}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <CTAButton
        label={t('auth.login')}
        onPress={() => void submit('login')}
        disabled={busy || !email || password.length < 8}
      />
      <CTAButton
        label={t('auth.register')}
        variant="secondary"
        onPress={() => void submit('register')}
        disabled={busy || !email || password.length < 8}
      />

      <View style={styles.divider} />

      <CTAButton
        label={` ${t('auth.apple')}`}
        variant="secondary"
        onPress={() => Alert.alert(t('auth.oauthUnavailable', { provider: 'Apple' }))}
      />
      <CTAButton
        label={`G ${t('auth.google')}`}
        variant="secondary"
        onPress={() => Alert.alert(t('auth.oauthUnavailable', { provider: 'Google' }))}
      />

      <CTAButton label={t('auth.guest')} variant="ghost" onPress={() => router.back()} />
    </View>
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
    paddingVertical: spacing(3.5),
    fontSize: 15,
  },
  divider: { height: 1, backgroundColor: colors.cardBorder, marginVertical: spacing(2) },
})
