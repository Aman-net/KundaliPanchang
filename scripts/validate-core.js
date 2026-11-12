// Independent checks for the chart engine's calculation layer.
// Run: npm run validate
import assert from 'node:assert/strict';
import * as Astronomy from 'astronomy-engine';

import { buildChart } from '../src/chart.js';
import { matchCharts, mangalDosha } from '../src/match.js';
import { siderealPositions, ayanamsaAt } from '../src/astro.js';
import {
  dateToJd, localToUtc, formatInZone, zoneLabel,
} from '../src/time.js';
import {
  SIGNS, NAKSHATRAS, TITHI_NAMES, YOGA_NAMES, KARANA_NAMES, VIMSHOTTARI_ORDER,
} from '../src/constants.js';
import {
  describeLongitude, vargaSign, houseOf, dignityOf, isCombust, grahaAspects,
  vimshottari, panchangAt, taraScore,
} from '../src/vedic.js';

const norm360 = (x) => ((x % 360) + 360) % 360;
const failures = [];
let passed = 0;

async function test(name, fn) {
  try {
    await fn();
    passed += 1;
    console.log(`PASS  ${name}`);
  } catch (error) {
    failures.push({ name, error });
    console.error(`FAIL  ${name}`);
    console.error(`      ${error.message}`);
  }
}

function near(actual, expected, tolerance, label = 'value') {
  assert.ok(
    Number.isFinite(actual) && Math.abs(actual - expected) <= tolerance,
    `${label}: expected ${expected} ± ${tolerance}, got ${actual}`,
  );
}

function angleDiffArcsec(a, b) {
  return (((a - b + 540) % 360) - 180) * 3600;
}

function secondsOfDay(localTimestamp) {
  const match = /(\d{2}):(\d{2}):(\d{2})$/.exec(localTimestamp);
  assert.ok(match, `invalid timestamp ${localTimestamp}`);
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]);
}

function nearTimeOfDay(actual, expected, toleranceSeconds, label) {
  const diff = Math.abs(secondsOfDay(actual) - secondsOfDay(expected));
  assert.ok(
    Math.min(diff, 86400 - diff) <= toleranceSeconds,
    `${label}: expected ${expected} ± ${toleranceSeconds}s, got ${actual}`,
  );
}

const CHART_A = {
  date: '2000-08-15',
  time: '10:30',
  timeZone: 'Asia/Kolkata',
  latitude: 25.483,
  longitude: 80.334,
  elevation: 124,
  placeName: 'Banda, UP',
};

const CHART_B = {
  date: '2002-03-08',
  time: '14:20',
  timeZone: 'Asia/Kolkata',
  latitude: 25.483,
  longitude: 80.334,
  elevation: 124,
  placeName: 'Banda, UP',
};

const chartA = await buildChart(CHART_A);
const chartB = await buildChart(CHART_B);
const birthUtc = new Date('2000-08-15T05:00:00Z');
const birthJd = dateToJd(birthUtc);
const ayanamsa = await ayanamsaAt(birthJd);

await test('civil time, DST, fixed offsets, Julian Day', () => {
  near(dateToJd(new Date('2000-01-01T12:00:00Z')), 2451545.0, 1e-9, 'J2000 Julian Day');
  assert.equal(localToUtc({ year: 2000, month: 8, day: 15, hour: 10, minute: 30 }, 'Asia/Kolkata').toISOString(), '2000-08-15T05:00:00.000Z');
  assert.equal(localToUtc({ year: 2024, month: 7, day: 1, hour: 12, minute: 0 }, 'America/New_York').toISOString(), '2024-07-01T16:00:00.000Z');
  assert.equal(localToUtc({ year: 2024, month: 1, day: 15, hour: 12, minute: 0 }, 'America/New_York').toISOString(), '2024-01-15T17:00:00.000Z');
  assert.equal(localToUtc({ year: 2000, month: 8, day: 15, hour: 10, minute: 30 }, '+05:30').toISOString(), '2000-08-15T05:00:00.000Z');
  assert.equal(formatInZone(new Date('2000-08-15T05:00:00Z'), 'Asia/Kolkata'), '2000-08-15 10:30:00');
  assert.equal(zoneLabel('Asia/Kolkata', new Date('2000-08-15T05:00:00Z')), 'UTC+05:30');
});

