# Development

## Set up

**You need:** Node 20 or newer, and for native builds, JDK 17 and Android Studio (or an Android phone with USB debugging on).

```bash
npm install
cp .env.example .env
```

Fill in `.env`:

| Variable                                              | Needed?     | What it does                                                                                                                                                                           |
| ----------------------------------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `EXPO_PUBLIC_DATA_BASE_URL`                           | Recommended | Where the app fetches the GRAP stage and rules. Use `https://raw.githubusercontent.com/Austin2501/GaadiCheck/main/data`. Without it, the app only uses the copy bundled at build time. |
| `EXPO_PUBLIC_DATA_GOV_API_KEY`                        | Recommended | Free key from data.gov.in for official CPCB air quality. Without it every area shows "Estimated".                                                                                      |
| `EXPO_PUBLIC_POSTHOG_KEY`, `EXPO_PUBLIC_POSTHOG_HOST` | Optional    | Anonymous analytics. Leave empty to turn analytics off.                                                                                                                                |
| `EAS_OWNER`, `EAS_PROJECT_ID`                         | No          | Only for building under a different Expo account. Leave empty.                                                                                                                         |

`.env` is git-ignored. Never commit it. Anything starting with `EXPO_PUBLIC_` ends up inside the app and the website, so only put read-only, free keys there.

## Run it

There are three ways to run the app. Each one pairs a command with the app it serves.

| What you're testing                  | Command             | Open it in                                                                            |
| ------------------------------------ | ------------------- | ------------------------------------------------------------------------------------- |
| Everything, on a phone (recommended) | `npm start`         | The **GaadiCheck Dev** app (a development build)                                      |
| Quick UI check, no native build      | `npm run start:go`  | **Expo Go** from the Play Store. Document scanning and stage alerts don't work there. |
| The web version                      | `npm run start:web` | Your browser, at the address the terminal prints                                      |

**Getting the development build onto a phone,** done once and again after native changes:

```bash
eas build --profile development --platform android   # cloud build; install the APK from the link
# or, with the phone plugged in over USB:
npx expo run:android
```

After changing `.env`, restart with a cleared cache so the new values are picked up:

```bash
npm start -- -c
```

The phone and laptop must be on the same Wi-Fi. If the phone can't connect, see [Troubleshooting](troubleshooting.md#the-phone-cant-connect-to-the-dev-server).

## Check your work

```bash
npm run validate   # type check + lint + all tests
```

Run it before every commit and every build. It takes a few seconds.

## Code conventions

- **`src/domain` is pure TypeScript.** No React, no Expo imports. Business logic (rules engine, plate parsing, AQI maths, dates) lives here and has unit tests in `src/domain/__tests__`.
- **`src/services` talks to the outside world** (network, notifications, OCR, location) and must fail gracefully when a key, permission or native module is missing. For example, stage alerts are hidden when Firebase isn't configured, and reminders are skipped on web.
- **Every piece of text goes through i18n.** Add each new key to both `src/i18n/locales/en.ts` and `hi.ts`. The type check fails if Hindi is missing a key.
- **Remote data is validated with Zod** (`src/domain/schemas.ts`). A malformed feed is rejected and the app keeps its last good copy.
- **Forms explain themselves.** Each validation error has its own message key (`plateRequired`, `homeZoneRequired`…). On save, the form scrolls to the first problem and lists what's missing above the button.
- **No native-only popups for important actions.** `Alert.alert` does nothing on web, so use `confirmAction` from `src/services/confirm.ts` for confirmations, and an on-screen `Banner` for errors.
- **File names must differ by more than capital letters.** macOS ignores case, so `VehicleForm.tsx` next to `vehicleForm.ts` breaks imports.

## Project layout

```
app/                    Screens (Expo Router). (tabs)/ = Today · Air · Vehicles · More
src/domain/             Pure logic + tests
src/services/           Network, notifications, alerts, OCR, location, share, confirm
src/hooks/              Queries, assessment, device sync, app updates
src/features/           Feature components (today, air, vehicles, share, launch)
src/components/         Design system (ui/), brand components, error screen
src/i18n/               English and Hindi text
data/                   GRAP stage + rules (bundled into the app and served from GitHub)
landing/                Static landing page (the root of the website)
scripts/build-web.mjs   Builds the website into dist/
docs/                   This handbook
```
