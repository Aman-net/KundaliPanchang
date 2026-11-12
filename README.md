# Kundali

A Vedic birth-chart **data generator**. It computes the chart and the deterministic facts around it; it does not interpret. The JSON/Markdown output is meant to be handed to another AI or astrologer for reading.

## What it computes

- **Charts:** D1 (Rashi), D9 (Navamsa), D10 (Dashamsha) by default; D2–D60 selectable.
- **North Indian diagrams:** D1/D9/D10 rendered as interactive North Indian charts with English + Hindi planet labels; tap or click a house or planet for details. South Indian layout is not implemented yet.
- **Planets:** sidereal longitude, sign, degree, nakshatra + pada, house, dignity, retrogression, combustion.
- **Houses:** whole-sign (rashi) primary, plus Sripati bhava madhya, boundaries and bhava-chalit placements.
- **Reference charts:** Moon chart (Chandra lagna) and Sun chart (Surya lagna).
- **Relations:** graha drishti aspects (including Mars/Jupiter/Saturn special aspects), same-sign conjunctions.
- **Timing:** Vimshottari dasha — mahadasha, antardasha, optional pratyantardasha, plus the current period at generation time. The UI includes a 120-year mahadasha timeline with the current period marker.
- **Birth panchang:** vara, tithi, nakshatra, yoga, karana, sunrise/sunset, moonrise/moonset.
- **Matching:** Ashtakoota (8 kootas, 36 points) and Mangal dosha for two charts.
- **Place search:** Open-Meteo town/city lookup fills place, latitude, longitude, elevation and timezone.
- **Save / share:** chart and match inputs are encoded in the URL; the Share button copies the link (or opens the native share sheet), and opening the link restores the form and runs the calculation.
- **Copy for AI:** one click copies the Markdown digest wrapped in a neutral, grounded interpretation prompt, ready to paste into an AI chat.
- **Print / PDF:** browser print-to-PDF button on the chart and match results.

## Conventions

| Item | Value |
|---|---|
| Zodiac | Sidereal |
| Ayanamsa | Lahiri / Chitrapaksha |
| House system | Whole sign (rashi) primary; Sripati bhava madhya supplied |
| Node | True node (Rahu); Ketu opposite |
| Dasha | Vimshottari, year = 365.25 days |
| Vara | Sunrise to sunrise |
| Ephemeris | Swiss Ephemeris 2.10.03, `sepl_18` / `semo_18` / `seas_18` (1800–2399) |

The payload states all of these in `conventions`, so a downstream interpreter does not have to guess.

## Setup

```bash
npm install
```

The three standard Swiss Ephemeris files are committed in `static/ephe`:

```bash
ls static/ephe
# seas_18.se1  sepl_18.se1  semo_18.se1
```

To refresh them from the Swiss Ephemeris repository:

```bash
curl -L -o static/ephe/sepl_18.se1 https://raw.githubusercontent.com/aloistr/swisseph/master/ephe/sepl_18.se1
curl -L -o static/ephe/semo_18.se1 https://raw.githubusercontent.com/aloistr/swisseph/master/ephe/semo_18.se1
curl -L -o static/ephe/seas_18.se1 https://raw.githubusercontent.com/aloistr/swisseph/master/ephe/seas_18.se1
```

## Run the UI

```bash
npm start
```

Open <http://localhost:5173>. Two tabs: **Chart** (one birth at a time) and **Match** (two charts). The chart diagrams are North Indian. UI labels are bilingual (English + Hindi) for planets, signs, nakshatras, tithi/yoga/karana/vara, dignities, dasha lords, divisional charts, and match kootas.

The UI computes everything in the browser. The first calculation downloads the Wasm engine and the three ephemeris files (about 2.6 MB); later calculations are instant. Chart data never leaves the browser.

To run the optional Express API instead:

```bash
npm run api
# http://localhost:3000
```

To run the full validation suite:

```bash
npm run validate
```

This runs 16 calculation groups plus the independent ascendant check. It covers timezone/DST conversion, Julian Day, Lahiri ayanamsa, planetary longitudes against Astronomy Engine, nakshatra/pada boundaries, whole-sign houses, all divisional-chart rules, dignity, combustion, aspects, Vimshottari dasha, Ashtakoota, Mangal dosha, panchang boundaries, USNO rise/set fixtures, and the Purnima end time.

## Build and deploy

```bash
npm run build     # static site in dist/
npm run preview   # serve the production build locally
```

The static build works on Vercel, GitHub Pages, Netlify, or any file host. For Vercel:

