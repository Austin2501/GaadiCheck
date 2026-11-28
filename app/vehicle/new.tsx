import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';

import { VehicleForm } from '@/features/vehicles/VehicleForm';
import { track } from '@/services/analytics';
import { useGarage } from '@/store/garage';
import { usePreferences } from '@/store/preferences';

export default function NewVehicle() {
  const { t } = useTranslation();
  const { onboarding } = useLocalSearchParams<{ onboarding?: string }>();
  const addVehicle = useGarage((state) => state.addVehicle);
  const completeOnboarding = usePreferences((state) => state.completeOnboarding);

  return (
    <VehicleForm
      submitLabel={t('vehicle.save')}
      onSubmit={(input) => {
        addVehicle(input);
        track('vehicle_added', {
          type: input.vehicleType,
          fuel: input.fuel,
          bs: input.bsNorm ?? 'unknown',
          zone: input.homeZone,
        });
        if (onboarding && Platform.OS === 'web') {
          // Browsers can't schedule the reminders the permission step asks for.
          completeOnboarding();
          track('onboarding_completed', { notifications: false });
          router.replace('/(tabs)');
        } else if (onboarding) {
          router.replace('/onboarding/permissions');
        } else if (router.canGoBack()) {
          router.back();
        } else {
          // Opened directly by URL on web, so there is no screen to return to.
          router.replace('/(tabs)/vehicles');
        }
      }}
    />
  );
}
