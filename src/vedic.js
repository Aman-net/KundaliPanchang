import {
  SIGNS, SIGN_LORDS, NAKSHATRAS, NAKSHATRA_LORDS, NAKSHATRA_YONI,
  NAKSHATRA_GANA, NAKSHATRA_NADI, TITHI_NAMES, YOGA_NAMES, KARANA_NAMES,
  EXALTATION, MOOLATRIKONA, OWN_SIGNS, NATURAL_FRIENDS, COMBUSTION_ORB,
  VIMSHOTTARI_ORDER, VIMSHOTTARI_YEARS, VARNA_BY_SIGN, VASHYA_BY_SIGN, VASHYA_SPLIT,
} from './constants.js';

export const NAKSHATRA_SIZE = 360 / 27;
export const PADA_SIZE = NAKSHATRA_SIZE / 4;

export function norm360(x) {
  return ((x % 360) + 360) % 360;
}

export function signIndex(longitude) {
  return Math.floor(norm360(longitude) / 30) % 12;
}

export function degreeInSign(longitude) {
  return norm360(longitude) % 30;
}

export function nakshatraIndex(longitude) {
  return Math.floor(norm360(longitude) / NAKSHATRA_SIZE) % 27;
}

export function padaOf(longitude) {
  const within = norm360(longitude) % NAKSHATRA_SIZE;
  return Math.floor(within / PADA_SIZE) + 1;
}

export function describeLongitude(longitude) {
  const lon = norm360(longitude);
  const sign = signIndex(lon);
  const nak = nakshatraIndex(lon);
  return {
    longitude: Number(lon.toFixed(6)),
    sign: SIGNS[sign],
    sign_index: sign,
    degree_in_sign: Number(degreeInSign(lon).toFixed(4)),
    nakshatra: NAKSHATRAS[nak],
    nakshatra_index: nak,
    nakshatra_lord: NAKSHATRA_LORDS[nak % 9],
    pada: padaOf(lon),
    nakshatra_progress: Number(((lon % NAKSHATRA_SIZE) / NAKSHATRA_SIZE * 100).toFixed(2)),
  };
}

/* ------------------------------------------------------------------ */
/* Dignity                                                            */
/* ------------------------------------------------------------------ */

export function dignityOf(key, longitude) {
  if (!(key in EXALTATION)) return 'unknown';
  const sign = signIndex(longitude);
  const exalt = EXALTATION[key];
  const debil = (exalt.sign + 6) % 12;

  const mt = MOOLATRIKONA[key];
  if (mt && sign === mt.sign) {
    const deg = degreeInSign(longitude);
    if (deg >= mt.start && deg < mt.end) return 'moolatrikona';
  }

  if (sign === exalt.sign) return 'exalted';
  if (sign === debil) return 'debilitated';

  if (OWN_SIGNS[key]?.includes(sign)) return 'own';

  const lordName = SIGN_LORDS[sign];
  const lordKey = lordName.toLowerCase();
  if (lordKey === key) return 'own';

  const rel = NATURAL_FRIENDS[key];
  if (!rel) return 'unknown';
  if (rel.friends.includes(lordKey)) return 'friend';
  if (rel.enemies.includes(lordKey)) return 'enemy';
  if (rel.neutral.includes(lordKey)) return 'neutral';
  return 'unknown';
}

export function isCombust(key, longitude, sunLongitude, retrograde = false) {
  if (!(key in COMBUSTION_ORB)) return { combust: false, orb: null };
  let orb = COMBUSTION_ORB[key];
  if (key === 'mercury' && retrograde) orb = COMBUSTION_ORB.mercuryRetrograde;
  if (key === 'venus' && retrograde) orb = COMBUSTION_ORB.venusRetrograde;
  const diff = Math.abs(((norm360(longitude - sunLongitude) + 180) % 360) - 180);
  return { combust: diff <= orb, orb: Number(diff.toFixed(3)), limit: orb };
}

/* ------------------------------------------------------------------ */
/* Divisional charts                                                  */
/* ------------------------------------------------------------------ */

