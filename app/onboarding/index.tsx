import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { PlateBadge } from '@/components/brand/PlateBadge';
import { Wordmark } from '@/components/brand/Wordmark';
import { AppText, Button, FadeIn, Icon, Screen, StatusPill, type IconName } from '@/components/ui';
import type { LanguageCode } from '@/domain/types';
import { useLaunchState } from '@/features/launch/launchState';
import { SUPPORTED_LANGUAGES } from '@/i18n';
import { track } from '@/services/analytics';
import { usePreferences } from '@/store/preferences';
import { colors, radius, shadows, spacing } from '@/theme';

function LanguageToggle() {
  const { t, i18n } = useTranslation();
  const setLanguage = usePreferences((state) => state.setLanguage);
  return (
    <View style={styles.toggle} accessibilityRole="radiogroup">
      {SUPPORTED_LANGUAGES.map((code: LanguageCode) => {
        const active = i18n.language === code;
        return (
          <Pressable
            key={code}
            accessibilityRole="radio"
            accessibilityState={{ checked: active }}
            onPress={() => {
              setLanguage(code);
              track('language_changed', { language: code, from: 'onboarding' });
            }}
            style={[styles.toggleOption, active && styles.toggleActive]}
          >
            <AppText variant="calloutStrong" color={active ? colors.onPrimary : colors.inkMuted}>
              {t(`languages.${code}`)}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

/** A miniature of the Today screen so the value is obvious before any input. */
function ProductPreview() {
  const { t } = useTranslation();
  return (
    <View
      style={styles.preview}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={styles.previewHeader}>
        <AppText variant="overline" color={colors.inkSubtle}>
          {t('today.stage', { stage: 'III' })}
        </AppText>
        <View style={styles.previewDot} />
      </View>
      <PlateBadge plate="UP14AB1234" size="sm" />
      <View style={styles.previewRows}>
        {[
          { zone: 'Ghaziabad', tone: 'stop' as const, label: t('today.status.blocked') },
          { zone: 'Delhi', tone: 'stop' as const, label: t('today.status.blocked') },
          { zone: 'Noida', tone: 'stop' as const, label: t('today.status.blocked') },
        ].map((row) => (
          <View key={row.zone} style={styles.previewRow}>
            <AppText variant="calloutStrong">{row.zone}</AppText>
            <StatusPill tone={row.tone} label={row.label} />
          </View>
        ))}
      </View>
    </View>
  );
}

const POINTS: { icon: IconName; title: 'point1' | 'point2' | 'point3' }[] = [
  { icon: 'car-sport-outline', title: 'point1' },
  { icon: 'map-outline', title: 'point2' },
  { icon: 'notifications-outline', title: 'point3' },
];

export default function Welcome() {
  const { t } = useTranslation();
  // On a first launch this screen sits under the launch overlay; enter as it dissolves.
  const play = useLaunchState((state) => state.settled);

  return (
    <Screen
      edges={['top']}
      footer={
        <View style={styles.footer}>
          <Button
            label={t('onboarding.cta')}
            icon="add"
            onPress={() => router.push({ pathname: '/vehicle/new', params: { onboarding: '1' } })}
          />
          <AppText variant="caption" color={colors.inkSubtle} align="center">
            {t('common.disclaimerShort')}
          </AppText>
        </View>
      }
    >
      <FadeIn play={play} style={styles.topBar}>
        <Wordmark size={20} />
        <LanguageToggle />
      </FadeIn>

      <FadeIn play={play} delay={90} offset={20}>
        <ProductPreview />
      </FadeIn>

      <FadeIn play={play} delay={180} style={styles.intro}>
        <AppText variant="display" accessibilityRole="header">
          {t('onboarding.title')}
        </AppText>
        <AppText variant="body" color={colors.inkMuted}>
          {t('onboarding.subtitle')}
        </AppText>
      </FadeIn>

      <View style={styles.points}>
        {POINTS.map(({ icon, title }, index) => (
          <FadeIn key={title} play={play} delay={260 + index * 70} style={styles.point}>
            <View style={styles.pointIcon}>
              <Icon name={icon} size={20} color={colors.primary} />
            </View>
            <View style={styles.pointText}>
              <AppText variant="bodyStrong">{t(`onboarding.${title}Title`)}</AppText>
              <AppText variant="callout" color={colors.inkMuted}>
                {t(`onboarding.${title}Body`)}
              </AppText>
            </View>
          </FadeIn>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggle: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSunken,
  },
  toggleOption: {
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
  },
  toggleActive: {
    backgroundColor: colors.primary,
  },
  preview: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    transform: [{ rotate: '-1.5deg' }],
    ...shadows.raised,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewDot: {
    width: 10,
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
  previewRows: {
    gap: spacing.sm,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  intro: {
    gap: spacing.sm,
  },
  points: {
    gap: spacing.lg,
  },
  point: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  pointIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  pointText: {
    flex: 1,
    gap: spacing.xxs,
  },
  footer: {
    gap: spacing.md,
  },
});
