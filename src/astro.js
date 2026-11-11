import { getEphemeris } from './ephemeris.js';
import { SE, FLAGS_SIDEREAL } from './se.js';

const BODY_IDS = {
  sun: SE.SUN,
  moon: SE.MOON,
  mercury: SE.MERCURY,
  venus: SE.VENUS,
  mars: SE.MARS,
  jupiter: SE.JUPITER,
  saturn: SE.SATURN,
  rahu: SE.TRUE_NODE,
};

function norm360(x) {
  return ((x % 360) + 360) % 360;
}

export async function siderealPositions(jdUt) {
  const swe = await getEphemeris();
  const out = {};

  for (const [key, id] of Object.entries(BODY_IDS)) {
    const [lon, lat, dist, lonSpeed, latSpeed, distSpeed] = swe.swe_calc_ut(jdUt, id, FLAGS_SIDEREAL);
    out[key] = {
      longitude: norm360(lon),
      latitude: lat,
      distance: dist,
      speed: lonSpeed,
      latitudeSpeed: latSpeed,
      distanceSpeed: distSpeed,
      retrograde: lonSpeed < 0,
    };
  }

  out.ketu = {
    longitude: norm360(out.rahu.longitude + 180),
    latitude: -out.rahu.latitude,
    distance: out.rahu.distance,
    speed: out.rahu.speed,
    latitudeSpeed: -out.rahu.latitudeSpeed,
    distanceSpeed: out.rahu.distanceSpeed,
    retrograde: out.rahu.retrograde,
  };

  return out;
}

export async function tropicalPositions(jdUt) {
  const swe = await getEphemeris();
  const sun = swe.swe_calc_ut(jdUt, SE.SUN, SE.FLG_SWIEPH)[0];
  const moon = swe.swe_calc_ut(jdUt, SE.MOON, SE.FLG_SWIEPH)[0];
  return { sun: norm360(sun), moon: norm360(moon) };
}

export async function ayanamsaAt(jdUt) {
  const [tropical, sidereal] = await Promise.all([
    tropicalPositions(jdUt),
    siderealPositions(jdUt),
  ]);
  return norm360(tropical.sun - sidereal.sun.longitude);
}

export async function ascendantAndCusps(jdUt, lat, lon) {
  const swe = await getEphemeris();

  const placidus = swe.swe_houses_ex(jdUt, SE.FLG_SIDEREAL, lat, lon, 'P');
  const sripati = swe.swe_houses_ex(jdUt, SE.FLG_SIDEREAL, lat, lon, 'S');

  return {
    ascendant: norm360(placidus.ascmc[0]),
    midheaven: norm360(placidus.ascmc[1]),
    sripatiCusps: sripati.cusps.slice(1, 13).map(norm360),
  };
}

/**
 * Rise/set/transit search.
 * @param {number} jdStart UT julian day to search forward from
 * @param {'sun'|'moon'} body
 * @param {'rise'|'set'|'transit'} event
 */
export async function riseSet(jdStart, body, event, lat, lon, elevation = 0) {
  const swe = await getEphemeris();
  const ipl = body === 'sun' ? SE.SUN : SE.MOON;
  const rsmi = event === 'rise' ? SE.CALC_RISE : event === 'set' ? SE.CALC_SET : SE.CALC_MTRANSIT;
  const geopos = [lon, lat, elevation];

  try {
    const tret = swe.swe_rise_trans(jdStart, ipl, null, SE.FLG_SWIEPH, rsmi, geopos, 1013.25, 20);
    return Number.isFinite(tret) && tret > 0 ? tret : null;
  } catch {
    return null;
  }
}
