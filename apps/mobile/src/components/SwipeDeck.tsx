import React, { useCallback, useEffect, useRef } from 'react'
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { useTranslation } from 'react-i18next'
import type { SwipeAction } from '@carmatch/shared'
import { colors, radius, typography } from '../lib/theme'

const SWIPE_X_THRESHOLD = 110
const SWIPE_UP_THRESHOLD = -130

export interface SwipeDeckHandle {
  swipe: (action: SwipeAction) => void
}

/**
 * Generische Swipe-Engine (Inserate UND Fahrzeugmodelle):
 * rechts = Like, links = Dislike, hoch = Super-Like.
 * Misst Verweildauer + "Mehr"-Öffnung pro Karte (Recommendation-Signale).
 */
export function SwipeDeck<T>({
  items,
  keyFor,
  renderCard,
  onSwipe,
  deckRef,
}: {
  items: T[]
  keyFor: (item: T) => string
  renderCard: (item: T, opts: { isTop: boolean; onOpenedMore: () => void }) => React.ReactNode
  onSwipe: (item: T, action: SwipeAction, dwellTimeMs: number, openedMore: boolean) => void
  deckRef?: React.MutableRefObject<SwipeDeckHandle | null>
}) {
  const { t } = useTranslation()
  const { width } = useWindowDimensions()
  const tx = useSharedValue(0)
  const ty = useSharedValue(0)
  const shownAt = useRef(Date.now())
  const openedMore = useRef(false)

  const top = items[0]
  const next = items[1]
  const topKey = top ? keyFor(top) : undefined

  useEffect(() => {
    shownAt.current = Date.now()
    openedMore.current = false
    tx.value = 0
    ty.value = 0
  }, [topKey, tx, ty])

  const commit = useCallback(
    (action: SwipeAction) => {
      if (!top) return
      onSwipe(top, action, Date.now() - shownAt.current, openedMore.current)
    },
    [top, onSwipe],
  )

  const flyOut = useCallback(
    (action: SwipeAction) => {
      const targetX = action === 'LIKE' ? width * 1.3 : action === 'DISLIKE' ? -width * 1.3 : 0
      const targetY = action === 'SUPERLIKE' ? -900 : ty.value
      tx.value = withTiming(targetX, { duration: 260 })
      ty.value = withTiming(targetY, { duration: 260 }, () => runOnJS(commit)(action))
    },
    [commit, width, tx, ty],
  )

  if (deckRef) deckRef.current = { swipe: flyOut }

  const pan = Gesture.Pan()
    .onChange((e) => {
      tx.value += e.changeX
      ty.value += e.changeY
    })
    .onEnd(() => {
      if (tx.value > SWIPE_X_THRESHOLD) runOnJS(flyOut)('LIKE')
      else if (tx.value < -SWIPE_X_THRESHOLD) runOnJS(flyOut)('DISLIKE')
      else if (ty.value < SWIPE_UP_THRESHOLD) runOnJS(flyOut)('SUPERLIKE')
      else {
        tx.value = withSpring(0, { damping: 16 })
        ty.value = withSpring(0, { damping: 16 })
      }
    })

  const topStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { rotate: `${interpolate(tx.value, [-width, width], [-12, 12])}deg` },
    ],
  }))
  const nextStyle = useAnimatedStyle(() => {
    const progress = Math.min(1, (Math.abs(tx.value) + Math.abs(ty.value)) / 200)
    return { transform: [{ scale: 0.94 + progress * 0.06 }], opacity: 0.7 + progress * 0.3 }
  })
  const likeStyle = useAnimatedStyle(() => ({ opacity: interpolate(tx.value, [20, SWIPE_X_THRESHOLD], [0, 1], 'clamp') }))
  const nopeStyle = useAnimatedStyle(() => ({ opacity: interpolate(tx.value, [-SWIPE_X_THRESHOLD, -20], [1, 0], 'clamp') }))
  const dreamStyle = useAnimatedStyle(() => ({ opacity: interpolate(ty.value, [SWIPE_UP_THRESHOLD, -30], [1, 0], 'clamp') }))

  if (!top) return null

  return (
    <View style={styles.deck}>
      {next ? (
        <Animated.View style={[styles.cardHolder, nextStyle]} pointerEvents="none">
          {renderCard(next, { isTop: false, onOpenedMore: () => {} })}
        </Animated.View>
      ) : null}

      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.cardHolder, topStyle]}>
          {renderCard(top, {
            isTop: true,
            onOpenedMore: () => {
              openedMore.current = true
            },
          })}
          <Animated.View style={[styles.stamp, styles.stampLike, likeStyle]} pointerEvents="none">
            <Text style={[typography.title, { color: colors.like }]}>{t('swipeLabels.like')}</Text>
          </Animated.View>
          <Animated.View style={[styles.stamp, styles.stampNope, nopeStyle]} pointerEvents="none">
            <Text style={[typography.title, { color: colors.dislike }]}>{t('swipeLabels.nope')}</Text>
          </Animated.View>
          <Animated.View style={[styles.stamp, styles.stampDream, dreamStyle]} pointerEvents="none">
            <Text style={[typography.title, { color: colors.info }]}>{t('swipeLabels.dream')}</Text>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </View>
  )
}

const styles = StyleSheet.create({
  deck: { flex: 1 },
  cardHolder: { ...StyleSheet.absoluteFillObject },
  stamp: {
    position: 'absolute',
    top: 28,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 2.5,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(10,10,12,0.35)',
  },
  stampLike: { left: 20, borderColor: colors.like, transform: [{ rotate: '-12deg' }] },
  stampNope: { right: 20, borderColor: colors.dislike, transform: [{ rotate: '12deg' }] },
  stampDream: { alignSelf: 'center', bottom: 40, top: undefined, borderColor: colors.info },
})
