import { format, formatDistanceToNowStrict, type Locale } from 'date-fns';
import { enIN, hi } from 'date-fns/locale';

import { isoDateToDate } from '@/domain/dates';
import type { IsoDate, LanguageCode } from '@/domain/types';

const DATE_LOCALES: Record<LanguageCode, Locale> = { en: enIN, hi };

const DEVANAGARI_DIGITS = /[\u0966-\u096F]/g;

/**
 * date-fns' Hindi locale emits Devanagari numerals in some phrases. Everything else in the
 * app (plates, AQI, fines) uses Latin digits, so dates follow suit.
 */
function latinDigits(text: string): string {
  return text.replace(DEVANAGARI_DIGITS, (digit) => String(digit.charCodeAt(0) - 0x0966));
}

const rupees = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export function formatRupees(amount: number): string {
  return rupees.format(amount);
}

/** e.g. `25 Nov 2026`. */
export function formatCalendarDate(date: IsoDate, language: LanguageCode): string {
  return latinDigits(format(isoDateToDate(date), 'd MMM yyyy', { locale: DATE_LOCALES[language] }));
}

/** e.g. `Tue, 25 Nov`. */
export function formatShortDay(instant: Date, language: LanguageCode): string {
  return latinDigits(format(instant, 'EEE, d MMM', { locale: DATE_LOCALES[language] }));
}

/** e.g. `2 hours ago`. */
export function formatRelative(instant: Date | string | number, language: LanguageCode): string {
  return latinDigits(
    formatDistanceToNowStrict(new Date(instant), {
      addSuffix: true,
      locale: DATE_LOCALES[language],
    }),
  );
}
