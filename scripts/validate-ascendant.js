// Independent ascendant check: Meeus GMST + obliquity vs Swiss Ephemeris houses.
// Run: node scripts/validate-ascendant.js
import { ascendantAndCusps, ayanamsaAt } from '../src/astro.js';
import { dateToJd, localToUtc } from '../src/time.js';

const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;

const norm360 = (x) => ((x % 360) + 360) % 360;

function gmstDeg(jdUt) {
  const T = (jdUt - 2451545.0) / 36525;
  return norm360(
    280.46061837 +
      360.98564736629 * (jdUt - 2451545.0) +
      0.000387933 * T * T -
      (T * T * T) / 38710000,
  );
}

function obliquityDeg(jdUt) {
  const T = (jdUt - 2451545.0) / 36525;
  return 23.439291111 - 0.0130041667 * T - 1.638e-7 * T * T + 5.036e-7 * T * T * T;
}

function independentAscendant(jdUt, lat, lon) {
  const lst = norm360(gmstDeg(jdUt) + lon);
  const eps = obliquityDeg(jdUt) * D2R;
  const phi = lat * D2R;
  const theta = lst * D2R;
  const asc = Math.atan2(
    Math.cos(theta),
    -(Math.sin(theta) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps)),
  );
  return norm360(asc * R2D);
}

const cases = [
  { date: '2000-08-15', time: '10:30', lat: 25.483, lon: 80.334 },
  { date: '2000-01-01', time: '06:54', lat: 25.483, lon: 80.334 },
  { date: '2005-12-31', time: '23:45', lat: 25.483, lon: 80.334 },
  { date: '1973-04-24', time: '18:00', lat: 19.076, lon: 72.8777 },
];

let worst = 0;
for (const c of cases) {
  const [y, m, d] = c.date.split('-').map(Number);
  const [h, mi] = c.time.split(':').map(Number);
  const utc = localToUtc({ year: y, month: m, day: d, hour: h, minute: mi }, 'Asia/Kolkata');
  const jd = dateToJd(utc);
  const [asc, ayan] = await Promise.all([
    ascendantAndCusps(jd, c.lat, c.lon),
    ayanamsaAt(jd),
  ]);
  const tropical = norm360(asc.ascendant + ayan);
  const independent = independentAscendant(jd, c.lat, c.lon);
  const diff = ((tropical - independent + 540) % 360) - 180;
  worst = Math.max(worst, Math.abs(diff * 60));
  console.log(
    `${c.date} ${c.time}  SE=${asc.ascendant.toFixed(5)}  independent=${independent.toFixed(5)}  diff=${(diff * 60).toFixed(2)}'`,
  );
}

console.log(`Worst difference: ${worst.toFixed(2)} arcminutes`);
