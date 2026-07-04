import React, { useEffect, useState } from 'react'
import { Alert, Image, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { api, buildQuery } from '../../src/lib/api'
import { Switch } from 'react-native'
import { useSession } from '../../src/lib/store'
import { colors, radius, spacing, typography } from '../../src/lib/theme'
import { formatKm, formatPrice, type ListingInsights } from '../../src/lib/types'
import { Badge, CTAButton, LoadingState, Row, ScoreBar } from '../../src/components/ui'

/**
 * Fahrzeugdetail mit Kaufhilfe: Preisbewertung, Risiko-Hinweise, Quartett-Scores
 * (mit Konfidenz), Quelle/Attribution und Lead-CTAs.
 */
export default function VehicleDetailScreen() {
  const { t } = useTranslation()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { location } = useSession()
  const [data, setData] = useState<ListingInsights | null>(null)
  const [leadMessage, setLeadMessage] = useState('')
  const [leadSent, setLeadSent] = useState(false)
  const [goalSaved, setGoalSaved] = useState(false)
  const [evKm, setEvKm] = useState('40')
  const [evHome, setEvHome] = useState(true)
  const [evResult, setEvResult] = useState<{ verdict: string; usableRangeKm?: number; chargesPerWeek?: number } | null>(null)
  const [advisor, setAdvisor] = useState<{
    inspectionChecklist: string[]
    hiddenCostAlerts: string[]
    negotiation: { arguments?: string[]; suggestedOffer?: number | null } | string[]
    whyCheap: string[]
    dealerTrust: { level?: string; signals?: string[] } | string[]
  } | null>(null)
  const [advisorOpen, setAdvisorOpen] = useState(false)

  useEffect(() => {
    if (!id) return
    const q = buildQuery({ lat: location.latitude, lon: location.longitude })
    api.get<ListingInsights>(`/vehicles/${id}${q}`).then(setData).catch(() => {})
  }, [id, location])

  if (!data) return <LoadingState label={t('common.loading')} />

  const sendLead = (path: string) => {
    void api
      .post(path, { listingId: data.id, message: leadMessage || t('lead.defaultMessage') })
      .then(() => {
        setLeadSent(true)
        Alert.alert(t('lead.sent'))
      })
      .catch(() => Alert.alert(t('common.error')))
  }

  const priceTone =
    data.priceAssessment.verdict === 'GOOD_DEAL' ? 'gold' : data.priceAssessment.verdict === 'EXPENSIVE' ? 'warn' : 'default'

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: spacing(10) }}>
      <Image source={{ uri: data.images[0] }} style={styles.hero} />
      <View style={{ padding: spacing(4), gap: spacing(4) }}>
        <View>
          <View style={{ flexDirection: 'row', gap: spacing(1.5), marginBottom: spacing(2) }}>
            {data.imagesAreDemo && <Badge label={t('discover.demoBadge')} tone="warn" />}
            {data.isSponsored && <Badge label={t('discover.sponsored')} tone="gold" />}
            {data.attribution && <Badge label={data.attribution.attributionText} />}
          </View>
          <Text style={[typography.label, { color: colors.textMuted }]}>{data.make}</Text>
          <Text style={[typography.display, { color: colors.text }]}>
            {data.model} {data.variant ?? ''}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing(3), marginTop: spacing(2) }}>
            <Text style={[typography.price, { color: colors.gold }]}>{formatPrice(data.price, data.currency)}</Text>
            <Badge label={t(`price.${data.priceAssessment.verdict}`)} tone={priceTone} />
          </View>
          {data.priceAssessment.verdict !== 'UNKNOWN' && data.priceAssessment.deltaPercent != null ? (
            <Text style={[typography.badge, { color: colors.textFaint, marginTop: spacing(1) }]}>
              {t(data.priceAssessment.deltaPercent <= 0 ? 'price.deltaBelow' : 'price.deltaAbove', {
                percent: Math.abs(data.priceAssessment.deltaPercent),
              })}{' '}
              · {t('price.basis', { count: data.priceAssessment.comparablesCount })}
            </Text>
          ) : null}
        </View>

        {/* Kaufhilfe: Risiko-Hinweise */}
        {data.riskFlags.length > 0 ? (
          <View style={styles.box}>
            <Text style={[typography.label, { color: colors.warn, marginBottom: spacing(2) }]}>{t('risks.title')}</Text>
            {data.riskFlags.map((f) => (
              <Text key={f.key} style={[typography.body, { color: f.severity === 'WARN' ? colors.warn : colors.textMuted, marginBottom: spacing(1) }]}>
                {f.severity === 'WARN' ? '⚠︎ ' : 'ℹ︎ '}
                {t(`risks.${f.key}`)}
              </Text>
            ))}
          </View>
        ) : null}

        {/* Quartett-Scores mit Konfidenz */}
        {data.scores.length > 0 ? (
          <View style={styles.box}>
            <Text style={[typography.label, { color: colors.textMuted, marginBottom: spacing(3) }]}>
              {t('scores.title')}
            </Text>
            {data.scores.map((s) => (
              <ScoreBar
                key={s.key}
                label={t(`scores.${s.key}`)}
                value={s.value}
                confidence={s.confidence}
                estimatedLabel={t('card.estimated')}
              />
            ))}
          </View>
        ) : null}

        {/* Kerndaten */}
        <View style={styles.box}>
          <Row label={t('card.year')} value={data.year != null ? String(data.year) : t('card.unknown')} />
          <Row label={t('card.mileage')} value={formatKm(data.mileage)} />
          <Row label={t('card.power')} value={data.powerHp != null ? `${data.powerHp} ${t('common.hp')}` : t('card.unknown')} />
          <Row label={t('card.fuel')} value={data.fuelType ? t(`filters.fuelValues.${data.fuelType}`) : t('card.unknown')} />
          <Row label={t('card.transmission')} value={data.transmission ? t(`filters.transmissionValues.${data.transmission}`) : t('card.unknown')} />
          <Row label={t('card.seller')} value={data.sellerType === 'DEALER' ? t('card.dealer') : t('card.private')} />
          {data.distanceKm != null ? <Row label={t('location.title')} value={`${data.city ?? ''} · ${t('card.distance', { km: data.distanceKm })}`} /> : null}
        </View>

        {/* Monatskosten-Schätzung */}
        {data.monthlyCosts ? (
          <View style={styles.box}>
            <Text style={[typography.label, { color: colors.textMuted, marginBottom: spacing(2) }]}>
              {t('costs.title')}{data.monthlyCosts.confidence < 0.5 ? ` (${t('card.estimated')})` : ''}
            </Text>
            <Row label={t('costs.depreciation')} value={`${data.monthlyCosts.depreciation} €`} />
            <Row label={t('costs.fuel')} value={`${data.monthlyCosts.fuel} €`} />
            <Row label={t('costs.insurance')} value={`${data.monthlyCosts.insurance} €`} />
            <Row label={t('costs.tax')} value={`${data.monthlyCosts.tax} €`} />
            <Row label={t('costs.maintenance')} value={`${data.monthlyCosts.maintenance} €`} />
            <Row label={t('costs.total')} value={`≈ ${data.monthlyCosts.total} €/Monat`} />
            <Text style={[typography.badge, { color: colors.textFaint, marginTop: spacing(2) }]}>
              {t('costs.assumption', { km: data.monthlyCosts.assumptions.kmPerYear.toLocaleString('de-DE') })}
            </Text>
          </View>
        ) : null}

        {/* Markttrend / Kauf-Timing */}
        {data.marketTrend && data.marketTrend.direction !== 'UNKNOWN' ? (
          <View style={styles.box}>
            <Text style={[typography.label, { color: colors.textMuted, marginBottom: spacing(1) }]}>
              {t('trend.title')}
            </Text>
            <Text style={[typography.body, {
              color: data.marketTrend.direction === 'FALLING' ? colors.like : data.marketTrend.direction === 'RISING' ? colors.warn : colors.textMuted,
              fontWeight: '600',
            }]}>
              {data.marketTrend.direction === 'FALLING' ? '↓ ' : data.marketTrend.direction === 'RISING' ? '↑ ' : '→ '}
              {t(`trend.${data.marketTrend.direction}`, { percent: Math.abs(data.marketTrend.trendPercent ?? 0) })}
            </Text>
            {data.marketTrend.seasonalHint ? (
              <Text style={[typography.badge, { color: colors.gold, marginTop: spacing(1) }]}>
                {t(`trend.${data.marketTrend.seasonalHint}`)}
              </Text>
            ) : null}
          </View>
        ) : null}

        {/* E-Auto-Alltagscheck */}
        {(data.fuelType === 'ELECTRIC' || data.fuelType === 'PLUGIN_HYBRID') && data.specs?.electricRangeKm != null ? (
          <View style={styles.box}>
            <Text style={[typography.label, { color: colors.textMuted, marginBottom: spacing(2) }]}>
              ⚡ {t('ev.title')}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing(3) }}>
              <TextInput
                style={[styles.input, { flex: 1, minHeight: 0 }]}
                keyboardType="numeric"
                value={evKm}
                onChangeText={(v) => setEvKm(v.replace(/\D/g, ''))}
                placeholder={t('ev.dailyKm')}
                placeholderTextColor={colors.textFaint}
              />
              <Text style={[typography.badge, { color: colors.textMuted }]}>{t('ev.homeCharging')}</Text>
              <Switch value={evHome} onValueChange={setEvHome} trackColor={{ true: colors.like, false: colors.cardBorder }} />
            </View>
            <CTAButton
              label={t('ev.check')}
              variant="secondary"
              style={{ marginTop: spacing(2) }}
              onPress={() =>
                void api
                  .get<{ verdict: string; usableRangeKm?: number; chargesPerWeek?: number }>(
                    `/vehicles/${data.id}/ev-check?dailyKm=${evKm || '40'}&homeCharging=${evHome}`,
                  )
                  .then(setEvResult)
                  .catch(() => {})
              }
            />
            {evResult ? (
              <View style={{ marginTop: spacing(2) }}>
                <Text style={[typography.body, {
                  fontWeight: '600',
                  color: evResult.verdict === 'FITS' ? colors.like : evResult.verdict === 'TIGHT' ? colors.warn : colors.dislike,
                }]}>
                  {t(`ev.${evResult.verdict}`, evResult.verdict)}
                </Text>
                {evResult.usableRangeKm != null ? (
                  <Text style={[typography.badge, { color: colors.textFaint, marginTop: 2 }]}>
                    {t('ev.detail', { range: evResult.usableRangeKm, charges: evResult.chargesPerWeek })}
                  </Text>
                ) : null}
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Kaufcheck (regelbasierter Kaufberater) */}
        <View style={styles.box}>
          <Pressable onPress={() => {
            setAdvisorOpen(!advisorOpen)
            if (!advisor) {
              void api.get<typeof advisor>(`/buying-assistant/check/${data.id}`).then((d) => setAdvisor(d)).catch(() => {})
            }
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[typography.label, { color: colors.textMuted }]}>🛡 {t('advisor.title')}</Text>
              <Text style={{ color: colors.textFaint }}>{advisorOpen ? '▾' : '▸'}</Text>
            </View>
          </Pressable>
          {advisorOpen && advisor ? (
            <View style={{ marginTop: spacing(3), gap: spacing(3) }}>
              <AdvisorList title={t('advisor.checklist')} items={advisor.inspectionChecklist} glyph="☐" />
              <AdvisorList title={t('advisor.hiddenCosts')} items={advisor.hiddenCostAlerts} glyph="⚠︎" tone={colors.warn} />
              <AdvisorList
                title={t('advisor.negotiation')}
                items={Array.isArray(advisor.negotiation) ? advisor.negotiation : (advisor.negotiation.arguments ?? [])}
                glyph="•"
              />
              <AdvisorList title={t('advisor.whyCheap')} items={advisor.whyCheap} glyph="?" />
              <AdvisorList
                title={t('advisor.dealerTrust')}
                items={Array.isArray(advisor.dealerTrust) ? advisor.dealerTrust : (advisor.dealerTrust.signals ?? [])}
                glyph="✓"
                tone={colors.like}
              />
              <Text style={[typography.badge, { color: colors.textFaint }]}>{t('advisor.disclaimer')}</Text>
            </View>
          ) : null}
        </View>

        {/* Sparziel */}
        {!goalSaved ? (
          <CTAButton
            label={`🎯 ${t('goals.add')}`}
            variant="secondary"
            onPress={() =>
              void api
                .post('/garage/savings-goals', {
                  listingId: data.id,
                  title: `${data.make} ${data.model}`,
                  targetPrice: data.price,
                })
                .then(() => {
                  setGoalSaved(true)
                  Alert.alert(t('goals.added'))
                })
            }
          />
        ) : null}

        {/* Lead / Kontakt */}
        {!leadSent ? (
          <View style={styles.box}>
            <Text style={[typography.label, { color: colors.textMuted, marginBottom: spacing(2) }]}>{t('lead.title')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('lead.defaultMessage')}
              placeholderTextColor={colors.textFaint}
              value={leadMessage}
              onChangeText={setLeadMessage}
              multiline
            />
            <Text style={[typography.badge, { color: colors.textFaint, marginVertical: spacing(2) }]}>
              {t('lead.attribution')}
            </Text>
            <View style={{ gap: spacing(2) }}>
              <CTAButton label={t('actions.contact')} onPress={() => sendLead('/leads/contact')} />
              <CTAButton label={t('actions.testDrive')} variant="secondary" onPress={() => sendLead('/leads/test-drive')} />
              {data.financingAvailable ? (
                <CTAButton label={t('actions.checkFinance')} variant="secondary" onPress={() => sendLead('/leads/finance')} />
              ) : null}
              {data.sourceUrl ? (
                <CTAButton label={t('actions.toListing')} variant="ghost" onPress={() => void Linking.openURL(data.sourceUrl!)} />
              ) : null}
            </View>
          </View>
        ) : (
          <View style={styles.box}>
            <Text style={[typography.body, { color: colors.like }]}>✓ {t('lead.sent')}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  )
}

function AdvisorList({ title, items, glyph, tone }: { title: string; items: string[]; glyph: string; tone?: string }) {
  if (!items || items.length === 0) return null
  return (
    <View>
      <Text style={[typography.badge, { color: colors.textMuted, fontWeight: '700', marginBottom: 4 }]}>{title}</Text>
      {items.slice(0, 6).map((item) => (
        <Text key={item} style={[typography.body, { color: tone ?? colors.text, fontSize: 13, marginBottom: 3 }]}>
          {glyph} {item}
        </Text>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  hero: { width: '100%', height: 260, backgroundColor: colors.surface },
  box: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing(4),
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.sm,
    color: colors.text,
    padding: spacing(3),
    minHeight: 70,
    textAlignVertical: 'top',
  },
})
