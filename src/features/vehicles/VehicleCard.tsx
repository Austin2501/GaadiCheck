import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { PlateBadge } from '@/components/brand/PlateBadge';
import { AppText, Card, Icon, StatusPill } from '@/components/ui';
import { formatBsNorm } from '@/domain/bsNorm';
import type { LanguageCode, Vehicle } from '@/domain/types';
import { vehicleSummary, verdictCopy, zoneLabel } from '@/features/today/verdictCopy';
import { useAssessment } from '@/hooks/useAssessment';
import { colors, spacing } from '@/theme';

interface VehicleCardProps {
  vehicle: Vehicle;
  onPress: () => void;
}

export function VehicleCard({ vehicle, onPress }: VehicleCardProps) {
  const { t, i18n } = useTranslation();
  const language = i18n.language as LanguageCode;
  const assessment = useAssessment(vehicle);
  const copy = assessment ? verdictCopy(assessment, vehicle, t, language) : null;

  return (
    <Card
      onPress={onPress}
      accessibilityLabel={`${vehicle.nickname ?? vehicle.plate}. ${copy?.title ?? ''}`}
    >
      <View style={styles.top}>
        <PlateBadge plate={vehicle.plate} />
        <Icon name="chevron-forward" size={18} color={colors.inkDisabled} />
      </View>
      <View style={styles.text}>
        {vehicle.nickname ? <AppText variant="subheading">{vehicle.nickname}</AppText> : null}
        <AppText variant="callout" color={colors.inkMuted}>
          {vehicleSummary(vehicle, t, vehicle.bsNorm ? formatBsNorm(vehicle.bsNorm) : null)}
        </AppText>
        <AppText variant="caption" color={colors.inkSubtle}>
          {t('garage.drivesIn', { zone: zoneLabel(vehicle.homeZone, language) })}
        </AppText>
      </View>
      {assessment && copy ? (
        <View style={styles.status}>
          <StatusPill tone={assessment.headline.tone} label={copy.title} />
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  text: {
    gap: spacing.xxs,
    marginTop: spacing.md,
  },
  status: {
    marginTop: spacing.md,
    alignItems: 'flex-start',
  },
});