const MOVABLE = new Set([0, 3, 6, 9]);
const FIXED = new Set([1, 4, 7, 10]);
// dual signs are the remaining 2, 5, 8, 11

function isOddSign(sign) {
  return sign % 2 === 0; // Aries, Gemini, Leo, ... (1st, 3rd, 5th sign)
}

export const VARGA_INFO = {
  D1: { name: 'Rashi', division: 1 },
  D2: { name: 'Hora', division: 2 },
  D3: { name: 'Drekkana', division: 3 },
  D4: { name: 'Chaturthamsha', division: 4 },
  D7: { name: 'Saptamsha', division: 7 },
  D9: { name: 'Navamsa', division: 9 },
  D10: { name: 'Dashamsha', division: 10 },
  D12: { name: 'Dwadashamsha', division: 12 },
  D16: { name: 'Shodashamsha', division: 16 },
  D20: { name: 'Vimshamsha', division: 20 },
  D24: { name: 'Chaturvimshamsha', division: 24 },
  D27: { name: 'Bhamsha', division: 27 },
  D30: { name: 'Trimshamsha', division: 30 },
  D40: { name: 'Khavedamsha', division: 40 },
  D45: { name: 'Akshavedamsha', division: 45 },
  D60: { name: 'Shashtiamsha', division: 60 },
};

export function vargaSign(longitude, varga) {
  const lon = norm360(longitude);
  const sign = signIndex(lon);
  const deg = degreeInSign(lon);

  switch (varga) {
    case 'D1':
      return sign;

    case 'D2': {
      const half = deg < 15 ? 0 : 1;
      if (isOddSign(sign)) return half === 0 ? 4 : 3; // Leo then Cancer
      return half === 0 ? 3 : 4;
    }

    case 'D3': {
      const part = Math.floor(deg / 10);
      return (sign + part * 4) % 12;
    }

    case 'D4': {
      const part = Math.floor(deg / 7.5);
      return (sign + part * 3) % 12;
    }

    case 'D7': {
      const part = Math.floor(deg / (30 / 7));
      const start = isOddSign(sign) ? sign : (sign + 6) % 12;
      return (start + part) % 12;
    }

    case 'D9': {
      return Math.floor(lon / (30 / 9)) % 12;
    }

    case 'D10': {
      const part = Math.floor(deg / 3);
      const start = isOddSign(sign) ? sign : (sign + 8) % 12;
      return (start + part) % 12;
    }

    case 'D12': {
      const part = Math.floor(deg / 2.5);
      return (sign + part) % 12;
    }

    case 'D16': {
      const part = Math.floor(deg / (30 / 16));
      const start = MOVABLE.has(sign) ? 0 : FIXED.has(sign) ? 4 : 8;
      return (start + part) % 12;
    }

    case 'D20': {
      const part = Math.floor(deg / 1.5);
      const start = MOVABLE.has(sign) ? 0 : FIXED.has(sign) ? 8 : 4;
      return (start + part) % 12;
    }

    case 'D24': {
      const part = Math.floor(deg / 1.25);
      const start = isOddSign(sign) ? 4 : 3;
      return (start + part) % 12;
    }

    case 'D27': {
      const part = Math.floor(deg / (30 / 27));
      const start = (sign % 4) * 3;
      return (start + part) % 12;
    }

    case 'D30': {
      if (isOddSign(sign)) {
        if (deg < 5) return 0;
        if (deg < 10) return 10;
        if (deg < 18) return 8;
        if (deg < 25) return 2;
        return 6;
      }
      if (deg < 5) return 1;
      if (deg < 12) return 5;
      if (deg < 20) return 11;
      if (deg < 25) return 9;
      return 7;
    }

    case 'D40': {
      const part = Math.floor(deg / 0.75);
      const start = isOddSign(sign) ? 0 : 6;
      return (start + part) % 12;
    }

    case 'D45': {
      const part = Math.floor(deg / (30 / 45));
      const start = MOVABLE.has(sign) ? 0 : FIXED.has(sign) ? 4 : 8;
      return (start + part) % 12;
    }

    case 'D60': {
      const part = Math.floor(deg / 0.5);
      const start = isOddSign(sign) ? sign : (sign + 6) % 12;
      return (start + part) % 12;
    }

    default:
      throw new Error(`Unknown varga ${varga}`);
  }
}

