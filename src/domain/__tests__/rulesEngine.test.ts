import { BUNDLED_RULE_BOOK } from '@/data/bundled';
import { alertTopicsForGarage, alertTopicsForVehicle } from '@/domain/alertTopics';
import { assessVehicle } from '@/domain/rulesEngine';
import type { GrapRule, RuleBook, VehicleAssessment, ZoneId, ZoneStatus } from '@/domain/types';
import { ZONE_IDS } from '@/domain/zones';

import { grapAt, istMorning, makeVehicle } from './fixtures';

const NOV_25 = istMorning('2026-11-25');

function statusByZone(assessment: VehicleAssessment): Record<ZoneId, ZoneStatus> {
  return Object.fromEntries(assessment.zones.map((zone) => [zone.zone, zone.status])) as Record<
    ZoneId,
    ZoneStatus
  >;
}

function everyZone(status: ZoneStatus): Record<ZoneId, ZoneStatus> {
  return Object.fromEntries(ZONE_IDS.map((zone) => [zone, status])) as Record<ZoneId, ZoneStatus>;
}

describe('assessVehicle — GRAP restrictions', () => {
  it('allows a Delhi BS-VI petrol car everywhere, even at Stage IV', () => {
    const vehicle = makeVehicle({
      plate: 'DL3CAB1234',
      registeredInDelhi: true,
      homeZone: 'delhi',
    });
    const result = assessVehicle(vehicle, BUNDLED_RULE_BOOK, grapAt(4), NOV_25);

    expect(statusByZone(result)).toEqual(everyZone('allowed'));
    expect(result.headline).toMatchObject({ tone: 'go', reason: 'all-clear' });
  });

  it('blocks a UP BS-IV diesel car in every district at Stage III', () => {
    const vehicle = makeVehicle({ fuel: 'diesel', bsNorm: 4 });
    const result = assessVehicle(vehicle, BUNDLED_RULE_BOOK, grapAt(3), NOV_25);

    expect(statusByZone(result)).toEqual(everyZone('blocked'));
    expect(result.headline).toMatchObject({ tone: 'stop', reason: 'home-blocked' });
    const ghaziabad = result.zones.find((zone) => zone.zone === 'ghaziabad');
    expect(ghaziabad?.findings[0]?.fineInr).toBe(20000);
  });

  it('keeps a UP BS-IV diesel car out of Delhi at Stage II while it can drive at home', () => {
    const vehicle = makeVehicle({ fuel: 'diesel', bsNorm: 4 });
    const result = assessVehicle(vehicle, BUNDLED_RULE_BOOK, grapAt(2), NOV_25);
    const statuses = statusByZone(result);

    expect(statuses.ghaziabad).toBe('allowed');
    expect(statuses.delhi).toBe('blocked');
    expect(result.headline).toMatchObject({
      tone: 'caution',
      reason: 'some-zones-blocked',
      blockedZones: ['delhi'],
    });
  });

  it('lifts the Delhi entry restriction once the winter window ends', () => {
    const vehicle = makeVehicle({ fuel: 'diesel', bsNorm: 4 });
    const result = assessVehicle(vehicle, BUNDLED_RULE_BOOK, grapAt(2), istMorning('2027-02-01'));

    expect(statusByZone(result)).toEqual(everyZone('allowed'));
  });

  it('does not restrict a Delhi BS-IV petrol car at Stage III', () => {
    const vehicle = makeVehicle({
      plate: 'DL8CAF5030',
      registeredInDelhi: true,
      homeZone: 'delhi',
      bsNorm: 4,
    });
    const result = assessVehicle(vehicle, BUNDLED_RULE_BOOK, grapAt(3), NOV_25);

    expect(statusByZone(result)).toEqual(everyZone('allowed'));
  });

  it('blocks a Delhi BS-III petrol car at Stage III', () => {
    const vehicle = makeVehicle({
      plate: 'DL4CAB0001',
      registeredInDelhi: true,
      homeZone: 'delhi',
      bsNorm: 3,
      registrationDate: '2008-02-01',
    });
    const result = assessVehicle(vehicle, BUNDLED_RULE_BOOK, grapAt(3), NOV_25);

    expect(statusByZone(result)).toEqual(everyZone('blocked'));
  });

  it('treats CNG cars as exempt from both the entry and Stage III rules', () => {
    const vehicle = makeVehicle({ fuel: 'cng', bsNorm: 4 });
    const result = assessVehicle(vehicle, BUNDLED_RULE_BOOK, grapAt(3), NOV_25);

    expect(statusByZone(result)).toEqual(everyZone('allowed'));
  });

  it('treats electric cars as exempt and skips the PUC requirement', () => {
    const vehicle = makeVehicle({ fuel: 'electric', bsNorm: null, pucExpiry: null });
    const result = assessVehicle(vehicle, BUNDLED_RULE_BOOK, grapAt(4), NOV_25);

    expect(statusByZone(result)).toEqual(everyZone('allowed'));
    expect(result.documents.find((doc) => doc.kind === 'puc')?.state).toBe('not-required');
  });

  it('applies petrol rules to hybrids', () => {
    const vehicle = makeVehicle({ fuel: 'hybrid', bsNorm: 3, registrationDate: '2009-05-01' });
    const result = assessVehicle(vehicle, BUNDLED_RULE_BOOK, grapAt(3), NOV_25);

    expect(statusByZone(result).ghaziabad).toBe('blocked');
  });

  it('asks for the BS norm when a rule depends on it', () => {
    const vehicle = makeVehicle({ fuel: 'diesel', bsNorm: null });
    const result = assessVehicle(vehicle, BUNDLED_RULE_BOOK, grapAt(2), NOV_25);
    const delhi = result.zones.find((zone) => zone.zone === 'delhi');

    expect(delhi?.status).toBe('check');
    expect(delhi?.findings[0]?.certainty).toBe('needs-info');
    expect(result.headline.reason).toBe('needs-info');
  });

  it('exempts essential-service vehicles', () => {
    const vehicle = makeVehicle({ fuel: 'diesel', bsNorm: 4, essentialService: true });
    const result = assessVehicle(vehicle, BUNDLED_RULE_BOOK, grapAt(3), NOV_25);

    expect(statusByZone(result)).toEqual(everyZone('allowed'));
  });

  it('leaves two-wheelers out of the car restrictions', () => {
    const vehicle = makeVehicle({
      vehicleType: 'two-wheeler',
      bsNorm: 3,
      registrationDate: '2012-01-01',
    });
    const result = assessVehicle(vehicle, BUNDLED_RULE_BOOK, grapAt(3), NOV_25);

    expect(statusByZone(result)).toEqual(everyZone('allowed'));
  });

  it('flags goods vehicles for a manual check from Stage III', () => {
    const vehicle = makeVehicle({ vehicleType: 'goods', fuel: 'diesel', bsNorm: 6 });
    const result = assessVehicle(vehicle, BUNDLED_RULE_BOOK, grapAt(3), NOV_25);

    expect(statusByZone(result)).toEqual(everyZone('check'));
    expect(result.headline.reason).toBe('check-order');
  });
});

