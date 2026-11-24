import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage } from 'zustand/middleware';

export const persistStorage = createJSONStorage(() => AsyncStorage);

export const STORAGE_KEYS = {
  garage: 'gaadicheck/garage',
  preferences: 'gaadicheck/preferences',
  queryCache: 'gaadicheck/query-cache',
  alertTopics: 'gaadicheck/alert-topics',
} as const;
