import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const EPHE_DIR = path.resolve(__dirname, '..', 'ephe');

let shimInstalled = false;

/**
 * sweph-wasm loads both the wasm binary and the .se1 ephemeris files through
 * `fetch`. Node's fetch does not support file:// URLs, so we transparently
 * serve local files instead.
 */
function installFetchShim() {
  if (shimInstalled) return;
  shimInstalled = true;
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : input?.url ?? String(input);
    let file = null;

    if (url.startsWith('file://')) {
      file = fileURLToPath(url);
    } else {
      const name = url.split('?')[0].split('/').pop();
      if (name) {
        const candidate = path.join(EPHE_DIR, name);
        if (fs.existsSync(candidate)) file = candidate;
      }
    }

    if (!file) {
      if (originalFetch) return originalFetch(input, init);
      throw new Error(`No local file for ${url}`);
    }

    const buf = fs.readFileSync(file);
    const isWasm = file.toLowerCase().endsWith('.wasm');
    return new Response(buf, {
      status: 200,
      headers: { 'Content-Type': isWasm ? 'application/wasm' : 'application/octet-stream' },
    });
  };
}

export const SE = {
  SUN: 0,
  MOON: 1,
  MERCURY: 2,
  VENUS: 3,
  MARS: 4,
  JUPITER: 5,
  SATURN: 6,
  URANUS: 7,
  NEPTUNE: 8,
  PLUTO: 9,
  MEAN_NODE: 10,
  TRUE_NODE: 11,

  FLG_SWIEPH: 2,
  FLG_MOSEPH: 4,
  FLG_SPEED: 256,
  FLG_SIDEREAL: 65536,

  CALC_RISE: 1,
  CALC_SET: 2,
  CALC_MTRANSIT: 4,
  CALC_ITRANSIT: 8,

  SIDM_LAHIRI: 1,
};

/** Sidereal, with speed, using the Swiss ephemeris files. */
export const FLAGS_SIDEREAL = SE.FLG_SWIEPH | SE.FLG_SPEED | SE.FLG_SIDEREAL;

let instancePromise = null;

export function getEphemeris() {
  if (!instancePromise) {
    instancePromise = (async () => {
      installFetchShim();
      const SwissEPH = require('sweph-wasm');
      const swe = await SwissEPH.init();
      // Default file list is sepl_18 / semo_18 / seas_18, served from ./ephe.
      const log = console.log;
      console.log = () => {};
      try {
        await swe.swe_set_ephe_path('https://local/ephe/');
      } finally {
        console.log = log;
      }
      swe.swe_set_sid_mode(SE.SIDM_LAHIRI, 0, 0);
      return swe;
    })();
  }
  return instancePromise;
}

export async function ephemerisInfo() {
  const swe = await getEphemeris();
  return {
    version: typeof swe.swe_version === 'function' ? swe.swe_version() : 'unknown',
    ayanamsa: 'Lahiri',
  };
}
