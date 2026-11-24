import { useSyncExternalStore } from 'react';

import { useGarage } from './garage';
import { usePreferences } from './preferences';

const stores = [useGarage, usePreferences] as const;

function allHydrated(): boolean {
  return stores.every((store) => store.persist.hasHydrated());
}

function subscribe(onChange: () => void): () => void {
  const unsubscribers = stores.map((store) => store.persist.onFinishHydration(onChange));
  return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
}

/** `true` once every persisted store has been restored from disk. */
export function useStoresHydrated(): boolean {
  return useSyncExternalStore(subscribe, allHydrated, allHydrated);
}
