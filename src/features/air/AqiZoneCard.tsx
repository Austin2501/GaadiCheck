import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppText, Card } from '@/components/ui';
import type { LanguageCode, ZoneId } from '@/domain/types';
import { zoneLabel } from '@/features/today/verdictCopy';
import type { AqiReading, ZoneAirQuality } from '@/services/airQuality';
import { aqiColors, colors, radius, spacing } from '@/theme';

interface AqiZoneCardProps {
  zone: ZoneId;
  data: ZoneAirQuality | undefined;
  loading: boolean;
  isHome: boolean;
}

function SourceLabel({ reading }: { reading: AqiReading }) {
  const { t } = useTranslation();
  return (
    <AppText variant="caption" color={colors.inkSubtle}>
      {reading.source === 'cpcb'
        ? t('air.sourceCpcb', { count: reading.stationCount ?? 1 })
        : t('air.sourceModel')}
      {' · '}
      {t('air.prominent', { pollutant: reading.prominent })}
    </AppText>
  );
}

export function AqiZoneCard({ zone, data, loading, isHome }: AqiZoneCardProps) {
  const { t, i18n } = useTranslation();
  const language = i18n.language as LanguageCode;
  const current = data?.current ?? null;
  const tomorrow = data?.tomorrow ?? null;
  const palette = current ? aqiColors[current.category] : null;
  const name = zoneLabel(zone, language);

  return (
    <Card>
      <View style={styles.header}>
        <View style={styles.title}>
          <AppText variant="subheading">{name}</AppText>
          {isHome ? (
            <View style={styles.homeTag}>
              <AppText variant="caption" color={colors.primary}>
                {t('today.homeTag')}
              </AppText>
            </View>
          ) : null}
        </View>
        {loading && !data ? <ActivityIndicator color={colors.primary} /> : null}
      </View>

      {current && palette ? (
        <View
          style={styles.body}
          accessible
          accessibilityLabel={`${name}: AQI ${current.aqi}, ${t(`air.categories.${current.category}`)}`}
        >
          <View style={[styles.metric, { backgroundColor: palette.background }]}>
            <AppText variant="metric" color={palette.foreground}>
              {current.aqi}
            </AppText>
            <AppText variant="calloutStrong" color={palette.foreground}>
              {t(`air.categories.${current.category}`)}
            </AppText>
          </View>
          <View style={styles.side}>
            <SourceLabel reading={current} />
            {tomorrow ? (
              <View style={styles.tomorrow}>
                <AppText variant="caption" color={colors.inkSubtle}>
                  {t('air.tomorrow')}
                </AppText>
                <View style={styles.tomorrowValue}>
                  <View
                    style={[styles.dot, { backgroundColor: aqiColors[tomorrow.category].swatch }]}
                  />
                  <AppText variant="calloutStrong">
                    {tomorrow.aqi} · {t(`air.categories.${tomorrow.category}`)}
                  </AppText>
                </View>
              </View>
            ) : null}
          </View>
        </View>
      ) : !loading ? (
        <AppText variant="callout" color={colors.inkSubtle} style={styles.unavailable}>
          {t('air.unavailable')}
        </AppText>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  homeTag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 1,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  metric: {
    minWidth: 112,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  side: {
    flex: 1,
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  tomorrow: {
    gap: spacing.xxs,
  },
  tomorrowValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: radius.pill,
  },
  unavailable: {
    marginTop: spacing.sm,
  },
});
