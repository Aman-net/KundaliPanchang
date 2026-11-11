# Kundali

A Vedic birth-chart **data generator**. It computes the chart and the deterministic facts around it; it does not interpret. The JSON/Markdown output is meant to be handed to another AI or astrologer for reading.

## What it computes

- **Charts:** D1 (Rashi), D9 (Navamsa), D10 (Dashamsha) by default; D2–D60 selectable.
- **Planets:** sidereal longitude, sign, degree, nakshatra + pada, house, dignity, retrogression, combustion.
- **Houses:** whole-sign (rashi) primary, plus Sripati bhava madhya, boundaries and bhava-chalit placements.
- **Reference charts:** Moon chart (Chandra lagna) and Sun chart (Surya lagna).
- **Relations:** graha drishti aspects (including Mars/Jupiter/Saturn special aspects), same-sign conjunctions.
- **Timing:** Vimshottari dasha — mahadasha, antardasha, optional pratyantardasha, plus the current period at generation time.
- **Birth panchang:** vara, tithi, nakshatra, yoga, karana, sunrise/sunset, moonrise/moonset.
- **Matching:** Ashtakoota (8 kootas, 36 points) and Mangal dosha for two charts.

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

The three standard Swiss Ephemeris files must exist in `./ephe`:

```bash
mkdir -p ephe
curl -L -o ephe/sepl_18.se1 https://raw.githubusercontent.com/aloistr/swisseph/master/ephe/sepl_18.se1
curl -L -o ephe/semo_18.se1 https://raw.githubusercontent.com/aloistr/swisseph/master/ephe/semo_18.se1
curl -L -o ephe/seas_18.se1 https://raw.githubusercontent.com/aloistr/swisseph/master/ephe/seas_18.se1
```

## Run the UI

```bash
npm start
```

Open <http://localhost:3000>. Two tabs: **Chart** (one birth at a time) and **Match** (two charts).

To re-run the independent ascendant check:

```bash
npm run validate
```

## CLI

```bash
node src/cli.js \
  --date 2000-08-15 --time 10:30 \
  --lat 25.483 --lon 80.334 --elev 124 \
  --tz Asia/Kolkata --place "Banda, UP" \
  --json chart.json --md chart.md
```

Options: `--vargas D1,D9,D10`, `--depth 3` for pratyantardashas, `--name`.

## API

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

- **Sunrise/sunset** vs USNO for Banda (2000-01-01 and 2000-08-15): agreement to the minute.
- **Ascendant** vs an independent Meeus sidereal-time formula: within 0.25 arcminutes.
- **Tithi** vs USNO full-moon time for 2000-08-15: computed Purnima ends ~10:42 IST, USNO says 10:43.
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
  ephemeris.js   sweph-wasm loader + local-file fetch shim
  time.js        timezone, julian day, formatting
  astro.js       positions, houses, rise/set
  vedic.js       nakshatra, dignity, vargas, dasha, panchang, ashtakoota
  chart.js       chart assembly
  match.js       matching
  format.js      Markdown digests
  server.js      Express API + static UI
  cli.js         command line
public/          single-page UI
ephe/            Swiss Ephemeris data files
```

## Licensing

Swiss Ephemeris (via `sweph-wasm`) is dual-licensed AGPL/commercial. This project is set up for personal use; review the Swiss Ephemeris license before distributing it.
