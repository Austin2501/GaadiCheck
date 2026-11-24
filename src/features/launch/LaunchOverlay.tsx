import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AccessibilityInfo, Animated, Easing, StyleSheet } from 'react-native';

import { BrandMark, MARK_BADGE, MarkBadge } from '@/components/brand/BrandMark';
import { Wordmark } from '@/components/brand/Wordmark';
import { AppText } from '@/components/ui';
import { colors } from '@/theme';

import { useLaunchState } from './launchState';

/** Same size and position as the native splash artwork (64-unit grid drawn at 168dp). */
const MARK_SIZE = 168;
const SETTLED_SCALE = 0.62;
const SETTLED_LIFT = -52;
const HOLD_MS = 300;
const EXIT_MS = 260;
const SETTLE_EASING = Easing.bezier(0.2, 0.8, 0.2, 1);

const BADGE_FRAME = {
  left: ((MARK_BADGE.cx - MARK_BADGE.r) / 64) * MARK_SIZE,
  top: ((MARK_BADGE.cy - MARK_BADGE.r) / 64) * MARK_SIZE,
  width: ((MARK_BADGE.r * 2) / 64) * MARK_SIZE,
  height: ((MARK_BADGE.r * 2) / 64) * MARK_SIZE,
  borderRadius: ((MARK_BADGE.r * 2) / 64) * MARK_SIZE,
};

interface LaunchOverlayProps {
  onFinish: () => void;
}

/**
 * Picks up where the native splash leaves off: the car settles, the check badge stamps on and
 * the name fades in, then the overlay dissolves into the app, which has been rendering beneath.
 */
export function LaunchOverlay({ onFinish }: LaunchOverlayProps) {
  const { t } = useTranslation();
  const [settle] = useState(() => new Animated.Value(0));
  const [stamp] = useState(() => new Animated.Value(0));
  const [pulse] = useState(() => new Animated.Value(0));
  const [copy] = useState(() => new Animated.Value(0));
  const [exit] = useState(() => new Animated.Value(0));
  const [leaving, setLeaving] = useState(false);
  const started = useRef(false);

  const leave = () => {
    setLeaving(true);
    useLaunchState.getState().markSettled();
    Animated.timing(exit, {
      toValue: 1,
      duration: EXIT_MS,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(onFinish);
  };

  const start = async () => {
    if (started.current) return;
    started.current = true;
    // The first frame is on screen, so the native splash can go without a flash.
    void SplashScreen.hideAsync();

    if (await AccessibilityInfo.isReduceMotionEnabled()) {
      for (const value of [settle, stamp, copy]) value.setValue(1);
      setTimeout(leave, HOLD_MS);
      return;
    }

    // Timed rather than sprung so the whole intro has a fixed, short length (about 1.5s).
    Animated.sequence([
      Animated.parallel([
        Animated.timing(settle, {
          toValue: 1,
          duration: 560,
          easing: SETTLE_EASING,
          useNativeDriver: true,
        }),
        Animated.timing(stamp, {
          toValue: 1,
          duration: 380,
          delay: 300,
          easing: Easing.out(Easing.back(2.2)),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 620,
          delay: 380,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(copy, {
          toValue: 1,
          duration: 420,
          delay: 380,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(HOLD_MS),
    ]).start(leave);
  };

  return (
    <Animated.View
      style={[
        styles.root,
        { opacity: exit.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) },
      ]}
      pointerEvents={leaving ? 'none' : 'auto'}
      onLayout={() => void start()}
      accessible
      accessibilityLabel={`${t('common.appName')}. ${t('common.tagline')}`}
      accessibilityViewIsModal
    >
      <StatusBar style="light" />

      <Animated.View
        style={[
          styles.mark,
          {
            transform: [
              {
                translateY: settle.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, SETTLED_LIFT],
                }),
              },
              {
                scale: settle.interpolate({ inputRange: [0, 1], outputRange: [1, SETTLED_SCALE] }),
              },
            ],
          },
        ]}
      >
        <BrandMark size={MARK_SIZE} variant="inverse" showBadge={false} />
        <Animated.View
          style={[
            styles.pulse,
            BADGE_FRAME,
            {
              opacity: pulse.interpolate({ inputRange: [0, 0.1, 1], outputRange: [0, 0.5, 0] }),
              transform: [
                { scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 2.3] }) },
              ],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.badge,
            BADGE_FRAME,
            {
              opacity: stamp.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0, 1, 1] }),
              transform: [{ scale: stamp }],
            },
          ]}
        >
          <MarkBadge markSize={MARK_SIZE} />
        </Animated.View>
      </Animated.View>

      <Animated.View
        style={[
          styles.copy,
          {
            opacity: copy,
            transform: [
              { translateY: copy.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) },
            ],
          },
        ]}
      >
        <Wordmark size={34} showMark={false} inverse />
        <Animated.View
          style={{ opacity: copy.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0, 1] }) }}
        >
          <AppText variant="body" color={colors.primaryMuted} align="center">
            {t('common.tagline')}
          </AppText>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  mark: {
    width: MARK_SIZE,
    height: MARK_SIZE,
  },
  badge: {
    position: 'absolute',
  },
  pulse: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: colors.accent,
  },
  copy: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 6,
    marginTop: -4,
  },
});
