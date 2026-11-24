import { isIsoDate } from './dates';
import { normalizePlate, parsePlate } from './registration';
import type { BsNorm, FuelType, IsoDate, VehicleType } from './types';

const MONTHS: Readonly<Record<string, number>> = {
  JAN: 1,
  FEB: 2,
  MAR: 3,
  APR: 4,
  MAY: 5,
  JUN: 6,
  JUL: 7,
  AUG: 8,
  SEP: 9,
  SEPT: 9,
  OCT: 10,
  NOV: 11,
  DEC: 12,
};

const DATE_TOKEN_SOURCE =
  '(\\d{1,2}[-/. ](?:\\d{1,2}|[A-Za-z]{3,9})[-/. ]\\d{4}|\\d{4}-\\d{2}-\\d{2})';
const DATE_TOKEN_GLOBAL = new RegExp(DATE_TOKEN_SOURCE, 'g');
/** Label, optional separator, then the value, which OCR often puts on the next line. */
const LABEL_GAP = '\\s*[:\\-]?\\s*';

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function parseDocumentDate(raw: string): IsoDate | null {
  const value = raw.trim().toUpperCase();

  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (iso) return isIsoDate(value) ? value : null;

  const parts = /^(\d{1,2})[-/. ]([A-Z]{3,9}|\d{1,2})[-/. ](\d{4})$/.exec(value);
  if (!parts) return null;
  const [, dayText, monthText, yearText] = parts as unknown as [string, string, string, string];

  const month = /^\d+$/.test(monthText)
    ? Number(monthText)
    : (MONTHS[monthText.slice(0, 4)] ?? MONTHS[monthText.slice(0, 3)]);
  if (!month) return null;

  const candidate = `${yearText}-${pad(month)}-${pad(Number(dayText))}`;
  return isIsoDate(candidate) ? candidate : null;
}

function findLabelledDate(text: string, labelSource: string): IsoDate | null {
  const pattern = new RegExp(`${labelSource}${LABEL_GAP}${DATE_TOKEN_SOURCE}`, 'i');
  const match = pattern.exec(text);
  return match?.[1] ? parseDocumentDate(match[1]) : null;
}

function allDates(text: string): IsoDate[] {
  return [...text.matchAll(DATE_TOKEN_GLOBAL)]
    .map((match) => parseDocumentDate(match[1] ?? ''))
    .filter((date): date is IsoDate => date !== null);
}

function toFuel(raw: string): FuelType | null {
  const value = raw.toUpperCase();
  if (value.includes('CNG')) return 'cng';
  if (value.includes('HYBRID')) return 'hybrid';
  if (/ELECTRIC|\bBOV\b|\bEV\b/.test(value)) return 'electric';
  if (value.includes('DIESEL')) return 'diesel';
  if (value.includes('PETROL')) return 'petrol';
  return null;
}

const ROMAN_NORMS: Readonly<Record<string, BsNorm>> = {
  VI: 6,
  '6': 6,
  IV: 4,
  '4': 4,
  III: 3,
  '3': 3,
  II: 2,
  '2': 2,
};

function toVehicleType(raw: string): VehicleType | null {
  const value = raw.toUpperCase();
  if (/GOODS|\bLGV\b|\bMGV\b|\bHGV\b|TRUCK|CARRIER/.test(value)) return 'goods';
  if (/M-?CYCLE|MOTOR ?CYCLE|SCOOTER|MOPED|\b2W|TWO ?WHEELER/.test(value)) return 'two-wheeler';
  if (/MOTOR CAR|\bLMV\b|\bCAR\b/.test(value)) return 'car';
  return null;
}

function findPlate(text: string): string | null {
  const candidates = text
    .toUpperCase()
    .match(
      /\b(?:\d{2}\s?BH\s?\d{4}\s?[A-Z]{1,2}|[A-Z]{2}[\s-]?\d{1,2}[\s-]?(?:[A-Z][\s-]?){0,3}\d{1,4})\b/g,
    );
  if (!candidates) return null;
  for (const candidate of candidates) {
    const parsed = parsePlate(candidate);
    // Require a series or a 4-digit number so labels like "UP 14" alone are not mistaken for plates.
    if (parsed && (parsed.kind === 'bharat' || parsed.series || parsed.number.length === 4)) {
      return normalizePlate(candidate);
    }
  }
  return null;
}

export interface RcFields {
  plate?: string;
  fuel?: FuelType;
  bsNorm?: BsNorm;
  registrationDate?: IsoDate;
  vehicleType?: VehicleType;
}

/** Extracts what it can from OCR output of an RC card or an mParivahan / Vahan RC screen. */
export function parseRcText(lines: readonly string[]): RcFields {
  const text = lines.join('\n');
  const fields: RcFields = {};

  const plate = findPlate(text);
  if (plate) fields.plate = plate;

  const fuelMatch =
    /FUEL\s*(?:TYPE)?\s*[:-]?\s*(PETROL\s*\/?\s*(?:CNG|HYBRID)|DIESEL\s*\/?\s*HYBRID|STRONG\s*HYBRID|PETROL|DIESEL|CNG|ELECTRIC(?:\s*\(BOV\))?|BOV|HYBRID)/i.exec(
      text,
    );
  const fuel = fuelMatch?.[1] ? toFuel(fuelMatch[1]) : null;
  if (fuel) fields.fuel = fuel;

  const normMatch =
    /(?:FUEL|EMISSION)\s*NORMS?\s*[:-]?\s*(?:BHARAT\s*STAGE|BS)[\s-]*(VI|IV|III|II|6|4|3|2)\b/i.exec(
      text,
    ) ?? /BHARAT\s*STAGE[\s-]*(VI|IV|III|II)\b/i.exec(text);
  const norm = normMatch?.[1] ? ROMAN_NORMS[normMatch[1].toUpperCase()] : undefined;
  if (norm) fields.bsNorm = norm;

  const registrationDate = findLabelledDate(
    text,
    '(?:REG(?:ISTRATION|N)?\\.?\\s*DATE|DATE\\s*OF\\s*REG(?:ISTRATION|N)?\\.?)',
  );
  if (registrationDate) fields.registrationDate = registrationDate;

  const classMatch = /VEHICLE\s*CLASS\s*[:-]?\s*([^\n]+)/i.exec(text);
  const vehicleType = classMatch?.[1] ? toVehicleType(classMatch[1]) : null;
  if (vehicleType) fields.vehicleType = vehicleType;

  return fields;
}

export interface PucFields {
  plate?: string;
  validUntil?: IsoDate;
}

/** Reads a PUC certificate. Falls back to the latest date on the page, which is the expiry. */
export function parsePucText(lines: readonly string[]): PucFields {
  const text = lines.join('\n');
  const fields: PucFields = {};

  const plate = findPlate(text);
  if (plate) fields.plate = plate;

  const labelled = findLabelledDate(
    text,
    '(?:VALID(?:ITY)?\\s*(?:UP\\s*TO|UPTO|TILL|UNTIL|DATE)|EXPIRY(?:\\s*DATE)?|VALID\\s*THRU)',
  );
  const latest = allDates(text).sort().at(-1);
  const validUntil = labelled ?? latest;
  if (validUntil) fields.validUntil = validUntil;

  return fields;
}

export function countFields(fields: object): number {
  return Object.values(fields).filter((value) => value !== undefined).length;
}