1. Import <https://github.com/Aman-net/KundaliPanchang> at <https://vercel.com/new>.
2. Keep the detected **Vite** preset; build command `npm run build`, output directory `dist`.
3. Deploy. Every push to `main` redeploys.

Or with the CLI:

```bash
npx vercel login
npx vercel --prod
```

`vercel.json` sets the build/output paths and long-lived cache headers for `/ephe/*` and `/wasm/*`.

## CLI

```bash
node src/cli.js \
  --date 2000-08-15 --time 10:30 \
  --lat 25.483 --lon 80.334 --elev 124 \
  --tz Asia/Kolkata --place "Banda, UP" \
  --json chart.json --md chart.md
```

Options: `--vargas D1,D9,D10`, `--depth 3` for pratyantardashas, `--name`.

## API (optional)

The UI does not call these endpoints; it imports the engine directly. Start the API with `npm run api` when you need programmatic access.

`POST /api/chart`

```json
{
  "name": "Optional",
  "date": "2000-08-15",
  "time": "10:30",
  "timeZone": "Asia/Kolkata",
  "latitude": 25.483,
  "longitude": 80.334,
  "elevation": 124,
  "placeName": "Banda, UP",
  "vargas": ["D1", "D9", "D10"],
  "dashaDepth": 2
}
```

Response: `{ "chart": { ... }, "markdown": "..." }`.

`POST /api/match` takes `{ "a": <birth input>, "b": <birth input>, "groom": "A" | "B" }` and returns `{ "match": { ... }, "markdown": "..." }`.

## Validation performed

`npm run validate` is the source of truth. Current results:

- **Planetary longitudes** vs the independent Astronomy Engine ephemeris: worst difference 7.6 arcseconds for the fixture chart.
- **Ascendant** vs an independent Meeus sidereal-time formula: within 0.23 arcminutes.
- **Sunrise/sunset/moonrise/moonset** vs USNO for Banda on 2000-08-15: agreement within one minute.
- **Purnima end** vs USNO: independent search gives 10:42:34 IST; USNO says 10:43.
- **Vimshottari dasha:** balance, lord sequence, 120-year total, antardasha totals, and current period checked against the fixture.
- **Ashtakoota:** all eight row scores, Tara direction, 7.5/36 fixture total, and groom/bride swap behavior checked.
- **Mangal dosha:** houses from Lagna, Moon, and Venus checked for both fixture charts.
- **Divisional charts:** boundary cases for D1–D60 checked, including the even-sign D60 start rule.
- **Dignity:** moolatrikona priority, exaltation, debilitation, own sign, and natural friendship checked.
- **Panchang:** tithi, paksha, nakshatra/pada, yoga, karana, and vara boundaries checked.
- **Ephemeris files** confirmed active: SWIEPH and MOSEPH differ (Sun ~0.02″, Moon ~0.45″).

## Limits

- **Birth time** drives the lagna, houses, divisional charts and dasha dates. An approximate time makes those unreliable even though the Moon-based facts remain usable.
- **Ashtakoota tables** vary between classical texts. The implementation uses one documented table and includes the raw koota values in the JSON.
- **Nodal dignity** (Rahu/Ketu exaltation) is deliberately left as `unknown`; traditions disagree.
- **Interpretation** is deliberately absent. Yogas, strengths and predictions are left to the consumer.
- **Ephemeris range:** the bundled `sepl_18`/`semo_18`/`seas_18` files cover 1800–2399. Outside that range Swiss Ephemeris falls back to Moshier (lower precision).
- D30 `degree_in_varga` is approximate because Trimshamsha divisions are unequal.

## Layout

```
src/
  se.js               shared Swiss Ephemeris constants
  ephemeris.js        Node loader + local-file fetch shim
  ephemeris-browser.js browser Wasm/ephemeris loader
  time.js             timezone, julian day, formatting
  astro.js            positions, houses, rise/set
  vedic.js            nakshatra, dignity, vargas, dasha, panchang, ashtakoota
  chart.js            chart assembly
  match.js            matching
  format.js           Markdown digests
  server.js           optional Express API
  cli.js              command line
public/               Vite entry, UI shell and styles
static/ephe/          Swiss Ephemeris data files
static/wasm/          generated by predev/prebuild (gitignored)
scripts/copy-wasm.js  copies the Wasm binary into static/wasm
vite.config.js        browser bundle + browser ephemeris alias
dist/                 production build (gitignored)
```

## Licensing

Swiss Ephemeris (via `sweph-wasm`) is dual-licensed AGPL/commercial. This project is set up for personal use; review the Swiss Ephemeris license before distributing it.
