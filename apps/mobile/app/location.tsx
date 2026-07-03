import React, { useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import * as Location from 'expo-location'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { api } from '../src/lib/api'
import { useSession } from '../src/lib/store'
import { colors, radius, spacing, typography } from '../src/lib/theme'
import { CTAButton } from '../src/components/ui'

const RADII: Array<number | null> = [10, 25, 50, 100, 250, null]

/** Standortauswahl: GPS (nur mit Zustimmung) oder PLZ/Ort, plus Umkreis. */
export default function LocationScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const { location, setLocation } = useSession()
  const [manual, setManual] = useState(location.postalCode ?? location.city ?? '')
  const [radiusKm, setRadiusKm] = useState<number | null>(location.radiusKm)
  const [gpsError, setGpsError] = useState(false)
  const [busy, setBusy] = useState(false)

  const useGps = async () => {
    setBusy(true)
    setGpsError(false)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        setGpsError(true)
        return
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      const places = await Location.reverseGeocodeAsync(pos.coords).catch(() => [])
      const city = places[0]?.city ?? places[0]?.subregion ?? undefined
      apply({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, city, postalCode: places[0]?.postalCode ?? undefined })
    } catch {
      setGpsError(true)
    } finally {
      setBusy(false)
    }
  }

  const useManual = () => {
    const value = manual.trim()
    if (!value) return
    const isPlz = /^\d{4,5}$/.test(value)
    apply({
      latitude: undefined,
      longitude: undefined,
      postalCode: isPlz ? value : undefined,
      city: isPlz ? undefined : value,
    })
  }

  const apply = (loc: Parameters<typeof setLocation>[0]) => {
    setLocation({ ...loc, radiusKm })
    // serverseitig speichern (für Push/Suchagenten); Fehler blockieren die UI nicht
    void api
      .patch('/settings/location', {
        latitude: loc.latitude,
        longitude: loc.longitude,
        postalCode: loc.postalCode,
        city: loc.city,
        radiusKm,
      })
      .catch(() => {})
    router.back()
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, padding: spacing(4), gap: spacing(4) }}>
      <CTAButton label={busy ? t('common.loading') : `📍 ${t('location.useGps')}`} onPress={() => void useGps()} disabled={busy} />
      {gpsError ? (
        <Text style={[typography.badge, { color: colors.warn }]}>{t('location.gpsDenied')}</Text>
      ) : null}

      <View>
        <Text style={[typography.label, { color: colors.textMuted, marginBottom: spacing(2) }]}>
          {t('location.manual')}
        </Text>
        <View style={{ flexDirection: 'row', gap: spacing(2) }}>
          <TextInput
            style={styles.input}
            value={manual}
            onChangeText={setManual}
            placeholder="18055 / Rostock"
            placeholderTextColor={colors.textFaint}
            onSubmitEditing={useManual}
          />
          <CTAButton label={t('actions.apply')} variant="secondary" onPress={useManual} />
        </View>
      </View>

      <View>
        <Text style={[typography.label, { color: colors.textMuted, marginBottom: spacing(2) }]}>
          {t('location.radius')}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing(2) }}>
          {RADII.map((r) => {
            const active = radiusKm === r
            return (
              <Pressable key={String(r)} onPress={() => setRadiusKm(r)}>
                <View style={[styles.chip, active && styles.chipActive]}>
                  <Text style={[typography.badge, { color: active ? colors.text : colors.textMuted }]}>
                    {r == null ? t('location.nationwide') : `${r} km`}
                  </Text>
                </View>
              </Pressable>
            )
          })}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  input: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.sm,
    color: colors.text,
    paddingHorizontal: spacing(3),
  },
  chip: {
    paddingHorizontal: spacing(3.5),
    paddingVertical: spacing(2),
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  chipActive: { borderColor: colors.gold, backgroundColor: 'rgba(201,161,90,0.12)' },
})
