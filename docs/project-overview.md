# Project overview

GaadiCheck is a free Android and web app that tells Delhi-NCR drivers whether their exact vehicle can be on the road today under GRAP pollution rules. This page covers the problem, the research behind the app, the solution, how it is built, and the impact it is designed to have.

**Live:** https://gaadicheck.expo.app (landing page, Android download and web app)

## 1. Problem

Every winter, Delhi-NCR's air turns hazardous, and the Commission for Air Quality Management (CAQM) responds with the **Graded Response Action Plan (GRAP)**. GRAP has four stages that can be switched on or off overnight. Each stage brings restrictions on which vehicles may be driven, and where.

For a driver, the question "can I take my car out today?" is surprisingly hard to answer:

- **The answer depends on the vehicle.** It turns on fuel, BS emission norm, where the vehicle is registered, its type and its age. Two neighbours with similar cars can get different answers.
- **The answer depends on the district.** Rules differ between Delhi and the surrounding districts, and many people cross several districts on one commute. Delhi also has its own entry rule for vehicles registered outside it.
- **The rules change at short notice.** Stages are invoked and revoked by orders that appear on official websites and in the news, often in the evening for the next morning. There is no official machine-readable feed.
- **Mistakes are expensive and automatic.** Driving a restricted vehicle during GRAP Stage III can cost **₹20,000**, and driving without a valid PUC certificate **₹10,000**. Enforcement increasingly relies on cameras, so there is no chance to explain.
- **Most drivers don't know their BS norm.** It is printed on the RC, but few people remember it, and it is exactly what the restrictions are based on.

The result is confusion, unnecessary fines, wasted trips, and in the other direction, restricted vehicles still being driven because their owners didn't know.

## 2. Research

### What happened in the 2026 season

Figures from the November 2026 GRAP season, also cited on the landing page:

