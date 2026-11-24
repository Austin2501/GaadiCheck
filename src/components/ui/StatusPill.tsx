import { StyleSheet, View } from 'react-native';

import type { HeadlineTone } from '@/domain/types';
import { radius, spacing, toneColors } from '@/theme';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

const TONE_ICONS: Record<HeadlineTone, IconName> = {
  go: 'checkmark-circle',
  caution: 'alert-circle',
  stop: 'close-circle',
};

interface StatusPillProps {
  tone: HeadlineTone;
  label: string;
}

/** Status is always conveyed by icon and text, never colour alone. */
export function StatusPill({ tone, label }: StatusPillProps) {
  const palette = toneColors[tone];
  return (
    <View style={[styles.pill, { backgroundColor: palette.background }]}>
      <Icon name={TONE_ICONS[tone]} size={16} color={palette.foreground} />
      <AppText variant="calloutStrong" color={palette.foreground}>
        {label}
      </AppText>
    </View>
  );
}

export { TONE_ICONS };

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radius.pill,
  },
});
