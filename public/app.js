import { buildChart } from '../src/chart.js';
import { matchCharts } from '../src/match.js';
import { chartToMarkdown, matchToMarkdown } from '../src/format.js';
import { SIGNS } from '../src/constants.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const state = { chart: null, match: null };
let engineReady = false;

const PLANET_META = {
  Sun: { key: 'sun', abbr: 'Su', hindi: 'सूर्य' },
  Moon: { key: 'moon', abbr: 'Mo', hindi: 'चंद्र' },
  Mars: { key: 'mars', abbr: 'Ma', hindi: 'मंगल' },
  Mercury: { key: 'mercury', abbr: 'Me', hindi: 'बुध' },
  Jupiter: { key: 'jupiter', abbr: 'Ju', hindi: 'गुरु' },
  Venus: { key: 'venus', abbr: 'Ve', hindi: 'शुक्र' },
  Saturn: { key: 'saturn', abbr: 'Sa', hindi: 'शनि' },
  Rahu: { key: 'rahu', abbr: 'Ra', hindi: 'राहु' },
  Ketu: { key: 'ketu', abbr: 'Ke', hindi: 'केतु' },
};

const SIGN_ABBR = ['Ar', 'Ta', 'Ge', 'Cn', 'Le', 'Vi', 'Li', 'Sc', 'Sg', 'Cp', 'Aq', 'Pi'];

// Fixed North Indian house geometry. House 1 is the top-centre diamond and the
// houses run anti-clockwise; the sign numbers rotate with the ascendant.
const NORTH_CELLS = [
  { points: '200,0 300,100 200,200 100,100', x: 200, signY: 38, planetY: 68, line: 15 },
  { points: '0,0 200,0 100,100', x: 100, signY: 24, planetY: 46, line: 14 },
  { points: '0,0 100,100 0,200', x: 40, signY: 96, planetY: 114, line: 14 },
  { points: '0,200 100,100 200,200 100,300', x: 96, signY: 196, planetY: 216, line: 15 },
  { points: '0,200 100,300 0,400', x: 40, signY: 318, planetY: 300, line: -14 },
  { points: '0,400 100,300 200,400', x: 100, signY: 380, planetY: 362, line: -14 },
  { points: '200,400 100,300 200,200 300,300', x: 200, signY: 252, planetY: 276, line: 15 },
  { points: '200,400 300,300 400,400', x: 300, signY: 380, planetY: 362, line: -14 },
  { points: '400,400 300,300 400,200', x: 360, signY: 318, planetY: 300, line: -14 },
  { points: '400,200 300,100 200,200 300,300', x: 304, signY: 196, planetY: 216, line: 15 },
  { points: '400,0 400,200 300,100', x: 360, signY: 96, planetY: 114, line: 14 },
  { points: '400,0 300,100 200,0', x: 300, signY: 24, planetY: 46, line: 14 },
];

function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function num(value, digits = 2) {
  return Number(value).toFixed(digits);
}

function download(filename, text, type) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* ---------------- tabs ---------------- */

$$('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    $$('.tab').forEach((t) => t.classList.toggle('active', t === tab));
    $$('.panel').forEach((p) => p.classList.add('hidden'));
    $(`#panel-${tab.dataset.tab}`).classList.remove('hidden');
  });
});

/* ---------------- chart ---------------- */

function readChartInput(form) {
  const get = (name) => form.elements[name];
  const vargas = $$('#varga-chips input:checked').map((i) => i.value);
  return {
    name: get('name').value.trim() || null,
    date: get('date').value,
    time: get('time').value,
    timeZone: get('timeZone').value.trim() || 'Asia/Kolkata',
    placeName: get('placeName').value.trim() || null,
    latitude: Number(get('latitude').value),
    longitude: Number(get('longitude').value),
    elevation: Number(get('elevation').value || 0),
    vargas: vargas.length ? vargas : ['D1'],
    dashaDepth: Number(get('dashaDepth').value),
  };
}

function showError(id, message) {
  const box = $(id);
  box.textContent = message;
  box.classList.remove('hidden');
}

function clearError(id) {
  $(id).classList.add('hidden');
}

