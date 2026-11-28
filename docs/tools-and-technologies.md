# Tools and technologies

Everything GaadiCheck is built with, grouped by kind. Versions are taken from `package.json`. Every item is free or open source, and the app makes no paid API calls.

A PDF copy of this list is in [GaadiCheck-Tools-and-Technologies.pdf](GaadiCheck-Tools-and-Technologies.pdf).

## AI tools

| Tool                                                                                                 | Used for                                                                                                                                    | Where                                                                  |
| ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| **Claude Code** (Anthropic, Claude Opus 5.5)                                                         | AI coding assistant during development: writing and reviewing code, debugging, testing in a headless browser, deployment, and documentation | Development only. Not part of the shipped app.                         |
| **Google ML Kit Text Recognition** (Android) and **Apple Vision** (iOS), via `expo-text-extractor` 2 | On-device OCR that reads the plate, fuel, BS norm, registration date and PUC expiry from an RC or PUC screenshot                            | In the app. Runs entirely on the phone, and images are never uploaded. |

The app doesn't send user data to any cloud AI service.

## Frameworks and platforms

| Name             | Version      | Role                                                              |
| ---------------- | ------------ | ----------------------------------------------------------------- |
| Expo SDK         | 58           | App platform, native modules and build tooling                    |
| React Native     | 0.88         | Cross-platform mobile UI                                          |
| React            | 19.3         | UI library                                                        |
| TypeScript       | 6.0 (strict) | Language                                                          |
| Expo Router      | 58           | File-based navigation with typed routes, shared by mobile and web |
| React Native Web | 0.21         | Runs the same app in the browser                                  |
| EAS Build        | —            | Cloud builds of the Android APK                                   |
| EAS Update       | —            | Over-the-air JavaScript updates to installed apps                 |
| EAS Hosting      | —            | Hosts the landing page and the web app at gaadicheck.expo.app     |

## Libraries

| Area                    | Libraries                                                                                                                                                                                                  |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| State and storage       | Zustand 5 · AsyncStorage 2.2                                                                                                                                                                               |
| Server data and caching | TanStack Query 5 · TanStack Query AsyncStorage persister and persist-client                                                                                                                                |
| Forms and validation    | React Hook Form 7 · Zod 4 (forms and remote data feeds) · @hookform/resolvers                                                                                                                              |
| Languages               | i18next 27 · react-i18next 18 · expo-localization (English and Hindi)                                                                                                                                      |
| Dates                   | date-fns 4                                                                                                                                                                                                 |
| Notifications           | expo-notifications (local PUC and insurance reminders) · React Native Firebase Messaging 27 (stage alerts, coming soon)                                                                                    |
| Device features         | expo-location · expo-image-picker · expo-text-extractor · expo-sharing · expo-clipboard · react-native-view-shot · expo-haptics · @react-native-community/datetimepicker · expo-web-browser · expo-linking |
| App updates             | expo-updates · expo-dev-client                                                                                                                                                                             |
| UI                      | react-native-svg · expo-linear-gradient · @expo/vector-icons (Ionicons) · react-native-safe-area-context · react-native-screens · expo-splash-screen · expo-font · expo-system-ui · expo-status-bar        |
| Fonts                   | Plus Jakarta Sans · Inter · Noto Sans Devanagari (Google Fonts, SIL Open Font License)                                                                                                                     |
| App info                | expo-constants · expo-application · expo-device · expo-file-system                                                                                                                                         |
| Analytics (optional)    | PostHog React Native 4 (anonymous, off unless a key is set)                                                                                                                                                |

## Development tools

| Tool                           | Version | Role                                                                           |
| ------------------------------ | ------- | ------------------------------------------------------------------------------ |
| Jest with jest-expo            | 30 / 58 | Unit tests (84 tests across the rules engine, AQI, plates, OCR parsing, forms) |
| ESLint with eslint-config-expo | 9 / 58  | Linting, including React hooks and React Compiler rules                        |
| Prettier                       | 3       | Code formatting                                                                |
| EAS CLI                        | 27      | Builds, updates, environment variables and web deploys                         |
| Git and GitHub                 | —       | Version control, the public data feed, and APK releases                        |
| Google Chrome (headless)       | —       | Automated screenshots and checks of the web build                              |

## APIs

| API                                                                                           | What GaadiCheck uses it for                                                                                       | Access       |
| --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------ |
| **data.gov.in, CPCB real-time air quality** (resource `3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69`) | Today's official AQI for each district, averaged across its monitoring stations                                   | Free API key |
| **Open-Meteo Air Quality API**                                                                | Tomorrow's PM2.5 and PM10 forecast, converted to India's AQI scale, and a fallback when CPCB is unavailable       | Free, no key |
| **GitHub raw content** (`raw.githubusercontent.com`)                                          | Serves `data/grap-status.json` and `data/rules.json`, so a stage or rule change reaches users without a new build | Public       |
| **Expo Updates service**                                                                      | Delivers over-the-air updates to installed APKs                                                                   | Expo account |
| **Firebase Cloud Messaging**                                                                  | Topic-based GRAP stage alerts (integrated, switched on once Firebase is configured)                               | Free tier    |
| **PostHog**                                                                                   | Optional anonymous product analytics                                                                              | Free tier    |

## External datasets and reference data

| Dataset                                          | Source                                                                      | Licence                              | How it is used                                                                                        |
| ------------------------------------------------ | --------------------------------------------------------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| Real-time station air quality                    | Central Pollution Control Board (CPCB) via data.gov.in                      | Government Open Data Licence – India | Live AQI for Delhi, Gurugram, Faridabad, Ghaziabad, Noida and Greater Noida, and Sonipat              |
| Air quality forecast                             | Open-Meteo, using Copernicus Atmosphere Monitoring Service (CAMS) data      | CC BY 4.0                            | Tomorrow's outlook, labelled "Forecast"                                                               |
| GRAP schedule and orders                         | Commission for Air Quality Management (CAQM)                                | Public orders                        | Curated into `data/grap-status.json` and `data/rules.json`, with a link to the order behind each rule |
| National Air Quality Index breakpoints           | CPCB                                                                        | Public standard                      | Converting pollutant concentrations to India's 0–500 AQI                                              |
| BS emission norm cut-over dates                  | Government notifications for Delhi-NCR and national roll-outs               | Public                               | Suggesting a vehicle's BS norm from its registration date                                             |
| Vehicle registration formats and state/RTO codes | Ministry of Road Transport & Highways formats, including Bharat (BH) series | Public                               | Parsing plates and suggesting a home district                                                         |
