import { getLocales } from 'expo-localization';
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import type { LanguageCode, LocalizedText } from '@/domain/types';

import en from './locales/en';
import hi from './locales/hi';

export const SUPPORTED_LANGUAGES: readonly LanguageCode[] = ['en', 'hi'];

export function deviceLanguage(): LanguageCode {
  return getLocales()[0]?.languageCode === 'hi' ? 'hi' : 'en';
}

const i18n = createInstance();

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, hi: { translation: hi } },
  lng: deviceLanguage(),
  fallbackLng: 'en',
  initAsync: false,
  interpolation: { escapeValue: false },
  returnNull: false,
});

/** `null` follows the device language. */
export function applyLanguage(preference: LanguageCode | null): void {
  const next = preference ?? deviceLanguage();
  if (i18n.language !== next) void i18n.changeLanguage(next);
}

export function currentLanguage(): LanguageCode {
  return i18n.language === 'hi' ? 'hi' : 'en';
}

export function localize(text: LocalizedText, language: LanguageCode = currentLanguage()): string {
  return text[language] || text.en;
}

export default i18n;
