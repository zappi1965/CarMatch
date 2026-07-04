import React, { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { api } from '../../src/lib/api'
import { colors, radius, spacing, typography } from '../../src/lib/theme'
import { CTAButton } from '../../src/components/ui'
export default function SharedScreen() {
  const [searches, setSearches] = useState<any[]>([])
  const [code, setCode] = useState('')
  const load = () =>
    api
      .get<any[]>('/shared-searches-v2')
      .then(setSearches)
      .catch(() => setSearches([]))
  useEffect(load, [])
  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: spacing(4), gap: spacing(4) }}
    >
      <Text style={[typography.display, { color: colors.text }]}>Gemeinsam suchen</Text>
      <Text style={[typography.body, { color: colors.textMuted }]}>
        Erstellt eine geteilte Garage und seht, welche Autos beide mögen oder wer ein Veto setzt.
      </Text>
      <View style={styles.box}>
        <CTAButton
          label="Gemeinsame Suche erstellen"
          onPress={() =>
            api
              .post('/shared-searches-v2', { name: 'Unsere Autosuche', displayName: 'Dominique' })
              .then(load)
          }
        />
        <TextInput
          value={code}
          onChangeText={setCode}
          placeholder="Invite-Code"
          placeholderTextColor={colors.textFaint}
          style={styles.input}
        />
        <CTAButton
          label="Per Code beitreten"
          variant="secondary"
          onPress={() =>
            api
              .post('/shared-searches-v2/join', { inviteCode: code, displayName: 'Partner' })
              .then(load)
          }
        />
      </View>
      {searches.map((s) => (
        <View key={s.id} style={styles.box}>
          <Text style={[typography.title, { color: colors.text }]}>{s.name}</Text>
          <Text style={[typography.price, { color: colors.gold }]}>Code: {s.inviteCode}</Text>
          <Text style={[typography.badge, { color: colors.textMuted }]}>
            {s.members?.length ?? 0} Mitglieder · {s.signals?.length ?? 0} Signale
          </Text>
        </View>
      ))}
    </ScrollView>
  )
}
const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing(4),
    gap: spacing(3),
  },
  input: {
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.sm,
    padding: spacing(3),
  },
})
