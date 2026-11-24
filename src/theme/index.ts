import type { TextStyle, ViewStyle } from 'react-native';

import type { AqiCategory } from '@/domain/airQuality';
import type { GrapStage, HeadlineTone, LanguageCode, ZoneStatus } from '@/domain/types';

/** Brand palette. Indigo carries the brand; marigold is a sparing accent borrowed from number plates. */
export const colors = {
  primary: '#4338CA',
  primaryPressed: '#3730A3',
  primarySoft: '#EEF0FF',
  primaryMuted: '#C7CBF7',
  onPrimary: '#FFFFFF',
  accent: '#FFC83D',
  accentSoft: '#FFF6DB',

  ink: '#0F172A',
  inkMuted: '#475569',
  inkSubtle: '#64748B',
  inkDisabled: '#94A3B8',
  inkInverse: '#FFFFFF',

  canvas: '#F6F7FB',
  surface: '#FFFFFF',
  surfaceSunken: '#EEF1F6',
  border: '#E2E8F0',
  borderStrong: '#CBD5E1',
  overlay: 'rgba(15, 23, 42, 0.45)',

  go: '#15803D',
  goSoft: '#E7F6EC',
  caution: '#B45309',
  cautionSoft: '#FEF3E2',
  stop: '#B91C1C',
  stopSoft: '#FDECEC',
  info: '#1D4ED8',
  infoSoft: '#EAF1FE',
} as const;

export const toneColors: Record<HeadlineTone, { foreground: string; background: string }> = {
  go: { foreground: colors.go, background: colors.goSoft },
  caution: { foreground: colors.caution, background: colors.cautionSoft },
  stop: { foreground: colors.stop, background: colors.stopSoft },
};

export const zoneStatusTone: Record<ZoneStatus, HeadlineTone> = {
  allowed: 'go',
  check: 'caution',
  blocked: 'stop',
};

/** Hues follow CPCB's AQI colour bands, tuned for contrast on white. */
export const aqiColors: Record<
  AqiCategory,
  { swatch: string; foreground: string; background: string }
> = {
  good: { swatch: '#3FAE49', foreground: '#1E7B34', background: '#E7F5E9' },
  satisfactory: { swatch: '#9BCB3B', foreground: '#4D7417', background: '#F0F7E2' },
  moderate: { swatch: '#F2C014', foreground: '#8A6300', background: '#FFF6D6' },
  poor: { swatch: '#F28C28', foreground: '#B4500A', background: '#FFEEDF' },
  'very-poor': { swatch: '#E53935', foreground: '#B42318', background: '#FDE8E7' },
  severe: { swatch: '#8E1B1B', foreground: '#7A1717', background: '#F5E3E3' },
};

export const stageColors: Record<GrapStage, { solid: string; soft: string }> = {
  0: { solid: '#3FAE49', soft: '#E7F5E9' },
  1: { solid: '#E07B12', soft: '#FFEEDF' },
  2: { solid: '#D32F2F', soft: '#FDE8E7' },
  3: { solid: '#8E1B1B', soft: '#F5E3E3' },
  4: { solid: '#5B1033', soft: '#F2E2EA' },
};

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

export const fonts = {
  display: 'PlusJakartaSans_800ExtraBold',
  heading: 'PlusJakartaSans_700Bold',
  headingMedium: 'PlusJakartaSans_600SemiBold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemibold: 'Inter_600SemiBold',
} as const;

/**
 * Plus Jakarta Sans and Inter carry no Devanagari glyphs. In Hindi the UI swaps to
 * Noto Sans Devanagari at the closest weight so headings keep their hierarchy instead of
 * falling back to whatever the platform picks.
 */
const DEVANAGARI_FONTS: Record<FontFamily, string> = {
  [fonts.display]: 'NotoSansDevanagari_700Bold',
  [fonts.heading]: 'NotoSansDevanagari_700Bold',
  [fonts.headingMedium]: 'NotoSansDevanagari_600SemiBold',
  [fonts.body]: 'NotoSansDevanagari_400Regular',
  [fonts.bodyMedium]: 'NotoSansDevanagari_500Medium',
  [fonts.bodySemibold]: 'NotoSansDevanagari_600SemiBold',
};

export type FontFamily = (typeof fonts)[keyof typeof fonts];

export function fontForLanguage(family: FontFamily, language: LanguageCode): string {
  return language === 'hi' ? DEVANAGARI_FONTS[family] : family;
}

export const typography = {
  display: { fontFamily: fonts.display, fontSize: 30, lineHeight: 36, letterSpacing: -0.6 },
  title: { fontFamily: fonts.heading, fontSize: 24, lineHeight: 30, letterSpacing: -0.4 },
  heading: { fontFamily: fonts.heading, fontSize: 18, lineHeight: 24, letterSpacing: -0.2 },
  subheading: { fontFamily: fonts.bodySemibold, fontSize: 16, lineHeight: 22 },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22 },
  bodyStrong: { fontFamily: fonts.bodySemibold, fontSize: 15, lineHeight: 22 },
  callout: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20 },
  calloutStrong: { fontFamily: fonts.bodyMedium, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18 },
  overline: {
    fontFamily: fonts.bodySemibold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  metric: { fontFamily: fonts.display, fontSize: 40, lineHeight: 44, letterSpacing: -1 },
} satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;

type TypeStyle = (typeof typography)[TypographyVariant];

/**
 * Devanagari needs extra room for matras above and below the headline, and negative
 * tracking breaks up conjuncts, so the Hindi scale is looser and untracked.
 */
const devanagariTypography = Object.fromEntries(
  (Object.keys(typography) as TypographyVariant[]).map((variant) => {
    const style: TypeStyle = typography[variant];
    return [
      variant,
      {
        ...style,
        fontFamily: DEVANAGARI_FONTS[style.fontFamily],
        lineHeight: Math.round(style.lineHeight * 1.18),
        letterSpacing: 0,
      },
    ];
  }),
) as Record<TypographyVariant, TextStyle>;

export function typographyFor(variant: TypographyVariant, language: LanguageCode): TextStyle {
  return language === 'hi' ? devanagariTypography[variant] : typography[variant];
}

export const shadows = {
  card: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  raised: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
} satisfies Record<string, ViewStyle>;

/** Minimum touch target recommended by both platform guidelines. */
export const MIN_TOUCH_TARGET = 48;
