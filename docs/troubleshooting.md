# Troubleshooting

## The phone can't connect to the dev server

1. **Match the command to the app.** `npm start` is for the GaadiCheck Dev app. `npm run start:go` is for Expo Go. In the terminal, press `s` to switch between them.
2. **Test the network.** With the server running, open `http://<your-mac-ip>:8081` in Chrome on the phone. Get the IP with `ipconfig getifaddr en0`.
   - **It doesn't load:** the router is keeping devices apart (guest network, "AP/client isolation"), or the phone is on mobile data. A "Gateway Timeout" page means a VPN, ad-blocker or Wi-Fi proxy on the phone is in the way, so turn those off.
   - **It loads:** update Expo Go from the Play Store (it must support SDK 58), or type `exp://<your-mac-ip>:8081` into it by hand.
3. **Skip the network:** `npx expo start --tunnel -c`, or plug the phone in over USB with USB debugging on, run the server, and press `a`.

## Air quality says "Estimated" for an area

- **For every area:** `EXPO_PUBLIC_DATA_GOV_API_KEY` is missing or wrong. Check `.env` (local runs and the website) or the EAS variables (APK builds), then restart with `npm start -- -c`.
- **For one area:** its CPCB name in `src/domain/zones.ts` doesn't match the API exactly. Names use spaces, e.g. `Uttar Pradesh`.
- **Now and then:** the CPCB call failed (slow network, data.gov.in down). The next refresh fixes it.

## An over-the-air update doesn't show up

- The app downloads an update while it's open and applies it on the **next** start. Open the app, wait 15–20 seconds, swipe it away from Recent apps, and open it again. Or tap **Restart to update** on the Today tab.
- Reinstalling the APK goes back to the code inside the APK. The update downloads again on first launch.
- Check the update reached the right place: `eas update:list --branch preview` should show it with runtime version `1.0.0`. Your build should be on channel `preview` (`eas build:list --platform android`).
- Native changes can't be delivered as an update. Build a new APK.

## Type check fails with "differs … only in casing"

Two files in the same folder have names that differ only by capital letters, e.g. `VehicleForm.tsx` and `vehicleForm.ts`. macOS treats them as one file. Rename one of them so the names really differ.

## Something works on the phone but not on the web

- `Alert.alert` does nothing on web. Use `confirmAction` (`src/services/confirm.ts`) or show a `Banner`.
- Local notifications, RC/PUC scanning and Firebase are native-only. Their services must check `Platform.OS === 'web'` and step aside.
- Screens opened directly by URL have no history, so call `router.canGoBack()` before `router.back()`.

## The cloud build or update uses old settings

`.env` is git-ignored, so EAS never sees it. Set variables with `eas env:create` (see [Releasing](releasing.md#building-the-apk)). Only `npm run build:web` and local runs read `.env`.
