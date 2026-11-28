import { isRunningInExpoGo } from 'expo';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { addDays, isoDateToDate } from '@/domain/dates';
import { formatPlate } from '@/domain/registration';
import type { DocumentPolicy, Vehicle } from '@/domain/types';
import i18n, { currentLanguage } from '@/i18n';
import { formatCalendarDate } from '@/i18n/format';

export const NOTIFICATION_CHANNELS = {
  reminders: 'reminders',
  alerts: 'grap-alerts',
} as const;

/**
 * Expo Go keeps its own channels per project and rejects app-defined ones on Android, so channels
 * are only managed in real builds. Notifications fall back to the default channel there.
 */
const MANAGES_CHANNELS = Platform.OS === 'android' && !isRunningInExpoGo();

function channel(id: (typeof NOTIFICATION_CHANNELS)[keyof typeof NOTIFICATION_CHANNELS]) {
  return MANAGES_CHANNELS ? id : undefined;
}

const REMINDER_PREFIX = 'doc:';
const REMINDER_HOUR = 9;

export type NotificationPermission = 'granted' | 'denied' | 'undetermined';

export function configureNotificationPresentation(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

/**
 * Channels are cosmetic (names and importance in system settings); failing to create them must
 * never block the permission prompt or scheduling, so errors are reported and swallowed.
 */
export async function ensureNotificationChannels(): Promise<void> {
  if (!MANAGES_CHANNELS) return;
  const results = await Promise.allSettled([
    Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.reminders, {
      name: i18n.t('notifications.channelReminders'),
      // eslint-disable-next-line import/namespace -- re-exported enum the resolver cannot follow
      importance: Notifications.AndroidImportance.DEFAULT,
    }),
    Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.alerts, {
      name: i18n.t('notifications.channelAlerts'),
      // eslint-disable-next-line import/namespace -- re-exported enum the resolver cannot follow
      importance: Notifications.AndroidImportance.HIGH,
    }),
  ]);
  for (const result of results) {
    if (result.status === 'rejected')
      console.warn('Notification channel setup failed', result.reason);
  }
}

export async function getNotificationPermission(): Promise<NotificationPermission> {
  const { status } = await Notifications.getPermissionsAsync();
  return status as NotificationPermission;
}

export async function requestNotificationPermission(): Promise<boolean> {
  await ensureNotificationChannels();
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

interface ReminderPlan {
  identifier: string;
  fireAt: Date;
  vehicle: Vehicle;
  kind: 'puc' | 'insurance';
  expiry: string;
  leadDays: number;
}

function planReminders(vehicles: Vehicle[], policy: DocumentPolicy, now: Date): ReminderPlan[] {
  const plans: ReminderPlan[] = [];
  for (const vehicle of vehicles) {
    const documents: { kind: 'puc' | 'insurance'; expiry: string | null }[] = [
      { kind: 'puc', expiry: vehicle.fuel === 'electric' ? null : vehicle.pucExpiry },
      { kind: 'insurance', expiry: vehicle.insuranceExpiry },
    ];
    for (const { kind, expiry } of documents) {
      if (!expiry) continue;
      for (const leadDays of policy.reminderLeadDays) {
        const fireAt = isoDateToDate(addDays(expiry, -leadDays));
        fireAt.setHours(REMINDER_HOUR, 0, 0, 0);
        if (fireAt <= now) continue;
        plans.push({
          identifier: `${REMINDER_PREFIX}${vehicle.id}:${kind}:${leadDays}`,
          fireAt,
          vehicle,
          kind,
          expiry,
          leadDays,
        });
      }
    }
  }
  return plans;
}

/**
 * Rebuilds every document reminder from the current garage. Idempotent, so it is safe to call
 * whenever vehicles, language or preferences change.
 */
export async function syncDocumentReminders(
  vehicles: Vehicle[],
  policy: DocumentPolicy,
  enabled: boolean,
): Promise<void> {
  // Browsers can't schedule local notifications; reminders are an Android-app feature.
  if (Platform.OS === 'web') return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((request) => request.identifier.startsWith(REMINDER_PREFIX))
      .map((request) => Notifications.cancelScheduledNotificationAsync(request.identifier)),
  );

  if (!enabled || (await getNotificationPermission()) !== 'granted') return;

  const language = currentLanguage();
  await Promise.all(
    planReminders(vehicles, policy, new Date()).map((plan) => {
      const documentName = i18n.t(`docs.kinds.${plan.kind}`);
      const title =
        plan.leadDays === 1
          ? i18n.t('notifications.reminderTitleTomorrow', { document: documentName })
          : i18n.t('notifications.reminderTitleDays', {
              document: documentName,
              count: plan.leadDays,
            });
      return Notifications.scheduleNotificationAsync({
        identifier: plan.identifier,
        content: {
          title,
          body: i18n.t('notifications.reminderBody', {
            plate: formatPlate(plan.vehicle.plate),
            date: formatCalendarDate(plan.expiry, language),
          }),
          data: { href: `/vehicle/${plan.vehicle.id}` },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: plan.fireAt,
          channelId: channel(NOTIFICATION_CHANNELS.reminders),
        },
      });
    }),
  );
}

/** Shows a notification immediately, e.g. for an alert received while the app is open. */
export async function presentNow(title: string, body: string, href?: string): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, data: href ? { href } : {} },
    trigger: MANAGES_CHANNELS ? { channelId: NOTIFICATION_CHANNELS.alerts } : null,
  });
}

export function onNotificationOpened(handler: (href: string | null) => void): () => void {
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const href = response.notification.request.content.data?.href;
    handler(typeof href === 'string' ? href : null);
  });
  return () => subscription.remove();
}
