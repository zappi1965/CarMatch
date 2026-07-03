import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { getLocales } from 'expo-localization'
import de from '../locales/de.json'
import en from '../locales/en.json'

/**
 * i18n: erkennt die Gerätesprache automatisch. MVP: Deutsch + Englisch;
 * weitere EU-Sprachen werden als zusätzliche JSON-Dateien ergänzt.
 */
const deviceLang = getLocales()[0]?.languageCode ?? 'de'

void i18n.use(initReactI18next).init({
  resources: { de: { translation: de }, en: { translation: en } },
  lng: ['de', 'en'].includes(deviceLang) ? deviceLang : 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export default i18n
