import {
  createVehicleFormSchema,
  toFormValues,
  type VehicleFormValues,
} from '../vehicleFormSchema';

function firstErrors(values: Partial<VehicleFormValues>, existing: string[] = []) {
  const result = createVehicleFormSchema(existing).safeParse({ ...toFormValues(), ...values });
  if (result.success) return {};
  const byField: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const field = String(issue.path[0]);
    byField[field] ??= issue.message;
  }
  return byField;
}

describe('vehicle form validation', () => {
  it('asks for the number when the plate is empty, not for a valid format', () => {
    expect(firstErrors({ plate: '  ', homeZone: 'delhi' }).plate).toBe('plateRequired');
  });

  it('explains the expected format for an unreadable plate', () => {
    expect(firstErrors({ plate: 'ABC', homeZone: 'delhi' }).plate).toBe('plateInvalid');
  });

  it('flags a vehicle that is already saved', () => {
    expect(firstErrors({ plate: 'DL3CAB1234', homeZone: 'delhi' }, ['DL3CAB1234']).plate).toBe(
      'plateDuplicate',
    );
  });

  it('names the missing home area', () => {
    expect(firstErrors({ plate: 'DL3CAB1234' }).homeZone).toBe('homeZoneRequired');
  });

  it('asks where a BH-series vehicle is registered', () => {
    expect(firstErrors({ plate: '22BH1234AA', homeZone: 'delhi' }).registeredInDelhi).toBe(
      'delhiRequired',
    );
  });

  it('accepts a complete vehicle', () => {
    expect(firstErrors({ plate: 'DL3CAB1234', homeZone: 'delhi' })).toEqual({});
  });
});