describe('assessVehicle — odd-even rationing', () => {
  const oddEven: GrapRule = {
    id: 'delhi-odd-even',
    zones: ['delhi'],
    conditions: {
      vehicleTypes: ['car'],
      fuels: ['petrol', 'diesel'],
      oddEven: true,
      exceptWeekdays: [0],
      validFrom: '2026-11-23',
      validUntil: '2026-11-30',
    },
    severity: 'blocked',
    fineInr: 20000,
    title: { en: 'Odd-even rationing', hi: 'ऑड-ईवन' },
    explanation: { en: 'Odd plates on odd dates.', hi: 'विषम तारीख़ पर विषम नंबर।' },
    sourceUrl: 'https://transport.delhi.gov.in',
  };
  const book: RuleBook = { ...BUNDLED_RULE_BOOK, rules: [oddEven] };
  const delhiStatus = (plate: string, date: string, fuel: 'petrol' | 'cng' = 'petrol') =>
    statusByZone(assessVehicle(makeVehicle({ plate, fuel }), book, grapAt(2), istMorning(date)))
      .delhi;

  it('keeps an even plate off the road on an odd date', () => {
    expect(delhiStatus('UP14AB1234', '2026-11-25')).toBe('blocked');
  });

  it('lets the same plate drive on an even date', () => {
    expect(delhiStatus('UP14AB1234', '2026-11-26')).toBe('allowed');
  });

  it('reads the number, not the trailing letters, on BH plates', () => {
    expect(delhiStatus('22BH1235AA', '2026-11-25')).toBe('allowed');
    expect(delhiStatus('22BH1235AA', '2026-11-24')).toBe('blocked');
  });

  it('is off on the excepted weekday', () => {
    // 29 Nov 2026 is a Sunday.
    expect(delhiStatus('UP14AB1234', '2026-11-29')).toBe('allowed');
  });

  it('respects fuel exemptions and zones', () => {
    expect(delhiStatus('UP14AB1234', '2026-11-25', 'cng')).toBe('allowed');
    const ghaziabad = statusByZone(
      assessVehicle(makeVehicle(), book, grapAt(2), istMorning('2026-11-25')),
    ).ghaziabad;
    expect(ghaziabad).toBe('allowed');
  });
});

