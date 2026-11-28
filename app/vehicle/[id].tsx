import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { formatPlate } from '@/domain/registration';
import { VehicleForm } from '@/features/vehicles/VehicleForm';
import { track } from '@/services/analytics';
import { confirmAction } from '@/services/confirm';
import { useGarage, useVehicle } from '@/store/garage';

export default function EditVehicle() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const vehicle = useVehicle(id);
  const updateVehicle = useGarage((state) => state.updateVehicle);
  const removeVehicle = useGarage((state) => state.removeVehicle);

  if (!vehicle) return <Redirect href="/(tabs)/vehicles" />;

  const confirmRemove = async () => {
    const confirmed = await confirmAction({
      title: t('vehicle.removeTitle'),
      message: t('vehicle.removeBody', { plate: formatPlate(vehicle.plate) }),
      confirmLabel: t('vehicle.remove'),
      cancelLabel: t('common.cancel'),
      destructive: true,
    });
    if (!confirmed) return;
    removeVehicle(vehicle.id);
    track('vehicle_removed');
    // A deep-linked edit screen on web has nothing to go back to.
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/vehicles');
  };

  return (
    <VehicleForm
      key={vehicle.id}
      initial={vehicle}
      submitLabel={t('vehicle.saveChanges')}
      onSubmit={(input) => {
        updateVehicle(vehicle.id, input);
        track('vehicle_updated');
        if (router.canGoBack()) router.back();
        else router.replace('/(tabs)/vehicles');
      }}
      onRemove={() => void confirmRemove()}
    />
  );
}