await test('Lahiri ayanamsa is in the expected range', () => {
  near(ayanamsa, 23.8617, 0.001, 'ayanamsa at 2000-08-15');
});

await test('planetary longitudes agree with independent Astronomy Engine ephemeris', async () => {
  const sidereal = await siderealPositions(birthJd);
  const when = new Astronomy.AstroTime(birthUtc);
  const bodies = {
    sun: 'Sun',
    moon: 'Moon',
    mars: 'Mars',
    mercury: 'Mercury',
    jupiter: 'Jupiter',
    venus: 'Venus',
    saturn: 'Saturn',
  };
  let worst = 0;
  for (const [key, body] of Object.entries(bodies)) {
    const vector = Astronomy.GeoVector(Astronomy.Body[body], when, true);
    const ecliptic = Astronomy.Ecliptic(vector);
    const expected = norm360(ecliptic.elon - ayanamsa);
    const diff = angleDiffArcsec(sidereal[key].longitude, expected);
    worst = Math.max(worst, Math.abs(diff));
    assert.ok(Math.abs(diff) < 20, `${key}: expected ${expected.toFixed(6)}, got ${sidereal[key].longitude.toFixed(6)} (${diff.toFixed(2)}″)`);
  }
  near(angleDiffArcsec(sidereal.ketu.longitude, sidereal.rahu.longitude + 180), 0, 1e-6, 'Rahu/Ketu opposition');
  console.log(`      worst planetary difference: ${worst.toFixed(2)} arcseconds`);
});

await test('fixture chart summary, nakshatra, pada, and whole-sign houses', () => {
  assert.equal(chartA.summary.ascendant.sign, 'Libra');
  near(chartA.summary.ascendant.degree_in_sign, 2.4012, 0.0001, 'ascendant degree');
  assert.equal(chartA.summary.ascendant.nakshatra, 'Chitra');
  assert.equal(chartA.summary.ascendant.pada, 3);
  assert.equal(chartA.summary.sun_sign, 'Cancer');
  assert.equal(chartA.summary.moon_sign, 'Capricorn');
  assert.equal(chartA.summary.moon_nakshatra, 'Dhanishta');
  assert.equal(chartA.summary.moon_pada, 2);
  assert.equal(chartA.planets.find((p) => p.key === 'sun').house, 10);
  assert.equal(chartA.planets.find((p) => p.key === 'moon').house, 4);
  assert.equal(chartA.planets.find((p) => p.key === 'mars').house, 10);
  assert.equal(chartA.planets.find((p) => p.key === 'saturn').house, 8);
  const ascSignIndex = SIGNS.indexOf(chartA.summary.ascendant.sign);
  for (const planet of chartA.planets) {
    assert.equal(planet.house, houseOf(planet.longitude, ascSignIndex), `${planet.id} whole-sign house`);
  }
  assert.deepEqual(chartA.houses.map((h) => h.house), Array.from({ length: 12 }, (_, i) => i + 1));
  assert.deepEqual(chartA.houses.map((h) => h.sign), [
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  ]);
});

await test('nakshatra and pada boundaries', () => {
  assert.equal(describeLongitude(0).nakshatra, 'Ashwini');
  assert.equal(describeLongitude(0).pada, 1);
  assert.equal(describeLongitude(3.334).pada, 2);
  assert.equal(describeLongitude(13.334).nakshatra, 'Bharani');
  assert.equal(describeLongitude(13.334).pada, 1);
  assert.equal(describeLongitude(359.9999).nakshatra, 'Revati');
  assert.equal(describeLongitude(359.9999).pada, 4);
  assert.equal(describeLongitude(298.71311).nakshatra, 'Dhanishta');
  assert.equal(describeLongitude(298.71311).pada, 2);
});

