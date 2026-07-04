import React from 'react'
import { Text } from 'react-native'
import { Tabs } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { colors } from '../../src/lib/theme'

function Icon({ glyph, color }: { glyph: string; color: string }) {
  return <Text style={{ fontSize: 22, color }}>{glyph}</Text>
}

export default function TabsLayout() {
  const { t } = useTranslation()
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.cardBorder },
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textFaint,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: t('tabs.discover'), tabBarIcon: ({ color }) => <Icon glyph="◈" color={color} /> }}
      />
      <Tabs.Screen
        name="search"
        options={{ title: t('tabs.search'), tabBarIcon: ({ color }) => <Icon glyph="⌕" color={color} /> }}
      />
      <Tabs.Screen
        name="garage"
        options={{ title: t('tabs.garage'), tabBarIcon: ({ color }) => <Icon glyph="♥" color={color} /> }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: t('tabs.settings'), tabBarIcon: ({ color }) => <Icon glyph="⚙" color={color} /> }}
      />
    </Tabs>
  )
}
