import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState } from 'react-native';

import { alertTopicsForGarage } from '@/domain/alertTopics';
import { toIstDateKey } from '@/domain/dates';
import { listenForStageAlerts, syncAlertTopics } from '@/services/alerts';
import {
  configureNotificationPresentation,
  ensureNotificationChannels,
  onNotificationOpened,
  syncDocumentReminders,
} from '@/services/notifications';
import { useGarage } from '@/store/garage';
import { usePreferences } from '@/store/preferences';

import { queryKeys, useRuleBook } from './queries';

configureNotificationPresentation();

/**
 * Keeps device-level side effects — scheduled reminders and alert topic subscriptions — in step
 * with the garage and preferences. Runs once at the root of the app.
 */
export function useDeviceSync(): void {
  const queryClient = useQueryClient();
  const { i18n } = useTranslation();
  const vehicles = useGarage((state) => state.vehicles);
  const remindersEnabled = usePreferences((state) => state.remindersEnabled);
  const alertsEnabled = usePreferences((state) => state.alertsEnabled);
  const syncNonce = usePreferences((state) => state.syncNonce);
  const { data: ruleBook } = useRuleBook();
  const [foregroundTick, setForegroundTick] = useState(0);

  useEffect(() => {
    void ensureNotificationChannels();
    const subscription = AppState.addEventListener('change', (status) => {
      // Permissions may have changed in system settings while the app was in the background.
      if (status === 'active') setForegroundTick((tick) => tick + 1);
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    syncDocumentReminders(vehicles, ruleBook.data.documents, remindersEnabled).catch((error) =>
      console.warn('Reminder sync failed', error),
    );
  }, [
    vehicles,
    ruleBook.data.documents,
    remindersEnabled,
    i18n.language,
    syncNonce,
    foregroundTick,
  ]);

  useEffect(() => {
    const topics = alertsEnabled
      ? alertTopicsForGarage(vehicles, ruleBook.data.rules, toIstDateKey(new Date()))
      : [];
    syncAlertTopics(topics).catch((error) => console.warn('Alert topic sync failed', error));
  }, [vehicles, ruleBook.data.rules, alertsEnabled, syncNonce]);

  useEffect(
    () =>
      listenForStageAlerts(() => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.grapStatus });
        void queryClient.invalidateQueries({ queryKey: queryKeys.ruleBook });
      }),
    [queryClient],
  );

  useEffect(
    () =>
      onNotificationOpened((href) => {
        if (href) router.push(href as never);
      }),
    [],
  );
}
