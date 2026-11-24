import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, EmptyState, Screen } from '@/components/ui';
import { VehicleCard } from '@/features/vehicles/VehicleCard';
import { useGarage } from '@/store/garage';
import { colors, spacing } from '@/theme';

export default function Vehicles() {
  const { t } = useTranslation();
  const vehicles = useGarage((state) => state.vehicles);
  const addVehicle = () => router.push('/vehicle/new');

  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="title" accessibilityRole="header">
          {t('garage.title')}
        </AppText>
        <AppText variant="callout" color={colors.inkMuted}>
          {t('garage.subtitle')}
        </AppText>
      </View>

      {vehicles.length === 0 ? (
        <EmptyState
          icon="car-sport-outline"
          title={t('garage.emptyTitle')}
          body={t('garage.emptyBody')}
          action={{ label: t('garage.add'), onPress: addVehicle }}
        />
      ) : (
        <>
          {vehicles.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              onPress={() => router.push({ pathname: '/vehicle/[id]', params: { id: vehicle.id } })}
            />
          ))}
          <Button label={t('garage.add')} icon="add" variant="secondary" onPress={addVehicle} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.xs,
  },
});
