import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { VehicleForm } from '@/features/vehicles/VehicleForm';
import { track } from '@/services/analytics';
import { useGarage } from '@/store/garage';

export default function NewVehicle() {
  const { t } = useTranslation();
  const { onboarding } = useLocalSearchParams<{ onboarding?: string }>();
  const addVehicle = useGarage((state) => state.addVehicle);

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
        if (onboarding) {
          router.replace('/onboarding/permissions');
        } else {
          router.back();
        }
      }}
    />
  );
}
