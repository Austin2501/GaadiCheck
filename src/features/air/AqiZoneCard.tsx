import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppText, Card } from '@/components/ui';
import type { LanguageCode, ZoneId } from '@/domain/types';
import { zoneLabel } from '@/features/today/verdictCopy';
import type { AqiReading, ZoneAirQuality } from '@/services/airQuality';
import { colors, radius, spacing } from '@/theme';

import { AqiTile } from './AqiTile';
import { SourceLabel } from './SourceLabel';

interface AqiZoneCardProps {
  zone: ZoneId;
  data: ZoneAirQuality | undefined;
  loading: boolean;
  isHome: boolean;
}

export function AqiZoneCard({ zone, data, loading, isHome }: AqiZoneCardProps) {
  const { t, i18n } = useTranslation();
  const language = i18n.language as LanguageCode;
  const current = data?.current ?? null;
  const tomorrow = data?.tomorrow ?? null;
  const name = zoneLabel(zone, language);

  const describe = (label: string, reading: AqiReading | null) =>
    reading
      ? `${label}: AQI ${reading.aqi}, ${t(`air.categories.${reading.category}`)}`
      : `${label}: ${t('air.noReading')}`;

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

      {current || tomorrow ? (
        <View
          style={styles.body}
          accessible
          accessibilityLabel={[
            name,
            describe(t('air.today'), current),
            describe(t('air.tomorrow'), tomorrow),
          ].join('. ')}
        >
          <View style={styles.tiles}>
            <AqiTile label={t('air.today')} reading={current} />
            <AqiTile label={t('air.tomorrow')} reading={tomorrow} note={t('air.forecast')} />
          </View>
          {current ? <SourceLabel reading={current} /> : null}
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
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  tiles: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  unavailable: {
    marginTop: spacing.sm,
  },
});
