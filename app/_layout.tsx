import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import {
  NotoSansDevanagari_400Regular,
  NotoSansDevanagari_500Medium,
  NotoSansDevanagari_600SemiBold,
  NotoSansDevanagari_700Bold,
} from '@expo-google-fonts/noto-sans-devanagari';
import {
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useFonts } from 'expo-font';
import { Stack, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LaunchOverlay } from '@/features/launch/LaunchOverlay';
import { useDeviceSync } from '@/hooks/useDeviceSync';
import { applyLanguage } from '@/i18n';
import {
  bindQueryFocusToAppState,
  PERSIST_MAX_AGE_MS,
  queryClient,
  queryPersister,
} from '@/lib/queryClient';
import { trackScreen } from '@/services/analytics';
import { usePreferences } from '@/store/preferences';
import { useStoresHydrated } from '@/store/useStoresHydrated';
import { colors, fontForLanguage, fonts } from '@/theme';

export { ErrorBoundary } from 'expo-router';

void SplashScreen.preventAutoHideAsync();

/** Bump when the shape of cached query data changes. */
const QUERY_CACHE_BUSTER = '1';

function DeviceSync() {
  useDeviceSync();
  const pathname = usePathname();
  useEffect(() => trackScreen(pathname), [pathname]);
  return null;
}

function AppStack() {
  const { t, i18n } = useTranslation();
  const headerFont = fontForLanguage(fonts.heading, i18n.language === 'hi' ? 'hi' : 'en');
  return (
    <Stack
      screenOptions={{
        headerTintColor: colors.ink,
        headerTitleStyle: { fontFamily: headerFont, fontSize: 17 },
        headerStyle: { backgroundColor: colors.canvas },
        headerShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: colors.canvas },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding/index" options={{ headerShown: false }} />
      <Stack.Screen
        name="onboarding/permissions"
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen name="vehicle/new" options={{ title: t('vehicle.addTitle') }} />
      <Stack.Screen name="vehicle/[id]" options={{ title: t('vehicle.editTitle') }} />
      <Stack.Screen name="share" options={{ title: t('share.title'), presentation: 'modal' }} />
      <Stack.Screen name="guide" options={{ title: t('guide.title') }} />
      <Stack.Screen name="sources" options={{ title: t('sources.title') }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    NotoSansDevanagari_400Regular,
    NotoSansDevanagari_500Medium,
    NotoSansDevanagari_600SemiBold,
    NotoSansDevanagari_700Bold,
  });
  const hydrated = useStoresHydrated();
  const language = usePreferences((state) => state.language);
  const ready = (fontsLoaded || fontError !== null) && hydrated;
  const [launching, setLaunching] = useState(true);

  useEffect(() => applyLanguage(language), [language]);
  useEffect(() => bindQueryFocusToAppState(), []);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister: queryPersister,
          maxAge: PERSIST_MAX_AGE_MS,
          buster: QUERY_CACHE_BUSTER,
        }}
      >
        <DeviceSync />
        <StatusBar style="dark" />
        <AppStack />
        {/* Hides the native splash once its first frame is drawn. */}
        {launching ? <LaunchOverlay onFinish={() => setLaunching(false)} /> : null}
      </PersistQueryClientProvider>
    </SafeAreaProvider>
  );
}
