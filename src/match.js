import { ashtakoota } from './vedic.js';
import { SIGNS } from './constants.js';

const MANGLIK_HOUSES = [1, 2, 4, 7, 8, 12];

function houseFrom(referenceSign, targetSign) {
  return ((targetSign - referenceSign + 12) % 12) + 1;
}

export function mangalDosha(chart) {
  const mars = chart.planets.find((p) => p.key === 'mars');
  const moonSign = chart.extras.moon_sign_index;
  const venus = chart.planets.find((p) => p.key === 'venus');
  const venusSign = venus.sign_index;

  const fromLagna = mars.house;
  const fromMoon = houseFrom(moonSign, mars.sign_index);
  const fromVenus = houseFrom(venusSign, mars.sign_index);

  const flags = {
    from_lagna: MANGLIK_HOUSES.includes(fromLagna),
    from_moon: MANGLIK_HOUSES.includes(fromMoon),
    from_venus: MANGLIK_HOUSES.includes(fromVenus),
  };

  const notes = [];
  if (['own', 'exalted', 'moolatrikona'].includes(mars.dignity)) {
    notes.push(`Mars is ${mars.dignity} in ${mars.sign}, which some traditions treat as a cancellation.`);
  }
  if (mars.house === 1 && ['Aries', 'Scorpio', 'Capricorn'].includes(mars.sign)) {
    notes.push('Mars in the 1st in own/exaltation sign is often exempted.');
  }

  return {
    mars_sign: mars.sign,
    mars_house_from_lagna: fromLagna,
    mars_house_from_moon: fromMoon,
    mars_house_from_venus: fromVenus,
    dosha: flags,
    any: flags.from_lagna || flags.from_moon || flags.from_venus,
    notes,
    convention: 'Mars in houses 1, 2, 4, 7, 8 or 12 from lagna, Moon or Venus.',
  };
}

export function matchCharts(chartA, chartB, { groom = 'A' } = {}) {
  const groomChart = groom === 'B' ? chartB : chartA;
  const brideChart = groom === 'B' ? chartA : chartB;

  const groomData = {
    moon_sign_index: groomChart.extras.moon_sign_index,
    moon_degree: groomChart.extras.moon_degree,
    nakshatra_index: groomChart.extras.moon_nakshatra_index,
  };
  const brideData = {
    moon_sign_index: brideChart.extras.moon_sign_index,
    moon_degree: brideChart.extras.moon_degree,
    nakshatra_index: brideChart.extras.moon_nakshatra_index,
  };

  const koota = ashtakoota(groomData, brideData);

  const summary = (chart) => ({
    name: chart.subject.name,
    birth: chart.subject.birth,
    place: chart.subject.place,
    ascendant: chart.summary.ascendant.sign,
    sun_sign: chart.summary.sun_sign,
    moon_sign: chart.summary.moon_sign,
    moon_nakshatra: chart.summary.moon_nakshatra,
    moon_pada: chart.summary.moon_pada,
    moon_sign_index: chart.extras.moon_sign_index,
    moon_degree: chart.extras.moon_degree,
    nakshatra_index: chart.extras.moon_nakshatra_index,
  });

  return {
    schema: 'kundali-match/1.0',
    generated_at: new Date().toISOString(),
    groom: groom === 'B' ? 'B' : 'A',
    a: { summary: summary(chartA), mangal_dosha: mangalDosha(chartA) },
    b: { summary: summary(chartB), mangal_dosha: mangalDosha(chartB) },
    ashtakoota: koota,
    charts: { a: chartA, b: chartB },
    note: 'Scores are one standard implementation of Ashtakoota. Raw koota values are included so another system can verify them.',
  };
}

export function moonKootaInputs(chart) {
  return {
    moon_sign: SIGNS[chart.extras.moon_sign_index],
    moon_degree: chart.extras.moon_degree,
    nakshatra: chart.summary.moon_nakshatra,
    pada: chart.extras.moon_pada,
  };
}
