import * as Haptics from 'expo-haptics';
import { ActivityIndicator, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { colors, MIN_TOUCH_TARGET, radius, spacing } from '@/theme';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  compact?: boolean;
  style?: ViewStyle;
  accessibilityHint?: string;
}

const VARIANTS: Record<
  ButtonVariant,
  { background: string; pressed: string; foreground: string; border?: string }
> = {
  primary: {
    background: colors.primary,
    pressed: colors.primaryPressed,
    foreground: colors.onPrimary,
  },
  secondary: {
    background: colors.surface,
    pressed: colors.surfaceSunken,
    foreground: colors.primary,
    border: colors.primaryMuted,
  },
  ghost: { background: 'transparent', pressed: colors.primarySoft, foreground: colors.primary },
  danger: {
    background: colors.surface,
    pressed: colors.stopSoft,
    foreground: colors.stop,
    border: '#F3C4C4',
  },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
  compact = false,
  style,
  accessibilityHint,
}: ButtonProps) {
  const palette = VARIANTS[variant];
  const inactive = disabled || loading;

  const handlePress = () => {
    if (variant === 'primary') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.base,
        compact ? styles.compact : styles.regular,
        {
          backgroundColor: pressed ? palette.pressed : palette.background,
          borderColor: palette.border ?? 'transparent',
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.foreground} />
      ) : (
        <View style={styles.content}>
          {icon ? <Icon name={icon} size={compact ? 18 : 20} color={palette.foreground} /> : null}
          <AppText variant={compact ? 'calloutStrong' : 'bodyStrong'} color={palette.foreground}>
            {label}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
  },
  regular: {
    minHeight: 52,
    paddingHorizontal: spacing.xl,
  },
  compact: {
    minHeight: MIN_TOUCH_TARGET - 8,
    paddingHorizontal: spacing.lg,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
