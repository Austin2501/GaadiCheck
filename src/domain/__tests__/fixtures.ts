import { BUNDLED_GRAP_STATUS } from '@/data/bundled';
import type { GrapStage, GrapStatus, Vehicle } from '@/domain/types';

export function makeVehicle(overrides: Partial<Vehicle> = {}): Vehicle {
  return {
    id: 'vehicle-1',
    nickname: null,
    plate: 'UP14AB1234',
    registeredInDelhi: false,
    homeZone: 'ghaziabad',
    vehicleType: 'car',
    fuel: 'petrol',
    bsNorm: 6,
    registrationDate: '2021-06-10',
    pucExpiry: '2027-03-01',
    insuranceExpiry: '2027-05-01',
    essentialService: false,
    createdAt: '2026-11-22T00:00:00.000Z',
    updatedAt: '2026-11-22T00:00:00.000Z',
    ...overrides,
  };
}

export function grapAt(stage: GrapStage): GrapStatus {
  return { ...BUNDLED_GRAP_STATUS, stage };
}

/** Mid-morning in India on the given calendar date. */
export function istMorning(date: string): Date {
  return new Date(`${date}T10:00:00+05:30`);
}
