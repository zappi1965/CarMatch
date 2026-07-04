import React from 'react'
import { Text } from 'react-native'
import { Tabs } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { colors } from '../../src/lib/theme'

function Icon({ glyph, color }: { glyph: string; color: string }) {
  return <Text style={{ fontSize: 20, color }}>{glyph}</Text>
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
        options={{
          title: t('tabs.discover'),
          tabBarIcon: ({ color }) => <Icon glyph="◈" color={color} />,
        }}
      />
      <Tabs.Screen
        name="duel"
        options={{ title: 'Duell', tabBarIcon: ({ color }) => <Icon glyph="⚔" color={color} /> }}
      />
      <Tabs.Screen
        name="budget"
        options={{ title: 'Budget', tabBarIcon: ({ color }) => <Icon glyph="€" color={color} /> }}
      />
      <Tabs.Screen
        name="advisor"
        options={{ title: 'Assistent', tabBarIcon: ({ color }) => <Icon glyph="✦" color={color} /> }}
      />
      <Tabs.Screen
        name="models"
        options={{ title: 'Modelle', tabBarIcon: ({ color }) => <Icon glyph="ⓘ" color={color} /> }}
      />
      <Tabs.Screen
        name="shared"
        options={{
          title: 'Gemeinsam',
          tabBarIcon: ({ color }) => <Icon glyph="♡" color={color} />,
        }}
      />
      <Tabs.Screen
        name="sell"
        options={{
          title: 'Verkaufen',
          tabBarIcon: ({ color }) => <Icon glyph="↗" color={color} />,
        }}
      />
      <Tabs.Screen
        name="owned"
        options={{ title: 'Garage+', tabBarIcon: ({ color }) => <Icon glyph="▣" color={color} /> }}
      />
      <Tabs.Screen
        name="ev"
        options={{ title: 'E-Check', tabBarIcon: ({ color }) => <Icon glyph="⚡" color={color} /> }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: t('tabs.search'),
          tabBarIcon: ({ color }) => <Icon glyph="⌕" color={color} />,
        }}
      />
      <Tabs.Screen
        name="garage"
        options={{
          title: t('tabs.garage'),
          tabBarIcon: ({ color }) => <Icon glyph="♥" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tabs.settings'),
          tabBarIcon: ({ color }) => <Icon glyph="⚙" color={color} />,
        }}
      />
    </Tabs>
  )
}
