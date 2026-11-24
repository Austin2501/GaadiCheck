import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui';
import type { AqiReading } from '@/services/airQuality';
import { aqiColors, colors, radius, spacing } from '@/theme';

interface AqiTileProps {
  label: string;
  reading: AqiReading | null;
  /** Small line under the category, e.g. to mark a forecast. */
  note?: string;
}

/** One AQI figure on its category colour; used in pairs for today and tomorrow. */
export function AqiTile({ label, reading, note }: AqiTileProps) {
  const { t } = useTranslation();
  const palette = reading ? aqiColors[reading.category] : null;
  const ink = palette?.foreground ?? colors.inkSubtle;

  return (
    <View style={[styles.tile, { backgroundColor: palette?.background ?? colors.canvas }]}>
      <AppText variant="overline" color={ink}>
        {label}
      </AppText>
      <AppText variant="metric" color={ink}>
        {reading ? reading.aqi : '—'}
      </AppText>
      <AppText variant="calloutStrong" color={ink} numberOfLines={1}>
        {reading ? t(`air.categories.${reading.category}`) : t('air.noReading')}
      </AppText>
      {note && reading ? (
        <AppText variant="caption" color={ink}>
          {note}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    gap: spacing.xxs,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
});
