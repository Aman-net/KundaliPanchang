export const SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

export const SIGN_LORDS = [
  'Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury',
  'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter',
];

export const NAKSHATRAS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni',
  'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha',
  'Jyeshtha', 'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana',
  'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
];

/** Vimshottari lords, repeating every 9 nakshatras. */
export const NAKSHATRA_LORDS = [
  'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury',
];

export const NAKSHATRA_YONI = [
  'Horse', 'Elephant', 'Sheep', 'Serpent', 'Serpent', 'Dog',
  'Cat', 'Sheep', 'Cat', 'Rat', 'Rat', 'Cow',
  'Buffalo', 'Tiger', 'Buffalo', 'Tiger', 'Deer', 'Deer',
  'Dog', 'Monkey', 'Mongoose', 'Monkey', 'Lion', 'Horse',
  'Lion', 'Cow', 'Elephant',
];

export const NAKSHATRA_GANA = [
  'Deva', 'Manushya', 'Rakshasa', 'Manushya', 'Deva', 'Manushya',
  'Deva', 'Deva', 'Rakshasa', 'Rakshasa', 'Manushya', 'Manushya',
  'Deva', 'Rakshasa', 'Deva', 'Rakshasa', 'Deva', 'Rakshasa',
  'Rakshasa', 'Manushya', 'Manushya', 'Deva', 'Rakshasa', 'Rakshasa',
  'Manushya', 'Manushya', 'Deva',
];

export const NAKSHATRA_NADI = [
  'Aadi', 'Madhya', 'Antya', 'Antya', 'Madhya', 'Aadi',
  'Aadi', 'Madhya', 'Antya', 'Antya', 'Madhya', 'Aadi',
  'Aadi', 'Madhya', 'Antya', 'Antya', 'Madhya', 'Aadi',
  'Aadi', 'Madhya', 'Antya', 'Antya', 'Madhya', 'Aadi',
  'Aadi', 'Madhya', 'Antya',
];

export const TITHI_NAMES = [
  'Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami',
  'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami',
  'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Purnima',
  'Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami',
  'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami',
  'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Amavasya',
];

export const YOGA_NAMES = [
  'Vishkambha', 'Priti', 'Ayushman', 'Saubhagya', 'Shobhana', 'Atiganda',
  'Sukarma', 'Dhriti', 'Shula', 'Ganda', 'Vriddhi', 'Dhruva',
  'Vyaghata', 'Harshana', 'Vajra', 'Siddhi', 'Vyatipata', 'Variyana',
  'Parigha', 'Shiva', 'Siddha', 'Sadhya', 'Shubha', 'Shukla',
  'Brahma', 'Indra', 'Vaidhriti',
];

export const KARANA_NAMES = [
  'Kimstughna', 'Bava', 'Balava', 'Kaulava', 'Taitila', 'Gara',
  'Vanija', 'Vishti', 'Shakuni', 'Chatushpada', 'Naga',
];

export const VARA_NAMES = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
];

export const PLANETS = [
  { key: 'sun', id: 'Sun', sanskrit: 'Surya', gem: 'Ruby' },
  { key: 'moon', id: 'Moon', sanskrit: 'Chandra', gem: 'Pearl' },
  { key: 'mars', id: 'Mars', sanskrit: 'Mangala', gem: 'Red Coral' },
  { key: 'mercury', id: 'Mercury', sanskrit: 'Budha', gem: 'Emerald' },
  { key: 'jupiter', id: 'Jupiter', sanskrit: 'Guru', gem: 'Yellow Sapphire' },
  { key: 'venus', id: 'Venus', sanskrit: 'Shukra', gem: 'Diamond' },
  { key: 'saturn', id: 'Saturn', sanskrit: 'Shani', gem: 'Blue Sapphire' },
  { key: 'rahu', id: 'Rahu', sanskrit: 'Rahu', gem: 'Hessonite' },
  { key: 'ketu', id: 'Ketu', sanskrit: 'Ketu', gem: "Cat's Eye" },
];

