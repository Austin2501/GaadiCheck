import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { AppText, Card } from '@/components/ui';
import { indicativeStageForAqi } from '@/domain/airQuality';
import type { GrapStage, LanguageCode, ZoneId } from '@/domain/types';
import { useZoneAirQuality } from '@/hooks/queries';
import { aqiColors, colors, radius, spacing } from '@/theme';

import { ROMAN_STAGES, zoneLabel } from './verdictCopy';

interface TomorrowCardProps {
  zone: ZoneId;
  currentStage: GrapStage;
}

export function TomorrowCard({ zone, currentStage }: TomorrowCardProps) {
  const { t, i18n } = useTranslation();
  const language = i18n.language as LanguageCode;
  const { data } = useZoneAirQuality(zone);
  const tomorrow = data?.tomorrow;
  if (!tomorrow) return null;

  const palette = aqiColors[tomorrow.category];
  const category = t(`air.categories.${tomorrow.category}`);
  const likelyStage = indicativeStageForAqi(tomorrow.aqi);

  return (
    <Card>
      <View style={styles.row}>
        <View style={[styles.metric, { backgroundColor: palette.background }]}>
          <AppText variant="heading" color={palette.foreground}>
            {tomorrow.aqi}
          </AppText>
        </View>
        <View style={styles.text}>
          <AppText variant="subheading">
            {t('today.tomorrowTitle', { zone: zoneLabel(zone, language) })}
          </AppText>
          <AppText variant="callout" color={colors.inkMuted}>
            {t('today.tomorrowBody', { aqi: tomorrow.aqi, category })}
          </AppText>
        </View>
      </View>
      {likelyStage > currentStage ? (
        <AppText variant="caption" color={colors.caution} style={styles.hint}>
          {t('today.tomorrowStageHint', { stage: ROMAN_STAGES[likelyStage] })}
        </AppText>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  metric: {
    minWidth: 56,
    height: 56,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  text: {
    flex: 1,
    gap: spacing.xxs,
  },
  hint: {
    marginTop: spacing.md,
  },
});