await test('panchang returns the fixture values', () => {
  const pc = chartA.panchang;
  assert.equal(pc.vara, 'Tuesday');
  assert.equal(pc.tithi.name, 'Purnima');
  assert.equal(pc.tithi.paksha, 'Shukla');
  near(pc.tithi.percent_elapsed, 99.19, 0.01, 'tithi percent');
  assert.equal(pc.nakshatra.name, 'Dhanishta');
  assert.equal(pc.nakshatra.pada, 2);
  assert.equal(pc.nakshatra.lord, 'Mars');
  assert.equal(pc.yoga.name, 'Shobhana');
  assert.equal(pc.karana.name, 'Bava');
  nearTimeOfDay(pc.sunrise, '05:42:06', 60, 'sunrise vs USNO');
  nearTimeOfDay(pc.sunset, '18:43:43', 60, 'sunset vs USNO');
  nearTimeOfDay(pc.moonrise, '19:02:15', 60, 'moonrise vs USNO');
  nearTimeOfDay(pc.moonset, '05:32:51', 60, 'moonset vs USNO');
});

await test('Purnima end agrees with an independent ephemeris search', () => {
  const elongation = (date) => {
    const when = new Astronomy.AstroTime(date);
    const sun = Astronomy.Ecliptic(Astronomy.GeoVector(Astronomy.Body.Sun, when, true)).elon;
    const moon = Astronomy.Ecliptic(Astronomy.GeoVector(Astronomy.Body.Moon, when, true)).elon;
    return norm360(moon - sun);
  };
  let lo = birthUtc.getTime();
  let hi = birthUtc.getTime() + 6 * 3600 * 1000;
  assert.ok(elongation(new Date(lo)) < 180);
  assert.ok(elongation(new Date(hi)) > 180);
  for (let i = 0; i < 60; i += 1) {
    const mid = (lo + hi) / 2;
    if (elongation(new Date(mid)) < 180) lo = mid;
    else hi = mid;
  }
  const endLocal = formatInZone(new Date((lo + hi) / 2), 'Asia/Kolkata');
  nearTimeOfDay(endLocal, '10:42:00', 120, 'Purnima end');
});

await test('panchang tithi, yoga, karana, and paksha boundaries', () => {
  const start = panchangAt(0, 0, 2451545);
  assert.equal(start.tithi.name, 'Pratipada');
  assert.equal(start.tithi.paksha, 'Shukla');
  assert.equal(start.yoga.name, 'Vishkambha');
  assert.equal(start.karana.name, 'Kimstughna');

  const bava = panchangAt(0, 6, 2451545);
  assert.equal(bava.karana.name, 'Bava');

  const krishna = panchangAt(0, 180, 2451545);
  assert.equal(krishna.tithi.number, 16);
  assert.equal(krishna.tithi.name, 'Pratipada');
  assert.equal(krishna.tithi.paksha, 'Krishna');

  const end = panchangAt(0, 359.999, 2451545);
  assert.equal(end.tithi.number, 30);
  assert.equal(end.tithi.name, 'Amavasya');
  assert.equal(end.tithi.paksha, 'Krishna');
  assert.equal(end.yoga.name, 'Vaidhriti');
  assert.equal(end.karana.name, 'Naga');

  const yoga = panchangAt(0, 13.334, 2451545);
  assert.equal(yoga.yoga.name, 'Priti');
});

