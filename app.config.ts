import fs from 'node:fs';
import path from 'node:path';

import type { ConfigContext, ExpoConfig } from 'expo/config';

const BRAND_INDIGO = '#4338CA';
const BRAND_CANVAS = '#F6F7FB';

const isDevVariant = process.env.APP_VARIANT === 'development';

/**
 * Firebase is optional. Alerts light up only when a google-services.json is available,
 * either committed locally or provided to EAS as a file environment variable.
 */
function resolveGoogleServicesFile(): string | undefined {
  if (process.env.GOOGLE_SERVICES_JSON) return process.env.GOOGLE_SERVICES_JSON;
  const localFile = path.resolve(__dirname, 'google-services.json');
  return fs.existsSync(localFile) ? './google-services.json' : undefined;
}

/**
 * Public identifiers created by `eas init`; they are not secrets. A fork can point the build at
 * its own Expo account through the environment instead of editing this file.
 */
const easOwner = process.env.EAS_OWNER?.trim() || 'vineet2501';
const easProjectId = process.env.EAS_PROJECT_ID?.trim() || 'b214050b-4dd8-4cc6-839d-ecb5cc20b1cd';

const googleServicesFile = resolveGoogleServicesFile();

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  owner: easOwner,
  name: isDevVariant ? 'GaadiCheck Dev' : 'GaadiCheck',
  slug: 'gaadicheck',
  scheme: 'gaadicheck',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  backgroundColor: BRAND_CANVAS,
  ios: {
    supportsTablet: false,
    bundleIdentifier: isDevVariant ? 'com.gaadicheck.app.dev' : 'com.gaadicheck.app',
  },
  android: {
    package: isDevVariant ? 'com.gaadicheck.app.dev' : 'com.gaadicheck.app',
    adaptiveIcon: {
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
      backgroundColor: BRAND_INDIGO,
    },
    blockedPermissions: ['android.permission.RECORD_AUDIO'],
    predictiveBackGestureEnabled: false,
    ...(googleServicesFile ? { googleServicesFile } : {}),
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    // Must stay ahead of expo-notifications; see the plugin for why.
    './plugins/withFirebaseNotificationDefaults',
    'expo-router',
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        imageWidth: 168,
        resizeMode: 'contain',
        backgroundColor: BRAND_INDIGO,
      },
    ],
    'expo-font',
    'expo-localization',
    'expo-sharing',
    'expo-web-browser',
    '@react-native-community/datetimepicker',
    [
      'expo-notifications',
      {
        icon: './assets/notification-icon.png',
        color: BRAND_INDIGO,
        defaultChannel: 'reminders',
      },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'GaadiCheck uses your location once to pick the nearest NCR district for your vehicle.',
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission:
          'GaadiCheck reads an RC or PUC screenshot on your phone to fill in vehicle details.',
        cameraPermission: 'GaadiCheck can photograph your PUC certificate to read its expiry date.',
        microphonePermission: false,
      },
    ],
    ...(googleServicesFile
      ? ['@react-native-firebase/app', '@react-native-firebase/messaging']
      : []),
  ],
  runtimeVersion: { policy: 'appVersion' },
  updates: { url: `https://u.expo.dev/${easProjectId}` },
  extra: { ...config.extra, eas: { projectId: easProjectId } },
});
