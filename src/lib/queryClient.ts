import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { focusManager, QueryClient } from '@tanstack/react-query';
import { AppState, Platform } from 'react-native';

import { STORAGE_KEYS } from '@/store/storage';

const DAY_MS = 24 * 60 * 60 * 1000;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      gcTime: 7 * DAY_MS,
      networkMode: 'offlineFirst',
    },
  },
});

export const queryPersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: STORAGE_KEYS.queryCache,
  throttleTime: 2_000,
});

export const PERSIST_MAX_AGE_MS = 7 * DAY_MS;

/** React Native has no window focus; treat the app returning to the foreground as focus. */
export function bindQueryFocusToAppState(): () => void {
  if (Platform.OS === 'web') return () => undefined;
  const subscription = AppState.addEventListener('change', (status) => {
    focusManager.setFocused(status === 'active');
  });
  return () => subscription.remove();
}