/* ------------------------------------------------------------------ */
/* Houses and aspects                                                 */
/* ------------------------------------------------------------------ */

export function houseOf(longitude, ascSign) {
  const sign = signIndex(longitude);
  return ((sign - ascSign + 12) % 12) + 1;
}

const SPECIAL_ASPECTS = {
  mars: [4, 8],
  jupiter: [5, 9],
  saturn: [3, 10],
  rahu: [5, 9],
  ketu: [5, 9],
};

export function grahaAspects(planetSigns, ascSign) {
  const aspectList = [];
  for (const [from, fromSign] of Object.entries(planetSigns)) {
    const distances = new Set([7]);
    for (const d of SPECIAL_ASPECTS[from] || []) distances.add(d);

    for (const d of distances) {
      const targetSign = (fromSign + d - 1) % 12;
      for (const [to, toSign] of Object.entries(planetSigns)) {
        if (to === from) continue;
        if (toSign === targetSign) {
          aspectList.push({ from, to, distance: d, variant: SPECIAL_ASPECTS[from]?.includes(d) || false });
        }
      }
      if (targetSign === ascSign) {
        aspectList.push({ from, to: 'Lagna', distance: d, variant: SPECIAL_ASPECTS[from]?.includes(d) || false });
      }
    }
  }
  return aspectList;
}

/* ------------------------------------------------------------------ */
/* Vimshottari dasha                                                  */
/* ------------------------------------------------------------------ */

export function vimshottari(moonLongitude, birthJd, { yearDays = 365.25, depth = 2, tz = 'Asia/Kolkata', formatJd, asOfJd = birthJd } = {}) {
  const nak = nakshatraIndex(moonLongitude);
  const lord = VIMSHOTTARI_ORDER[nak % 9];
  const fraction = (norm360(moonLongitude) % NAKSHATRA_SIZE) / NAKSHATRA_SIZE;
  const elapsedYears = fraction * VIMSHOTTARI_YEARS[lord];
  const startJd = birthJd - elapsedYears * yearDays;
  const lordIndex = VIMSHOTTARI_ORDER.indexOf(lord);

  const fmt = (jd) => (formatJd ? formatJd(jd, tz) : jd);

  const mahadashas = [];
  let cursor = startJd;

  for (let i = 0; i < 9; i += 1) {
    const mahaLord = VIMSHOTTARI_ORDER[(lordIndex + i) % 9];
    const mahaYears = VIMSHOTTARI_YEARS[mahaLord];
    const mahaStart = cursor;
    const mahaEnd = mahaStart + mahaYears * yearDays;

    const antardashas = [];
    let subCursor = mahaStart;
    const subStartIndex = VIMSHOTTARI_ORDER.indexOf(mahaLord);
    for (let j = 0; j < 9; j += 1) {
      const antarLord = VIMSHOTTARI_ORDER[(subStartIndex + j) % 9];
      const antarYears = (mahaYears * VIMSHOTTARI_YEARS[antarLord]) / 120;
      const antarStart = subCursor;
      const antarEnd = antarStart + antarYears * yearDays;

      const entry = {
        lord: antarLord,
        years: Number(antarYears.toFixed(4)),
        start: fmt(antarStart),
        end: fmt(antarEnd),
        start_jd: Number(antarStart.toFixed(6)),
        end_jd: Number(antarEnd.toFixed(6)),
      };

      if (depth >= 3) {
        const pratyantardashas = [];
        let pCursor = antarStart;
        const pStartIndex = VIMSHOTTARI_ORDER.indexOf(antarLord);
        for (let k = 0; k < 9; k += 1) {
          const pLord = VIMSHOTTARI_ORDER[(pStartIndex + k) % 9];
          const pYears = (antarYears * VIMSHOTTARI_YEARS[pLord]) / 120;
          const pStart = pCursor;
          const pEnd = pStart + pYears * yearDays;
          pratyantardashas.push({
            lord: pLord,
            years: Number(pYears.toFixed(4)),
            start: fmt(pStart),
            end: fmt(pEnd),
            start_jd: Number(pStart.toFixed(6)),
            end_jd: Number(pEnd.toFixed(6)),
          });
          pCursor = pEnd;
        }
        entry.pratyantardashas = pratyantardashas;
      }

      antardashas.push(entry);
      subCursor = antarEnd;
    }

    mahadashas.push({
      lord: mahaLord,
      years: mahaYears,
      start: fmt(mahaStart),
      end: fmt(mahaEnd),
      start_jd: Number(mahaStart.toFixed(6)),
      end_jd: Number(mahaEnd.toFixed(6)),
      includes_birth: mahaStart <= birthJd && birthJd < mahaEnd,
      antardashas,
    });

    cursor = mahaEnd;
  }

  return {
    system: 'Vimshottari',
    year_days: yearDays,
    birth_nakshatra: NAKSHATRAS[nak],
    birth_nakshatra_lord: lord,
    balance_at_birth: {
      lord,
      years: Number((VIMSHOTTARI_YEARS[lord] * (1 - fraction)).toFixed(4)),
      fraction_elapsed: Number(fraction.toFixed(6)),
    },
    current: currentDasha(mahadashas, asOfJd, depth, fmt),
    mahadashas,
  };
}

