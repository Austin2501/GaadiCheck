import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, StyleSheet, View } from 'react-native';

import { AppText, Banner, Screen } from '@/components/ui';
import { ZONE_IDS } from '@/domain/zones';
import { AqiScale } from '@/features/air/AqiScale';
import { AqiZoneCard } from '@/features/air/AqiZoneCard';
import { useAllZonesAirQuality } from '@/hooks/queries';
import { useActiveVehicle } from '@/store/garage';
import { colors, spacing } from '@/theme';

export default function AirQuality() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const results = useAllZonesAirQuality();
  const homeZone = useActiveVehicle()?.homeZone ?? null;
  const [refreshing, setRefreshing] = useState(false);

  const entries = ZONE_IDS.map((zone, index) => ({ zone, result: results[index]! }));
  entries.sort((a, b) => Number(b.zone === homeZone) - Number(a.zone === homeZone));
  const showsEstimates = entries.some((entry) => entry.result.data?.current?.source === 'model');

  const refresh = async () => {
    setRefreshing(true);
    await queryClient.refetchQueries({ queryKey: ['air-quality'] });
    setRefreshing(false);
  };

  return (
    <Screen
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void refresh()}
          tintColor={colors.primary}
        />
      }
    >
      <View style={styles.header}>
        <AppText variant="title" accessibilityRole="header">
          {t('air.title')}
        </AppText>
        <AppText variant="callout" color={colors.inkMuted}>
          {t('air.subtitle')}
        </AppText>
      </View>

      {entries.map(({ zone, result }) => (
        <AqiZoneCard
          key={zone}
          zone={zone}
          data={result.data}
          loading={result.isLoading || result.isFetching}
          isHome={zone === homeZone}
        />
      ))}

      {showsEstimates ? <Banner tone="neutral" message={t('air.estimatedNote')} /> : null}
      <Banner tone="info" message={t('air.grapNote')} />
      <AqiScale />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.xs,
  },
});
