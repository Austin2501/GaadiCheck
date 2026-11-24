import {
  addMonths,
  dayOfMonth,
  dayOfWeek,
  daysBetween,
  fullYearsBetween,
  toIstDateKey,
} from './dates';
import type {
  DocumentCheck,
  DocumentPolicy,
  DocumentState,
  Finding,
  FuelType,
  GrapRule,
  GrapStage,
  GrapStatus,
  Headline,
  IsoDate,
  MatchResult,
  RuleBook,
  Vehicle,
  VehicleAssessment,
  ZoneStatus,
  ZoneVerdict,
} from './types';
import { ZONE_IDS } from './zones';

/** Hybrids are regulated by their petrol engine's norm. */
const RULE_FUEL: Record<FuelType, FuelType> = {
  petrol: 'petrol',
  diesel: 'diesel',
  cng: 'cng',
  electric: 'electric',
  hybrid: 'petrol',
};

/**
 * The digit odd-even schemes go by: the last digit of the registration number. For BH plates
 * the number sits before the trailing series letters, so this is the last digit anywhere.
 */
function lastPlateDigit(plate: string): number | null {
  const digits = plate.match(/\d/g);
  return digits ? Number(digits[digits.length - 1]) : null;
}

export interface MatchContext {
  /** `'any'` evaluates the rule as if its stage threshold were already met. */
  stage: GrapStage | 'any';
  /** `'any'` ignores the rule's validity window. */
  today: IsoDate | 'any';
}

export function matchRule(rule: GrapRule, vehicle: Vehicle, context: MatchContext): MatchResult {
  const { conditions } = rule;

  if (
    conditions.minStage !== undefined &&
    context.stage !== 'any' &&
    context.stage < conditions.minStage
  ) {
    return 'no';
  }
  if (context.today !== 'any') {
    if (conditions.validFrom && context.today < conditions.validFrom) return 'no';
    if (conditions.validUntil && context.today > conditions.validUntil) return 'no';
    if (conditions.exceptWeekdays?.includes(dayOfWeek(context.today))) return 'no';
  }
  if (conditions.vehicleTypes && !conditions.vehicleTypes.includes(vehicle.vehicleType)) {
    return 'no';
  }
  if (conditions.fuels && !conditions.fuels.includes(RULE_FUEL[vehicle.fuel])) return 'no';
  if (
    conditions.registeredInDelhi !== undefined &&
    conditions.registeredInDelhi !== vehicle.registeredInDelhi
  ) {
    return 'no';
  }
  if (conditions.exemptEssentialServices && vehicle.essentialService) return 'no';

  if (conditions.oddEven && context.today !== 'any') {
    const digit = lastPlateDigit(vehicle.plate);
    if (digit === null) return 'unknown';
    if (digit % 2 === dayOfMonth(context.today) % 2) return 'no';
  }

  if (conditions.maxBsNorm !== undefined) {
    if (vehicle.bsNorm === null) return 'unknown';
    if (vehicle.bsNorm > conditions.maxBsNorm) return 'no';
  }
  return 'yes';
}

function toFinding(rule: GrapRule, match: Exclude<MatchResult, 'no'>): Finding {
  return {
    ruleId: rule.id,
    severity: match === 'yes' ? rule.severity : 'check',
    certainty: match === 'yes' ? 'confirmed' : 'needs-info',
    title: rule.title,
    explanation: rule.explanation,
    fineInr: rule.fineInr,
    sourceUrl: rule.sourceUrl,
  };
}

function statusFor(findings: Finding[]): ZoneStatus {
  if (findings.some((finding) => finding.severity === 'blocked')) return 'blocked';
  return findings.length > 0 ? 'check' : 'allowed';
}

export function evaluateZones(
  vehicle: Vehicle,
  rules: GrapRule[],
  context: { stage: GrapStage; today: IsoDate },
): ZoneVerdict[] {
  return ZONE_IDS.map((zone) => {
    const findings: Finding[] = [];
    for (const rule of rules) {
      if (!rule.zones.includes(zone)) continue;
      const match = matchRule(rule, vehicle, context);
      if (match !== 'no') findings.push(toFinding(rule, match));
    }
    return { zone, status: statusFor(findings), findings };
  });
}

function expiryCheck(
  kind: 'puc' | 'insurance',
  expiry: IsoDate,
  today: IsoDate,
  policy: DocumentPolicy,
): DocumentCheck {
  const daysLeft = daysBetween(today, expiry);
  const state: DocumentState =
    daysLeft < 0 ? 'expired' : daysLeft <= policy.expiringSoonDays ? 'expiring' : 'valid';
  return {
    kind,
    state,
    daysLeft,
    date: expiry,
    fineInr: kind === 'puc' && state === 'expired' ? policy.pucFineInr : null,
  };
}

