import { LinearGradient } from 'expo-linear-gradient';
import type { ComponentRef, Ref } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { PlateBadge } from '@/components/brand/PlateBadge';
import { Wordmark } from '@/components/brand/Wordmark';
import { AppText, Icon, TONE_ICONS } from '@/components/ui';
import type { LanguageCode, Vehicle, VehicleAssessment } from '@/domain/types';
import { verdictCopy, ROMAN_STAGES } from '@/features/today/verdictCopy';
import { formatShortDay } from '@/i18n/format';
import { colors, radius, spacing, toneColors } from '@/theme';

interface ShareCardProps {
  vehicle: Vehicle;
  assessment: VehicleAssessment;
  ref?: Ref<ComponentRef<typeof View>>;
}

export const SHARE_CARD_WIDTH = 320;
export const SHARE_CARD_HEIGHT = 400;

/** 4:5 card sized for Instagram and X feeds; captured at the device's pixel density. */
export function ShareCard({ vehicle, assessment, ref }: ShareCardProps) {
  const { t, i18n } = useTranslation();
  const language = i18n.language as LanguageCode;
  const { tone } = assessment.headline;
  const copy = verdictCopy(assessment, vehicle, t, language);
  const palette = toneColors[tone];

  return (
    <View ref={ref} collapsable={false} style={styles.frame}>
      <LinearGradient
        colors={[colors.primary, '#2E2A8F']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.header}>
        <Wordmark size={18} inverse />
        <AppText variant="caption" color={colors.primaryMuted}>
          {formatShortDay(new Date(), language)}
        </AppText>
      </View>

      <View style={styles.panel}>
        <View style={[styles.toneRing, { backgroundColor: palette.background }]}>
          <Icon name={TONE_ICONS[tone]} size={30} color={palette.foreground} />
        </View>
        <AppText variant="heading" align="center">
          {copy.title}
        </AppText>
        <PlateBadge plate={vehicle.plate} />
        <AppText variant="caption" color={colors.inkSubtle} align="center">
          {assessment.stage === 0
            ? t('today.stageNone')
            : `${t('today.stage', { stage: ROMAN_STAGES[assessment.stage] })} · Delhi-NCR`}
        </AppText>
      </View>

      <View style={styles.footer}>
        <AppText variant="calloutStrong" color={colors.inkInverse}>
          {t('common.tagline')}
        </AppText>
        <AppText variant="caption" color={colors.primaryMuted}>
          {t('share.cardFooter')}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: SHARE_CARD_WIDTH,
    height: SHARE_CARD_HEIGHT,
    padding: spacing.xl,
    justifyContent: 'space-between',
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  panel: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  toneRing: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
  footer: {
    gap: spacing.xxs,
  },
});
