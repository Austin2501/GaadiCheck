// Order matters: background message handling must be registered before the app registers itself.
import './src/services/backgroundAlerts';
import 'expo-router/entry';
