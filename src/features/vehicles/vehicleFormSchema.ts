import { z } from 'zod';

import { isIsoDate } from '@/domain/dates';
import { formatPlate, normalizePlate, parsePlate } from '@/domain/registration';
import type { BsNorm, FuelType, IsoDate, Vehicle, VehicleType, ZoneId } from '@/domain/types';
import type { VehicleInput } from '@/store/garage';

/** Validation messages are translation keys under `vehicle.*`. */
export type VehicleFormError =
  | 'plateRequired'
  | 'plateInvalid'
  | 'plateDuplicate'
  | 'delhiRequired'
  | 'homeZoneRequired'
  | 'dateInvalid';

const isoDateOrNull = z
  .string()
  .nullable()
  .refine((value) => value === null || isIsoDate(value), { message: 'dateInvalid' });

export function createVehicleFormSchema(existingPlates: readonly string[]) {
  const taken = new Set(existingPlates.map(normalizePlate));

  return z
    .object({
      plate: z
        .string()
        .refine((value) => value.trim().length > 0, { message: 'plateRequired', abort: true })
        .refine((value) => parsePlate(value) !== null, { message: 'plateInvalid' })
        .refine((value) => !taken.has(normalizePlate(value)), { message: 'plateDuplicate' }),
      nickname: z.string().max(40),
      registeredInDelhi: z.boolean().nullable(),
      vehicleType: z.enum(['car', 'two-wheeler', 'goods']),
      fuel: z.enum(['petrol', 'diesel', 'cng', 'electric', 'hybrid']),
      bsNorm: z.union([z.literal(2), z.literal(3), z.literal(4), z.literal(6)]).nullable(),
      registrationDate: isoDateOrNull,
      homeZone: z
        .enum(['delhi', 'gurugram', 'faridabad', 'ghaziabad', 'gautam-buddh-nagar', 'sonipat'])
        .nullable()
        .refine((value) => value !== null, { message: 'homeZoneRequired' }),
      pucExpiry: isoDateOrNull,
      insuranceExpiry: isoDateOrNull,
      essentialService: z.boolean(),
    })
    .superRefine((values, context) => {
      if (parsePlate(values.plate)?.kind === 'bharat' && values.registeredInDelhi === null) {
        context.addIssue({ code: 'custom', path: ['registeredInDelhi'], message: 'delhiRequired' });
      }
    });
}

export interface VehicleFormValues {
  plate: string;
  nickname: string;
  registeredInDelhi: boolean | null;
  vehicleType: VehicleType;
  fuel: FuelType;
  bsNorm: BsNorm | null;
  registrationDate: IsoDate | null;
  homeZone: ZoneId | null;
  pucExpiry: IsoDate | null;
  insuranceExpiry: IsoDate | null;
  essentialService: boolean;
}

export function toFormValues(vehicle?: Vehicle | null): VehicleFormValues {
  return {
    plate: vehicle ? formatPlate(vehicle.plate) : '',
    nickname: vehicle?.nickname ?? '',
    registeredInDelhi: vehicle ? vehicle.registeredInDelhi : null,
    vehicleType: vehicle?.vehicleType ?? 'car',
    fuel: vehicle?.fuel ?? 'petrol',
    bsNorm: vehicle?.bsNorm ?? null,
    registrationDate: vehicle?.registrationDate ?? null,
    homeZone: vehicle?.homeZone ?? null,
    pucExpiry: vehicle?.pucExpiry ?? null,
    insuranceExpiry: vehicle?.insuranceExpiry ?? null,
    essentialService: vehicle?.essentialService ?? false,
  };
}

export function toVehicleInput(values: VehicleFormValues): VehicleInput {
  const plate = parsePlate(values.plate);
  if (!plate || !values.homeZone) throw new Error('Vehicle form submitted with invalid values');
  const electric = values.fuel === 'electric';

  return {
    plate: plate.normalized,
    nickname: values.nickname.trim() || null,
    registeredInDelhi:
      plate.kind === 'state' ? plate.stateCode === 'DL' : Boolean(values.registeredInDelhi),
    homeZone: values.homeZone,
    vehicleType: values.vehicleType,
    fuel: values.fuel,
    bsNorm: electric ? null : values.bsNorm,
    registrationDate: values.registrationDate,
    pucExpiry: electric ? null : values.pucExpiry,
    insuranceExpiry: values.insuranceExpiry,
    essentialService: values.essentialService,
  };
}
