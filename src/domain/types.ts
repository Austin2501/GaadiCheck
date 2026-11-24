export type ZoneId =
  'delhi' | 'gurugram' | 'faridabad' | 'ghaziabad' | 'gautam-buddh-nagar' | 'sonipat';

export type GrapStage = 0 | 1 | 2 | 3 | 4;

export type FuelType = 'petrol' | 'diesel' | 'cng' | 'electric' | 'hybrid';

export type VehicleType = 'car' | 'two-wheeler' | 'goods';

/** Bharat Stage emission norm. `2` stands for BS-II or older; BS-V was never introduced. */
export type BsNorm = 2 | 3 | 4 | 6;

export type LanguageCode = 'en' | 'hi';

export type LocalizedText = Record<LanguageCode, string>;

/** Calendar date in `yyyy-MM-dd` form, interpreted in Indian Standard Time. */
export type IsoDate = string;

export interface Vehicle {
  id: string;
  nickname: string | null;
  /** Upper-case registration number without spaces, e.g. `UP14AB1234`. */
  plate: string;
  registeredInDelhi: boolean;
  homeZone: ZoneId;
  vehicleType: VehicleType;
  fuel: FuelType;
  bsNorm: BsNorm | null;
  registrationDate: IsoDate | null;
  pucExpiry: IsoDate | null;
  insuranceExpiry: IsoDate | null;
  essentialService: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GrapStatus {
  stage: GrapStage;
  effectiveFrom: string;
  orderUrl: string;
  note: LocalizedText;
  updatedAt: string;
  rulesVersion: number;
}

export type RuleSeverity = 'blocked' | 'check';

export interface RuleConditions {
  vehicleTypes?: VehicleType[];
  fuels?: FuelType[];
  /** Rule applies to vehicles at or below this norm. */
  maxBsNorm?: BsNorm;
  registeredInDelhi?: boolean;
  minStage?: GrapStage;
  validFrom?: IsoDate;
  validUntil?: IsoDate;
  /** Days of the week the rule is off, 0 = Sunday (odd-even has historically skipped Sundays). */
  exceptWeekdays?: number[];
  /**
   * Odd-even rationing: matches when the last digit of the registration number has the
   * opposite parity to the day of the month.
   */
  oddEven?: boolean;
  exemptEssentialServices?: boolean;
}

export interface GrapRule {
  id: string;
  zones: ZoneId[];
  conditions: RuleConditions;
  severity: RuleSeverity;
  fineInr: number | null;
  alertTopic?: string;
  title: LocalizedText;
  explanation: LocalizedText;
  sourceUrl: string;
}

export interface DocumentPolicy {
  pucFineInr: number;
  newVehiclePucValidityMonths: number;
  reminderLeadDays: number[];
  expiringSoonDays: number;
  ageLimitYears: { diesel: number; petrol: number };
}

export interface RuleBook {
  version: number;
  updatedAt: string;
  documents: DocumentPolicy;
  rules: GrapRule[];
}

/** Whether the rule's conditions hold for the vehicle; `unknown` when the profile lacks data. */
export type MatchResult = 'yes' | 'no' | 'unknown';

export interface Finding {
  ruleId: string;
  severity: RuleSeverity;
  certainty: 'confirmed' | 'needs-info';
  title: LocalizedText;
  explanation: LocalizedText;
  fineInr: number | null;
  sourceUrl: string;
}

export type ZoneStatus = 'allowed' | 'blocked' | 'check';

export interface ZoneVerdict {
  zone: ZoneId;
  status: ZoneStatus;
  findings: Finding[];
}

export type DocumentKind = 'puc' | 'insurance' | 'age';

export type DocumentState =
  | 'valid'
  | 'expiring'
  | 'expired'
  | 'missing'
  | 'not-required'
  | 'covered-new'
  | 'end-of-life'
  | 'ok';

export interface DocumentCheck {
  kind: DocumentKind;
  state: DocumentState;
  /** Days until expiry (negative once expired). */
  daysLeft: number | null;
  date: IsoDate | null;
  fineInr: number | null;
  /** For the age check: years since registration. */
  ageYears?: number;
  ageLimitYears?: number;
}

export type HeadlineTone = 'go' | 'caution' | 'stop';

export type HeadlineReason =
  | 'all-clear'
  | 'home-blocked'
  | 'some-zones-blocked'
  | 'needs-info'
  | 'check-order'
  | 'document-expired'
  | 'document-missing';

export interface Headline {
  tone: HeadlineTone;
  reason: HeadlineReason;
  blockedZones: ZoneId[];
  documentKind?: DocumentKind;
}

export interface VehicleAssessment {
  vehicleId: string;
  stage: GrapStage;
  evaluatedOn: IsoDate;
  zones: ZoneVerdict[];
  documents: DocumentCheck[];
  headline: Headline;
}
