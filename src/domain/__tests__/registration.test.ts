import { suggestBsNorm } from '@/domain/bsNorm';
import { addMonths, daysBetween, fullYearsBetween, toIstDateKey } from '@/domain/dates';
import {
  formatPlate,
  isDelhiRegistration,
  parsePlate,
  suggestHomeZone,
} from '@/domain/registration';
import { nearestZone } from '@/domain/zones';

describe('parsePlate', () => {
  it('parses state plates regardless of spacing and case', () => {
    expect(parsePlate('up 14 ab 1234')).toEqual({
      kind: 'state',
      normalized: 'UP14AB1234',
      stateCode: 'UP',
      rtoCode: 'UP14',
      rtoNumber: '14',
      series: 'AB',
      number: '1234',
    });
  });

  it('pads single-digit Delhi RTO codes', () => {
    const plate = parsePlate('DL3CAB1234');
    expect(plate).toMatchObject({ kind: 'state', rtoCode: 'DL03', series: 'CAB' });
  });

  it('recognises Bharat-series plates', () => {
    expect(parsePlate('22 BH 1234 AA')).toMatchObject({ kind: 'bharat', year: '22', series: 'AA' });
  });

  it('rejects unknown state codes and malformed input', () => {
    expect(parsePlate('XX12AB1234')).toBeNull();
    expect(parsePlate('UP14AB0000')).toBeNull();
    expect(parsePlate('hello')).toBeNull();
  });

  it('formats plates for display', () => {
    expect(formatPlate('up14ab1234')).toBe('UP 14 AB 1234');
    expect(formatPlate('22bh1234aa')).toBe('22 BH 1234 AA');
    expect(formatPlate('DL3CAB1234')).toBe('DL 3 CAB 1234');
  });

  it('derives Delhi registration and home district', () => {
    const delhi = parsePlate('DL8CAF5030')!;
    const ghaziabad = parsePlate('UP14BT7788')!;
    const bharat = parsePlate('22BH1234AA')!;

    expect(isDelhiRegistration(delhi)).toBe(true);
    expect(isDelhiRegistration(ghaziabad)).toBe(false);
    expect(isDelhiRegistration(bharat)).toBeNull();
    expect(suggestHomeZone(delhi)).toBe('delhi');
    expect(suggestHomeZone(ghaziabad)).toBe('ghaziabad');
    expect(suggestHomeZone(parsePlate('MH12AB1234')!)).toBeNull();
  });
});

describe('suggestBsNorm', () => {
  it('uses the earlier NCR timeline for four-wheelers', () => {
    expect(
      suggestBsNorm({ registrationDate: '2012-07-15', vehicleType: 'car', registeredInNcr: true }),
    ).toEqual({ norm: 4, confidence: 'likely' });
  });

  it('uses the national timeline outside NCR', () => {
    expect(
      suggestBsNorm({ registrationDate: '2012-07-15', vehicleType: 'car', registeredInNcr: false }),
    ).toEqual({ norm: 3, confidence: 'likely' });
  });

  it('keeps two-wheelers on the national timeline even in NCR', () => {
    expect(
      suggestBsNorm({
        registrationDate: '2012-07-15',
        vehicleType: 'two-wheeler',
        registeredInNcr: true,
      }).norm,
    ).toBe(3);
  });

  it('marks dates close to a cut-over as uncertain', () => {
    expect(
      suggestBsNorm({ registrationDate: '2020-05-01', vehicleType: 'car', registeredInNcr: true }),
    ).toEqual({ norm: 6, confidence: 'uncertain' });
  });

  it('maps very old vehicles to BS-II or older', () => {
    expect(
      suggestBsNorm({ registrationDate: '2003-01-10', vehicleType: 'car', registeredInNcr: true })
        .norm,
    ).toBe(2);
  });
});

describe('dates', () => {
  it('uses the Indian calendar day', () => {
    expect(toIstDateKey(new Date('2026-11-22T20:00:00Z'))).toBe('2026-11-23');
  });

  it('clamps month arithmetic to the end of the month', () => {
    expect(addMonths('2024-01-31', 1)).toBe('2024-02-29');
    expect(addMonths('2026-06-01', 12)).toBe('2027-06-01');
  });

  it('counts days and completed years', () => {
    expect(daysBetween('2026-11-25', '2026-11-20')).toBe(-5);
    expect(fullYearsBetween('2015-08-01', '2026-07-31')).toBe(10);
    expect(fullYearsBetween('2015-08-01', '2026-08-01')).toBe(11);
  });
});

describe('nearestZone', () => {
  it('picks the closest covered district', () => {
    expect(nearestZone({ latitude: 28.66, longitude: 77.43 })?.zone).toBe('ghaziabad');
    expect(nearestZone({ latitude: 28.57, longitude: 77.32 })?.zone).toBe('gautam-buddh-nagar');
  });

  it('returns null far outside NCR', () => {
    expect(nearestZone({ latitude: 19.076, longitude: 72.8777 })).toBeNull();
  });
});
