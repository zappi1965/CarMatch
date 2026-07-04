import React, { useEffect, useState } from 'react'
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { api } from '../../src/lib/api'
import { colors, radius, spacing, typography } from '../../src/lib/theme'
import { formatPrice, type ListingDto } from '../../src/lib/types'
import { CTAButton, LoadingState } from '../../src/components/ui'

type AdvisorResult = {
  hiddenCostAlerts: Array<{ severity: string; title: string; detail: string; estimatedCost?: string }>
  inspectionChecklist: { mustCheck: string[]; sellerQuestions: string[]; testDriveFocus: string[] }
  negotiationAdvice: { openingOffer: number; targetPrice: number; walkAwayPrice: number; script: string; arguments: string[] }
  whyCheap: string[]
  dealerTrust: { score: number; verdict: string; signals: string[] }
  financing: { estimatedMonthlyPayment: number; totalCreditCost: number; note: string }
}

export default function AdvisorScreen() {
  const [listings, setListings] = useState<ListingDto[]>([])
  const [selected, setSelected] = useState<ListingDto | null>(null)
  const [advisor, setAdvisor] = useState<AdvisorResult | null>(null)
  const [compare, setCompare] = useState<any>(null)
  const [dreamModel, setDreamModel] = useState('Porsche 911')
  const [dreamBudget, setDreamBudget] = useState('550')
  const [dream, setDream] = useState<any>(null)

  useEffect(() => {
    api
      .get<ListingDto[]>('/vehicles/search?pageSize=6')
      .then((rows: ListingDto[]) => {
        setListings(rows)
        if (rows[0]) setSelected(rows[0])
      })
      .catch(() => setListings([]))
  }, [])

  useEffect(() => {
    if (!selected) return
    api
      .get<AdvisorResult>(`/buying-assistant/listings/${selected.id}`)
      .then(setAdvisor)
      .catch(() => setAdvisor(null))
  }, [selected])

  const runCompare = () => {
    const ids = listings.slice(0, 3).map((l) => l.id)
    if (ids.length < 2) return
    api.post('/buying-assistant/compare', { listingIds: ids }).then(setCompare).catch(() => {})
  }

  const runDream = () => {
    api
      .post('/buying-assistant/dream-alternatives', {
        dreamModel,
        monthlyBudgetEur: Number(dreamBudget) || 550,
      })
      .then(setDream)
      .catch(() => {})
  }

  if (!selected) return <LoadingState label="Kaufassistent wird geladen" />

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: spacing(4), gap: spacing(4) }}>
      <Text style={[typography.display, { color: colors.text }]}>Kaufassistent</Text>
      <Text style={[typography.body, { color: colors.textMuted }]}>Besichtigung, Verhandlung, Hidden Costs, Finanzierung, Vergleich und Traumauto-Alternativen an einem Ort.</Text>

      <View style={styles.selectorRow}>
        {listings.slice(0, 4).map((l: ListingDto) => (
          <Pressable key={l.id} onPress={() => setSelected(l)} style={[styles.mini, selected.id === l.id && styles.miniActive]}>
            <Image source={{ uri: l.images[0] }} style={styles.miniImg} />
            <Text style={[typography.badge, { color: colors.text }]} numberOfLines={1}>{l.make} {l.model}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.heroCard}>
        <Image source={{ uri: selected.images[0] }} style={styles.heroImg} />
        <View style={{ padding: spacing(3), gap: spacing(1) }}>
          <Text style={[typography.title, { color: colors.text }]}>{selected.make} {selected.model}</Text>
          <Text style={[typography.price, { color: colors.gold }]}>{formatPrice(selected.price, selected.currency)}</Text>
          <Text style={[typography.badge, { color: colors.textMuted }]}>{selected.year ?? '–'} · {selected.mileage?.toLocaleString('de-DE') ?? '–'} km · {selected.powerHp ?? '–'} PS</Text>
        </View>
      </View>

      {advisor ? (
        <>
          <Section title="Verhandlungsassistent" accent>
            <Text style={[typography.price, { color: colors.gold }]}>{advisor.negotiationAdvice.openingOffer.toLocaleString('de-DE')} € Einstieg</Text>
            <Text style={[typography.body, { color: colors.text }]}>Zielpreis: {advisor.negotiationAdvice.targetPrice.toLocaleString('de-DE')} € · Schmerzgrenze: {advisor.negotiationAdvice.walkAwayPrice.toLocaleString('de-DE')} €</Text>
            <Text style={[typography.badge, { color: colors.textMuted }]}>{advisor.negotiationAdvice.script}</Text>
            {advisor.negotiationAdvice.arguments.slice(0, 3).map((x: string) => <Bullet key={x}>{x}</Bullet>)}
          </Section>

          <Section title="Hidden Cost Alerts">
            {advisor.hiddenCostAlerts.slice(0, 5).map((a: { severity: string; title: string; detail: string; estimatedCost?: string }) => (
              <View key={`${a.title}-${a.detail}`} style={styles.alertRow}>
                <Text style={{ color: a.severity === 'high' ? colors.dislike : colors.warn }}>●</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.body, { color: colors.text, fontWeight: '700' }]}>{a.title}</Text>
                  <Text style={[typography.badge, { color: colors.textMuted }]}>{a.detail}</Text>
                  {a.estimatedCost ? <Text style={[typography.badge, { color: colors.gold }]}>{a.estimatedCost}</Text> : null}
                </View>
              </View>
            ))}
          </Section>

          <Section title="Besichtigung vorbereiten">
            {advisor.inspectionChecklist.mustCheck.slice(0, 6).map((x: string) => <Bullet key={x}>{x}</Bullet>)}
          </Section>

          <Section title="Warum ist dieses Auto günstig/teuer?">
            {advisor.whyCheap.slice(0, 5).map((x: string) => <Bullet key={x}>{x}</Bullet>)}
          </Section>

          <Section title="Händler-/Inseratsvertrauen">
            <Text style={[typography.display, { color: colors.gold }]}>{advisor.dealerTrust.score}/100</Text>
            <Text style={[typography.body, { color: colors.text }]}>{advisor.dealerTrust.verdict}</Text>
            {advisor.dealerTrust.signals.map((x: string) => <Bullet key={x}>{x}</Bullet>)}
          </Section>

          <Section title="Finanzierungs-Simulation">
            <Text style={[typography.price, { color: colors.gold }]}>ca. {advisor.financing.estimatedMonthlyPayment} €/Monat</Text>
            <Text style={[typography.badge, { color: colors.textMuted }]}>Kreditkosten demohaft: {advisor.financing.totalCreditCost.toLocaleString('de-DE')} € · {advisor.financing.note}</Text>
          </Section>
        </>
      ) : null}

      <Section title="Auto gegen Auto vergleichen" accent>
        <CTAButton label="Top 3 Demo-Autos vergleichen" onPress={runCompare} />
        {compare ? (
          <View style={{ gap: spacing(2), marginTop: spacing(2) }}>
            <Text style={[typography.body, { color: colors.text }]}>Vernunft: {compare.rationalWinner.title}</Text>
            <Text style={[typography.body, { color: colors.text }]}>Emotion: {compare.emotionalWinner.title}</Text>
            <Text style={[typography.price, { color: colors.gold }]}>Bester Kompromiss: {compare.compromise.title}</Text>
          </View>
        ) : null}
      </Section>

      <Section title="Dream Garage Alternativen">
        <TextInput value={dreamModel} onChangeText={setDreamModel} style={styles.input} placeholder="Traumauto" placeholderTextColor={colors.textFaint} />
        <TextInput value={dreamBudget} onChangeText={setDreamBudget} style={styles.input} keyboardType="numeric" placeholder="Monatsbudget" placeholderTextColor={colors.textFaint} />
        <CTAButton label="realistische Alternativen finden" onPress={runDream} />
        {dream?.alternatives?.map((a: any) => (
          <View key={a.title} style={styles.altCard}>
            <Text style={[typography.body, { color: colors.text, fontWeight: '700' }]}>{a.title}</Text>
            <Text style={[typography.badge, { color: colors.gold }]}>ca. {a.estimatedMonthlyCost} €/Monat · {a.budgetFit}</Text>
            <Text style={[typography.badge, { color: colors.textMuted }]}>{a.reason}</Text>
          </View>
        ))}
      </Section>
    </ScrollView>
  )
}