function currentDasha(mahadashas, asOfJd, depth, fmt) {
  const maha = mahadashas.find((m) => m.start_jd <= asOfJd && asOfJd < m.end_jd);
  if (!maha) return null;

  const antar = maha.antardashas.find((a) => a.start_jd <= asOfJd && asOfJd < a.end_jd);
  const current = {
    as_of: fmt(asOfJd),
    mahadasha: { lord: maha.lord, start: maha.start, end: maha.end },
    antardasha: antar ? { lord: antar.lord, start: antar.start, end: antar.end } : null,
  };

  if (depth >= 3 && antar?.pratyantardashas) {
    const praty = antar.pratyantardashas.find((p) => p.start_jd <= asOfJd && asOfJd < p.end_jd);
    if (praty) current.pratyantardasha = { lord: praty.lord, start: praty.start, end: praty.end };
  }

  return current;
}

/* ------------------------------------------------------------------ */
/* Panchang at birth                                                  */
/* ------------------------------------------------------------------ */

export function panchangAt(sunLongitude, moonLongitude, birthJd, { vara = null, sunrise = null, sunset = null, moonrise = null, moonset = null } = {}) {
  const elongation = norm360(moonLongitude - sunLongitude);
  const tithiIndex = Math.floor(elongation / 12);
  const tithi = tithiIndex + 1;
  const paksha = tithi <= 15 ? 'Shukla' : 'Krishna';

  const yogaIndex = Math.floor(norm360(sunLongitude + moonLongitude) / NAKSHATRA_SIZE);
  const karanaNumber = Math.floor(elongation / 6); // 0..59

  let karana;
  if (karanaNumber === 0) karana = 'Kimstughna';
  else if (karanaNumber >= 57) karana = KARANA_NAMES[8 + (karanaNumber - 57)];
  else karana = KARANA_NAMES[1 + ((karanaNumber - 1) % 7)];

  return {
    vara,
    tithi: {
      number: tithi,
      name: TITHI_NAMES[tithi - 1],
      paksha,
      percent_elapsed: Number(((elongation % 12) / 12 * 100).toFixed(2)),
      elongation: Number(elongation.toFixed(4)),
    },
    nakshatra: {
      name: NAKSHATRAS[nakshatraIndex(moonLongitude)],
      index: nakshatraIndex(moonLongitude),
      pada: padaOf(moonLongitude),
      lord: NAKSHATRA_LORDS[nakshatraIndex(moonLongitude) % 9],
      percent_elapsed: Number(((norm360(moonLongitude) % NAKSHATRA_SIZE) / NAKSHATRA_SIZE * 100).toFixed(2)),
    },
    yoga: {
      number: yogaIndex + 1,
      name: YOGA_NAMES[yogaIndex],
      percent_elapsed: Number(((norm360(sunLongitude + moonLongitude) % NAKSHATRA_SIZE) / NAKSHATRA_SIZE * 100).toFixed(2)),
    },
    karana: {
      number: karanaNumber + 1,
      name: karana,
    },
    sunrise: sunrise !== null ? sunrise : null,
    sunset: sunset !== null ? sunset : null,
    moonrise: moonrise !== null ? moonrise : null,
    moonset: moonset !== null ? moonset : null,
  };
}

