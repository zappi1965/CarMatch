import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import { colors, radius, spacing, typography } from '../lib/theme'

/**
 * Score-Kachel mit Ring-Gauge (Mockup: "Performance 9.3").
 * Werte kommen 0–100 aus der API und werden als 0–10 mit einer
 * Nachkommastelle angezeigt. Konfidenz < 0.5 → Ring gedimmt + "geschätzt".
 */
export function ScoreDial({
  label,
  value,
  confidence,
  color,
  estimatedLabel,
}: {
  label: string
  value: number // 0–100
  confidence: number
  color: string
  estimatedLabel: string
}) {
  const size = 44
  const strokeWidth = 3.5
  const r = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * r
  const progress = Math.max(0, Math.min(1, value / 100))
  const estimated = confidence < 0.5

  return (
    <View style={styles.tile}>
      <Text style={[typography.badge, { color: colors.textMuted }]} numberOfLines={1}>
        {label}
        {estimated ? ' *' : ''}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing(2), marginTop: spacing(1.5) }}>
        <Text style={[typography.title, { color: colors.text, fontSize: 24 }]}>
          {(value / 10).toFixed(1)}
        </Text>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2} cy={size / 2} r={r}
            stroke="rgba(255,255,255,0.09)" strokeWidth={strokeWidth} fill="none"
          />
          <Circle
            cx={size / 2} cy={size / 2} r={r}
            stroke={color}
            strokeOpacity={estimated ? 0.45 : 1}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${circumference * progress * 0.75} ${circumference}`}
            transform={`rotate(135 ${size / 2} ${size / 2})`}
          />
        </Svg>
      </View>
      {estimated ? (
        <Text style={[typography.badge, { color: colors.textFaint, fontSize: 10 }]}>* {estimatedLabel}</Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing(3),
  },
})
