# GaadiCheck brand guide

**Know before you drive.**

GaadiCheck answers one question every morning for Delhi-NCR drivers: _can this vehicle be on the road today?_ The brand should feel like a reliable traffic signal — calm, clear and instantly readable — never alarmist, never official-looking.

---

## 1. Positioning

|                 |                                                                                                                                           |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **For**         | Car, two-wheeler and goods-vehicle owners in Delhi, Gurugram, Noida, Ghaziabad, Faridabad and Sonipat                                     |
| **Problem**     | GRAP stages switch on and off with little notice; rules depend on fuel, BS norm and where a vehicle is registered; fines start at ₹10,000 |
| **Promise**     | A personal yes / no for _your_ vehicle, district by district, every day                                                                   |
| **Proof**       | Rules written as data with a source link on every verdict; official CPCB air quality; reminders before documents lapse                    |
| **Personality** | Helpful neighbour who reads the circulars so you don't have to                                                                            |

## 2. Voice and tone

- **Lead with the answer.** "You're good to drive" before any explanation.
- **Plain words, short sentences.** "Not allowed", not "Movement restricted under extant directions".
- **Calm about bad news.** "Don't drive in Ghaziabad today" — no exclamation marks, no fear.
- **Specific over vague.** "Fine up to ₹20,000", "Expires 30 Nov".
- **Bilingual by default.** Every string ships in English and Hindi; Hindi is written natively, not transliterated.
- **Never pose as government.** We are independent. We point to the official order; we do not issue one.

## 3. Logo

The mark is a **car seen head-on** wearing a **marigold check badge** — the vehicle and today's verdict in one shape. The car's number plate nods to the plate badges used throughout the app.

| File                                   | Use                                               |
| -------------------------------------- | ------------------------------------------------- |
| `logo-mark.svg` / `logo-mark-512.png`  | App icon contexts, avatars, favicons              |
| `logo-mark-inverse.svg`                | On indigo or photographic backgrounds             |
| `logo-horizontal.svg` / `.png`         | Default lock-up on light backgrounds              |
| `logo-horizontal-inverse.svg` / `.png` | On indigo backgrounds (wordmark white + marigold) |

**Clear space:** keep at least the badge's diameter around the logo.
**Minimum size:** mark 24 px; horizontal lock-up 96 px wide.

**Don't:** recolour the car or badge, separate the badge from the car (except in the launch animation), rotate the mark, add effects or outlines, stretch it, place the indigo tile on indigo, or combine it with any government emblem, the national flag, the Ashoka Chakra or state seals.

## 4. Colour

| Token                 | Hex       | Use                                            |
| --------------------- | --------- | ---------------------------------------------- |
| **Indigo** (primary)  | `#4338CA` | Brand, primary buttons, links, selected states |
| Indigo pressed        | `#3730A3` | Pressed states                                 |
| Indigo deep           | `#2E2A8F` | Gradient end on hero surfaces                  |
| Indigo soft           | `#EEF0FF` | Selected chips, info tiles                     |
| **Marigold** (accent) | `#FFC83D` | Check badge, wordmark on dark — use sparingly  |
| Ink                   | `#0F172A` | Primary text                                   |
| Ink muted             | `#475569` | Secondary text                                 |
| Ink subtle            | `#64748B` | Captions, metadata                             |
| Canvas                | `#F6F7FB` | App background                                 |
| Surface               | `#FFFFFF` | Cards                                          |
| Border                | `#E2E8F0` | Dividers, outlines                             |

**Verdict colours** are functional, never decorative, and are always paired with an icon and a word:

| State              | Foreground | Background |
| ------------------ | ---------- | ---------- |
| Allowed / go       | `#15803D`  | `#E7F6EC`  |
| Check / caution    | `#B45309`  | `#FEF3E2`  |
| Not allowed / stop | `#B91C1C`  | `#FDECEC`  |

**AQI colours** follow CPCB's bands (Good → Severe): `#3FAE49`, `#9BCB3B`, `#F2C014`, `#F28C28`, `#E53935`, `#8E1B1B`. **GRAP stage colours** run from orange (Stage I) to deep maroon (Stage IV).

All text/background pairs used in the app meet WCAG AA contrast.

## 5. Typography

| Role                                       | Typeface                           | Weight                                  |
| ------------------------------------------ | ---------------------------------- | --------------------------------------- |
| Display, headings, wordmark, number plates | **Plus Jakarta Sans**              | ExtraBold 800 / Bold 700 / SemiBold 600 |
| Body, UI text, numbers in text             | **Inter**                          | Regular 400 / Medium 500 / SemiBold 600 |
| Hindi                                      | **Noto Sans Devanagari** (bundled) | Bold 700 / SemiBold 600 / Regular 400   |

All three families are free under the SIL Open Font License. `fonts/` holds the Latin files used in brand artwork; the app bundles all three through `@expo-google-fonts`.

Type scale (pt): Display 30 · Title 24 · Heading 18 · Subheading 16 · Body 15 · Callout 14 · Caption 13 · Overline 12 (caps, +0.6 tracking) · Metric 40.

## 6. Signature elements

- **Plate badge** — registration numbers are always shown as a white plate with an ink border and rivets, set in Plus Jakarta Sans Bold with wide tracking.
- **Status pill** — icon + word + tinted background. Colour alone never carries meaning.
- **Stage badge** — the GRAP stage in Roman numerals on its stage colour.
- **Cards** — 16 px radius, hairline border, soft shadow, on the cool canvas.
- **Icons** — Ionicons, outline by default, filled for the active tab.
- **Spacing** — 4-point grid; 20 px screen gutters; 48 px minimum touch targets.

## 7. Imagery

- Shoot original footage: smoggy skylines, traffic, PUC booths, petrol-pump signage.
- Blur faces and number plates of other people's vehicles; ask before filming private property.
- Prefer natural light and real roads over stock images or illustrations of the city.
- On social cards use the indigo gradient with a white content panel (see the in-app share card).

## 8. App icon & splash

- **Icon:** indigo gradient tile, white car, marigold check badge. Android adaptive icon has separate background, foreground and monochrome (themed icon) layers.
- **Splash:** solid indigo `#4338CA` with the car centred, badge off. The in-app launch animation (about 1.5 s, skipped when the system asks for reduced motion) settles the car, stamps the badge on and fades in the name and tagline.
- **Notification icon:** white car-and-badge silhouette with the check knocked out.
