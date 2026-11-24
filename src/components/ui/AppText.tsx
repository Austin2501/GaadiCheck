import { useTranslation } from 'react-i18next';
import { Text, type TextProps } from 'react-native';

import { colors, typographyFor, type TypographyVariant } from '@/theme';

export interface AppTextProps extends TextProps {
  variant?: TypographyVariant;
  color?: string;
  align?: 'left' | 'center' | 'right';
}

export function AppText({
  variant = 'body',
  color = colors.ink,
  align,
  style,
  ...rest
}: AppTextProps) {
  const { i18n } = useTranslation();
  const language = i18n.language === 'hi' ? 'hi' : 'en';

  return (
    <Text
      maxFontSizeMultiplier={1.6}
      style={[
        typographyFor(variant, language),
        { color },
        align ? { textAlign: align } : null,
        style,
      ]}
      {...rest}
    />
  );
}
