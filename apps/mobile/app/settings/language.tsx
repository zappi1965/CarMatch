import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { getLocales } from 'expo-localization'
import { useTranslation } from 'react-i18next'
import { api } from '../../src/lib/api'
import { colors, radius, spacing, typography } from '../../src/lib/theme'

const LANGS = [
  { code: 'auto', label: '' }, // Gerätesprache
  { code: 'de', label: 'Deutsch' },
  { code: 'en', label: 'English' },
]

/** Sprache: automatisch (Gerät) oder manuell. Weitere EU-Sprachen folgen. */
export default function LanguageScreen() {
  const { t, i18n } = useTranslation()

  const select = (code: string) => {
    const target = code === 'auto' ? (getLocales()[0]?.languageCode ?? 'en') : code
    void i18n.changeLanguage(['de', 'en'].includes(target) ? target : 'en')
    void api.patch('/settings/language', { locale: target }).catch(() => {})
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, padding: spacing(4) }}>
      <View style={styles.box}>
        {LANGS.map(({ code, label }) => (
          <Pressable
            key={code}
            onPress={() => select(code)}
            style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
          >
            <Text style={[typography.body, { color: colors.text }]}>
              {code === 'auto' ? t('settings.languageAuto') : label}
            </Text>
            {code !== 'auto' && i18n.language === code ? (
              <Text style={{ color: colors.like }}>✓</Text>
            ) : null}
          </Pressable>
        ))}
      </View>
    </View>
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
