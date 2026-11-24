import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, MIN_TOUCH_TARGET, radius, spacing } from '@/theme';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

export interface Choice<T extends string | number> {
  value: T;
  label: string;
  icon?: IconName;
}

interface ChoiceGroupProps<T extends string | number> {
  label: string;
  choices: readonly Choice<T>[];
  value: T | null;
  onChange: (value: T) => void;
  hint?: string;
  error?: string;
}

/** Single-select chips; announced as a radio group to screen readers. */
export function ChoiceGroup<T extends string | number>({
  label,
  choices,
  value,
  onChange,
  hint,
  error,
}: ChoiceGroupProps<T>) {
  return (
    <View style={styles.wrapper}>
      <AppText variant="calloutStrong" color={colors.inkMuted}>
        {label}
      </AppText>
      <View accessibilityRole="radiogroup" accessibilityLabel={label} style={styles.row}>
        {choices.map((choice) => {
          const selected = choice.value === value;
          return (
            <Pressable
              key={String(choice.value)}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={choice.label}
              onPress={() => {
                void Haptics.selectionAsync();
                onChange(choice.value);
              }}
              style={({ pressed }) => [
                styles.chip,
                selected && styles.chipSelected,
                pressed && !selected && styles.chipPressed,
              ]}
            >
              {choice.icon ? (
                <Icon
                  name={choice.icon}
                  size={18}
                  color={selected ? colors.primary : colors.inkMuted}
                />
              ) : null}
              <AppText variant="calloutStrong" color={selected ? colors.primary : colors.ink}>
                {choice.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
      {error ? (
        <AppText variant="caption" color={colors.stop}>
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="caption" color={colors.inkSubtle}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    minHeight: MIN_TOUCH_TARGET - 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  chipPressed: {
    backgroundColor: colors.surfaceSunken,
  },
});
