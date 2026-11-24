import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, Icon, Screen } from '@/components/ui';
import { track } from '@/services/analytics';
import { requestNotificationPermission } from '@/services/notifications';
import { usePreferences } from '@/store/preferences';
import { colors, radius, spacing } from '@/theme';

const BULLETS = ['permissionsBullet1', 'permissionsBullet2', 'permissionsBullet3'] as const;

export default function NotificationPermission() {
  const { t } = useTranslation();
  const completeOnboarding = usePreferences((state) => state.completeOnboarding);
  const requestDeviceSync = usePreferences((state) => state.requestDeviceSync);
  const [requesting, setRequesting] = useState(false);

  const finish = (granted: boolean) => {
    completeOnboarding();
    requestDeviceSync();
    track('onboarding_completed', { notifications: granted });
    router.replace('/(tabs)');
  };

  const allow = async () => {
    setRequesting(true);
    const granted = await requestNotificationPermission().catch(() => false);
    setRequesting(false);
    finish(granted);
  };

  return (
    <Screen
      edges={['top']}
      contentStyle={styles.content}
      footer={
        <View style={styles.footer}>
          <Button
            label={t('onboarding.permissionsAllow')}
            icon="notifications-outline"
            loading={requesting}
            onPress={() => void allow()}
          />
          <Button
            label={t('onboarding.permissionsSkip')}
            variant="ghost"
            onPress={() => finish(false)}
          />
        </View>
      }
    >
      <View style={styles.iconRing}>
        <Icon name="notifications" size={40} color={colors.primary} />
      </View>
      <View style={styles.text}>
        <AppText variant="display" accessibilityRole="header">
          {t('onboarding.permissionsTitle')}
        </AppText>
        <AppText variant="body" color={colors.inkMuted}>
          {t('onboarding.permissionsBody')}
        </AppText>
      </View>
      <View style={styles.bullets}>
        {BULLETS.map((key) => (
          <View key={key} style={styles.bullet}>
            <Icon name="checkmark-circle" size={22} color={colors.go} />
            <AppText variant="body" style={styles.bulletText}>
              {t(`onboarding.${key}`)}
            </AppText>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  iconRing: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  text: {
    gap: spacing.sm,
  },
  bullets: {
    gap: spacing.md,
  },
  bullet: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  bulletText: {
    flex: 1,
  },
  footer: {
    gap: spacing.sm,
  },
});
