import { getEphemeris, ephemerisInfo } from './ephemeris.js';
import { siderealPositions, ayanamsaAt, ascendantAndCusps, riseSet } from './astro.js';
import {
  SIGNS, SIGN_LORDS, PLANETS, PLANET_NAMES, VARA_NAMES,
} from './constants.js';
import {
  describeLongitude, dignityOf, isCombust, vargaSign, houseOf, grahaAspects,
  vimshottari, panchangAt, signIndex, degreeInSign, nakshatraIndex, padaOf, norm360,
  VARGA_INFO,
} from './vedic.js';
import {
  localToUtc, dateToJd, jdToDate, formatJd, formatInZone, isoUtc, zoneLabel,
} from './time.js';

const DEFAULT_VARGAS = ['D1', 'D9', 'D10'];
const DEFAULT_TZ = 'Asia/Kolkata';

function requireNumber(value, name) {
  const n = Number(value);
  if (!Number.isFinite(n)) throw new Error(`${name} must be a number`);
  return n;
}

function parseDateParts(date, time) {
  const dm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(date).trim());
  if (!dm) throw new Error('date must be YYYY-MM-DD');
  const tm = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(String(time ?? '00:00').trim());
  if (!tm) throw new Error('time must be HH:MM or HH:MM:SS');

  return {
    year: Number(dm[1]),
    month: Number(dm[2]),
    day: Number(dm[3]),
    hour: Number(tm[1]),
    minute: Number(tm[2]),
    second: Number(tm[3] ?? 0),
  };
}