await test('all divisional-chart boundary rules', () => {
  const cases = [
    ['D1', 0, 0], ['D1', 30, 1], ['D1', 359.999, 11],
    ['D2', 0, 4], ['D2', 14.999, 4], ['D2', 15, 3], ['D2', 30, 3], ['D2', 45, 4],
    ['D3', 0, 0], ['D3', 10, 4], ['D3', 20, 8], ['D3', 30, 1], ['D3', 40, 5], ['D3', 50, 9],
    ['D4', 0, 0], ['D4', 7.5, 3], ['D4', 15, 6], ['D4', 22.5, 9],
    ['D7', 0, 0], ['D7', 4.286, 1], ['D7', 8.572, 2], ['D7', 30, 7], ['D7', 34.286, 8],
    ['D9', 0, 0], ['D9', 3.334, 1], ['D9', 30, 9], ['D9', 60, 6], ['D9', 90, 3],
    ['D10', 0, 0], ['D10', 3.001, 1], ['D10', 30, 9], ['D10', 60, 2], ['D10', 90, 11],
    ['D12', 0, 0], ['D12', 2.501, 1], ['D12', 30, 1],
    ['D16', 0, 0], ['D16', 1.876, 1], ['D16', 30, 4], ['D16', 60, 8], ['D16', 90, 0],
    ['D20', 0, 0], ['D20', 1.501, 1], ['D20', 30, 8], ['D20', 60, 4], ['D20', 90, 0],
    ['D24', 0, 4], ['D24', 1.251, 5], ['D24', 30, 3], ['D24', 60, 4], ['D24', 90, 3],
    ['D27', 0, 0], ['D27', 1.112, 1], ['D27', 30, 3], ['D27', 60, 6], ['D27', 90, 9], ['D27', 120, 0],
    ['D30', 0, 0], ['D30', 5, 10], ['D30', 10, 8], ['D30', 18, 2], ['D30', 25, 6],
    ['D30', 30, 1], ['D30', 35, 5], ['D30', 42, 11], ['D30', 50, 9], ['D30', 55, 7],
    ['D40', 0, 0], ['D40', 0.751, 1], ['D40', 30, 6], ['D40', 60, 0],
    ['D45', 0, 0], ['D45', 0.667, 1], ['D45', 30, 4], ['D45', 60, 8],
    ['D60', 0, 0], ['D60', 0.5, 1], ['D60', 29.5, 11], ['D60', 30, 7], ['D60', 30.5, 8],
  ];
  for (const [varga, longitude, expected] of cases) {
    assert.equal(vargaSign(longitude, varga), expected, `${varga} at ${longitude}°: expected ${SIGNS[expected]}`);
  }
});

await test('dignity, including moolatrikona priority and exaltation', () => {
  assert.equal(dignityOf('sun', 10), 'exalted');
  assert.equal(dignityOf('sun', 125), 'moolatrikona');
  assert.equal(dignityOf('sun', 145), 'own');
  assert.equal(dignityOf('sun', 190), 'debilitated');
  assert.equal(dignityOf('moon', 33), 'exalted');
  assert.equal(dignityOf('moon', 34), 'moolatrikona');
  assert.equal(dignityOf('moon', 220), 'debilitated');
  assert.equal(dignityOf('mars', 5), 'moolatrikona');
  assert.equal(dignityOf('mars', 15), 'own');
  assert.equal(dignityOf('mars', 105), 'debilitated');
  assert.equal(dignityOf('mars', 298), 'exalted');
  assert.equal(dignityOf('mercury', 165), 'exalted');
  assert.equal(dignityOf('mercury', 166), 'moolatrikona');
  assert.equal(dignityOf('mercury', 171), 'exalted');
  assert.equal(dignityOf('jupiter', 95), 'exalted');
  assert.equal(dignityOf('jupiter', 245), 'moolatrikona');
  assert.equal(dignityOf('jupiter', 340), 'own');
  assert.equal(dignityOf('venus', 357), 'exalted');
  assert.equal(dignityOf('venus', 185), 'moolatrikona');
  assert.equal(dignityOf('venus', 40), 'own');
  assert.equal(dignityOf('saturn', 200), 'exalted');
  assert.equal(dignityOf('saturn', 310), 'moolatrikona');
  assert.equal(dignityOf('saturn', 280), 'own');
  assert.equal(dignityOf('saturn', 10), 'debilitated');
});