function checkPuc(vehicle: Vehicle, policy: DocumentPolicy, today: IsoDate): DocumentCheck {
  if (vehicle.fuel === 'electric') {
    return { kind: 'puc', state: 'not-required', daysLeft: null, date: null, fineInr: null };
  }
  if (vehicle.pucExpiry) return expiryCheck('puc', vehicle.pucExpiry, today, policy);

  if (vehicle.registrationDate) {
    const coveredUntil = addMonths(vehicle.registrationDate, policy.newVehiclePucValidityMonths);
    if (today < coveredUntil) {
      return {
        kind: 'puc',
        state: 'covered-new',
        daysLeft: daysBetween(today, coveredUntil),
        date: coveredUntil,
        fineInr: null,
      };
    }
  }
  return { kind: 'puc', state: 'missing', daysLeft: null, date: null, fineInr: policy.pucFineInr };
}

function checkInsurance(vehicle: Vehicle, policy: DocumentPolicy, today: IsoDate): DocumentCheck {
  if (vehicle.insuranceExpiry) {
    return expiryCheck('insurance', vehicle.insuranceExpiry, today, policy);
  }
  return { kind: 'insurance', state: 'missing', daysLeft: null, date: null, fineInr: null };
}

function checkAge(vehicle: Vehicle, policy: DocumentPolicy, today: IsoDate): DocumentCheck | null {
  if (vehicle.fuel === 'electric' || !vehicle.registrationDate) return null;
  const limit =
    vehicle.fuel === 'diesel' ? policy.ageLimitYears.diesel : policy.ageLimitYears.petrol;
  const ageYears = fullYearsBetween(vehicle.registrationDate, today);
  return {
    kind: 'age',
    state: ageYears >= limit ? 'end-of-life' : 'ok',
    daysLeft: null,
    date: vehicle.registrationDate,
    fineInr: null,
    ageYears,
    ageLimitYears: limit,
  };
}

export function checkDocuments(
  vehicle: Vehicle,
  policy: DocumentPolicy,
  today: IsoDate,
): DocumentCheck[] {
  const checks: (DocumentCheck | null)[] = [
    checkPuc(vehicle, policy, today),
    checkInsurance(vehicle, policy, today),
    checkAge(vehicle, policy, today),
  ];
  return checks.filter((check): check is DocumentCheck => check !== null);
}

export function buildHeadline(
  vehicle: Vehicle,
  zones: ZoneVerdict[],
  documents: DocumentCheck[],
): Headline {
  const blockedZones = zones.filter((zone) => zone.status === 'blocked').map((zone) => zone.zone);
  const homeVerdict = zones.find((zone) => zone.zone === vehicle.homeZone);

  if (homeVerdict?.status === 'blocked') {
    return { tone: 'stop', reason: 'home-blocked', blockedZones };
  }

  const expired = documents.find(
    (doc) => doc.state === 'expired' && (doc.kind === 'puc' || doc.kind === 'insurance'),
  );
  if (expired) {
    return { tone: 'stop', reason: 'document-expired', blockedZones, documentKind: expired.kind };
  }

  if (blockedZones.length > 0) {
    return { tone: 'caution', reason: 'some-zones-blocked', blockedZones };
  }

  const findings = zones.flatMap((zone) => zone.findings);
  if (findings.some((finding) => finding.certainty === 'needs-info')) {
    return { tone: 'caution', reason: 'needs-info', blockedZones };
  }
  if (findings.length > 0) {
    return { tone: 'caution', reason: 'check-order', blockedZones };
  }

  const missingPuc = documents.find((doc) => doc.kind === 'puc' && doc.state === 'missing');
  if (missingPuc) {
    return { tone: 'caution', reason: 'document-missing', blockedZones, documentKind: 'puc' };
  }

  return { tone: 'go', reason: 'all-clear', blockedZones };
}

export function assessVehicle(
  vehicle: Vehicle,
  ruleBook: RuleBook,
  grapStatus: GrapStatus,
  now: Date = new Date(),
): VehicleAssessment {
  const today = toIstDateKey(now);
  const zones = evaluateZones(vehicle, ruleBook.rules, { stage: grapStatus.stage, today });
  const documents = checkDocuments(vehicle, ruleBook.documents, today);
  return {
    vehicleId: vehicle.id,
    stage: grapStatus.stage,
    evaluatedOn: today,
    zones,
    documents,
    headline: buildHeadline(vehicle, zones, documents),
  };
}
