import SwissEPH from 'sweph-wasm';
import { SE, FLAGS_SIDEREAL } from './se.js';

export { SE, FLAGS_SIDEREAL };

let instancePromise = null;

/**
 * Browser loader. The engine is fully client-side, so the Wasm binary and the
 * three .se1 ephemeris files are fetched relative to the page. `base: './'` in
 * vite.config.js keeps this working at a domain root and under a sub-path.
 */
export function getEphemeris() {
  if (!instancePromise) {
    instancePromise = (async () => {
      const wasmUrl = new URL('wasm/swisseph.wasm', document.baseURI).href;
      const swe = await SwissEPH.init(wasmUrl);
      const epheUrl = new URL('ephe/', document.baseURI).href;

      // The library logs the loaded files. Keep the browser console clean.
      const log = console.log;
      console.log = () => {};
      try {
        await swe.swe_set_ephe_path(epheUrl);
      } finally {
        console.log = log;
      }

      swe.swe_set_sid_mode(SE.SIDM_LAHIRI, 0, 0);
      return swe;
    })().catch((err) => {
      instancePromise = null;
      throw err;
    });
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
