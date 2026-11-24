const { AndroidConfig, withAndroidManifest } = require('expo/config-plugins');

const TOOLS_NAMESPACE = 'http://schemas.android.com/tools';
const FIREBASE_NOTIFICATION_DEFAULT = /^com\.google\.firebase\.messaging\.default_notification_/;

/**
 * expo-notifications writes Firebase's default notification channel, colour and icon into the
 * app manifest so remote notifications match local ones. @react-native-firebase/messaging
 * declares the same keys with empty placeholders, which fails the manifest merge. Marking the
 * app's entries with tools:replace keeps the app's values.
 *
 * This has to run after expo-notifications has added its entries. Mods run in reverse order of
 * registration, so the plugin is listed before expo-notifications in app.config.ts.
 *
 * @type {import('expo/config-plugins').ConfigPlugin}
 */
const withFirebaseNotificationDefaults = (config) =>
  withAndroidManifest(config, (mod) => {
    const { manifest } = mod.modResults;
    manifest.$ = { ...manifest.$, 'xmlns:tools': TOOLS_NAMESPACE };

    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(mod.modResults);
    for (const item of application['meta-data'] ?? []) {
      if (!FIREBASE_NOTIFICATION_DEFAULT.test(item.$['android:name'])) continue;
      item.$['tools:replace'] =
        item.$['android:resource'] !== undefined ? 'android:resource' : 'android:value';
    }
    return mod;
  });

module.exports = withFirebaseNotificationDefaults;
