/**
 * Swiss Ephemeris constants shared by the Node and browser loaders.
 * Keeping these in a Node-free module lets Vite bundle the browser build
 * without pulling in `node:fs` or the local-file fetch shim.
 */
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