function table(headers, rows, options = {}) {
  const head = headers.map((h) => `<th>${esc(h)}</th>`).join('');
  const body = rows
    .map((row) => `<tr>${row.map((cell, i) => `<td${options.numColumns?.includes(i) ? ' class="num"' : ''}>${cell}</td>`).join('')}</tr>`)
    .join('');
  return `<div class="table-wrap"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
}

function planetName(name) {
  const meta = PLANET_META[name];
  return meta
    ? `<strong>${esc(name)}</strong> <span class="hindi" lang="hi">${esc(meta.hindi)}</span>`
    : `<strong>${esc(name)}</strong>`;
}

function planetLegend() {
  return `<div class="chart-legend">${Object.entries(PLANET_META)
    .map(([name, meta]) => `<span><strong>${meta.abbr}</strong> ${esc(name)} <span class="hindi" lang="hi">${esc(meta.hindi)}</span></span>`)
    .join('')}</div>`;
}

function northChartSvg(varga) {
  const ascIndex = Number.isInteger(varga.ascendant_sign_index)
    ? varga.ascendant_sign_index
    : Math.max(0, SIGNS.indexOf(varga.ascendant_sign));

  const cells = NORTH_CELLS.map((cell, index) => {
    const house = varga.houses?.[index] ?? { house: index + 1, sign: SIGNS[(ascIndex + index) % 12], planets: [] };
    const signIndex = (ascIndex + index) % 12;
    const sign = house.sign || SIGNS[signIndex];
    const signLabel = `${SIGN_ABBR[signIndex]} ${signIndex + 1}`;
    const lagna = index === 0 ? ' · Lagna' : '';
    const planets = (house.planets || []).map((name, planetIndex) => {
      const meta = PLANET_META[name] ?? {
        key: 'other',
        abbr: String(name).slice(0, 2),
        hindi: name,
      };
      return `
        <g class="chart-planet planet-${meta.key}" transform="translate(${cell.x}, ${cell.planetY + planetIndex * cell.line})">
          <title>${esc(name)} · ${esc(meta.hindi)}${lagna ? ' · Lagna house' : ''}</title>
          <text text-anchor="middle" dominant-baseline="middle">${esc(meta.abbr)}</text>
        </g>`;
    }).join('');

    return `
      <g class="chart-house-group" data-house="${index + 1}">
        <title>House ${index + 1} · ${esc(sign)}${lagna}</title>
        <polygon class="chart-house${index === 0 ? ' lagna-house' : ''}" points="${cell.points}" />
        <text class="chart-sign" x="${cell.x}" y="${cell.signY}" text-anchor="middle">${esc(signLabel)}</text>
        ${index === 0 ? `<text class="chart-lagna" x="${cell.x}" y="${cell.signY + 14}" text-anchor="middle">Lagna</text>` : ''}
        ${planets}
      </g>`;
  }).join('');

  return `
    <svg class="north-chart" viewBox="-8 -8 416 416" role="img" aria-label="North Indian chart for ${esc(varga.varga)} ${esc(varga.name)}">
      <rect class="chart-frame" x="0" y="0" width="400" height="400" rx="3" />
      ${cells}
      <path class="chart-grid" d="M0 0 L400 400 M400 0 L0 400 M200 0 L400 200 L200 400 L0 200 Z" />
    </svg>`;
}

function northIndianChart(varga) {
  return `
    <div class="chart-card">
      <div class="chart-card-head">
        <div>
          <strong>${esc(varga.varga)} · ${esc(varga.name)}</strong>
          <span class="muted small"> · North Indian</span>
        </div>
        <span class="muted small">Lagna / लग्न: ${esc(varga.ascendant_sign)}</span>
      </div>
      ${northChartSvg(varga)}
      ${planetLegend()}
      <p class="chart-note muted small">Hover a house or planet for details. Houses run anti-clockwise from the Lagna.</p>
    </div>`;
}

function skeletonLines(count) {
  return Array.from({ length: count }, () => '<div class="skeleton-line"></div>').join('');
}

function chartSkeleton() {
  return `
    <div class="skeleton" aria-busy="true" aria-label="Calculating chart">
      <div class="skeleton-head">
        <div class="skeleton-line w-40"></div>
        <div class="skeleton-line w-20"></div>
      </div>
      <p class="skeleton-note">${engineReady ? 'Calculating chart…' : 'Loading ephemeris… first run downloads about 2.6 MB.'}</p>
      <div class="skeleton-summary">${'<div class="skeleton-card"></div>'.repeat(6)}</div>
      <div class="skeleton-panel">
        <div class="skeleton-line w-25"></div>
        <div class="skeleton-chart"></div>
      </div>
      <div class="skeleton-panel">
        <div class="skeleton-line w-25"></div>
        ${skeletonLines(6)}
      </div>
    </div>`;
}

function matchSkeleton() {
  return `
    <div class="skeleton" aria-busy="true" aria-label="Matching charts">
      <div class="skeleton-head">
        <div class="skeleton-line w-40"></div>
        <div class="skeleton-line w-20"></div>
      </div>
      <p class="skeleton-note">${engineReady ? 'Matching charts…' : 'Loading ephemeris… first run downloads about 2.6 MB.'}</p>
      <div class="skeleton-score">
        <div class="skeleton-circle"></div>
        <div class="skeleton-score-copy">
          <div class="skeleton-line w-30"></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-line w-70"></div>
        </div>
      </div>
      <div class="skeleton-panel">
        <div class="skeleton-line w-25"></div>
        ${skeletonLines(6)}
      </div>
      <div class="match-chart-grid">
        <div class="skeleton-panel"><div class="skeleton-chart"></div></div>
        <div class="skeleton-panel"><div class="skeleton-chart"></div></div>
      </div>
    </div>`;
}

function showSkeleton(selector, kind) {
  const el = $(selector);
  el.innerHTML = kind === 'match' ? matchSkeleton() : chartSkeleton();
  el.classList.remove('hidden');
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function hideResult(selector) {
  $(selector).classList.add('hidden');
}

function renderChart({ chart, markdown }) {
  state.chart = { chart, markdown };
  const el = $('#chart-result');
  const c = chart;
  const s = c.summary;

  const summary = [
    ['Lagna', s.ascendant.sign, `${num(s.ascendant.degree_in_sign)}° · ${s.ascendant.nakshatra} p${s.ascendant.pada}`],
    ['Sun sign', s.sun_sign, ''],
    ['Moon sign', s.moon_sign, `${s.moon_nakshatra} p${s.moon_pada}`],
    ['Vara', s.vara, ''],
    ['Tithi', `${s.tithi}`, ''],
    ['Ayanamsa', `${num(c.conventions.ayanamsa_value, 4)}°`, c.conventions.ayanamsa],
  ];

  const planets = table(
    ['Planet / ग्रह', 'Sign', 'Degree', 'Nakshatra', 'Pada', 'House', 'Dignity', 'R', 'Combust'],
    c.planets.map((p) => [
      planetName(p.id),
      esc(p.sign),
      num(p.degree_in_sign),
      esc(p.nakshatra),
      p.pada,
      p.house,
      esc(p.dignity),
      p.retrograde ? 'Y' : '',
      p.combust ? 'Y' : '',
    ]),
    { numColumns: [2, 4, 5] },
  );

  const houses = table(
    ['House', 'Sign', 'Lord', 'Lord in', 'Occupants', 'Sripati', 'Bhava madhya'],
    c.houses.map((h) => [
      h.house,
      esc(h.sign),
      planetName(h.lord),
      h.lord_house ?? '—',
      h.occupants.length ? h.occupants.map(esc).join(', ') : '—',
      c.bhava_chalit[h.house - 1].planets.length ? c.bhava_chalit[h.house - 1].planets.map(esc).join(', ') : '—',
      `${num(h.sripati_bhava_madhya)}°`,
    ]),
    { numColumns: [0, 3, 6] },
  );

  const aspects = c.aspects.length
    ? `<ul class="plain">${c.aspects.map((a) => `<li>${esc(a.from)} → ${esc(a.to)} <span class="muted">(${a.house_distance}${a.special ? ', special' : ''})</span></li>`).join('')}</ul>`
    : '<p class="muted">No aspects.</p>';

  const conjunctions = c.conjunctions.length
    ? `<ul class="plain">${c.conjunctions.map((x) => `<li>${x.planets.map(esc).join(' + ')} in ${esc(x.sign)} <span class="muted">(${num(x.orb)}° apart)</span></li>`).join('')}</ul>`
    : '<p class="muted">No same-sign conjunctions.</p>';

  const vargas = Object.entries(c.vargas)
    .filter(([key]) => key !== 'D1')
    .map(([key, v]) => `
      <div class="section">
        <h3>${key} — ${esc(v.name)}</h3>
        ${northIndianChart(v)}
      </div>`)
    .join('');

  const dashaRows = c.dasha.mahadashas.map((m) => [
    planetName(m.lord),
    m.years,
    esc(m.start),
    esc(m.end),
    m.includes_birth ? '<span class="badge">birth</span>' : '',
  ]);

  const dashaDetails = c.dasha.mahadashas
    .map((m) => `
      <details>
        <summary>${esc(m.lord)} <span class="hindi" lang="hi">${esc(PLANET_META[m.lord]?.hindi ?? '')}</span> — ${esc(m.start)} → ${esc(m.end)}</summary>
        ${table(
          ['Antardasha', 'Years', 'Start', 'End'],
          m.antardashas.map((a) => [planetName(a.lord), a.years, esc(a.start), esc(a.end)]),
          { numColumns: [1] },
        )}
      </details>`)
    .join('');

  const pc = c.panchang;

  el.innerHTML = `
    <div class="results-head">
      <div>
        <h2>${esc(c.subject.name || 'Birth chart')}</h2>
        <div class="sub">${esc(c.subject.birth.local)} · ${esc(c.conventions.timezone)} (${esc(c.conventions.timezone_offset)})<br />
        ${esc(c.subject.place.name || '—')} · ${num(c.subject.place.latitude, 4)}, ${num(c.subject.place.longitude, 4)} · ${c.subject.place.elevation_m} m</div>
      </div>
      <div class="actions">
        <button class="ghost" id="dl-json">Download JSON</button>
        <button class="ghost" id="dl-md">Download Markdown</button>
      </div>
    </div>

    <div class="summary-grid">
      ${summary.map(([k, v, sub]) => `
        <div class="summary-item">
          <div class="k">${esc(k)}</div>
          <div class="v">${esc(v)}</div>
          ${sub ? `<div class="s">${esc(sub)}</div>` : ''}
        </div>`).join('')}
    </div>

    <div class="section">
      <h3>Planets</h3>
      ${planets}
    </div>

    <div class="section">
      <h3>Houses (whole sign)</h3>
      ${northIndianChart(c.vargas.D1 || { varga: 'D1', name: 'Rashi', ascendant_sign: c.summary.ascendant.sign, ascendant_sign_index: c.summary.ascendant.sign_index, houses: [] })}
      <div style="height:14px"></div>
      ${houses}
      <p class="muted small">Whole-sign (rashi) houses are primary. The Sripati column is the bhava-chalit placement; the last column is the Sripati bhava madhya.</p>
    </div>

    <div class="section">
      <h3>Birth Panchang</h3>
      ${table(
        ['Vara', 'Tithi', 'Nakshatra', 'Yoga', 'Karana', 'Sunrise', 'Sunset', 'Moonrise', 'Moonset'],
        [[
          esc(pc.vara),
          `${esc(pc.tithi.paksha)} ${esc(pc.tithi.name)}`,
          `${esc(pc.nakshatra.name)} p${pc.nakshatra.pada}`,
          esc(pc.yoga.name),
          esc(pc.karana.name),
          esc(pc.sunrise || '—'),
          esc(pc.sunset || '—'),
          esc(pc.moonrise || '—'),
          esc(pc.moonset || '—'),
        ]],
      )}
      <p class="muted small">Tithi at birth is ${num(pc.tithi.percent_elapsed)}% elapsed; nakshatra ${num(pc.nakshatra.percent_elapsed)}% elapsed.</p>
    </div>

    <div class="section">
      <h3>Aspects</h3>
      ${aspects}
      <h4>Conjunctions</h4>
      ${conjunctions}
    </div>

    ${vargas}

    <div class="section">
      <h3>Vimshottari Dasha</h3>
      <p class="muted small">Balance at birth: ${planetName(c.dasha.balance_at_birth.lord)} ${num(c.dasha.balance_at_birth.years, 2)} years (Moon in ${esc(c.dasha.birth_nakshatra)}).</p>
      ${c.dasha.current ? `<p class="small">Current: ${planetName(c.dasha.current.mahadasha.lord)}${c.dasha.current.antardasha ? ` / ${planetName(c.dasha.current.antardasha.lord)}` : ''} <span class="muted">(as of ${esc(c.dasha.current.as_of)})</span></p>` : ''}
      ${table(['Mahadasha', 'Years', 'Start', 'End', ''], dashaRows, { numColumns: [1] })}
      <h4>Antardashas</h4>
      ${dashaDetails}
    </div>

    <div class="section">
      <h3>Machine-readable data</h3>
      <details>
        <summary>Show chart JSON</summary>
        <pre>${esc(JSON.stringify(c, null, 2))}</pre>
      </details>
    </div>
  `;

  el.classList.remove('hidden');
  $('#dl-json').addEventListener('click', () => download('chart.json', JSON.stringify(c, null, 2), 'application/json'));
  $('#dl-md').addEventListener('click', () => download('chart.md', markdown, 'text/markdown'));
}

$('#chart-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  clearError('#chart-error');
  const button = event.target.querySelector('button[type="submit"]');
  button.disabled = true;
  button.textContent = engineReady ? 'Calculating…' : 'Loading ephemeris…';
  showSkeleton('#chart-result', 'chart');

  try {
    const chart = await buildChart(readChartInput(event.target));
    engineReady = true;
    renderChart({ chart, markdown: chartToMarkdown(chart) });
    $('#chart-result').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (err) {
    hideResult('#chart-result');
    showError('#chart-error', err.message);
  } finally {
    button.disabled = false;
    button.textContent = 'Generate chart';
  }
});

/* ---------------- match ---------------- */

function readPerson(fieldset) {
  const get = (name) => fieldset.querySelector(`[name="${name}"]`);
  return {
    name: get('name').value.trim() || null,
    date: get('date').value,
    time: get('time').value,
    timeZone: get('timeZone').value.trim() || 'Asia/Kolkata',
    placeName: get('placeName').value.trim() || null,
    latitude: Number(get('latitude').value),
    longitude: Number(get('longitude').value),
    elevation: Number(get('elevation').value || 0),
    vargas: ['D1', 'D9'],
    dashaDepth: 2,
  };
}

function kootaLabel(name) {
  return name.replaceAll('_', ' ').replace(/\b\w/g, (ch) => ch.toUpperCase());
}

const KOOTA_HINDI = {
  varna: 'वर्ण',
  vashya: 'वश्य',
  tara: 'तारा',
  yoni: 'योनि',
  graha_maitri: 'ग्रह मैत्री',
  gana: 'गण',
  bhakoot: 'भकूट',
  nadi: 'नाड़ी',
};

function displayPlanetName(name) {
  const text = String(name ?? '');
  return planetName(text ? text[0].toUpperCase() + text.slice(1) : text);
}

function scoreGauge(score, max) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const ratio = max > 0 ? Math.min(1, Math.max(0, score / max)) : 0;
  const offset = circumference * (1 - ratio);
  return `
    <div class="match-gauge-wrap">
      <svg class="match-gauge" viewBox="0 0 120 120" role="img" aria-label="Ashtakoota score ${esc(score)} out of ${esc(max)}">
        <circle class="match-gauge-track" cx="60" cy="60" r="${radius}" />
        <circle class="match-gauge-value" cx="60" cy="60" r="${radius}"
          stroke-dasharray="${circumference.toFixed(2)}" stroke-dashoffset="${offset.toFixed(2)}"
          transform="rotate(-90 60 60)" />
        <text class="match-gauge-score" x="60" y="60" text-anchor="middle">${esc(score)}</text>
        <text class="match-gauge-max" x="60" y="78" text-anchor="middle">/ ${esc(max)}</text>
      </svg>
      <div class="match-gauge-label">Ashtakoota</div>
    </div>`;
}

function kootaBars(rows, detail) {
  return `<div class="koota-bars">${Object.entries(rows).map(([name, row]) => {
    const percent = row.max > 0 ? Math.round((row.score / row.max) * 100) : 0;
    return `
      <div class="koota-row">
        <div class="koota-top">
          <span class="koota-name">${esc(kootaLabel(name))}${KOOTA_HINDI[name] ? ` <span class="hindi">${esc(KOOTA_HINDI[name])}</span>` : ''}</span>
          <span class="koota-score"><strong>${row.score}</strong> / ${row.max}</span>
        </div>
        <div class="koota-track"><span class="koota-fill" style="width:${percent}%"></span></div>
        <div class="koota-detail">${detail(name, row)}</div>
      </div>`;
  }).join('')}</div>`;
}

function mangalDoshaCard(person, fallbackLabel) {
  const m = person.mangal_dosha;
  const label = person.summary.name || fallbackLabel;
  const flags = [
    ['Lagna', m.dosha.from_lagna, m.mars_house_from_lagna],
    ['Moon', m.dosha.from_moon, m.mars_house_from_moon],
    ['Venus', m.dosha.from_venus, m.mars_house_from_venus],
  ];
  return `
    <div class="dosha-card">
      <div class="dosha-head">
        <strong>${esc(label)}</strong>
        ${m.any ? '<span class="badge bad">Mars flagged</span>' : '<span class="badge good">Mars not flagged</span>'}
      </div>
      <p class="small">Mars in <strong>${esc(m.mars_sign)}</strong> · ${m.mars_house_from_lagna}th / ${m.mars_house_from_moon}th / ${m.mars_house_from_venus}th from Lagna / Moon / Venus</p>
      <div class="dosha-flags">
        ${flags.map(([name, active, house]) => `<span class="flag${active ? ' on' : ''}">${esc(name)} · H${house}</span>`).join('')}
      </div>
      ${m.notes.length ? `<p class="muted small">${m.notes.map(esc).join('<br>')}</p>` : ''}
      <p class="muted small">${esc(m.convention)}</p>
    </div>`;
}

function renderMatch({ match, markdown }) {
  state.match = { match, markdown };
  const el = $('#match-result');
  const a = match.a;
  const b = match.b;
  const k = match.ashtakoota;
  const groomIsA = match.groom !== 'B';
  const roleA = groomIsA ? 'Groom' : 'Bride';
  const roleB = groomIsA ? 'Bride' : 'Groom';
  const groomName = groomIsA ? (a.summary.name || 'Person A') : (b.summary.name || 'Person B');
  const brideName = groomIsA ? (b.summary.name || 'Person B') : (a.summary.name || 'Person A');

  const detail = (name, row) => {
    if (name === 'varna' || name === 'vashya' || name === 'yoni' || name === 'gana') {
      return `${esc(row.groom)} / ${esc(row.bride)}`;
    }
    if (name === 'tara') {
      return `${row.groom_to_bride.remainder} / ${row.bride_to_groom.remainder}`;
    }
    if (name === 'graha_maitri') {
      return `${displayPlanetName(row.groom_lord)} (${esc(row.groom_relation)}) / ${displayPlanetName(row.bride_lord)} (${esc(row.bride_relation)})`;
    }
    if (name === 'bhakoot') {
      return `${row.distance}${row.dosha ? ' · dosha' : ''}`;
    }
    if (name === 'nadi') {
      return `${esc(row.groom)} / ${esc(row.bride)}${row.dosha ? ' · dosha' : ''}`;
    }
    return '';
  };

  const chartA = match.charts?.a?.vargas?.D1;
  const chartB = match.charts?.b?.vargas?.D1;
  const charts = chartA && chartB
    ? `
      <div class="section">
        <h3>D1 Charts <span class="hindi">D1 कुंडली</span></h3>
        <div class="match-chart-grid">
          <div class="match-chart-card">
            <div class="match-chart-head">
              <div><strong>${esc(a.summary.name || 'Person A')}</strong> <span class="badge">${esc(roleA)}</span></div>
              <span class="muted small">Lagna: ${esc(a.summary.ascendant)}</span>
            </div>
            ${northChartSvg(chartA)}
          </div>
          <div class="match-chart-card">
            <div class="match-chart-head">
              <div><strong>${esc(b.summary.name || 'Person B')}</strong> <span class="badge">${esc(roleB)}</span></div>
              <span class="muted small">Lagna: ${esc(b.summary.ascendant)}</span>
            </div>
            ${northChartSvg(chartB)}
          </div>
        </div>
        ${planetLegend()}
        <p class="chart-note muted small">Hover a house or planet for details. Houses run anti-clockwise from the Lagna.</p>
      </div>`
    : '';

  el.innerHTML = `
    <div class="results-head">
      <div>
        <h2>Kundali Match</h2>
        <div class="sub">Ashtakoota plus Mangal dosha. Raw koota values are included in the JSON for independent checking.</div>
      </div>
      <div class="actions">
        <button class="ghost" id="match-dl-json">Download JSON</button>
        <button class="ghost" id="match-dl-md">Download Markdown</button>
      </div>
    </div>

    ${table(
      ['', 'Person A', 'Person B'],
      [
        ['Role / भूमिका', esc(roleA), esc(roleB)],
        ['Name / नाम', esc(a.summary.name || 'Person A'), esc(b.summary.name || 'Person B')],
        ['Birth / जन्म', esc(a.summary.birth.local), esc(b.summary.birth.local)],
        ['Place / स्थान', esc(a.summary.place.name || '—'), esc(b.summary.place.name || '—')],
        ['Lagna / लग्न', esc(a.summary.ascendant), esc(b.summary.ascendant)],
        ['Sun / सूर्य', esc(a.summary.sun_sign), esc(b.summary.sun_sign)],
        ['Moon / चंद्र', `${esc(a.summary.moon_sign)} / ${esc(a.summary.moon_nakshatra)} p${a.summary.moon_pada}`, `${esc(b.summary.moon_sign)} / ${esc(b.summary.moon_nakshatra)} p${b.summary.moon_pada}`],
      ],
    )}

    <div class="section">
      <h3>Ashtakoota <span class="hindi">अष्टकूट</span></h3>
      <div class="match-score-panel">
        ${scoreGauge(k.score, k.max)}
        <div class="match-score-copy">
          <div class="match-pair"><span class="muted small">Groom <span class="hindi">वर</span></span><strong>${esc(groomName)}</strong></div>
          <div class="match-pair"><span class="muted small">Bride <span class="hindi">वधू</span></span><strong>${esc(brideName)}</strong></div>
          <p class="muted small">${esc(k.note)}</p>
        </div>
      </div>
      ${kootaBars(k.rows, detail)}
    </div>

    ${charts}

    <div class="section">
      <h3>Mangal Dosha <span class="hindi">मंगल दोष</span></h3>
      <div class="dosha-grid">
        ${mangalDoshaCard(a, 'Person A')}
        ${mangalDoshaCard(b, 'Person B')}
      </div>
    </div>

    <div class="section">
      <h3>Machine-readable data</h3>
      <details>
        <summary>Show match JSON</summary>
        <pre>${esc(JSON.stringify(match, null, 2))}</pre>
      </details>
    </div>
  `;

  el.classList.remove('hidden');
  $('#match-dl-json').addEventListener('click', () => download('match.json', JSON.stringify(match, null, 2), 'application/json'));
  $('#match-dl-md').addEventListener('click', () => download('match.md', markdown, 'text/markdown'));
}

$('#match-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  clearError('#match-error');
  const button = event.target.querySelector('button[type="submit"]');
  button.disabled = true;
  button.textContent = engineReady ? 'Matching…' : 'Loading ephemeris…';
  showSkeleton('#match-result', 'match');

  try {
    const a = readPerson(event.target.querySelector('[data-person="a"]'));
    const b = readPerson(event.target.querySelector('[data-person="b"]'));
    const groom = event.target.elements.groom.value;
    const [chartA, chartB] = await Promise.all([buildChart(a), buildChart(b)]);
    engineReady = true;
    const match = matchCharts(chartA, chartB, { groom });
    renderMatch({ match, markdown: matchToMarkdown(match) });
    $('#match-result').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (err) {
    hideResult('#match-result');
    showError('#match-error', err.message);
  } finally {
    button.disabled = false;
    button.textContent = 'Match charts';
  }
});
