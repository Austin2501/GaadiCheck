import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, StyleSheet, View } from 'react-native';

import { Wordmark } from '@/components/brand/Wordmark';
import { AppText, Banner, Button, EmptyState, Screen, SectionHeader } from '@/components/ui';
import type { LanguageCode } from '@/domain/types';
import { DocumentList } from '@/features/today/DocumentList';
import { StageCard } from '@/features/today/StageCard';
import { TomorrowCard } from '@/features/today/TomorrowCard';
import { VehicleSwitcher } from '@/features/today/VehicleSwitcher';
import { VerdictHero } from '@/features/today/VerdictHero';
import { ZoneList } from '@/features/today/ZoneList';
import { queryKeys, useGrapStatus } from '@/hooks/queries';
import { useAssessment } from '@/hooks/useAssessment';
import { formatCalendarDate, formatShortDay } from '@/i18n/format';
import { useActiveVehicle, useGarage } from '@/store/garage';
import { colors, spacing } from '@/theme';

export default function Today() {
  const { t, i18n } = useTranslation();
  const language = i18n.language as LanguageCode;
  const queryClient = useQueryClient();
  const vehicles = useGarage((state) => state.vehicles);
  const setActiveVehicle = useGarage((state) => state.setActiveVehicle);
  const vehicle = useActiveVehicle();
  const assessment = useAssessment(vehicle);
  const grap = useGrapStatus();
  const [refreshing, setRefreshing] = useState(false);

  const refresh = async () => {
    setRefreshing(true);
    await Promise.allSettled([
      queryClient.refetchQueries({ queryKey: queryKeys.grapStatus }),
      queryClient.refetchQueries({ queryKey: queryKeys.ruleBook }),
      vehicle
        ? queryClient.refetchQueries({ queryKey: queryKeys.airQuality(vehicle.homeZone) })
        : null,
    ]);
    setRefreshing(false);
  };

  const header = (
    <View style={styles.header}>
      <Wordmark size={20} />
      <AppText variant="calloutStrong" color={colors.inkMuted}>
        {formatShortDay(new Date(), language)}
      </AppText>
    </View>
  );

  const stageCard = (
    <StageCard
      status={grap.data.data}
      isStale={grap.isRefetchError}
      onPress={() => router.push('/guide')}
    />
  );

  if (!vehicle || !assessment) {
    return (
      <Screen>
        {header}
        {stageCard}
        <EmptyState
          icon="car-sport-outline"
          title={t('today.emptyTitle')}
          body={t('today.emptyBody')}
          action={{ label: t('garage.add'), onPress: () => router.push('/vehicle/new') }}
        />
      </Screen>
    );
  }

  const editVehicle = () => router.push({ pathname: '/vehicle/[id]', params: { id: vehicle.id } });

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
      {header}
      {grap.isRefetchError ? <Banner tone="warning" message={t('errors.refreshFailed')} /> : null}

      {vehicles.length > 1 ? (
        <VehicleSwitcher vehicles={vehicles} activeId={vehicle.id} onSelect={setActiveVehicle} />
      ) : null}

      <VerdictHero vehicle={vehicle} assessment={assessment} onFixDetails={editVehicle} />
      <Button
        label={t('today.share')}
        icon="share-social-outline"
        variant="secondary"
        onPress={() => router.push('/share')}
      />

      {stageCard}

      <SectionHeader title={t('today.areasTitle')} />
      <ZoneList vehicle={vehicle} zones={assessment.zones} />

      <SectionHeader title={t('today.documentsTitle')} />
      <DocumentList documents={assessment.documents} onEdit={editVehicle} />

      <TomorrowCard zone={vehicle.homeZone} currentStage={assessment.stage} />

      <View style={styles.footnote}>
        <AppText variant="caption" color={colors.inkSubtle} align="center">
          {t('today.checkedOn', { date: formatCalendarDate(assessment.evaluatedOn, language) })}
        </AppText>
        <AppText variant="caption" color={colors.inkSubtle} align="center">
          {t('common.disclaimerShort')}
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footnote: {
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
  },
});
