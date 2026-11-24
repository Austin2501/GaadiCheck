import { router, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';

import { EmptyState, Screen } from '@/components/ui';

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <Screen scroll={false} contentStyle={styles.centered}>
      <Stack.Screen options={{ title: '' }} />
      <EmptyState
        icon="map-outline"
        title={t('errors.notFoundTitle')}
        body={t('common.tagline')}
        action={{
          label: t('errors.goHome'),
          icon: 'home-outline',
          onPress: () => router.replace('/(tabs)'),
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: {
    justifyContent: 'center',
  },
});
