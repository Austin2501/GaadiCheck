import Constants from 'expo-constants';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Pressable, StyleSheet, Switch, View } from 'react-native';

import { AppText, Banner, Card, ListRow, Screen, SectionHeader } from '@/components/ui';
import type { LanguageCode } from '@/domain/types';
import { SUPPORTED_LANGUAGES } from '@/i18n';
import { isStageAlertsSupported } from '@/services/alerts';
import { track } from '@/services/analytics';
import { openLink } from '@/services/links';
import {
  getNotificationPermission,
  requestNotificationPermission,
  type NotificationPermission,
} from '@/services/notifications';
import { usePreferences } from '@/store/preferences';
import { colors, MIN_TOUCH_TARGET, radius, spacing } from '@/theme';

function PreferenceSwitch({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <Switch
      accessibilityLabel={label}
      value={value}
      disabled={disabled}
      onValueChange={onChange}
      trackColor={{ true: colors.primary, false: colors.borderStrong }}
      thumbColor={colors.surface}
    />
  );
}

function LanguageSelector() {
  const { t, i18n } = useTranslation();
  const setLanguage = usePreferences((state) => state.setLanguage);
  return (
    <View
      style={styles.segmented}
      accessibilityRole="radiogroup"
      accessibilityLabel={t('more.language')}
    >
      {SUPPORTED_LANGUAGES.map((code: LanguageCode) => {
        const active = i18n.language === code;
        return (
          <Pressable
            key={code}
            accessibilityRole="radio"
            accessibilityState={{ checked: active }}
            onPress={() => {
              setLanguage(code);
              track('language_changed', { language: code, from: 'settings' });
            }}
            style={[styles.segment, active && styles.segmentActive]}
          >
            <AppText variant="calloutStrong" color={active ? colors.primary : colors.inkMuted}>
              {t(`languages.${code}`)}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function More() {
  const { t } = useTranslation();
  const remindersEnabled = usePreferences((state) => state.remindersEnabled);
  const alertsEnabled = usePreferences((state) => state.alertsEnabled);
  const setRemindersEnabled = usePreferences((state) => state.setRemindersEnabled);
  const setAlertsEnabled = usePreferences((state) => state.setAlertsEnabled);
  const requestDeviceSync = usePreferences((state) => state.requestDeviceSync);
  const [permission, setPermission] = useState<NotificationPermission>('undetermined');
  const alertsSupported = isStageAlertsSupported();

  useFocusEffect(
    useCallback(() => {
      void getNotificationPermission().then(setPermission);
    }, []),
  );

  const toggle = async (kind: 'reminders' | 'alerts', enabled: boolean) => {
    if (enabled && permission !== 'granted') {
      const granted = await requestNotificationPermission();
      setPermission(granted ? 'granted' : 'denied');
      if (!granted) return;
    }
    if (kind === 'reminders') setRemindersEnabled(enabled);
    else setAlertsEnabled(enabled);
    requestDeviceSync();
    track(kind === 'reminders' ? 'reminders_toggled' : 'alerts_toggled', { enabled });
  };

  return (
    <Screen>
      <AppText variant="title" accessibilityRole="header">
        {t('more.title')}
      </AppText>

      <SectionHeader title={t('more.preferences')} />
      <Card padded={false}>
        <ListRow
          icon="language-outline"
          title={t('more.language')}
          trailing={<LanguageSelector />}
        />
        <ListRow
          icon="megaphone-outline"
          title={t('more.alerts')}
          subtitle={alertsSupported ? t('more.alertsHint') : t('more.alertsUnavailable')}
          trailing={
            <PreferenceSwitch
              label={t('more.alerts')}
              value={alertsSupported && alertsEnabled && permission === 'granted'}
              disabled={!alertsSupported}
              onChange={(value) => void toggle('alerts', value)}
            />
          }
        />
        <ListRow
          icon="alarm-outline"
          title={t('more.reminders')}
          subtitle={t('more.remindersHint')}
          trailing={
            <PreferenceSwitch
              label={t('more.reminders')}
              value={remindersEnabled && permission === 'granted'}
              onChange={(value) => void toggle('reminders', value)}
            />
          }
          last
        />
      </Card>
      {permission === 'denied' ? (
        <Banner
          tone="warning"
          message={t('more.notificationsOff')}
          action={{ label: t('more.openSettings'), onPress: () => void Linking.openSettings() }}
        />
      ) : null}

      <SectionHeader title={t('more.help')} />
      <Card padded={false}>
        <ListRow
          icon="layers-outline"
          title={t('more.guide')}
          onPress={() => router.push('/guide')}
        />
        <ListRow
          icon="navigate-outline"
          title={t('more.findPuc')}
          onPress={() => void openLink('pucCentresNearby')}
        />
        <ListRow
          icon="receipt-outline"
          title={t('more.echallan')}
          onPress={() => void openLink('echallan')}
        />
        <ListRow
          icon="leaf-outline"
          title={t('more.pucStatus')}
          onPress={() => void openLink('pucStatus')}
        />
        <ListRow
          icon="phone-portrait-outline"
          title={t('more.mParivahan')}
          onPress={() => void openLink('mParivahan')}
          last
        />
      </Card>

      <SectionHeader title={t('more.about')} />
      <Card padded={false}>
        <ListRow
          icon="document-text-outline"
          title={t('more.sources')}
          onPress={() => router.push('/sources')}
          last
        />
      </Card>
      <Card>
        <AppText variant="subheading">{t('more.disclaimer')}</AppText>
        <AppText variant="callout" color={colors.inkMuted} style={styles.disclaimer}>
          {t('more.disclaimerBody')}
        </AppText>
      </Card>

      <AppText variant="caption" color={colors.inkSubtle} align="center">
        {t('common.appName')} ·{' '}
        {t('more.version', { version: Constants.expoConfig?.version ?? '1.0.0' })}
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  segmented: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSunken,
  },
  segment: {
    minHeight: MIN_TOUCH_TARGET - 12,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
  },
  segmentActive: {
    backgroundColor: colors.surface,
  },
  disclaimer: {
    marginTop: spacing.sm,
  },
});