| Finding                                                                                                 | Source                                                                                                                                                                                |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Delhi's average AQI on Diwali (8 Nov) was **376**, the worst festival-day reading since 2021            | [Outlook India](https://www.outlookindia.com/national/delhi-smog-after-diwali-aqi-371-severe-air-pollution-stubble-burning-grap-stage-3)                                              |
| GRAP **Stage III ran for 11 days** (6–17 Nov), taking BS-III petrol and BS-IV diesel cars off NCR roads | [Business Today](https://www.businesstoday.in/india/story/grap-3-curbs-revoked-in-delhi-will-restrictions-on-bs-3-petrol-bs-4-diesel-cars-to-continue-what-we-know-568060-2026-11-18) |
| Delhi Traffic Police issued **3,048 PUC challans in a single week** of the GRAP drive                   | [ThePrint](https://theprint.in/india/delhi-traffic-police-issues-3048-pucc-challans-in-drive-under-grap-in-one-week/3101051/)                                                         |
| **Ghaziabad ranked among India's five most polluted districts** from 12 to 14 Nov                       | [Oneindia](https://www.oneindia.com/india/grap-iii-fails-to-bring-relief-ghaziabad-ranks-among-indias-5-most-polluted-districts-for-3-days-8259709.html)                              |

### How the rules actually work

Studying CAQM's GRAP schedule and orders showed that a correct answer needs:

- **The stage in force,** which CAQM sets mainly from Delhi's AQI and forecasts. Roughly: Stage I above AQI 200, II above 300, III above 400, IV above 450. CAQM can act ahead of the numbers.
- **The vehicle's details:** fuel, BS norm, type, registration state, and whether it is an essential or emergency service vehicle, which are usually exempt.
- **The district:** six areas are covered, namely Delhi, Gurugram, Faridabad, Ghaziabad, Gautam Buddh Nagar (Noida) and Sonipat.
- **Document validity:** a valid PUC (new vehicles get 12 months of cover) and NCR's age limits of 10 years for diesel and 15 for petrol vehicles.
- **Odd-even rationing,** used in earlier years. Past schemes covered private cars only, ran 8 AM to 8 PM and skipped Sundays. GaadiCheck's rules engine already supports it, so a scheme can be switched on the day it is announced.

### Choosing the data sources

We compared the two free sources of air-quality data across all six districts on 24 November 2026:

| District  | Official CPCB reading | Modelled estimate (Open-Meteo) | Gap  |
| --------- | --------------------- | ------------------------------ | ---- |
| Delhi     | 231                   | 101                            | +130 |
| Gurugram  | 273                   | 105                            | +168 |
| Faridabad | 166                   | 105                            | +61  |
| Ghaziabad | 207                   | 113                            | +94  |
| Noida     | 198                   | 105                            | +93  |
| Sonipat   | 199                   | 101                            | +98  |

The modelled estimate under-read by **61–168 AQI points**, enough to put a district in the wrong category. GaadiCheck therefore uses **official CPCB station readings** (via data.gov.in) for today, averaged across each district's stations. The forecast model is used only for tomorrow's outlook, where CPCB publishes nothing, and is labelled "Forecast".

Other findings that shaped the build:

- **Station coverage is good:** about 58 stations in Delhi, 14 across Noida and Greater Noida, 9 in Ghaziabad, 4 in Gurugram, 3 in Faridabad and 1 in Sonipat.
- **The CPCB API matches names exactly.** A filter spelt `Uttar_Pradesh` returns nothing while `Uttar Pradesh` works, which had silently been dropping Noida and Ghaziabad to estimates. It is now covered by a test.
- **Both air-quality APIs and GitHub allow requests from browsers,** so the web version can fetch live data directly, without a server.

## 3. Solution

GaadiCheck turns all of this into one clear, explained answer per vehicle, every morning.

1. **Add your vehicle in about 30 seconds.** Type the registration number, or scan an RC screenshot. The app reads the plate, fuel, BS norm and registration date on the phone. It suggests the BS norm from the registration date and the home district from the RTO code or location.
2. **Get today's verdict:** allowed, not allowed, or check, for each of the six districts. Every verdict shows the reason, the fine at stake and a link to the official order.
3. **Look ahead:** see the GRAP stage in force, today's official AQI and tomorrow's forecast for every district, and a warning when the air is heading towards a stricter stage.
4. **Avoid document challans:** reminders 7 days and 1 day before the PUC or insurance expires.
5. **Share it:** a ready-made status card for family or office groups.

Design principles:

- **Explain, don't just decide.** Every answer comes with its reason and its source order.
- **Ask, don't guess.** If a detail such as the BS norm is missing, the app says "confirm your BS norm" rather than giving a confident wrong answer.
- **Private by design.** There is no account and no server. Vehicle details stay on the device, and Android cloud backup is turned off so they never leave it.
- **For everyone.** Every screen and reminder is in English and Hindi. It works offline with the last known data, and status is always shown with an icon and text as well as colour.
- **Free.** No sign-up, no ads, no paid services.

Available as an **Android app** and a **web app** (any browser, including iPhone), from one link.

## 4. Technical approach

| Layer                            | Approach                                                                                                                                                                                                                                                          |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **One codebase, two platforms**  | Expo SDK 58 and React Native 0.88 in strict TypeScript. The same code runs as the Android app and, through React Native Web, as the web app.                                                                                                                      |
| **Rules as data**                | Every restriction lives in `data/rules.json`: who, where, when, fine and source. A small rules engine (`src/domain/rulesEngine.ts`) evaluates them with three outcomes (yes, no, or "need more information"), so missing details are surfaced instead of guessed. |
| **Updates without app releases** | The GRAP stage and rules are fetched from the project's GitHub repository, so a new order reaches every user within minutes. App code changes ship over the air with EAS Update, and only native changes need a new APK.                                          |
| **Trustworthy remote data**      | Every feed is checked against a schema (Zod). A broken or partial file is rejected, and the app keeps its last good copy.                                                                                                                                         |
| **Air quality**                  | CPCB station readings are converted to India's National AQI (worst pollutant per station, averaged per district). Open-Meteo forecasts are converted with the same breakpoints.                                                                                   |
| **Offline first**                | Data is cached on the device with TanStack Query and kept for 7 days. The app opens instantly and works without a connection.                                                                                                                                     |
| **On-device intelligence**       | RC and PUC text recognition uses Google ML Kit on Android and Apple Vision on iOS, running on the phone. No images are uploaded.                                                                                                                                  |
| **No backend**                   | All public data comes from GitHub, data.gov.in and Open-Meteo. Vehicle data stays in local storage. Hosting is EAS Hosting, and the APK is distributed via GitHub Releases.                                                                                       |
| **Quality**                      | 84 automated tests cover the rules engine, AQI maths, plate formats, BS-norm timelines, OCR parsing and form validation. Type checking and linting run on every change.                                                                                           |

More detail: [Development](development.md), [Data and rules](data-and-rules.md), [Releasing](releasing.md), and the full [tools and technologies](tools-and-technologies.md) list.

## 5. Real-world impact

### Who it helps

- **Private car and two-wheeler owners** across Delhi-NCR, especially those with older BS-III and BS-IV vehicles, which the stricter stages target.
- **Commuters who cross districts,** for example Ghaziabad or Noida to Delhi, who face different rules on the same trip.
- **Families and offices** sharing one answer through the status card.
- **Hindi-speaking drivers,** who get the same clarity in their own language.

### What it changes

- **Fewer avoidable fines.** A driver who checks before leaving avoids a ₹20,000 GRAP challan or a ₹10,000 PUC challan, and expiry reminders keep the PUC valid before an enforcement drive.
- **Better compliance, cleaner air.** GRAP only works if restricted vehicles actually stay off the road. When drivers know clearly and in time, more of them comply, which is the point of the restrictions.
- **Less confusion and fewer wasted trips.** One explained answer per district replaces searching news sites and official orders.
- **Trust through transparency.** Every verdict links to the order behind it, and the app is clear that it is guidance, not an official notice.

### How we will measure it

The app can record anonymous usage events when analytics is switched on, with no registration numbers or personal data: vehicles added, documents scanned, verdicts shared, reminders turned on, language used. Together with downloads from GitHub Releases and website visits, these show adoption, how many vehicles are covered and how many users rely on reminders. GaadiCheck is a live MVP, and these numbers will be reported once it has users.

### What comes next

- **Stage-change alerts:** a notification only when a GRAP change affects one of your vehicles. Already built in the app, waiting on Firebase set-up.
- **Play Store release** for easier installation and automatic updates.
- **Faster stage updates:** automating the GRAP stage feed from CAQM orders, which are currently updated by hand.
- **iOS app,** and more cities with similar schemes.
