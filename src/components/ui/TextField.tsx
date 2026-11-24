import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { colors, fontForLanguage, fonts, radius, spacing } from '@/theme';

import { AppText } from './AppText';

interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  hint?: ReactNode;
  error?: string;
  /** Larger, letter-spaced input used for registration numbers. */
  emphasis?: boolean;
}

export function TextField({
  label,
  hint,
  error,
  emphasis = false,
  onFocus,
  onBlur,
  ...inputProps
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const { i18n } = useTranslation();
  const bodyFont = fontForLanguage(fonts.body, i18n.language === 'hi' ? 'hi' : 'en');

  return (
    <View style={styles.wrapper}>
      <AppText variant="calloutStrong" color={colors.inkMuted}>
        {label}
      </AppText>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.inkDisabled}
        selectionColor={colors.primary}
        maxFontSizeMultiplier={1.4}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        style={[
          styles.input,
          { fontFamily: bodyFont },
          emphasis && styles.emphasis,
          focused && styles.focused,
          error ? styles.invalid : null,
        ]}
        {...inputProps}
      />
      {error ? (
        <AppText variant="caption" color={colors.stop} accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : typeof hint === 'string' ? (
        <AppText variant="caption" color={colors.inkSubtle}>
          {hint}
        </AppText>
      ) : (
        hint
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.sm,
  },
  input: {
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.ink,
    fontSize: 16,
  },
  emphasis: {
    fontFamily: fonts.heading,
    fontSize: 20,
    letterSpacing: 1.6,
  },
  focused: {
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  invalid: {
    borderColor: colors.stop,
  },
});
