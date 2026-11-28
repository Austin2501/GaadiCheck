# Releasing

There are four ways to ship a change. Use the lightest one that covers it.

| What changed                                                         | How to ship it       | Users need to…                                       |
| -------------------------------------------------------------------- | -------------------- | ---------------------------------------------------- |
| GRAP stage or rules (`data/`)                                        | Push to `main`       | Nothing, it arrives within 30 minutes                |
| App code: screens, text, logic                                       | `eas update`         | Reopen the app (a banner offers "Restart to update") |
| Native: new native package, permissions, icon, splash, app `version` | New APK build        | Download and install the new APK                     |
| Landing page or web app                                              | `npm run deploy:web` | Nothing, refresh the page                            |

Before any of them, run:

```bash
npm run validate
git add -A && git commit -m "…" && git push
```

## Over-the-air updates

```bash
eas update --channel preview --environment preview --message "What changed"
```

- `--channel preview` reaches APKs built with `npm run build:apk`.
- `--environment preview` builds the update with the EAS environment variables, the same as the APK.
- An installed app only accepts updates made for its app `version` (currently `1.0.0` in `app.config.ts`).
- The app checks for updates when it opens and when it comes back to the front (at most every 15 minutes). When one has downloaded, the Today tab shows **"Update ready · Restart to update"**.
- To undo a bad update, republish the previous one from expo.dev → GaadiCheck → Updates.

## Building the APK

```bash
eas whoami           # must be vineet2501
npm run build:apk    # preview profile, cloud build
```

The build takes about 10–30 minutes on the free plan. The link and QR code appear in the terminal and on expo.dev → Builds.

| Profile       | Command                                      | Use                                                                                                  |
| ------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `preview`     | `npm run build:apk`                          | The APK you share. Update channel `preview`.                                                         |
| `production`  | `eas build -p android --profile production`  | For the Play Store later. The Play Store needs an `.aab`, so change the profile's `buildType` first. |
| `development` | `eas build -p android --profile development` | The GaadiCheck Dev app for local development                                                         |

**EAS environment variables.** Cloud builds can't read your `.env`. Set them once per environment:

```bash
eas env:create --name EXPO_PUBLIC_DATA_BASE_URL --value https://raw.githubusercontent.com/Austin2501/GaadiCheck/main/data --environment preview --environment production --visibility plaintext
eas env:create --name EXPO_PUBLIC_DATA_GOV_API_KEY --value <key> --environment preview --environment production --visibility sensitive
eas env:list --environment preview
```

## Publishing the APK on GitHub Releases

The website's download buttons point at this permanent link, which always serves the newest release:

```
https://github.com/Austin2501/GaadiCheck/releases/latest/download/GaadiCheck.apk
```

For it to work, the release asset must be named exactly **`GaadiCheck.apk`**.

1. Download the APK from the build page on expo.dev and rename it `GaadiCheck.apk`, or put it in the git-ignored `release/` folder.
2. Open https://github.com/Austin2501/GaadiCheck/releases/new.
3. Create a tag, e.g. `v1.0.0`, and add a title and short notes.
4. Drag in `GaadiCheck.apk`, and leave "Set as the latest release" ticked.
5. Publish. The website's download buttons now serve this file.

With the GitHub CLI installed, steps 2–5 are one command:

```bash
gh release create v1.0.0 release/GaadiCheck.apk --title "GaadiCheck 1.0.0" --notes "First public release"
```

For a new version, create a new release (e.g. `v1.1.0`) with an asset of the same name. The link moves to it automatically.

## Deploying the website

```bash
npm run deploy:web            # build + publish to https://gaadicheck.expo.app
npm run deploy:web:preview    # build + publish to a throwaway preview URL first
```

`npm run build:web` (`scripts/build-web.mjs`) assembles `dist/`:

| Path                           | Contents                                                                         |
| ------------------------------ | -------------------------------------------------------------------------------- |
| `/`                            | The landing page, copied from `landing/`                                         |
| `/app/`                        | The web app, exported with base URL `/app`                                       |
| `/app/air`, `/app/vehicles`, … | Copies of the app's entry page, so refreshing or sharing any screen's link works |

Good to know:

- The website build reads your **local `.env`**, not EAS variables. Check it has the API key and data URL before deploying.
- `/app` without a trailing slash serves the landing page, which immediately redirects to `/app/`.
- On the web, vehicles are saved in that browser only. Reminders and RC scanning are Android-only, and the app says so on the More tab.
- Every deploy is listed on expo.dev → GaadiCheck → Hosting. To roll back, promote an earlier one: `eas deploy:alias --prod --id <deploymentId>`.