/* ------------------------------------------------------------------ */
/* Ashtakoota helpers                                                 */
/* ------------------------------------------------------------------ */

const VARNA_RANK = { Brahmin: 1, Kshatriya: 2, Vaishya: 3, Shudra: 4 };

export function varnaForSign(sign) {
  return VARNA_BY_SIGN[sign];
}

export function vashyaForSign(sign, degree) {
  const split = VASHYA_SPLIT[sign];
  if (split) return degree < 15 ? split.first : split.second;
  return VASHYA_BY_SIGN[sign];
}

const VASHYA_GROUPS = ['Chatushpada', 'Manava', 'Jalachara', 'Vanachara', 'Keeta'];
const VASHYA_SCORES = [
  [2, 1, 1, 0, 1],
  [1, 2, 1, 0, 1],
  [1, 1, 2, 0, 1],
  [0, 0, 0, 2, 0],
  [1, 1, 1, 0, 2],
];

export function vashyaScore(a, b) {
  const i = VASHYA_GROUPS.indexOf(a);
  const j = VASHYA_GROUPS.indexOf(b);
  if (i < 0 || j < 0) return 0;
  return VASHYA_SCORES[i][j];
}

export function taraScore(fromNak, toNak) {
  const count = ((toNak - fromNak + 27) % 27) + 1;
  const remainder = count % 9 === 0 ? 9 : count % 9;
  const bad = [3, 5, 7].includes(remainder);
  return { score: bad ? 0 : 1.5, count, remainder, bad };
}

const YONI_ORDER = ['Horse', 'Elephant', 'Sheep', 'Serpent', 'Dog', 'Cat', 'Rat', 'Cow', 'Buffalo', 'Tiger', 'Deer', 'Monkey', 'Mongoose', 'Lion'];
const YONI_ENEMIES = {
  Horse: 'Buffalo',
  Elephant: 'Lion',
  Sheep: 'Monkey',
  Serpent: 'Mongoose',
  Dog: 'Deer',
  Cat: 'Rat',
  Rat: 'Cat',
  Cow: 'Tiger',
  Buffalo: 'Horse',
  Tiger: 'Cow',
  Deer: 'Dog',
  Monkey: 'Sheep',
  Mongoose: 'Serpent',
  Lion: 'Elephant',
};

export function yoniScore(a, b) {
  if (!YONI_ORDER.includes(a) || !YONI_ORDER.includes(b)) return 0;
  if (a === b) return 4;
  if (YONI_ENEMIES[a] === b) return 0;
  return 2;
}

const GANA_SCORES = {
  Deva: { Deva: 6, Manushya: 5, Rakshasa: 1 },
  Manushya: { Deva: 5, Manushya: 6, Rakshasa: 0 },
  Rakshasa: { Deva: 1, Manushya: 0, Rakshasa: 6 },
};

export function ganaScore(a, b) {
  return GANA_SCORES[a]?.[b] ?? 0;
}

export function bhakootScore(groomSign, brideSign) {
  const distance = ((groomSign - brideSign + 12) % 12) + 1;
  const bad = [2, 5, 6, 8, 9, 12].includes(distance);
  return { score: bad ? 0 : 7, distance, bad };
}