describe('assessVehicle — documents', () => {
  it('stops the driver when the PUC has expired', () => {
    const vehicle = makeVehicle({ pucExpiry: '2026-11-20' });
    const result = assessVehicle(vehicle, BUNDLED_RULE_BOOK, grapAt(1), NOV_25);
    const puc = result.documents.find((doc) => doc.kind === 'puc');

    expect(puc).toMatchObject({ state: 'expired', daysLeft: -5, fineInr: 10000 });
    expect(result.headline).toMatchObject({
      tone: 'stop',
      reason: 'document-expired',
      documentKind: 'puc',
    });
  });

  it('marks a PUC expiring within the week', () => {
    const vehicle = makeVehicle({ pucExpiry: '2026-11-30' });
    const result = assessVehicle(vehicle, BUNDLED_RULE_BOOK, grapAt(1), NOV_25);

    expect(result.documents.find((doc) => doc.kind === 'puc')).toMatchObject({
      state: 'expiring',
      daysLeft: 5,
    });
  });

  it('treats a first-year vehicle without a PUC date as covered', () => {
    const vehicle = makeVehicle({ registrationDate: '2026-06-01', pucExpiry: null });
    const result = assessVehicle(vehicle, BUNDLED_RULE_BOOK, grapAt(1), NOV_25);

    expect(result.documents.find((doc) => doc.kind === 'puc')).toMatchObject({
      state: 'covered-new',
      date: '2027-06-01',
    });
    expect(result.headline.tone).toBe('go');
  });

  it('nudges for a PUC date on older vehicles', () => {
    const vehicle = makeVehicle({ pucExpiry: null });
    const result = assessVehicle(vehicle, BUNDLED_RULE_BOOK, grapAt(1), NOV_25);

    expect(result.headline).toMatchObject({ tone: 'caution', reason: 'document-missing' });
  });

  it('warns when a diesel car crosses ten years', () => {
    const vehicle = makeVehicle({ fuel: 'diesel', bsNorm: 4, registrationDate: '2015-08-01' });
    const result = assessVehicle(vehicle, BUNDLED_RULE_BOOK, grapAt(0), NOV_25);

    expect(result.documents.find((doc) => doc.kind === 'age')).toMatchObject({
      state: 'end-of-life',
      ageYears: 11,
      ageLimitYears: 10,
    });
  });
});

describe('alert topics', () => {
  it('subscribes restricted vehicles to the rules that can affect them', () => {
    const vehicle = makeVehicle({ fuel: 'diesel', bsNorm: 4 });

    expect(alertTopicsForVehicle(vehicle, BUNDLED_RULE_BOOK.rules, '2026-11-25')).toEqual([
      'ncr-all',
      'rule-delhi-entry',
      'rule-grap3',
      'zone-ghaziabad',
    ]);
  });

  it('keeps unaffected vehicles on the regional and district topics only', () => {
    const vehicle = makeVehicle({ registeredInDelhi: true, homeZone: 'delhi' });

    expect(alertTopicsForVehicle(vehicle, BUNDLED_RULE_BOOK.rules, '2026-11-25')).toEqual([
      'ncr-all',
      'zone-delhi',
    ]);
  });

  it('drops topics for rules whose window has closed', () => {
    const vehicle = makeVehicle({ fuel: 'petrol', bsNorm: 4 });

    expect(alertTopicsForVehicle(vehicle, BUNDLED_RULE_BOOK.rules, '2027-03-01')).toEqual([
      'ncr-all',
      'zone-ghaziabad',
    ]);
  });

  it('merges topics across the garage without duplicates', () => {
    const vehicles = [
      makeVehicle({ id: 'a', fuel: 'diesel', bsNorm: 4 }),
      makeVehicle({ id: 'b', homeZone: 'gurugram', plate: 'HR26DK8337' }),
    ];

    expect(alertTopicsForGarage(vehicles, BUNDLED_RULE_BOOK.rules, '2026-11-25')).toEqual([
      'ncr-all',
      'rule-delhi-entry',
      'rule-grap3',
      'zone-ghaziabad',
      'zone-gurugram',
    ]);
  });
});