export const PLANET_NAMES = Object.fromEntries(PLANETS.map((p) => [p.key, p.id]));

/** Deep exaltation sign index and degree. */
export const EXALTATION = {
  sun: { sign: 0, degree: 10 },
  moon: { sign: 1, degree: 3 },
  mars: { sign: 9, degree: 28 },
  mercury: { sign: 5, degree: 15 },
  jupiter: { sign: 3, degree: 5 },
  venus: { sign: 11, degree: 27 },
  saturn: { sign: 6, degree: 20 },
};

/** Moolatrikona ranges as [startDegree, endDegree) within the sign. */
export const MOOLATRIKONA = {
  sun: { sign: 4, start: 0, end: 20 },
  moon: { sign: 1, start: 4, end: 30 },
  mars: { sign: 0, start: 0, end: 12 },
  mercury: { sign: 5, start: 16, end: 20 },
  jupiter: { sign: 8, start: 0, end: 10 },
  venus: { sign: 6, start: 0, end: 15 },
  saturn: { sign: 10, start: 0, end: 20 },
};

export const OWN_SIGNS = {
  sun: [4],
  moon: [3],
  mars: [0, 7],
  mercury: [2, 5],
  jupiter: [8, 11],
  venus: [1, 6],
  saturn: [9, 10],
};

export const NATURAL_FRIENDS = {
  sun: { friends: ['moon', 'mars', 'jupiter'], enemies: ['venus', 'saturn'], neutral: ['mercury'] },
  moon: { friends: ['sun', 'mercury'], enemies: [], neutral: ['mars', 'jupiter', 'venus', 'saturn'] },
  mars: { friends: ['sun', 'moon', 'jupiter'], enemies: ['mercury'], neutral: ['venus', 'saturn'] },
  mercury: { friends: ['sun', 'venus'], enemies: ['moon'], neutral: ['mars', 'jupiter', 'saturn'] },
  jupiter: { friends: ['sun', 'moon', 'mars'], enemies: ['mercury', 'venus'], neutral: ['saturn'] },
  venus: { friends: ['mercury', 'saturn'], enemies: ['sun', 'moon'], neutral: ['mars', 'jupiter'] },
  saturn: { friends: ['mercury', 'venus'], enemies: ['sun', 'moon', 'mars'], neutral: ['jupiter'] },
};

/** Combustion orb in degrees from the Sun; retrograde orbs noted separately. */
export const COMBUSTION_ORB = {
  moon: 12,
  mars: 17,
  mercury: 14,
  mercuryRetrograde: 12,
  jupiter: 11,
  venus: 10,
  venusRetrograde: 8,
  saturn: 15,
};

export const VIMSHOTTARI_ORDER = [
  'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury',
];

export const VIMSHOTTARI_YEARS = {
  Ketu: 7,
  Venus: 20,
  Sun: 6,
  Moon: 10,
  Mars: 7,
  Rahu: 18,
  Jupiter: 16,
  Saturn: 19,
  Mercury: 17,
};

export const VARNA_BY_SIGN = [
  'Kshatriya', 'Vaishya', 'Shudra', 'Brahmin', 'Kshatriya', 'Vaishya',
  'Shudra', 'Brahmin', 'Kshatriya', 'Vaishya', 'Shudra', 'Brahmin',
];

export const VASHYA_BY_SIGN = [
  'Chatushpada', 'Chatushpada', 'Manava', 'Jalachara', 'Vanachara', 'Manava',
  'Manava', 'Keeta', 'Manava', 'Chatushpada', 'Manava', 'Jalachara',
];

/** Sagittarius and Capricorn split at 15 degrees. */
export const VASHYA_SPLIT = {
  8: { first: 'Manava', second: 'Chatushpada' },
  9: { first: 'Chatushpada', second: 'Jalachara' },
};