await test('combustion orbs and retrograde variants', () => {
  assert.equal(isCombust('moon', 12, 0).combust, true);
  assert.equal(isCombust('moon', 12.1, 0).combust, false);
  assert.equal(isCombust('mars', 17, 0).combust, true);
  assert.equal(isCombust('mars', 17.1, 0).combust, false);
  assert.equal(isCombust('mercury', 14, 0, false).combust, true);
  assert.equal(isCombust('mercury', 12, 0, true).combust, true);
  assert.equal(isCombust('mercury', 13, 0, true).combust, false);
  assert.equal(isCombust('venus', 10, 0, false).combust, true);
  assert.equal(isCombust('venus', 8, 0, true).combust, true);
  assert.equal(isCombust('venus', 9, 0, true).combust, false);
  assert.equal(isCombust('jupiter', 11, 0).combust, true);
  assert.equal(isCombust('saturn', 15, 0).combust, true);
  assert.equal(isCombust('sun', 0, 0).combust, false);
});

await test('graha aspects include 7th, special, and Lagna aspects', () => {
  const aspects = grahaAspects({
    sun: 6, mars: 0, jupiter: 0, saturn: 0, moon: 3, venus: 4, mercury: 9,
  }, 6);
  assert.ok(aspects.some((a) => a.from === 'mars' && a.to === 'moon' && a.distance === 4 && a.variant));
  assert.ok(aspects.some((a) => a.from === 'jupiter' && a.to === 'venus' && a.distance === 5 && a.variant));
  assert.ok(aspects.some((a) => a.from === 'jupiter' && a.to === 'sun' && a.distance === 7 && !a.variant));
  assert.ok(aspects.some((a) => a.from === 'saturn' && a.to === 'mercury' && a.distance === 10 && a.variant));
  assert.ok(aspects.some((a) => a.from === 'jupiter' && a.to === 'Lagna' && a.distance === 7));
});

await test('Vimshottari balance, sequence, and period totals', () => {
  const asOf = dateToJd(new Date('2026-11-11T00:00:00Z'));
  const dasha = vimshottari(298.71311, birthJd, {
    yearDays: 365.25,
    depth: 2,
    tz: 'Asia/Kolkata',
    formatJd: (jd, tz) => formatInZone(new Date((jd - 2440587.5) * 86400000), tz),
    asOfJd: asOf,
  });
  assert.equal(dasha.birth_nakshatra, 'Dhanishta');
  assert.equal(dasha.balance_at_birth.lord, 'Mars');
  near(dasha.balance_at_birth.years, 4.1756, 0.0001, 'dasha balance');
  near(dasha.balance_at_birth.fraction_elapsed, 0.403483, 0.000001, 'dasha elapsed fraction');
  assert.equal(dasha.mahadashas.length, 9);
  assert.deepEqual(dasha.mahadashas.map((m) => m.lord), ['Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury', 'Ketu', 'Venus', 'Sun', 'Moon']);
  const totalYears = dasha.mahadashas.reduce((sum, m) => sum + m.years, 0);
  near(totalYears, 120, 1e-9, 'mahadasha total');
  const first = dasha.mahadashas[0];
  const elapsedYears = 7 * dasha.balance_at_birth.fraction_elapsed;
  near(first.start_jd, birthJd - elapsedYears * 365.25, 0.001, 'first dasha start');
  assert.equal(first.includes_birth, true);
  for (const maha of dasha.mahadashas) {
    const subTotal = maha.antardashas.reduce((sum, a) => sum + a.years, 0);
    near(subTotal, maha.years, 0.001, `${maha.lord} antardasha total`);
  }
  assert.equal(dasha.current.mahadasha.lord, 'Jupiter');
  assert.equal(dasha.current.antardasha.lord, 'Saturn');
  near(dasha.current.as_of_jd, asOf, 1e-6, 'current dasha as-of JD');
  const currentMaha = dasha.mahadashas.find((m) => m.lord === dasha.current.mahadasha.lord);
  assert.ok(currentMaha.start_jd <= dasha.current.as_of_jd && dasha.current.as_of_jd < currentMaha.end_jd, 'current dasha JD in range');
  assert.equal(VIMSHOTTARI_ORDER.length, 9);
});

