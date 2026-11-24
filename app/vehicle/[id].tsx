import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import { formatPlate } from '@/domain/registration';
import { VehicleForm } from '@/features/vehicles/VehicleForm';
import { track } from '@/services/analytics';
import { useGarage, useVehicle } from '@/store/garage';

export default function EditVehicle() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const vehicle = useVehicle(id);
  const updateVehicle = useGarage((state) => state.updateVehicle);
  const removeVehicle = useGarage((state) => state.removeVehicle);

  if (!vehicle) return <Redirect href="/(tabs)/vehicles" />;

  const confirmRemove = () => {
    Alert.alert(
      t('vehicle.removeTitle'),
      t('vehicle.removeBody', { plate: formatPlate(vehicle.plate) }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('vehicle.remove'),
          style: 'destructive',
          onPress: () => {
            removeVehicle(vehicle.id);
            track('vehicle_removed');
            router.back();
          },
        },
      ],
    );
  };

  return (
    <VehicleForm
      key={vehicle.id}
      initial={vehicle}
      submitLabel={t('vehicle.saveChanges')}
      onSubmit={(input) => {
        updateVehicle(vehicle.id, input);
        track('vehicle_updated');
        router.back();
      }}
      onRemove={confirmRemove}
    />
  );
}
