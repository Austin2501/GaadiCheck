import * as Updates from 'expo-updates';
import { useEffect } from 'react';
import { AppState } from 'react-native';

/** Avoid a network check every time the user flicks back to the app. */
const MIN_CHECK_INTERVAL_MS = 15 * 60 * 1000;

/** Over-the-air updates only exist in release builds; dev clients and Expo Go load from Metro. */
const updatesActive = Updates.isEnabled && !__DEV__;

/**
 * The app already checks for an update on a cold start. Most people only ever switch back to it,
 * so also check when it returns to the foreground and download anything new in the background.
 * Runs once at the root of the app.
 */
export function useForegroundUpdateCheck(): void {
  useEffect(() => {
    if (!updatesActive) return;
    // The launch check has just run, so the first foreground check waits a full interval.
    let lastCheck = Date.now();

    const check = async () => {
      if (Date.now() - lastCheck < MIN_CHECK_INTERVAL_MS) return;
      lastCheck = Date.now();
      try {
        const result = await Updates.checkForUpdateAsync();
        if (result.isAvailable) await Updates.fetchUpdateAsync();
      } catch (error) {
        // Offline, or a check already running; the next foreground tries again.
        console.warn('Update check failed', error);
      }
    };

    const subscription = AppState.addEventListener('change', (status) => {
      if (status === 'active') void check();
    });
    return () => subscription.remove();
  }, []);
}

/** Whether a downloaded update is waiting for a restart, and a way to apply it now. */
export function useUpdateReady(): { ready: boolean; restart: () => void } {
  const { isUpdatePending } = Updates.useUpdates();
  return {
    ready: updatesActive && isUpdatePending,
    restart: () => {
      Updates.reloadAsync().catch((error) => console.warn('Update restart failed', error));
    },
  };
}
