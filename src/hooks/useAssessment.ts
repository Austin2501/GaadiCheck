import { useMemo } from 'react';

import { assessVehicle } from '@/domain/rulesEngine';
import type { Vehicle, VehicleAssessment } from '@/domain/types';

import { useNow } from './useNow';
import { useGrapStatus, useRuleBook } from './queries';

export function useAssessment(vehicle: Vehicle | null): VehicleAssessment | null {
  const { data: status } = useGrapStatus();
  const { data: ruleBook } = useRuleBook();
  const now = useNow();

  return useMemo(
    () => (vehicle ? assessVehicle(vehicle, ruleBook.data, status.data, now) : null),
    [vehicle, ruleBook.data, status.data, now],
  );
}
