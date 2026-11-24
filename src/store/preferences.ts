import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { LanguageCode } from '@/domain/types';

import { persistStorage, STORAGE_KEYS } from './storage';

interface PreferencesState {
  /** `null` follows the device language. */
  language: LanguageCode | null;
  hasOnboarded: boolean;
  remindersEnabled: boolean;
  alertsEnabled: boolean;
  /** Not persisted. Bumped to force a re-sync of reminders and alert topics, e.g. after a permission grant. */
  syncNonce: number;
  setLanguage: (language: LanguageCode | null) => void;
  completeOnboarding: () => void;
  setRemindersEnabled: (enabled: boolean) => void;
  setAlertsEnabled: (enabled: boolean) => void;
  requestDeviceSync: () => void;
}

export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      language: null,
      hasOnboarded: false,
      remindersEnabled: true,
      alertsEnabled: true,
      syncNonce: 0,
      setLanguage: (language) => set({ language }),
      completeOnboarding: () => set({ hasOnboarded: true }),
      setRemindersEnabled: (remindersEnabled) => set({ remindersEnabled }),
      setAlertsEnabled: (alertsEnabled) => set({ alertsEnabled }),
      requestDeviceSync: () => set((state) => ({ syncNonce: state.syncNonce + 1 })),
    }),
    {
      name: STORAGE_KEYS.preferences,
      storage: persistStorage,
      version: 1,
      partialize: ({ language, hasOnboarded, remindersEnabled, alertsEnabled }) => ({
        language,
        hasOnboarded,
        remindersEnabled,
        alertsEnabled,
      }),
    },
  ),
);
