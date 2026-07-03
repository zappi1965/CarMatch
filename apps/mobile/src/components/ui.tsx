import React from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native'
import { colors, radius, spacing, typography } from '../lib/theme'

export function Badge({ label, tone = 'default' }: { label: string; tone?: 'default' | 'accent' | 'gold' | 'warn' }) {
  const bg =
    tone === 'accent' ? 'rgba(213,0,28,0.16)' : tone === 'gold' ? 'rgba(201,161,90,0.16)' : tone === 'warn' ? 'rgba(217,164,65,0.16)' : 'rgba(255,255,255,0.08)'
  const fg = tone === 'accent' ? '#FF6B7D' : tone === 'gold' ? colors.gold : tone === 'warn' ? colors.warn : colors.textMuted
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[typography.badge, { color: fg }]}>{label}</Text>
    </View>
  )
}

export function CTAButton({
  label, onPress, variant = 'primary', disabled, style,
}: {
  label: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'ghost'
  disabled?: boolean
  style?: ViewStyle
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.cta,
        variant === 'primary' && { backgroundColor: colors.accent },
        variant === 'secondary' && { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder },
        variant === 'ghost' && { backgroundColor: 'transparent' },
        (pressed || disabled) && { opacity: 0.6 },
        style,
      ]}
    >
      <Text style={[typography.body, { color: variant === 'ghost' ? colors.textMuted : colors.text, fontWeight: '600' }]}>
        {label}
      </Text>
    </Pressable>
  )
}

/** Quartett-Score-Balken mit Konfidenz-Kennzeichnung ("geschätzt" bei < 0.5). */
export function ScoreBar({ label, value, confidence, estimatedLabel }: { label: string; value: number; confidence: number; estimatedLabel: string }) {
  return (
    <View style={{ marginBottom: spacing(2.5) }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
        <Text style={[typography.badge, { color: colors.textMuted }]}>
          {label}
          {confidence < 0.5 ? ` · ${estimatedLabel}` : ''}
        </Text>
        <Text style={[typography.badge, { color: colors.text }]}>{value}</Text>
      </View>
      <View style={styles.scoreTrack}>
        <View
          style={[
            styles.scoreFill,
            { width: `${value}%`, backgroundColor: value >= 70 ? colors.like : value >= 40 ? colors.gold : colors.textFaint, opacity: confidence < 0.5 ? 0.55 : 1 },
          ]}
        />
      </View>
    </View>
  )
}

export function EmptyState({ title, hint, children }: { title: string; hint?: string; children?: React.ReactNode }) {
  return (
    <View style={styles.empty}>
      <Text style={[typography.title, { color: colors.text, textAlign: 'center' }]}>{title}</Text>
      {hint ? <Text style={[typography.body, { color: colors.textMuted, textAlign: 'center', marginTop: spacing(2) }]}>{hint}</Text> : null}
      {children ? <View style={{ marginTop: spacing(5), gap: spacing(2), alignSelf: 'stretch' }}>{children}</View> : null}
    </View>
  )
}

export function LoadingState({ label }: { label: string }) {
  return (
    <View style={styles.empty}>
      <ActivityIndicator color={colors.accent} size="large" />
      <Text style={[typography.body, { color: colors.textMuted, marginTop: spacing(3) }]}>{label}</Text>
    </View>
  )
}

/** Skeleton-Karte während des Ladens des Decks. */
export function CardSkeleton() {
  return (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonImage} />
      <View style={{ padding: spacing(4), gap: spacing(2) }}>
        <View style={[styles.skeletonLine, { width: '55%' }]} />
        <View style={[styles.skeletonLine, { width: '35%' }]} />
        <View style={{ flexDirection: 'row', gap: spacing(2), marginTop: spacing(2) }}>
          <View style={[styles.skeletonLine, { width: 64, height: 22, borderRadius: radius.pill }]} />
          <View style={[styles.skeletonLine, { width: 64, height: 22, borderRadius: radius.pill }]} />
          <View style={[styles.skeletonLine, { width: 64, height: 22, borderRadius: radius.pill }]} />
        </View>
      </View>
    </View>
  )
}

export function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={[typography.body, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[typography.body, { color: colors.text, fontWeight: '500', maxWidth: '60%', textAlign: 'right' }]}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing(2.5),
    paddingVertical: spacing(1),
    borderRadius: radius.pill,
  },
  cta: {
    paddingVertical: spacing(3.5),
    paddingHorizontal: spacing(5),
    borderRadius: radius.md,
    alignItems: 'center',
  },
  scoreTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.07)',
    overflow: 'hidden',
  },
  scoreFill: { height: 6, borderRadius: 3 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing(8),
  },
  skeletonCard: {
    flex: 1,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
  },
  skeletonImage: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)' },
  skeletonLine: { height: 14, borderRadius: 7, backgroundColor: 'rgba(255,255,255,0.07)' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing(2.5),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.cardBorder,
  },
})
