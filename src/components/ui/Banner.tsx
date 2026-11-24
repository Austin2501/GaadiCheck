import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

type BannerTone = 'info' | 'success' | 'warning' | 'danger' | 'neutral';

const TONES: Record<BannerTone, { foreground: string; background: string; icon: IconName }> = {
  info: { foreground: colors.info, background: colors.infoSoft, icon: 'information-circle' },
  success: { foreground: colors.go, background: colors.goSoft, icon: 'checkmark-circle' },
  warning: { foreground: colors.caution, background: colors.cautionSoft, icon: 'alert-circle' },
  danger: { foreground: colors.stop, background: colors.stopSoft, icon: 'warning' },
  neutral: {
    foreground: colors.inkMuted,
    background: colors.surfaceSunken,
    icon: 'information-circle-outline',
  },
};

interface BannerProps {
  message: string;
  tone?: BannerTone;
  title?: string;
  icon?: IconName;
  action?: { label: string; onPress: () => void };
}

export function Banner({ message, tone = 'info', title, icon, action }: BannerProps) {
  const palette = TONES[tone];
  return (
    <View
      accessibilityRole={tone === 'danger' || tone === 'warning' ? 'alert' : 'summary'}
      style={[styles.banner, { backgroundColor: palette.background }]}
    >
      <Icon name={icon ?? palette.icon} size={20} color={palette.foreground} />
      <View style={styles.body}>
        {title ? (
          <AppText variant="calloutStrong" color={palette.foreground}>
            {title}
          </AppText>
        ) : null}
        <AppText variant="callout" color={colors.ink}>
          {message}
        </AppText>
        {action ? (
          <Pressable accessibilityRole="button" onPress={action.onPress} hitSlop={8}>
            <AppText variant="calloutStrong" color={palette.foreground}>
              {action.label}
            </AppText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.md,
  },
  body: {
    flex: 1,
    gap: spacing.xs,
  },
});