function weekdayOfLocalDate({ year, month, day }) {
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function sripatiHouse(longitude, boundaries) {
  for (let i = 0; i < 12; i += 1) {
    const start = boundaries[i];
    const end = boundaries[(i + 1) % 12];
    const span = norm360(end - start);
    if (norm360(longitude - start) < span) return i + 1;
  }
  return null;
}

function signChart(referenceSign, planets) {
  return Array.from({ length: 12 }, (_, i) => {
    const sign = (referenceSign + i) % 12;
    return {
      house: i + 1,
      sign: SIGNS[sign],
      sign_index: sign,
      planets: planets.filter((p) => p.sign_index === sign).map((p) => p.id),
    };
  });
}

function buildVargaChart(ascendantLongitude, planets, varga) {  const ascSign = vargaSign(ascendantLongitude, varga);
  const houses = Array.from({ length: 12 }, (_, i) => ({
    house: i + 1,
    sign: SIGNS[(ascSign + i) % 12],
    planets: [],
  }));

  const placements = {};
  for (const planet of planets) {
    const vSign = vargaSign(planet.longitude, varga);
    const vHouse = ((vSign - ascSign + 12) % 12) + 1;
    placements[planet.key] = {
      sign: SIGNS[vSign],
      sign_index: vSign,
      house: vHouse,
      degree_in_varga: Number((norm360(planet.longitude) * (VARGA_INFO[varga].division / 30) % 1 * 30).toFixed(4)),
    };
    houses[vHouse - 1].planets.push(planet.id);
  }

  return {
    varga,
    name: VARGA_INFO[varga].name,
    ascendant_sign: SIGNS[ascSign],
    ascendant_sign_index: ascSign,
    houses,
    placements,
  };
}

export async function buildChart(input) {
  const {
    name = null,
    date,
    time = '00:00',
    timeZone = DEFAULT_TZ,
    latitude,
    longitude,
    elevation = 0,
    placeName = null,
    vargas = DEFAULT_VARGAS,
    dashaDepth = 2,
    dashaYearDays = 365.25,
  } = input ?? {};

  const lat = requireNumber(latitude, 'latitude');
  const lon = requireNumber(longitude, 'longitude');
  const elev = Number(elevation) || 0;
  if (lat < -90 || lat > 90) throw new Error('latitude out of range');
  if (lon < -180 || lon > 180) throw new Error('longitude out of range');

  const parts = parseDateParts(date, time);
  const utc = localToUtc(parts, timeZone);
  const jdUt = dateToJd(utc);

  const swe = await getEphemeris();
  const [positions, asc, ayanamsa, info] = await Promise.all([
    siderealPositions(jdUt),
    ascendantAndCusps(jdUt, lat, lon),
    ayanamsaAt(jdUt),
    ephemerisInfo(),
  ]);

  const ascSign = signIndex(asc.ascendant);
  const ascDesc = describeLongitude(asc.ascendant);

  // Swiss Ephemeris returns Sripati *boundaries*; derive bhava madhya.
  const sripatiMadhya = asc.sripatiCusps.map((start, i) => {
    const end = asc.sripatiCusps[(i + 1) % 12];
    const span = norm360(end - start);
    return norm360(start + span / 2);
  });

  // Sunrise/sunset/moonrise/moonset for the local civil date.
  const localMidnight = localToUtc(
    { year: parts.year, month: parts.month, day: parts.day, hour: 0, minute: 0, second: 0 },
    timeZone,
  );
  const jdMidnight = dateToJd(localMidnight);
  const [sunrise, sunset, moonrise, moonset] = await Promise.all([
    riseSet(jdMidnight, 'sun', 'rise', lat, lon, elev),
    riseSet(jdMidnight, 'sun', 'set', lat, lon, elev),
    riseSet(jdMidnight, 'moon', 'rise', lat, lon, elev),
    riseSet(jdMidnight, 'moon', 'set', lat, lon, elev),
  ]);

  // Vara follows the Hindu day: sunrise to sunrise.
  let varaDay = weekdayOfLocalDate(parts);
  if (sunrise !== null && jdUt < sunrise) varaDay = (varaDay + 6) % 7;

  const sunLon = positions.sun.longitude;
  const moonLon = positions.moon.longitude;

  const planets = PLANETS.map((meta) => {
    const pos = positions[meta.key];
    const desc = describeLongitude(pos.longitude);
    const combust = isCombust(meta.key, pos.longitude, sunLon, pos.retrograde);
    const dignity = dignityOf(meta.key, pos.longitude);

    const vargaPlacements = {};
    for (const v of vargas) {
      const vSign = vargaSign(pos.longitude, v);
      vargaPlacements[v] = {
        sign: SIGNS[vSign],
        sign_index: vSign,
      };
    }

    return {
      key: meta.key,
      id: meta.id,
      sanskrit: meta.sanskrit,
      ...desc,
      house: houseOf(pos.longitude, ascSign),
      sripati_house: sripatiHouse(pos.longitude, asc.sripatiCusps),
      retrograde: Boolean(pos.retrograde),
      speed: Number(pos.speed.toFixed(6)),
      dignity,
      combust: combust.combust,
      combustion_orb: combust.orb,
      combustion_limit: combust.limit ?? null,
      vargas: vargaPlacements,
    };
  });

  const houses = Array.from({ length: 12 }, (_, i) => {
    const sign = (ascSign + i) % 12;
    const lordName = SIGN_LORDS[sign];
    const lordKey = lordName.toLowerCase();
    const lordPlanet = planets.find((p) => p.key === lordKey);
    return {
      house: i + 1,
      sign: SIGNS[sign],
      sign_index: sign,
      lord: lordName,
      lord_house: lordPlanet ? lordPlanet.house : null,
      lord_sign: lordPlanet ? lordPlanet.sign : null,
      occupants: planets.filter((p) => p.house === i + 1).map((p) => p.id),
      sripati_bhava_madhya: Number(sripatiMadhya[i].toFixed(4)),
      sripati_boundary: Number(asc.sripatiCusps[i].toFixed(4)),
      whole_sign_start: sign * 30,
    };
  });

  const planetSigns = Object.fromEntries(planets.map((p) => [p.key, p.sign_index]));
  const aspects = grahaAspects(planetSigns, ascSign).map((a) => ({
    from: PLANET_NAMES[a.from] ?? a.from,
    to: a.to === 'Lagna' ? 'Lagna' : PLANET_NAMES[a.to] ?? a.to,
    house_distance: a.distance,
    special: a.variant,
  }));

  const conjunctions = [];
  for (let sign = 0; sign < 12; sign += 1) {
    const group = planets.filter((p) => p.sign_index === sign);
    if (group.length > 1) {
      const sorted = [...group].sort((a, b) => a.longitude - b.longitude);
      for (let i = 0; i < sorted.length - 1; i += 1) {
        const gap = Math.abs(sorted[i + 1].longitude - sorted[i].longitude);
        conjunctions.push({
          sign: SIGNS[sign],
          planets: [sorted[i].id, sorted[i + 1].id],
          orb: Number(gap.toFixed(4)),
        });
      }
    }
  }

  const dasha = vimshottari(moonLon, jdUt, {
    yearDays: dashaYearDays,
    depth: dashaDepth,
    tz: timeZone,
    formatJd,
    asOfJd: dateToJd(new Date()),
  });

  const panchang = panchangAt(sunLon, moonLon, jdUt, {
    vara: VARA_NAMES[varaDay],
    sunrise: sunrise !== null ? formatJd(sunrise, timeZone) : null,
    sunset: sunset !== null ? formatJd(sunset, timeZone) : null,
    moonrise: moonrise !== null ? formatJd(moonrise, timeZone) : null,
    moonset: moonset !== null ? formatJd(moonset, timeZone) : null,
  });

  const vargaCharts = {};
  for (const v of vargas) {
    vargaCharts[v] = buildVargaChart(asc.ascendant, planets, v);
  }

  return {
    schema: 'kundali/1.0',
    generated_at: new Date().toISOString(),
    conventions: {
      zodiac: 'sidereal',
      ayanamsa: 'Lahiri (Chitrapaksha)',
      ayanamsa_value: Number(ayanamsa.toFixed(6)),
      house_system: 'whole_sign (rashi) with Sripati cusps supplied',
      node: 'true node',
      dasha_year_days: dashaYearDays,
      ephemeris: `Swiss Ephemeris ${info.version} (sepl_18/semo_18/seas_18)`,
      timezone: timeZone,
      timezone_offset: zoneLabel(timeZone, utc),
    },
    subject: {
      name,
      birth: {
        local: formatInZone(utc, timeZone),
        utc: isoUtc(utc),
        julian_day_ut: Number(jdUt.toFixed(6)),
      },
      place: {
        name: placeName,
        latitude: lat,
        longitude: lon,
        elevation_m: elev,
      },
    },
    summary: {
      ascendant: {
        sign: SIGNS[ascSign],
        degree_in_sign: Number(degreeInSign(asc.ascendant).toFixed(4)),
        nakshatra: ascDesc.nakshatra,
        pada: ascDesc.pada,
      },
      sun_sign: SIGNS[signIndex(sunLon)],
      moon_sign: SIGNS[signIndex(moonLon)],
      moon_nakshatra: panchang.nakshatra.name,
      moon_pada: panchang.nakshatra.pada,
      vara: panchang.vara,
      tithi: `${panchang.tithi.paksha} ${panchang.tithi.name}`,
    },
    panchang,
    angles: {
      ascendant: { ...ascDesc },
      midheaven: describeLongitude(asc.midheaven),
      sripati_bhava_madhya: sripatiMadhya.map((c, i) => ({
        house: i + 1,
        longitude: Number(c.toFixed(4)),
        sign: SIGNS[signIndex(c)],
        degree_in_sign: Number(degreeInSign(c).toFixed(4)),
      })),
      sripati_boundaries: asc.sripatiCusps.map((c, i) => ({
        house: i + 1,
        longitude: Number(c.toFixed(4)),
        sign: SIGNS[signIndex(c)],
        degree_in_sign: Number(degreeInSign(c).toFixed(4)),
      })),
    },
    planets,
    houses,
    aspects,
    conjunctions,
    bhava_chalit: Array.from({ length: 12 }, (_, i) => ({
      house: i + 1,
      planets: planets.filter((p) => p.sripati_house === i + 1).map((p) => p.id),
    })),
    moon_chart: signChart(signIndex(moonLon), planets),
    sun_chart: signChart(signIndex(sunLon), planets),
    vargas: vargaCharts,
    dasha,
    extras: {
      moon_sign_index: signIndex(moonLon),
      moon_degree: Number(degreeInSign(moonLon).toFixed(4)),
      moon_nakshatra_index: nakshatraIndex(moonLon),
      moon_pada: padaOf(moonLon),
      sun_longitude: Number(sunLon.toFixed(6)),
      moon_longitude: Number(moonLon.toFixed(6)),
    },
  };
}

export { DEFAULT_VARGAS, DEFAULT_TZ };
