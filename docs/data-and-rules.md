# Data and rules

GaadiCheck has no server. Everything the app knows about GRAP comes from two JSON files in `data/`. Air quality comes live from public APIs.

## The two data files

| File                    | Holds                                                                                                    | Changes when                                    |
| ----------------------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `data/grap-status.json` | The GRAP stage in force, when it started, a short note in English and Hindi, and a link to the order     | CAQM invokes or revokes a stage                 |
| `data/rules.json`       | Every restriction the app checks (who, where, when, the fine), plus document rules for PUC and insurance | A new order adds, changes or ends a restriction |

Each file is used in two ways:

1. **Bundled into the app at build time.** This is the offline fallback and what a brand-new install shows first.
2. **Fetched from GitHub** (`EXPO_PUBLIC_DATA_BASE_URL`). Whatever is on the `main` branch reaches installed apps within 10–30 minutes, or straight away on pull-to-refresh. No build is needed.

Both files are checked against a schema (`src/domain/schemas.ts`) every time they're loaded. If you push a broken file, apps reject it and keep their last good copy, so a mistake can't crash anyone's app. Run `npm test` before pushing anyway.

**Anything pushed to `main` under `data/` is live for every user.** Never push test rules there.

## Changing the GRAP stage

1. Open `data/grap-status.json`.
2. Update `stage` (0–4), `effectiveFrom`, `orderUrl`, both languages of `note`, and `updatedAt`. Times use India time, for example `2026-11-17T17:00:00+05:30`.
3. Run `npm test`, then commit and push to `main`.

## Adding or changing a rule

A rule looks like this:

```json
{
  "id": "grap3-petrol-bs3",
  "zones": ["delhi", "gurugram", "faridabad", "ghaziabad", "gautam-buddh-nagar", "sonipat"],
  "conditions": {
    "vehicleTypes": ["car"],
    "fuels": ["petrol"],
    "maxBsNorm": 3,
    "minStage": 3,
    "exemptEssentialServices": true
  },
  "severity": "blocked",
  "fineInr": 20000,
  "alertTopic": "rule-grap3",
  "title": { "en": "BS-III petrol cars off the road", "hi": "BS-III पेट्रोल कारों पर रोक" },
  "explanation": { "en": "…", "hi": "…" },
  "sourceUrl": "https://caqm.nic.in"
}
```

A rule applies only when **every** condition it lists matches. Leave out a condition to mean "any".

| Condition                  | Meaning                                                                                                     |
| -------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `vehicleTypes`             | `car`, `two-wheeler`, `goods`                                                                               |
| `fuels`                    | `petrol`, `diesel`, `cng`, `electric`, `hybrid` (hybrids are treated as petrol)                             |
| `maxBsNorm`                | Applies to this BS norm and older. If the user hasn't entered their norm, the app asks instead of guessing. |
| `registeredInDelhi`        | `true` or `false`, e.g. for Delhi's entry rules for outside vehicles                                        |
| `minStage`                 | Applies from this GRAP stage upwards                                                                        |
| `validFrom` / `validUntil` | Dates (`YYYY-MM-DD`) the rule is in force, inclusive                                                        |
| `exceptWeekdays`           | Days it's off: `0` = Sunday … `6` = Saturday                                                                |
| `oddEven`                  | Odd-even rationing, see below                                                                               |
| `exemptEssentialServices`  | Vehicles marked as essential or emergency services are exempt                                               |

`severity` is `blocked` (can't drive) or `check` (the driver should check the order). `fineInr` is the fine in rupees, or `null` for "as per order".

**After any rule change:**

1. Increase `version` at the top of `rules.json`. Apps never step back to an older version.
2. Add or update a test in `src/domain/__tests__/rulesEngine.test.ts`.
3. Run `npm run validate`, then push.

### Odd-even rationing

With `"oddEven": true`, a vehicle is restricted when the **last digit of its registration number** has the opposite parity to the date. On an odd date, plates ending 1, 3, 5, 7 or 9 may drive. On BH-series plates the app reads the last digit of the number and ignores the trailing letters, so `22BH1235AA` counts as 5.

The time of day isn't modelled. Past schemes ran 8 AM–8 PM, so put the hours in the rule's `explanation`. A full example for a one-week scheme is in the main README under "Changing rules". Take the dates, hours, fine and exemptions from the official order.

## Air quality

| Shown as     | Comes from                                                                 | Notes                                                                                                                                                                |
| ------------ | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Today**    | CPCB real-time readings via the data.gov.in API                            | Each station's AQI is its worst pollutant. The area's number is the average across its stations, the same method CPCB uses for cities. Labelled "CPCB · N stations". |
| **Tomorrow** | Open-Meteo forecast (Copernicus CAMS data), converted to India's AQI scale | CPCB publishes no forecast. Labelled "Forecast".                                                                                                                     |
| **Fallback** | Open-Meteo                                                                 | Used for today only if the CPCB call fails, and labelled "Estimated". It's often 60–170 points below CPCB, so it's never preferred.                                  |

Each area's CPCB filter is in `src/domain/zones.ts`. **Names must match the API exactly**, with spaces, not underscores: `Uttar Pradesh`, `Greater Noida`. A wrong name returns no data, and the area silently falls back to "Estimated". A unit test guards against underscores.

| Area                       | CPCB filter (state / city)                                |
| -------------------------- | --------------------------------------------------------- |
| Delhi                      | Delhi / Delhi                                             |
| Gurugram                   | Haryana / Gurugram                                        |
| Faridabad                  | Haryana / Faridabad                                       |
| Ghaziabad                  | Uttar Pradesh / Ghaziabad                                 |
| Noida (Gautam Buddh Nagar) | Uttar Pradesh / Noida, plus Uttar Pradesh / Greater Noida |
| Sonipat                    | Haryana / Sonipat                                         |

**Refreshing:** air quality counts as fresh for 30 minutes. Opening a screen after that, or pulling to refresh, fetches again. The last data is saved on the device for up to 7 days, so the app opens instantly and works offline. CPCB updates hourly, so refreshing more often shows the same numbers.
