import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, MIN_TOUCH_TARGET, radius, spacing } from '@/theme';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

interface ListRowProps {
  title: string;
  subtitle?: string;
  icon?: IconName;
  iconColor?: string;
  iconBackground?: string;
  /** Rendered on the right; defaults to a chevron when the row is pressable. */
  trailing?: ReactNode;
  onPress?: () => void;
  accessibilityHint?: string;
  last?: boolean;
}

export function ListRow({
  title,
  subtitle,
  icon,
  iconColor = colors.primary,
  iconBackground = colors.primarySoft,
  trailing,
  onPress,
  accessibilityHint,
  last = false,
}: ListRowProps) {
  const content = (
    <>
      {icon ? (
        <View style={[styles.iconTile, { backgroundColor: iconBackground }]}>
          <Icon name={icon} size={18} color={iconColor} />
        </View>
      ) : null}
      <View style={styles.text}>
        <AppText variant="bodyStrong">{title}</AppText>
        {subtitle ? (
          <AppText variant="caption" color={colors.inkSubtle}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {trailing ??
        (onPress ? <Icon name="chevron-forward" size={18} color={colors.inkDisabled} /> : null)}
    </>
  );

  const rowStyle = [styles.row, !last && styles.divider];

  if (!onPress) return <View style={rowStyle}>{content}</View>;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      style={({ pressed }) => [rowStyle, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: MIN_TOUCH_TARGET + 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  pressed: {
    backgroundColor: colors.surfaceSunken,
  },
  iconTile: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  text: {
    flex: 1,
    gap: spacing.xxs,
  },
});
