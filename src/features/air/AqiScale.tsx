import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { AppText, Card } from '@/components/ui';
import type { AqiCategory } from '@/domain/airQuality';
import { aqiColors, colors, radius, spacing } from '@/theme';

const BANDS: { category: AqiCategory; range: string }[] = [
  { category: 'good', range: '0–50' },
  { category: 'satisfactory', range: '51–100' },
  { category: 'moderate', range: '101–200' },
  { category: 'poor', range: '201–300' },
  { category: 'very-poor', range: '301–400' },
  { category: 'severe', range: '401–500' },
];

export function AqiScale() {
  const { t } = useTranslation();
  return (
    <Card>
      <AppText variant="subheading">{t('air.scaleTitle')}</AppText>
      <View
        style={styles.bar}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {BANDS.map(({ category }) => (
          <View
            key={category}
            style={[styles.segment, { backgroundColor: aqiColors[category].swatch }]}
          />
        ))}
      </View>
      <View style={styles.legend}>
        {BANDS.map(({ category, range }) => (
          <View key={category} style={styles.legendRow}>
            <View style={[styles.swatch, { backgroundColor: aqiColors[category].swatch }]} />
            <AppText variant="callout" style={styles.legendLabel}>
              {t(`air.categories.${category}`)}
            </AppText>
            <AppText variant="caption" color={colors.inkSubtle}>
              {range}
            </AppText>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    height: 8,
    marginVertical: spacing.md,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
  },
  legend: {
    gap: spacing.sm,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  swatch: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  legendLabel: {
    flex: 1,
  },
});