function Section({ title, accent, children }: { title: string; accent?: boolean; children: React.ReactNode }) {
  return <View style={[styles.box, accent && { borderColor: colors.gold }]}><Text style={[typography.label, { color: accent ? colors.gold : colors.textMuted, marginBottom: spacing(2) }]}>{title}</Text>{children}</View>
}
function Bullet({ children }: { children: React.ReactNode }) { return <Text style={[typography.body, { color: colors.textMuted, marginTop: spacing(1) }]}>• {children}</Text> }

const styles = StyleSheet.create({
  selectorRow: { flexDirection: 'row', gap: spacing(2) },
  mini: { flex: 1, borderRadius: radius.md, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.card, overflow: 'hidden', paddingBottom: spacing(2) },
  miniActive: { borderColor: colors.gold },
  miniImg: { width: '100%', height: 76, backgroundColor: colors.surface },
  heroCard: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.cardBorder, overflow: 'hidden' },
  heroImg: { width: '100%', height: 190, backgroundColor: colors.surface },
  box: { backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.cardBorder, padding: spacing(4), gap: spacing(2) },
  alertRow: { flexDirection: 'row', gap: spacing(2), alignItems: 'flex-start', paddingVertical: spacing(1) },
  input: { color: colors.text, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radius.sm, padding: spacing(3) },
  altCard: { padding: spacing(3), borderRadius: radius.md, backgroundColor: colors.surface, gap: spacing(1) },
})