export function nadiScore(a, b) {
  return a === b ? 0 : 8;
}

function relation(a, b) {
  if (a === b) return 'friend';
  const rel = NATURAL_FRIENDS[a];
  if (!rel) return 'neutral';
  if (rel.friends.includes(b)) return 'friend';
  if (rel.enemies.includes(b)) return 'enemy';
  return 'neutral';
}

export function grahaMaitriScore(groomLord, brideLord) {
  const a = relation(groomLord, brideLord);
  const b = relation(brideLord, groomLord);
  const key = [a, b].sort().join('-');

  const table = {
    'friend-friend': 5,
    'friend-neutral': 4,
    'neutral-neutral': 3,
    'enemy-friend': 1,
    'enemy-neutral': 0.5,
    'enemy-enemy': 0,
  };

  return { score: table[key] ?? 0, groom_relation: a, bride_relation: b };
}

export function ashtakoota(a, b) {
  const varnaA = VARNA_BY_SIGN[a.moon_sign_index];
  const varnaB = VARNA_BY_SIGN[b.moon_sign_index];
  const varna = VARNA_RANK[varnaA] <= VARNA_RANK[varnaB] ? 1 : 0;

  const vashyaA = vashyaForSign(a.moon_sign_index, a.moon_degree);
  const vashyaB = vashyaForSign(b.moon_sign_index, b.moon_degree);

  const taraA = taraScore(a.nakshatra_index, b.nakshatra_index);
  const taraB = taraScore(b.nakshatra_index, a.nakshatra_index);

  const yoniA = NAKSHATRA_YONI[a.nakshatra_index];
  const yoniB = NAKSHATRA_YONI[b.nakshatra_index];

  const ganaA = NAKSHATRA_GANA[a.nakshatra_index];
  const ganaB = NAKSHATRA_GANA[b.nakshatra_index];

  const nadiA = NAKSHATRA_NADI[a.nakshatra_index];
  const nadiB = NAKSHATRA_NADI[b.nakshatra_index];

  const groomLord = SIGN_LORDS[a.moon_sign_index].toLowerCase();
  const brideLord = SIGN_LORDS[b.moon_sign_index].toLowerCase();

  const bhakoot = bhakootScore(a.moon_sign_index, b.moon_sign_index);
  const maitri = grahaMaitriScore(groomLord, brideLord);

  const rows = {
    varna: {
      max: 1,
      score: varna,
      groom: varnaA,
      bride: varnaB,
    },
    vashya: {
      max: 2,
      score: vashyaScore(vashyaA, vashyaB),
      groom: vashyaA,
      bride: vashyaB,
    },
    tara: {
      max: 3,
      score: Number((taraA.score + taraB.score).toFixed(1)),
      groom_to_bride: taraA,
      bride_to_groom: taraB,
    },
    yoni: {
      max: 4,
      score: yoniScore(yoniA, yoniB),
      groom: yoniA,
      bride: yoniB,
    },
    graha_maitri: {
      max: 5,
      score: maitri.score,
      groom_lord: groomLord,
      bride_lord: brideLord,
      groom_relation: maitri.groom_relation,
      bride_relation: maitri.bride_relation,
    },
    gana: {
      max: 6,
      score: ganaScore(ganaA, ganaB),
      groom: ganaA,
      bride: ganaB,
    },
    bhakoot: {
      max: 7,
      score: bhakoot.score,
      distance: bhakoot.distance,
      dosha: bhakoot.bad,
    },
    nadi: {
      max: 8,
      score: nadiScore(nadiA, nadiB),
      groom: nadiA,
      bride: nadiB,
      dosha: nadiA === nadiB,
    },
  };

  const total = Object.values(rows).reduce((sum, r) => sum + r.score, 0);

  return {
    score: Number(total.toFixed(1)),
    max: 36,
    rows,
    note: 'Ashtakoota tables vary slightly between classical texts; raw koota values are included for independent checking.',
  };
}
