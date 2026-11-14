import { ashtakoota, mangalDosha } from './vedic.js';
import { SIGNS } from './constants.js';

export { mangalDosha };

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
