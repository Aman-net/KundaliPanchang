import { buildChart } from '../src/chart.js';
import { matchCharts } from '../src/match.js';
import { chartToMarkdown, matchToMarkdown } from '../src/format.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const state = { chart: null, match: null };
let engineReady = false;

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

function houseGrid(varga) {
  return `<div class="house-grid">${varga.houses
    .map((h) => `
      <div class="house-card">
        <div class="h">House ${h.house}</div>
        <div class="sign">${esc(h.sign)}</div>
        <div class="planets">${h.planets.length
          ? h.planets.map((p) => `<span class="pill">${esc(p)}</span>`).join('')
          : '<span class="muted small">—</span>'}</div>
      </div>`)
    .join('')}</div>`;
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
    ['Planet', 'Sign', 'Degree', 'Nakshatra', 'Pada', 'House', 'Dignity', 'R', 'Combust'],
    c.planets.map((p) => [
      `<strong>${esc(p.id)}</strong>`,
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
      esc(h.lord),
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
    .map(([key, v]) => `
      <div class="section">
        <h3>${key} — ${esc(v.name)}</h3>
        <p class="muted small">Lagna: <strong>${esc(v.ascendant_sign)}</strong></p>
        ${houseGrid(v)}
      </div>`)
    .join('');

  const dashaRows = c.dasha.mahadashas.map((m) => [
    `<strong>${esc(m.lord)}</strong>`,
    m.years,
    esc(m.start),
    esc(m.end),
    m.includes_birth ? '<span class="badge">birth</span>' : '',
  ]);

  const dashaDetails = c.dasha.mahadashas
    .map((m) => `
      <details>
        <summary>${esc(m.lord)} — ${esc(m.start)} → ${esc(m.end)}</summary>
        ${table(
          ['Antardasha', 'Years', 'Start', 'End'],
          m.antardashas.map((a) => [esc(a.lord), a.years, esc(a.start), esc(a.end)]),
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
      ${houseGrid(c.vargas.D1 || { houses: [] })}
      <div style="height:12px"></div>
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
      <p class="muted small">Balance at birth: <strong>${esc(c.dasha.balance_at_birth.lord)}</strong> ${num(c.dasha.balance_at_birth.years, 2)} years (Moon in ${esc(c.dasha.birth_nakshatra)}).</p>
      ${c.dasha.current ? `<p class="small">Current: <strong>${esc(c.dasha.current.mahadasha.lord)}</strong>${c.dasha.current.antardasha ? ` / ${esc(c.dasha.current.antardasha.lord)}` : ''} <span class="muted">(as of ${esc(c.dasha.current.as_of)})</span></p>` : ''}
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

  try {
    const chart = await buildChart(readChartInput(event.target));
    engineReady = true;
    renderChart({ chart, markdown: chartToMarkdown(chart) });
    $('#chart-result').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (err) {
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

function renderMatch({ match, markdown }) {
  state.match = { match, markdown };
  const el = $('#match-result');
  const a = match.a;
  const b = match.b;
  const k = match.ashtakoota;

  const detail = (name, row) => {
    if (name === 'varna' || name === 'vashya' || name === 'yoni' || name === 'gana') {
      return `${esc(row.groom)} / ${esc(row.bride)}`;
    }
    if (name === 'tara') {
      return `${row.groom_to_bride.remainder} / ${row.bride_to_groom.remainder}`;
    }
    if (name === 'graha_maitri') {
      return `${esc(row.groom_lord)} (${esc(row.groom_relation)}) / ${esc(row.bride_lord)} (${esc(row.bride_relation)})`;
    }
    if (name === 'bhakoot') {
      return `${row.distance}${row.dosha ? ' · dosha' : ''}`;
    }
    if (name === 'nadi') {
      return `${esc(row.groom)} / ${esc(row.bride)}${row.dosha ? ' · dosha' : ''}`;
    }
    return '';
  };

  const kootaTable = table(
    ['Koota', 'Score', 'Max', 'Detail'],
    Object.entries(k.rows).map(([name, row]) => [
      esc(kootaLabel(name)),
      `<strong>${row.score}</strong>`,
      row.max,
      detail(name, row),
    ]),
    { numColumns: [1, 2] },
  );

  const dosha = (person) => {
    const m = person.mangal_dosha;
    const label = person.summary.name || (person === a ? 'Person A' : 'Person B');
    return `
      <li>
        <strong>${esc(label)}</strong>:
        ${m.any ? '<span class="badge bad">present</span>' : '<span class="badge good">not indicated</span>'}
        <span class="muted small">Mars in ${esc(m.mars_sign)}; houses from lagna ${m.mars_house_from_lagna}, Moon ${m.mars_house_from_moon}, Venus ${m.mars_house_from_venus}</span>
        ${m.notes.length ? `<div class="muted small">${m.notes.map(esc).join('<br>')}</div>` : ''}
      </li>`;
  };

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
        ['Name', esc(a.summary.name || 'Person A'), esc(b.summary.name || 'Person B')],
        ['Birth', esc(a.summary.birth.local), esc(b.summary.birth.local)],
        ['Place', esc(a.summary.place.name || '—'), esc(b.summary.place.name || '—')],
        ['Lagna', esc(a.summary.ascendant), esc(b.summary.ascendant)],
        ['Sun', esc(a.summary.sun_sign), esc(b.summary.sun_sign)],
        ['Moon', `${esc(a.summary.moon_sign)} / ${esc(a.summary.moon_nakshatra)} p${a.summary.moon_pada}`, `${esc(b.summary.moon_sign)} / ${esc(b.summary.moon_nakshatra)} p${b.summary.moon_pada}`],
      ],
    )}

    <div class="section">
      <h3>Ashtakoota</h3>
      <div class="score"><span class="big">${k.score}</span><span class="of">/ ${k.max}</span></div>
      ${kootaTable}
      <p class="muted small">${esc(k.note)}</p>
    </div>

    <div class="section">
      <h3>Mangal Dosha</h3>
      <ul class="plain">${dosha(a)}${dosha(b)}</ul>
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
    showError('#match-error', err.message);
  } finally {
    button.disabled = false;
    button.textContent = 'Match charts';
  }
});
