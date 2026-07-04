import React, { useEffect, useState } from 'react'
import { Alert, Image, Linking, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { api, buildQuery } from '../../src/lib/api'
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

  useEffect(() => {
    if (!id) return
    const q = buildQuery({ lat: location.latitude, lon: location.longitude })
    api
      .get<ListingInsights>(`/vehicles/${id}${q}`)
      .then(setData)
      .catch(() => {})
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
    data.priceAssessment.verdict === 'GOOD_DEAL'
      ? 'gold'
      : data.priceAssessment.verdict === 'EXPENSIVE'
        ? 'warn'
        : 'default'

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingBottom: spacing(10) }}
    >
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
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing(3),
              marginTop: spacing(2),
            }}
          >
            <Text style={[typography.price, { color: colors.gold }]}>
              {formatPrice(data.price, data.currency)}
            </Text>
            <Badge label={t(`price.${data.priceAssessment.verdict}`)} tone={priceTone} />
          </View>
          {data.priceAssessment.verdict !== 'UNKNOWN' &&
          data.priceAssessment.deltaPercent != null ? (
            <Text style={[typography.badge, { color: colors.textFaint, marginTop: spacing(1) }]}>
              {t(data.priceAssessment.deltaPercent <= 0 ? 'price.deltaBelow' : 'price.deltaAbove', {
                percent: Math.abs(data.priceAssessment.deltaPercent),
              })}{' '}
              · {t('price.basis', { count: data.priceAssessment.comparablesCount })}
            </Text>
          ) : null}
        </View>

        {data.monthlyCost ? (
          <View style={styles.box}>
            <Text style={[typography.label, { color: colors.gold, marginBottom: spacing(2) }]}>
              Was kostet mich das Auto wirklich?
            </Text>
            <Text style={[typography.display, { color: colors.gold }]}>
              ca. {data.monthlyCost.total} €/Monat
            </Text>
            <Row label="Wertverlust" value={`${data.monthlyCost.depreciation} €/Monat`} />
            <Row label="Versicherung" value={`${data.monthlyCost.insurance} €/Monat`} />
            <Row label="Kfz-Steuer" value={`${data.monthlyCost.tax} €/Monat`} />
            <Row label="Sprit/Strom" value={`${data.monthlyCost.fuelOrEnergy} €/Monat`} />
            <Row label="Wartung" value={`${data.monthlyCost.maintenance} €/Monat`} />
            <Row label="Kapitalbindung" value={`${data.monthlyCost.financing} €/Monat`} />
          </View>
        ) : null}

        {data.marketTiming ? (
          <View style={styles.box}>
            <Text style={[typography.label, { color: colors.textMuted, marginBottom: spacing(2) }]}>
              Kauf-Timing
            </Text>
            <Text style={[typography.body, { color: colors.text }]}>
              {data.marketTiming.waitAdvice}
            </Text>
            {data.marketTiming.currentVsYearAveragePercent != null ? (
              <Row
                label="Jahresschnitt"
                value={`${data.marketTiming.currentVsYearAveragePercent}%`}
              />
            ) : null}
            <Row label="Preistrend" value={data.marketTiming.trendDirection} />
            {data.marketTiming.seasonalHint ? (
              <Text style={[typography.badge, { color: colors.textMuted, marginTop: spacing(2) }]}>
                {data.marketTiming.seasonalHint}
              </Text>
            ) : null}
          </View>
        ) : null}

        {data.modelKnowledge ? (
          <View style={styles.box}>
            <Text style={[typography.label, { color: colors.textMuted, marginBottom: spacing(2) }]}>
              Modellwissen
            </Text>
            <Text style={[typography.body, { color: colors.text, marginBottom: spacing(2) }]}>
              {data.modelKnowledge.summary}
            </Text>
            {(data.modelKnowledge.commonIssuesJson ?? []).slice(0, 4).map((issue) => (
              <Text key={issue} style={[typography.body, { color: colors.warn }]}>
                ⚠︎ {issue}
              </Text>
            ))}
            {data.modelKnowledge.buyingAdvice ? (
              <Text style={[typography.badge, { color: colors.gold, marginTop: spacing(2) }]}>
                {data.modelKnowledge.buyingAdvice}
              </Text>
            ) : null}
          </View>
        ) : null}

        {/* Kaufhilfe: Risiko-Hinweise */}
        {data.riskFlags.length > 0 ? (
          <View style={styles.box}>
            <Text style={[typography.label, { color: colors.warn, marginBottom: spacing(2) }]}>
              {t('risks.title')}
            </Text>
            {data.riskFlags.map((f) => (
              <Text
                key={f.key}
                style={[
                  typography.body,
                  {
                    color: f.severity === 'WARN' ? colors.warn : colors.textMuted,
                    marginBottom: spacing(1),
                  },
                ]}
              >
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
          <Row
            label={t('card.year')}
            value={data.year != null ? String(data.year) : t('card.unknown')}
          />
          <Row label={t('card.mileage')} value={formatKm(data.mileage)} />
          <Row
            label={t('card.power')}
            value={data.powerHp != null ? `${data.powerHp} ${t('common.hp')}` : t('card.unknown')}
          />
          <Row
            label={t('card.fuel')}
            value={data.fuelType ? t(`filters.fuelValues.${data.fuelType}`) : t('card.unknown')}
          />
          <Row
            label={t('card.transmission')}
            value={
              data.transmission
                ? t(`filters.transmissionValues.${data.transmission}`)
                : t('card.unknown')
            }
          />
          <Row
            label={t('card.seller')}
            value={data.sellerType === 'DEALER' ? t('card.dealer') : t('card.private')}
          />
          {data.distanceKm != null ? (
            <Row
              label={t('location.title')}
              value={`${data.city ?? ''} · ${t('card.distance', { km: data.distanceKm })}`}
            />
          ) : null}
        </View>

        {/* Lead / Kontakt */}
        {!leadSent ? (
          <View style={styles.box}>
            <Text style={[typography.label, { color: colors.textMuted, marginBottom: spacing(2) }]}>
              {t('lead.title')}
            </Text>
            <TextInput
              style={styles.input}
              placeholder={t('lead.defaultMessage')}
              placeholderTextColor={colors.textFaint}
              value={leadMessage}
              onChangeText={setLeadMessage}
              multiline
            />
            <Text
              style={[typography.badge, { color: colors.textFaint, marginVertical: spacing(2) }]}
            >
              {t('lead.attribution')}
            </Text>
            <View style={{ gap: spacing(2) }}>
              <CTAButton label={t('actions.contact')} onPress={() => sendLead('/leads/contact')} />
              <CTAButton
                label={t('actions.testDrive')}
                variant="secondary"
                onPress={() => sendLead('/leads/test-drive')}
              />
              {data.financingAvailable ? (
                <CTAButton
                  label={t('actions.checkFinance')}
                  variant="secondary"
                  onPress={() => sendLead('/leads/finance')}
                />
              ) : null}
              {data.sourceUrl ? (
                <CTAButton
                  label={t('actions.toListing')}
                  variant="ghost"
                  onPress={() => void Linking.openURL(data.sourceUrl!)}
                />
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
