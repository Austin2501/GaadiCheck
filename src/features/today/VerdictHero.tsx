import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { PlateBadge } from '@/components/brand/PlateBadge';
import { AppText, Button, Card, Icon, TONE_ICONS } from '@/components/ui';
import { formatBsNorm } from '@/domain/bsNorm';
import type { LanguageCode, Vehicle, VehicleAssessment } from '@/domain/types';
import { colors, radius, spacing, toneColors } from '@/theme';

import { vehicleSummary, verdictCopy } from './verdictCopy';

interface VerdictHeroProps {
  vehicle: Vehicle;
  assessment: VehicleAssessment;
  onFixDetails: () => void;
}

const FIXABLE = new Set(['needs-info', 'document-missing', 'document-expired']);

export function VerdictHero({ vehicle, assessment, onFixDetails }: VerdictHeroProps) {
  const { t, i18n } = useTranslation();
  const language = i18n.language as LanguageCode;
  const { tone, reason } = assessment.headline;
  const palette = toneColors[tone];
  const copy = verdictCopy(assessment, vehicle, t, language);

  return (
    <Card padded={false} style={styles.card}>
      <View
        style={[styles.verdict, { backgroundColor: palette.background }]}
        accessible
        accessibilityRole="summary"
        accessibilityLabel={`${copy.title}. ${copy.body}`}
        accessibilityLiveRegion="polite"
      >
        <View style={[styles.iconRing, { backgroundColor: colors.surface }]}>
          <Icon name={TONE_ICONS[tone]} size={34} color={palette.foreground} />
        </View>
        <AppText variant="title" color={colors.ink}>
          {copy.title}
        </AppText>
        <AppText variant="body" color={colors.inkMuted}>
          {copy.body}
        </AppText>
        {FIXABLE.has(reason) ? (
          <Button
            label={t('today.fixNow')}
            variant="secondary"
            icon="create-outline"
            compact
            onPress={onFixDetails}
            style={styles.fix}
          />
        ) : null}
      </View>
      <View style={styles.vehicle}>
        <PlateBadge plate={vehicle.plate} />
        <View style={styles.vehicleText}>
          {vehicle.nickname ? <AppText variant="calloutStrong">{vehicle.nickname}</AppText> : null}
          <AppText variant="caption" color={colors.inkSubtle}>
            {vehicleSummary(vehicle, t, vehicle.bsNorm ? formatBsNorm(vehicle.bsNorm) : null)}
          </AppText>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
  verdict: {
    gap: spacing.sm,
    padding: spacing.xl,
  },
  iconRing: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    marginBottom: spacing.xs,
  },
  fix: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
  },
  vehicle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  vehicleText: {
    flex: 1,
    gap: spacing.xxs,
  },
});
