import 'react-native-gesture-handler'
import React, { useEffect, useState } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useTranslation } from 'react-i18next'
import '../src/lib/i18n'
import { colors } from '../src/lib/theme'
import { useSession } from '../src/lib/store'
import { ensureSession } from '../src/lib/api'
import { LoadingState } from '../src/components/ui'

export default function RootLayout() {
  const { t, i18n } = useTranslation()
  const hydrated = useSession((s) => s.hydrated)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    void useSession.getState().hydrate()
  }, [])

  useEffect(() => {
    if (!hydrated) return
    // Gastmodus als Default: sofort loslegen, Konto optional (kein Zwangs-Onboarding)
    ensureSession(i18n.language)
      .catch(() => {}) // offline: Screens zeigen eigene Fehlerzustände
      .finally(() => setReady(true))
  }, [hydrated, i18n.language])

  if (!ready) {
    return (
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
        <LoadingState label={t('common.loading')} />
      </GestureHandlerRootView>
    )
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="vehicle/[id]" options={{ title: '' }} />
        <Stack.Screen name="model/[id]" options={{ title: t('taste.findSimilarListings') }} />
        <Stack.Screen name="taste" options={{ presentation: 'modal', title: t('taste.title') }} />
        <Stack.Screen name="duel" options={{ presentation: 'modal', title: t('duel.title') }} />
        <Stack.Screen name="sell" options={{ presentation: 'modal', title: t('sell.title') }} />
        <Stack.Screen name="owned-add" options={{ presentation: 'modal', title: t('owned.add') }} />
        <Stack.Screen name="filters" options={{ presentation: 'modal', title: t('filters.title') }} />
        <Stack.Screen name="location" options={{ presentation: 'modal', title: t('location.title') }} />
        <Stack.Screen name="auth" options={{ presentation: 'modal', title: t('auth.title') }} />
        <Stack.Screen name="premium" options={{ presentation: 'modal', title: t('premium.title') }} />
        <Stack.Screen name="settings/scores" options={{ title: t('settings.scores') }} />
        <Stack.Screen name="settings/notifications" options={{ title: t('push.title') }} />
        <Stack.Screen name="settings/language" options={{ title: t('settings.language') }} />
      </Stack>
    </GestureHandlerRootView>
  )
}
