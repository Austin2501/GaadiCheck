import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppText, Card, Icon } from '@/components/ui';
import { indicativeStageForAqi } from '@/domain/airQuality';
import type { GrapStage, LanguageCode, ZoneId } from '@/domain/types';
import { AqiTile } from '@/features/air/AqiTile';
import { SourceLabel } from '@/features/air/SourceLabel';
import { useZoneAirQuality } from '@/hooks/queries';
import type { AqiReading } from '@/services/airQuality';
import { colors, spacing } from '@/theme';

import { ROMAN_STAGES, zoneLabel } from './verdictCopy';

interface AirTodayCardProps {
  zone: ZoneId;
  currentStage: GrapStage;
}

/** Today's AQI next to tomorrow's outlook for one district; opens the full air screen. */
export function AirTodayCard({ zone, currentStage }: AirTodayCardProps) {
  const { t, i18n } = useTranslation();
  const language = i18n.language as LanguageCode;
  const { data, isPending } = useZoneAirQuality(zone);
  const current = data?.current ?? null;
  const tomorrow = data?.tomorrow ?? null;
  const name = zoneLabel(zone, language);

  // Either today's air or tomorrow's forecast can run ahead of the stage in force.
  const likelyStage = Math.max(
    current ? indicativeStageForAqi(current.aqi) : 0,
    tomorrow ? indicativeStageForAqi(tomorrow.aqi) : 0,
  ) as GrapStage;

  const describe = (label: string, reading: AqiReading | null) =>
    reading
      ? `${label}: AQI ${reading.aqi}, ${t(`air.categories.${reading.category}`)}`
      : `${label}: ${t('air.noReading')}`;

  return (
    <Card
      onPress={() => router.navigate('/air')}
      accessibilityLabel={[
        t('today.airTitle', { zone: name }),
        describe(t('air.today'), current),
        describe(t('air.tomorrow'), tomorrow),
        t('today.airOpen'),
      ].join('. ')}
    >
      <View style={styles.header}>
        <AppText variant="subheading">{t('today.airTitle', { zone: name })}</AppText>
        <Icon name="chevron-forward" size={18} color={colors.inkSubtle} />
      </View>

      {current || tomorrow ? (
        <View style={styles.tiles}>
          <AqiTile label={t('air.today')} reading={current} />
          <AqiTile label={t('air.tomorrow')} reading={tomorrow} note={t('air.forecast')} />
        </View>
      ) : isPending ? (
        <View style={[styles.tiles, styles.loading]}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <AppText variant="callout" color={colors.inkSubtle}>
          {t('air.unavailable')}
        </AppText>
      )}

      {current ? <SourceLabel reading={current} showUpdated /> : null}

      {likelyStage > currentStage ? (
        <View style={styles.hint}>
          <Icon name="trending-up" size={16} color={colors.caution} />
          <AppText variant="caption" color={colors.caution} style={styles.hintText}>
            {t('today.airStageHint', { stage: ROMAN_STAGES[likelyStage] })}
          </AppText>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  tiles: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  loading: {
    minHeight: 112,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  hintText: {
    flex: 1,
  },
});