await test('Ashtakoota fixture, row bounds, and Tara direction', () => {
  const match = matchCharts(chartA, chartB, { groom: 'A' });
  const k = match.ashtakoota;
  assert.equal(k.score, 7.5);
  assert.deepEqual(
    Object.fromEntries(Object.entries(k.rows).map(([name, row]) => [name, row.score])),
    { varna: 0, vashya: 1, tara: 1.5, yoni: 2, graha_maitri: 3, gana: 0, bhakoot: 0, nadi: 0 },
  );
  assert.equal(k.rows.varna.groom, 'Vaishya');
  assert.equal(k.rows.varna.bride, 'Kshatriya');
  assert.equal(k.rows.tara.groom_to_bride.count, 25);
  assert.equal(k.rows.tara.groom_to_bride.remainder, 7);
  assert.equal(k.rows.tara.groom_to_bride.bad, true);
  assert.equal(k.rows.tara.bride_to_groom.count, 4);
  assert.equal(k.rows.tara.bride_to_groom.remainder, 4);
  assert.equal(k.rows.bhakoot.distance, 2);
  assert.equal(k.rows.nadi.dosha, true);
  assert.equal(taraScore(22, 19).count, 25);
  assert.equal(taraScore(19, 22).count, 4);
  for (const [name, row] of Object.entries(k.rows)) {
    assert.ok(row.score >= 0 && row.score <= row.max, `${name} score in range`);
  }
  const swapped = matchCharts(chartA, chartB, { groom: 'B' }).ashtakoota;
  assert.equal(swapped.score, 8.5);
  assert.equal(swapped.rows.tara.groom_to_bride.count, 4);
  assert.equal(swapped.rows.tara.bride_to_groom.count, 25);
});

await test('Mangal dosha fixture and house calculations', () => {
  const doshaA = mangalDosha(chartA);
  assert.equal(doshaA.mars_sign, 'Cancer');
  assert.equal(doshaA.mars_house_from_lagna, 10);
  assert.equal(doshaA.mars_house_from_moon, 7);
  assert.equal(doshaA.mars_house_from_venus, 12);
  assert.deepEqual(doshaA.dosha, { from_lagna: false, from_moon: true, from_venus: true });
  assert.equal(doshaA.any, true);
  const doshaB = mangalDosha(chartB);
  assert.equal(doshaB.mars_sign, 'Aries');
  assert.equal(doshaB.mars_house_from_lagna, 10);
  assert.equal(doshaB.mars_house_from_moon, 5);
  assert.equal(doshaB.mars_house_from_venus, 2);
  assert.deepEqual(doshaB.dosha, { from_lagna: false, from_moon: false, from_venus: true });
  assert.ok(doshaB.notes.some((note) => note.includes('moolatrikona')));
});

await test('chart and match schemas contain the fields the UI consumes', () => {
  assert.equal(chartA.schema, 'kundali/1.0');
  assert.equal(chartA.vargas.D1.varga, 'D1');
  assert.equal(chartA.vargas.D9.name, 'Navamsa');
  assert.equal(chartA.vargas.D10.name, 'Dashamsha');
  assert.equal(chartA.vargas.D1.houses.length, 12);
  assert.equal(chartA.planets.length, 9);
  assert.equal(chartA.dasha.mahadashas.length, 9);
  const match = matchCharts(chartA, chartB, { groom: 'A' });
  assert.equal(match.schema, 'kundali-match/1.0');
  assert.equal(match.charts.a.vargas.D1.varga, 'D1');
  assert.equal(match.charts.b.vargas.D1.varga, 'D1');
  assert.equal(match.a.summary.moon_nakshatra, 'Dhanishta');
  assert.equal(match.b.summary.moon_nakshatra, 'Purva Ashadha');
  assert.ok(SIGNS.includes(match.a.summary.ascendant));
  assert.ok(NAKSHATRAS.includes(match.a.summary.moon_nakshatra));
  assert.ok(TITHI_NAMES.includes(chartA.panchang.tithi.name));
  assert.ok(YOGA_NAMES.includes(chartA.panchang.yoga.name));
  assert.ok(KARANA_NAMES.includes(chartA.panchang.karana.name));
});

console.log('');
if (failures.length) {
  console.error(`${failures.length} validation group(s) failed; ${passed} passed.`);
  process.exitCode = 1;
} else {
  console.log(`${passed} validation groups passed.`);
}
