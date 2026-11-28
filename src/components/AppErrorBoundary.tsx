import type { ErrorBoundaryProps } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';

import { BrandMark } from './brand/BrandMark';
import { AppText, Button } from './ui';

/**
 * Shown instead of a blank or developer-facing screen when rendering throws. It sits outside the
 * safe-area and query providers, so it only relies on plain views and the i18n instance.
 */
export function AppErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const { t } = useTranslation();

  useEffect(() => {
    console.error('Unhandled render error', error);
  }, [error]);

  return (
    <View style={styles.container} accessibilityRole="alert">
      <View style={styles.mark}>
        <BrandMark size={56} />
      </View>
      <AppText variant="heading" align="center">
        {t('errors.crashTitle')}
      </AppText>
      <AppText variant="body" color={colors.inkMuted} align="center">
        {t('errors.crashBody')}
      </AppText>
      <Button label={t('common.retry')} icon="refresh" onPress={() => void retry()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.lg,
    padding: spacing.xxl,
    backgroundColor: colors.canvas,
  },
  mark: {
    alignSelf: 'center',
    padding: spacing.md,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
  },
});
