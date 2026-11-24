import type { LocalizedText, ZoneId } from './types';

export type ParsedPlate =
  | {
      kind: 'state';
      normalized: string;
      stateCode: string;
      /** State code plus two-digit RTO number, e.g. `UP14`. */
      rtoCode: string;
      /** RTO number as written on the plate, e.g. `3` for `DL 3C AB 1234`. */
      rtoNumber: string;
      series: string;
      number: string;
    }
  | {
      kind: 'bharat';
      normalized: string;
      year: string;
      number: string;
      series: string;
    };

const STATE_PLATE = /^([A-Z]{2})(\d{1,2})([A-Z]{0,3})(\d{1,4})$/;
const BHARAT_PLATE = /^(\d{2})BH(\d{4})([A-Z]{1,2})$/;

export const STATE_NAMES: Readonly<Record<string, LocalizedText>> = {
  AN: { en: 'Andaman & Nicobar', hi: 'अंडमान और निकोबार' },
  AP: { en: 'Andhra Pradesh', hi: 'आंध्र प्रदेश' },
  AR: { en: 'Arunachal Pradesh', hi: 'अरुणाचल प्रदेश' },
  AS: { en: 'Assam', hi: 'असम' },
  BR: { en: 'Bihar', hi: 'बिहार' },
  CG: { en: 'Chhattisgarh', hi: 'छत्तीसगढ़' },
  CH: { en: 'Chandigarh', hi: 'चंडीगढ़' },
  DD: { en: 'Dadra & Nagar Haveli and Daman & Diu', hi: 'दादरा और नगर हवेली और दमन और दीव' },
  DL: { en: 'Delhi', hi: 'दिल्ली' },
  GA: { en: 'Goa', hi: 'गोवा' },
  GJ: { en: 'Gujarat', hi: 'गुजरात' },
  HP: { en: 'Himachal Pradesh', hi: 'हिमाचल प्रदेश' },
  HR: { en: 'Haryana', hi: 'हरियाणा' },
  JH: { en: 'Jharkhand', hi: 'झारखंड' },
  JK: { en: 'Jammu & Kashmir', hi: 'जम्मू और कश्मीर' },
  KA: { en: 'Karnataka', hi: 'कर्नाटक' },
  KL: { en: 'Kerala', hi: 'केरल' },
  LA: { en: 'Ladakh', hi: 'लद्दाख' },
  LD: { en: 'Lakshadweep', hi: 'लक्षद्वीप' },
  MH: { en: 'Maharashtra', hi: 'महाराष्ट्र' },
  ML: { en: 'Meghalaya', hi: 'मेघालय' },
  MN: { en: 'Manipur', hi: 'मणिपुर' },
  MP: { en: 'Madhya Pradesh', hi: 'मध्य प्रदेश' },
  MZ: { en: 'Mizoram', hi: 'मिज़ोरम' },
  NL: { en: 'Nagaland', hi: 'नागालैंड' },
  OD: { en: 'Odisha', hi: 'ओडिशा' },
  OR: { en: 'Odisha', hi: 'ओडिशा' },
  PB: { en: 'Punjab', hi: 'पंजाब' },
  PY: { en: 'Puducherry', hi: 'पुडुचेरी' },
  RJ: { en: 'Rajasthan', hi: 'राजस्थान' },
  SK: { en: 'Sikkim', hi: 'सिक्किम' },
  TN: { en: 'Tamil Nadu', hi: 'तमिलनाडु' },
  TR: { en: 'Tripura', hi: 'त्रिपुरा' },
  TS: { en: 'Telangana', hi: 'तेलंगाना' },
  UK: { en: 'Uttarakhand', hi: 'उत्तराखंड' },
  UA: { en: 'Uttarakhand', hi: 'उत्तराखंड' },
  UP: { en: 'Uttar Pradesh', hi: 'उत्तर प्रदेश' },
  WB: { en: 'West Bengal', hi: 'पश्चिम बंगाल' },
};

/**
 * RTO offices whose registrations default to a covered district. Intentionally limited to
 * the primary office of each district; users can always change the home area.
 */
const RTO_HOME_ZONES: Readonly<Record<string, ZoneId>> = {
  UP14: 'ghaziabad',
  UP16: 'gautam-buddh-nagar',
  HR26: 'gurugram',
  HR51: 'faridabad',
  HR10: 'sonipat',
};

export function normalizePlate(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function parsePlate(input: string): ParsedPlate | null {
  const normalized = normalizePlate(input);

  const bharat = BHARAT_PLATE.exec(normalized);
  if (bharat) {
    const [, year, number, series] = bharat as unknown as [string, string, string, string];
    return { kind: 'bharat', normalized, year, number, series };
  }

  const state = STATE_PLATE.exec(normalized);
  if (!state) return null;
  const [, stateCode, rtoDigits, series, number] = state as unknown as [
    string,
    string,
    string,
    string,
    string,
  ];
  if (!STATE_NAMES[stateCode] || Number(number) === 0) return null;
  return {
    kind: 'state',
    normalized,
    stateCode,
    rtoCode: `${stateCode}${rtoDigits.padStart(2, '0')}`,
    rtoNumber: rtoDigits,
    series,
    number,
  };
}

export function formatPlate(input: string): string {
  const parsed = parsePlate(input);
  if (!parsed) return normalizePlate(input);
  if (parsed.kind === 'bharat') {
    return `${parsed.year} BH ${parsed.number} ${parsed.series}`;
  }
  return [parsed.stateCode, parsed.rtoNumber, parsed.series, parsed.number]
    .filter(Boolean)
    .join(' ');
}

/** `true`/`false` when the plate settles it, `null` for Bharat-series plates. */
export function isDelhiRegistration(plate: ParsedPlate): boolean | null {
  return plate.kind === 'state' ? plate.stateCode === 'DL' : null;
}

export function suggestHomeZone(plate: ParsedPlate): ZoneId | null {
  if (plate.kind !== 'state') return null;
  if (plate.stateCode === 'DL') return 'delhi';
  return RTO_HOME_ZONES[plate.rtoCode] ?? null;
}

/** Registered with an NCR transport office we can place, which affects historic BS norm dates. */
export function isNcrRegistration(plate: ParsedPlate): boolean {
  return suggestHomeZone(plate) !== null;
}
