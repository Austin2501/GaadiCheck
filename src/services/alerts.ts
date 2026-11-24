import AsyncStorage from '@react-native-async-storage/async-storage';
import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';

import { STORAGE_KEYS } from '@/store/storage';

import { presentNow } from './notifications';

type MessagingModule = typeof import('@react-native-firebase/messaging');
type Messaging = ReturnType<MessagingModule['getMessaging']>;

interface MessagingHandle {
  module: MessagingModule;
  instance: Messaging;
}

let cachedHandle: MessagingHandle | null | undefined;

/**
 * Firebase is optional: builds without google-services.json (or Expo Go) have no native module
 * or default app. Resolve it lazily and remember the outcome.
 */
function messaging(): MessagingHandle | null {
  if (cachedHandle !== undefined) return cachedHandle;
  // Neither has the native module, and touching the package there is reported as an error.
  if (Platform.OS === 'web' || isRunningInExpoGo()) {
    cachedHandle = null;
    return cachedHandle;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const module = require('@react-native-firebase/messaging') as MessagingModule;
    cachedHandle = { module, instance: module.getMessaging() };
  } catch {
    cachedHandle = null;
  }
  return cachedHandle;
}

export function isStageAlertsSupported(): boolean {
  return messaging() !== null;
}

async function readSubscribedTopics(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.alertTopics);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string')
      : [];
  } catch {
    return [];
  }
}

/**
 * Brings FCM topic subscriptions in line with `desired`. Only the difference is sent, and the
 * stored set is updated per topic so a partial failure is retried on the next sync.
 */
export async function syncAlertTopics(desired: readonly string[]): Promise<void> {
  const handle = messaging();
  if (!handle) return;

  const current = new Set(await readSubscribedTopics());
  const target = new Set(desired);
  const { module, instance } = handle;

  for (const topic of target) {
    if (current.has(topic)) continue;
    try {
      await module.subscribeToTopic(instance, topic);
      current.add(topic);
    } catch (error) {
      console.warn(`Could not subscribe to ${topic}`, error);
    }
  }
  for (const topic of [...current]) {
    if (target.has(topic)) continue;
    try {
      await module.unsubscribeFromTopic(instance, topic);
      current.delete(topic);
    } catch (error) {
      console.warn(`Could not unsubscribe from ${topic}`, error);
    }
  }

  await AsyncStorage.setItem(STORAGE_KEYS.alertTopics, JSON.stringify([...current].sort()));
}

/**
 * While the app is in the foreground FCM does not display notification messages itself, so they
 * are re-posted locally. `onAlert` lets the caller refresh the stage immediately.
 */
export function listenForStageAlerts(onAlert: () => void): () => void {
  const handle = messaging();
  if (!handle) return () => undefined;
  return handle.module.onMessage(handle.instance, async (message) => {
    onAlert();
    const title = message.notification?.title;
    const body = message.notification?.body;
    if (title || body) await presentNow(title ?? '', body ?? '', '/');
  });
}

/** Must run at bundle start-up so Android can deliver data messages while the app is closed. */
export function registerBackgroundAlertHandler(): void {
  const handle = messaging();
  if (!handle) return;
  handle.module.setBackgroundMessageHandler(handle.instance, async () => {
    // Notification payloads are shown by the system; the stage is refreshed on next launch.
  });
}
