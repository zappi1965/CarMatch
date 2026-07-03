import React, { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import type { BodyType, FuelType, Transmission, VehicleFilters } from '@carmatch/shared'
import { useSession } from '../src/lib/store'
import { colors, radius, spacing, typography } from '../src/lib/theme'
import { CTAButton } from '../src/components/ui'

const FUELS: FuelType[] = ['PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID', 'PLUGIN_HYBRID']
const TRANSMISSIONS: Transmission[] = ['MANUAL', 'AUTOMATIC']
const BODIES: BodyType[] = ['SEDAN', 'WAGON', 'SUV', 'COUPE', 'CONVERTIBLE', 'HATCHBACK', 'VAN']

/** Filter — jederzeit änderbar, nie verpflichtend. */
export default function FiltersScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const { filters, setFilters } = useSession()
  const [draft, setDraft] = useState<VehicleFilters>(filters)

  const toggle = <K extends 'fuelTypes' | 'transmissions' | 'bodyTypes'>(key: K, value: string) => {
    const current = (draft[key] ?? []) as string[]
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value]
    setDraft({ ...draft, [key]: next.length ? next : undefined })
  }

  const numField = (key: keyof VehicleFilters) => ({
    value: draft[key] != null ? String(draft[key]) : '',
    onChangeText: (text: string) =>
      setDraft({ ...draft, [key]: text ? Number(text.replace(/\D/g, '')) || undefined : undefined }),
  })

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing(4), gap: spacing(4) }}>
        <Group label={t('filters.price')}>
          <View style={styles.pair}>
            <TextInput style={styles.input} keyboardType="numeric" placeholder={t('filters.min')} placeholderTextColor={colors.textFaint} {...numField('priceMin')} />
            <TextInput style={styles.input} keyboardType="numeric" placeholder={t('filters.max')} placeholderTextColor={colors.textFaint} {...numField('priceMax')} />
          </View>
        </Group>

        <Group label={t('filters.year')}>
          <View style={styles.pair}>
            <TextInput style={styles.input} keyboardType="numeric" placeholder={t('filters.min')} placeholderTextColor={colors.textFaint} {...numField('yearMin')} />
            <TextInput style={styles.input} keyboardType="numeric" placeholder={t('filters.max')} placeholderTextColor={colors.textFaint} {...numField('yearMax')} />
          </View>
        </Group>

        <Group label={t('filters.mileage')}>
          <View style={styles.pair}>
            <TextInput style={styles.input} keyboardType="numeric" placeholder={t('filters.min')} placeholderTextColor={colors.textFaint} {...numField('mileageMin')} />
            <TextInput style={styles.input} keyboardType="numeric" placeholder={t('filters.max')} placeholderTextColor={colors.textFaint} {...numField('mileageMax')} />
          </View>
        </Group>

        <Group label={t('filters.power')}>
          <View style={styles.pair}>
            <TextInput style={styles.input} keyboardType="numeric" placeholder={t('filters.min')} placeholderTextColor={colors.textFaint} {...numField('powerHpMin')} />
            <TextInput style={styles.input} keyboardType="numeric" placeholder={t('filters.max')} placeholderTextColor={colors.textFaint} {...numField('powerHpMax')} />
          </View>
        </Group>

        <Group label={t('filters.fuelTypes')}>
          <ChipRow options={FUELS} selected={draft.fuelTypes ?? []} onToggle={(v) => toggle('fuelTypes', v)} i18nPrefix="filters.fuelValues" />
        </Group>

        <Group label={t('filters.transmission')}>
          <ChipRow options={TRANSMISSIONS} selected={draft.transmissions ?? []} onToggle={(v) => toggle('transmissions', v)} i18nPrefix="filters.transmissionValues" />
        </Group>

        <Group label={t('filters.bodyTypes')}>
          <ChipRow options={BODIES} selected={draft.bodyTypes ?? []} onToggle={(v) => toggle('bodyTypes', v)} i18nPrefix="filters.bodyValues" />
        </Group>

        <Group label={t('filters.sellerType')}>
          <ChipRow
            options={['DEALER', 'PRIVATE']}
            selected={draft.sellerType ? [draft.sellerType] : []}
            onToggle={(v) => setDraft({ ...draft, sellerType: draft.sellerType === v ? undefined : (v as VehicleFilters['sellerType']) })}
            i18nPrefix="filters.sellerValues"
          />
        </Group>

        <ToggleRow
          label={t('filters.onlyAccidentFree')}
          value={Boolean(draft.accidentFreeOnly)}
          onChange={(v) => setDraft({ ...draft, accidentFreeOnly: v || undefined })}
        />
        <ToggleRow
          label={t('filters.onlyServiceHistory')}
          value={Boolean(draft.fullServiceHistoryOnly)}
          onChange={(v) => setDraft({ ...draft, fullServiceHistoryOnly: v || undefined })}
        />
      </ScrollView>

      <View style={styles.footer}>
        <CTAButton label={t('actions.reset')} variant="ghost" onPress={() => setDraft({})} style={{ flex: 1 }} />
        <CTAButton
          label={t('actions.apply')}
          onPress={() => {
            setFilters(draft)
            router.back()
          }}
          style={{ flex: 2 }}
        />
      </View>
    </View>
  )
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View>
      <Text style={[typography.label, { color: colors.textMuted, marginBottom: spacing(2) }]}>{label}</Text>
      {children}
    </View>
  )
}

function ChipRow({
  options, selected, onToggle, i18nPrefix,
}: {
  options: readonly string[]
  selected: string[]
  onToggle: (value: string) => void
  i18nPrefix: string
}) {
  const { t } = useTranslation()
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing(2) }}>
      {options.map((o) => {
        const active = selected.includes(o)
        return (
          <Pressable key={o} onPress={() => onToggle(o)}>
            <View style={[styles.chip, active && styles.chipActive]}>
              <Text style={[typography.badge, { color: active ? colors.text : colors.textMuted }]}>
                {t(`${i18nPrefix}.${o}`, o)}
              </Text>
            </View>
          </Pressable>
        )
      })}
    </View>
  )
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.toggleRow}>
      <Text style={[typography.body, { color: colors.text }]}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.like, false: colors.cardBorder }} />
    </View>
  )
}

const styles = StyleSheet.create({
  pair: { flexDirection: 'row', gap: spacing(3) },
  input: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.sm,
    color: colors.text,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(2.5),
  },
  chip: {
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(2),
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  chipActive: { borderColor: colors.gold, backgroundColor: 'rgba(201,161,90,0.12)' },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footer: {
    flexDirection: 'row',
    gap: spacing(3),
    padding: spacing(4),
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    backgroundColor: colors.bg,
  },
})
