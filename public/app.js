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

const SIGN_HINDI = {
  Aries: 'मेष', Taurus: 'वृषभ', Gemini: 'मिथुन', Cancer: 'कर्क',
  Leo: 'सिंह', Virgo: 'कन्या', Libra: 'तुला', Scorpio: 'वृश्चिक',
  Sagittarius: 'धनु', Capricorn: 'मकर', Aquarius: 'कुंभ', Pisces: 'मीन',
};

const NAKSHATRA_HINDI = {
  Ashwini: 'अश्विनी', Bharani: 'भरणी', Krittika: 'कृत्तिका', Rohini: 'रोहिणी',
  Mrigashira: 'मृगशिरा', Ardra: 'आर्द्रा', Punarvasu: 'पुनर्वसु', Pushya: 'पुष्य',
  Ashlesha: 'आश्लेषा', Magha: 'मघा', 'Purva Phalguni': 'पूर्व फाल्गुनी',
  'Uttara Phalguni': 'उत्तर फाल्गुनी', Hasta: 'हस्त', Chitra: 'चित्रा',
  Swati: 'स्वाति', Vishakha: 'विशाखा', Anuradha: 'अनुराधा', Jyeshtha: 'ज्येष्ठा',
  Mula: 'मूल', 'Purva Ashadha': 'पूर्वाषाढ़ा', 'Uttara Ashadha': 'उत्तराषाढ़ा',
  Shravana: 'श्रवण', Dhanishta: 'धनिष्ठा', Shatabhisha: 'शतभिषा',
  'Purva Bhadrapada': 'पूर्व भाद्रपद', 'Uttara Bhadrapada': 'उत्तर भाद्रपद', Revati: 'रेवती',
};

const TITHI_HINDI = {
  Pratipada: 'प्रतिपदा', Dwitiya: 'द्वितीया', Tritiya: 'तृतीया', Chaturthi: 'चतुर्थी',
  Panchami: 'पंचमी', Shashthi: 'षष्ठी', Saptami: 'सप्तमी', Ashtami: 'अष्टमी',
  Navami: 'नवमी', Dashami: 'दशमी', Ekadashi: 'एकादशी', Dwadashi: 'द्वादशी',
  Trayodashi: 'त्रयोदशी', Chaturdashi: 'चतुर्दशी', Purnima: 'पूर्णिमा', Amavasya: 'अमावस्या',
};

const PAKSHA_HINDI = { Shukla: 'शुक्ल', Krishna: 'कृष्ण' };

const YOGA_HINDI = {
  Vishkambha: 'विष्कंभ', Priti: 'प्रीति', Ayushman: 'आयुष्मान', Saubhagya: 'सौभाग्य',
  Shobhana: 'शोभन', Atiganda: 'अतिगंड', Sukarma: 'सुकर्मा', Dhriti: 'धृति',
  Shula: 'शूल', Ganda: 'गंड', Vriddhi: 'वृद्धि', Dhruva: 'ध्रुव',
  Vyaghata: 'व्याघात', Harshana: 'हर्षण', Vajra: 'वज्र', Siddhi: 'सिद्धि',
  Vyatipata: 'व्यतीपात', Variyana: 'वरीयान', Parigha: 'परिघ', Shiva: 'शिव',
  Siddha: 'सिद्ध', Sadhya: 'साध्य', Shubha: 'शुभ', Shukla: 'शुक्ल',
  Brahma: 'ब्रह्म', Indra: 'इंद्र', Vaidhriti: 'वैधृति',
};

const KARANA_HINDI = {
  Kimstughna: 'किंस्तुघ्न', Bava: 'बव', Balava: 'बालव', Kaulava: 'कौलव',
  Taitila: 'तैतिल', Gara: 'गर', Vanija: 'वणिज', Vishti: 'विष्टि',
  Shakuni: 'शकुनि', Chatushpada: 'चतुष्पद', Naga: 'नाग',
};

const VARA_HINDI = {
  Sunday: 'रविवार', Monday: 'सोमवार', Tuesday: 'मंगलवार', Wednesday: 'बुधवार',
  Thursday: 'गुरुवार', Friday: 'शुक्रवार', Saturday: 'शनिवार',
};

const DIGNITY_HINDI = {
  exalted: 'उच्च', debilitated: 'नीच', moolatrikona: 'मूलत्रिकोण',
  own: 'स्वराशि', friend: 'मित्र', enemy: 'शत्रु', neutral: 'सम', unknown: 'अज्ञात',
};

const VARGA_HINDI = {
  D1: 'राशि', D2: 'होरा', D3: 'द्रेक्काण', D4: 'चतुर्थांश', D7: 'सप्तमांश',
  D9: 'नवांश', D10: 'दशमांश', D12: 'द्वादशांश', D16: 'षोडशांश', D20: 'विंशांश',
  D24: 'चतुर्विंशांश', D27: 'भांश', D30: 'त्रिंशांश', D40: 'खवेदांश',
  D45: 'अक्षवेदांश', D60: 'षष्ट्यंश',
};

const VARNA_HINDI = {
  Brahmin: 'ब्राह्मण', Kshatriya: 'क्षत्रिय', Vaishya: 'वैश्य', Shudra: 'शूद्र',
};

const VASHYA_HINDI = {
  Chatushpada: 'चतुष्पद', Manava: 'मानव', Jalachara: 'जलचर',
  Vanachara: 'वनचर', Keeta: 'कीट',
};

const YONI_HINDI = {
  Horse: 'अश्व', Elephant: 'गज', Sheep: 'मेष', Serpent: 'सर्प', Dog: 'श्वान',
  Cat: 'मार्जार', Rat: 'मूषक', Cow: 'गौ', Buffalo: 'महिष', Tiger: 'व्याघ्र',
  Deer: 'मृग', Monkey: 'वानर', Mongoose: 'नकुल', Lion: 'सिंह',
};

const GANA_HINDI = { Deva: 'देव', Manushya: 'मनुष्य', Rakshasa: 'राक्षस' };
const NADI_HINDI = { Aadi: 'आदि', Madhya: 'मध्य', Antya: 'अन्त्य' };
const RELATION_HINDI = { friend: 'मित्र', neutral: 'सम', enemy: 'शत्रु' };

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

function safeFileName(value) {
  const cleaned = String(value || '')
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
  return cleaned.slice(0, 80);
}

function downloadBase(name) {
  const safe = safeFileName(name);
  return safe ? `${safe}_Kundali` : 'Kundali';
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
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const DASHA_COLORS = {
  sun: '#a86b00',
  moon: '#526577',
  mars: '#a33a2a',
  mercury: '#2f6b4f',
  jupiter: '#8a6a00',
  venus: '#8a4b2a',
  saturn: '#3d4f6b',
  rahu: '#5b4a6b',
  ketu: '#6b5a3d',
};

function dashaTimeline(dasha, birthJd) {
  const totalYears = 120;
  const yearDays = dasha.year_days || 365.25;
  const asOfJd = dasha.current?.as_of_jd ?? null;
  const toPercent = (jd) => ((jd - birthJd) / yearDays / totalYears) * 100;
  const clamp = (value) => Math.max(0, Math.min(100, value));

  const segments = dasha.mahadashas.map((maha) => {
    const startAge = Math.max(0, (maha.start_jd - birthJd) / yearDays);
    const endAge = Math.min(totalYears, (maha.end_jd - birthJd) / yearDays);
    const left = (startAge / totalYears) * 100;
    const width = Math.max(0.1, ((endAge - startAge) / totalYears) * 100);
    const meta = PLANET_META[maha.lord];
    const title = `${maha.lord} / ${meta.hindi} · ${num(maha.years, 1)}y · ${maha.start} → ${maha.end}`;
    return `
      <div class="dasha-segment planet-${meta.key}" style="left:${left.toFixed(3)}%;width:${width.toFixed(3)}%;background:${DASHA_COLORS[meta.key]}" title="${esc(title)}">
        <span>${esc(meta.abbr)}</span>
      </div>`;
  }).join('');

  const marker = asOfJd === null ? '' : (() => {
    const percent = clamp(toPercent(asOfJd));
    const current = dasha.current;
    const label = current.antardasha
      ? `${current.mahadasha.lord} / ${PLANET_META[current.mahadasha.lord].hindi} · ${current.antardasha.lord} / ${PLANET_META[current.antardasha.lord].hindi}`
      : `${current.mahadasha.lord} / ${PLANET_META[current.mahadasha.lord].hindi}`;
    return `
      <div class="dasha-current" style="left:${percent.toFixed(3)}%" title="${esc(label)}">
        <span class="dasha-current-label">Now / अभी</span>
      </div>`;
  })();

  const axis = [0, 20, 40, 60, 80, 100, 120]
    .map((age) => `<span style="left:${(age / totalYears) * 100}%">${age}y</span>`)
    .join('');

  const legend = dasha.mahadashas.map((maha) => {
    const meta = PLANET_META[maha.lord];
    return `
      <span>
        <i style="background:${DASHA_COLORS[meta.key]}"></i>
        ${meta.abbr} ${esc(maha.lord)} <span class="hindi">${esc(meta.hindi)}</span> · ${num(maha.years, 1)}y
      </span>`;
  }).join('');

  return `
    <div class="dasha-timeline">
      <div class="dasha-track">${segments}${marker}</div>
      <div class="dasha-axis">${axis}</div>
      <div class="dasha-legend">${legend}</div>
    </div>`;
}

/* ---------------- tabs ---------------- */

$$('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    $$('.tab').forEach((t) => t.classList.toggle('active', t === tab));
    $$('.panel').forEach((p) => p.classList.add('hidden'));
    $(`#panel-${tab.dataset.tab}`).classList.remove('hidden');
  });
});

/* ---------------- place search ---------------- */

function initPlaceSearch() {
  $$('[data-location]').forEach((root) => {
    const input = root.querySelector('[data-place-search]');
    if (!input) return;

    const list = document.createElement('div');
    list.className = 'place-search-results';
    list.setAttribute('role', 'listbox');
    list.setAttribute('aria-hidden', 'true');
    if (input.id) {
      list.id = `${input.id}-results`;
      input.setAttribute('aria-controls', list.id);
    }
    input.insertAdjacentElement('afterend', list);

    let results = [];
    let open = false;
    let activeIndex = -1;
    let controller = null;
    let debounceTimer = null;

    const setAria = () => {
      input.setAttribute('aria-expanded', String(open));
      input.setAttribute('aria-activedescendant', activeIndex >= 0 ? `${input.id}-option-${activeIndex}` : '');
    };

    const hide = () => {
      open = false;
      activeIndex = -1;
      list.classList.remove('open');
      list.setAttribute('aria-hidden', 'true');
      list.innerHTML = '';
      setAria();
    };

    const show = () => {
      open = true;
      list.classList.add('open');
      list.setAttribute('aria-hidden', 'false');
      setAria();
    };

    const fill = (place) => {
      const set = (name, value) => {
        const field = root.querySelector(`[name="${name}"]`);
        if (field && value !== undefined && value !== null) field.value = value;
      };
      const region = place.admin1 || place.admin2 || '';
      const country = place.country || '';
      const label = [place.name, region, country].filter(Boolean).join(', ');
      set('placeName', label);
      set('latitude', place.latitude);
      set('longitude', place.longitude);
      set('elevation', place.elevation ?? '');
      set('timeZone', place.timezone);
      input.value = '';
      hide();
      input.blur();
    };

    const render = () => {
      if (!results.length) {
        list.innerHTML = '<div class="place-search-empty">No matching place</div>';
        activeIndex = -1;
        setAria();
        return;
      }
      list.innerHTML = results.map((place, index) => {
        const region = place.admin1 || place.admin2 || '';
        const country = place.country || '';
        const meta = [region, country].filter(Boolean).join(', ');
        return `
          <button type="button" class="place-search-option" role="option" id="${input.id}-option-${index}" aria-selected="false" data-index="${index}">
            <strong>${esc(place.name)}</strong>
            <span>${esc(meta)}</span>
          </button>`;
      }).join('');
      setAria();
    };

    const setActive = (index) => {
      if (!results.length) return;
      activeIndex = (index + results.length) % results.length;
      [...list.querySelectorAll('.place-search-option')].forEach((button, i) => {
        button.classList.toggle('active', i === activeIndex);
        button.setAttribute('aria-selected', String(i === activeIndex));
      });
      const activeButton = list.querySelector('.place-search-option.active');
      if (activeButton) activeButton.scrollIntoView({ block: 'nearest' });
      setAria();
    };

    const search = async (query) => {
      if (query.length < 2) {
        controller?.abort();
        hide();
        return;
      }
      controller?.abort();
      controller = new AbortController();
      list.innerHTML = '<div class="place-search-loading">Searching…</div>';
      show();
      try {
        const response = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=10&language=en&format=json`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error('Place search failed');
        const data = await response.json();
        results = data.results ?? [];
        activeIndex = -1;
        render();
      } catch (error) {
        if (error.name === 'AbortError') return;
        results = [];
        list.innerHTML = '<div class="place-search-error">Search failed</div>';
      }
    };

    input.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => search(input.value.trim()), 250);
    });

    input.addEventListener('keydown', (event) => {
      if (!open) {
        if (event.key === 'ArrowDown' && results.length) {
          event.preventDefault();
          show();
          setActive(0);
        }
        return;
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActive(activeIndex + 1);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActive(activeIndex - 1);
      } else if (event.key === 'Enter') {
        event.preventDefault();
        if (activeIndex >= 0) fill(results[activeIndex]);
        else hide();
      } else if (event.key === 'Escape') {
        hide();
      }
    });

    list.addEventListener('click', (event) => {
      const option = event.target.closest('.place-search-option');
      if (!option) return;
      fill(results[Number(option.dataset.index)]);
    });

    document.addEventListener('click', (event) => {
      if (!root.contains(event.target)) hide();
    });
  });
}

initPlaceSearch();

window.addEventListener('beforeprint', () => {
  document.querySelectorAll('#chart-result details, #match-result details').forEach((node) => {
    node.open = true;
  });
});

/* ---------------- chart ---------------- */

const vargaCheckboxes = $$('#varga-chips input:not(:disabled)');
const selectAllVargas = $('#select-all-vargas');

function syncVargaSelectAll() {
  const allSelected = vargaCheckboxes.length > 0 && vargaCheckboxes.every((input) => input.checked);
  selectAllVargas.textContent = allSelected ? 'Clear all / सभी हटाएँ' : 'Select all / सभी चुनें';
  selectAllVargas.setAttribute('aria-pressed', String(allSelected));
}

selectAllVargas.addEventListener('click', () => {
  const select = !vargaCheckboxes.every((input) => input.checked);
  vargaCheckboxes.forEach((input) => { input.checked = select; });
  syncVargaSelectAll();
});

vargaCheckboxes.forEach((input) => input.addEventListener('change', syncVargaSelectAll));
syncVargaSelectAll();

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

function bilingual(name, map) {
  const hindi = map?.[name];
  return `${esc(name)}${hindi ? ` <span class="hindi" lang="hi">${esc(hindi)}</span>` : ''}`;
}

const signName = (name) => bilingual(name, SIGN_HINDI);
const nakshatraName = (name) => bilingual(name, NAKSHATRA_HINDI);
const dignityName = (name) => bilingual(name, DIGNITY_HINDI);
const varaName = (name) => bilingual(name, VARA_HINDI);
const yogaName = (name) => bilingual(name, YOGA_HINDI);
const karanaName = (name) => bilingual(name, KARANA_HINDI);
const lagnaName = () => 'Lagna <span class="hindi" lang="hi">लग्न</span>';

function tithiName(paksha, name) {
  return `${bilingual(paksha, PAKSHA_HINDI)} ${bilingual(name, TITHI_HINDI)}`;
}

function planetInline(name) {
  if (name === 'Lagna') return lagnaName();
  const meta = PLANET_META[name];
  return meta
    ? `${esc(name)} <span class="hindi" lang="hi">${esc(meta.hindi)}</span>`
    : esc(name);
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
        <g class="chart-planet planet-${meta.key}" data-planet="${esc(name)}" data-house="${index + 1}" transform="translate(${cell.x}, ${cell.planetY + planetIndex * cell.line})">
          <title>${esc(name)} · ${esc(meta.hindi)}${lagna ? ' · Lagna house' : ''}</title>
          <text text-anchor="middle" dominant-baseline="middle">${esc(meta.abbr)}</text>
        </g>`;
    }).join('');

    return `
      <g class="chart-house-group" data-house="${index + 1}" data-sign="${esc(sign)}" data-sign-hindi="${esc(SIGN_HINDI[sign] ?? '')}" data-planets="${esc((house.planets || []).join(','))}">
        <title>House ${index + 1} · ${esc(sign)} / ${esc(SIGN_HINDI[sign] ?? '')}${lagna}</title>
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
    </svg>
    <div class="chart-inspect" hidden></div>`;
}

function northIndianChart(varga) {
  return `
    <div class="chart-card">
      <div class="chart-card-head">
        <div>
          <strong>${esc(varga.varga)} · ${esc(varga.name)} <span class="hindi" lang="hi">${esc(VARGA_HINDI[varga.varga] ?? '')}</span></strong>
          <span class="muted small"> · North Indian</span>
        </div>
        <span class="muted small">Lagna / लग्न: ${signName(varga.ascendant_sign)}</span>
      </div>
      ${northChartSvg(varga)}
      ${planetLegend()}
      <p class="chart-note muted small">Tap or click a house or planet for details. Houses run anti-clockwise from the Lagna.</p>
    </div>`;
}

document.addEventListener('click', (event) => {
  const target = event.target.closest('.chart-house-group, .chart-planet');
  if (!target) return;
  const svg = target.closest('.north-chart');
  const panel = svg?.nextElementSibling;
  if (!svg || !panel || !panel.classList.contains('chart-inspect')) return;

  const houseGroup = target.closest('.chart-house-group');
  const houseNumber = houseGroup?.dataset.house ?? target.dataset.house;
  const sign = houseGroup?.dataset.sign ?? '';
  const signHindi = houseGroup?.dataset.signHindi ?? '';
  const planets = (houseGroup?.dataset.planets || '').split(',').filter(Boolean);
  const planetName = target.dataset.planet;
  const planetMeta = PLANET_META[planetName];
  const lagna = Number(houseNumber) === 1 ? ' · Lagna / लग्न' : '';

  let html = '';
  if (planetName && planetMeta) {
    html = `
      <div><strong>${esc(planetName)} <span class="hindi">${esc(planetMeta.hindi)}</span></strong> · House ${esc(houseNumber)} · ${esc(sign)} <span class="hindi">${esc(signHindi)}</span>${lagna}</div>`;
  } else if (houseNumber) {
    html = `
      <div><strong>House ${esc(houseNumber)}</strong> · ${esc(sign)} <span class="hindi">${esc(signHindi)}</span>${lagna}</div>`;
    if (planets.length) {
      html += `<div class="muted small">Planets: ${planets.map((name) => {
        const meta = PLANET_META[name];
        return `${esc(name)} <span class="hindi">${esc(meta?.hindi ?? '')}</span>`;
      }).join(', ')}</div>`;
    }
  }

  panel.innerHTML = html;
  panel.hidden = false;
  svg.querySelectorAll('.selected').forEach((node) => node.classList.remove('selected'));
  target.classList.add('selected');
});

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
  const fileNameBase = downloadBase(chart.subject?.name || null);
  state.chart = { chart, markdown, fileNameBase };
  const el = $('#chart-result');
  const c = chart;
  const s = c.summary;

  const summary = [
    ['Lagna / लग्न', signName(s.ascendant.sign), `${num(s.ascendant.degree_in_sign)}° · ${nakshatraName(s.ascendant.nakshatra)} p${s.ascendant.pada}`],
    ['Sun sign / सूर्य राशि', signName(s.sun_sign), ''],
    ['Moon sign / चंद्र राशि', signName(s.moon_sign), `${nakshatraName(s.moon_nakshatra)} p${s.moon_pada}`],
    ['Vara / वार', varaName(s.vara), ''],
    ['Tithi / तिथि', tithiName(c.panchang.tithi.paksha, c.panchang.tithi.name), ''],
    ['Ayanamsa / अयनांश', `${num(c.conventions.ayanamsa_value, 4)}°`, c.conventions.ayanamsa],
  ];

  const planets = table(
    ['Planet / ग्रह', 'Sign / राशि', 'Degree', 'Nakshatra / नक्षत्र', 'Pada', 'House / भाव', 'Dignity / स्थिति', 'R / वक्री', 'Combust / अस्त'],
    c.planets.map((p) => [
      planetName(p.id),
      signName(p.sign),
      num(p.degree_in_sign),
      nakshatraName(p.nakshatra),
      p.pada,
      p.house,
      dignityName(p.dignity),
      p.retrograde ? 'Y' : '',
      p.combust ? 'Y' : '',
    ]),
    { numColumns: [2, 4, 5] },
  );

  const houses = table(
    ['House / भाव', 'Sign / राशि', 'Lord / स्वामी', 'Lord in', 'Occupants', 'Sripati', 'Bhava madhya'],
    c.houses.map((h) => [
      h.house,
      signName(h.sign),
      planetName(h.lord),
      h.lord_house ?? '—',
      h.occupants.length ? h.occupants.map(planetInline).join(', ') : '—',
      c.bhava_chalit[h.house - 1].planets.length ? c.bhava_chalit[h.house - 1].planets.map(planetInline).join(', ') : '—',
      `${num(h.sripati_bhava_madhya)}°`,
    ]),
    { numColumns: [0, 3, 6] },
  );

  const aspects = c.aspects.length
    ? `<ul class="plain">${c.aspects.map((a) => `<li>${planetInline(a.from)} → ${planetInline(a.to)} <span class="muted">(${a.house_distance}${a.special ? ', special' : ''})</span></li>`).join('')}</ul>`
    : '<p class="muted">No aspects.</p>';

  const conjunctions = c.conjunctions.length
    ? `<ul class="plain">${c.conjunctions.map((x) => `<li>${x.planets.map(planetInline).join(' + ')} in ${signName(x.sign)} <span class="muted">(${num(x.orb)}° apart)</span></li>`).join('')}</ul>`
    : '<p class="muted">No same-sign conjunctions.</p>';

  const vargas = Object.entries(c.vargas)
    .filter(([key]) => key !== 'D1')
    .map(([key, v]) => `
      <div class="section">
        <h3>${key} — ${esc(v.name)} <span class="hindi" lang="hi">${esc(VARGA_HINDI[key] ?? '')}</span></h3>
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
        <button class="ghost" id="print-chart">Print / PDF</button>
        <button class="ghost" id="dl-json">Download JSON</button>
        <button class="ghost" id="dl-md">Download Markdown</button>
      </div>
    </div>

    <div class="summary-grid">
      ${summary.map(([k, v, sub]) => `
        <div class="summary-item">
          <div class="k">${esc(k)}</div>
          <div class="v">${v}</div>
          ${sub ? `<div class="s">${sub}</div>` : ''}
        </div>`).join('')}
    </div>

    <div class="section">
      <h3>Planets <span class="hindi" lang="hi">ग्रह</span></h3>
      ${planets}
    </div>

    <div class="section">
      <h3>Houses (whole sign) <span class="hindi" lang="hi">भाव</span></h3>
      ${northIndianChart(c.vargas.D1 || { varga: 'D1', name: 'Rashi', ascendant_sign: c.summary.ascendant.sign, ascendant_sign_index: c.summary.ascendant.sign_index, houses: [] })}
      <div style="height:14px"></div>
      ${houses}
      <p class="muted small">Whole-sign (rashi) houses are primary. The Sripati column is the bhava-chalit placement; the last column is the Sripati bhava madhya.</p>
    </div>

    <div class="section">
      <h3>Birth Panchang <span class="hindi" lang="hi">जन्म पंचांग</span></h3>
      ${table(
        ['Vara / वार', 'Tithi / तिथि', 'Nakshatra / नक्षत्र', 'Yoga / योग', 'Karana / करण', 'Sunrise / सूर्योदय', 'Sunset / सूर्यास्त', 'Moonrise / चंद्रोदय', 'Moonset / चंद्रास्त'],
        [[
          varaName(pc.vara),
          tithiName(pc.tithi.paksha, pc.tithi.name),
          `${nakshatraName(pc.nakshatra.name)} p${pc.nakshatra.pada}`,
          yogaName(pc.yoga.name),
          karanaName(pc.karana.name),
          esc(pc.sunrise || '—'),
          esc(pc.sunset || '—'),
          esc(pc.moonrise || '—'),
          esc(pc.moonset || '—'),
        ]],
      )}
      <p class="muted small">Tithi at birth is ${num(pc.tithi.percent_elapsed)}% elapsed; nakshatra ${num(pc.nakshatra.percent_elapsed)}% elapsed.</p>
    </div>

    <div class="section">
      <h3>Aspects <span class="hindi" lang="hi">दृष्टि</span></h3>
      ${aspects}
      <h4>Conjunctions <span class="hindi" lang="hi">युति</span></h4>
      ${conjunctions}
    </div>

    ${vargas}

    <div class="section">
      <h3>Vimshottari Dasha <span class="hindi" lang="hi">विंशोत्तरी दशा</span></h3>
      <p class="muted small">Balance at birth: ${planetName(c.dasha.balance_at_birth.lord)} ${num(c.dasha.balance_at_birth.years, 2)} years (Moon in ${nakshatraName(c.dasha.birth_nakshatra)}).</p>
      ${c.dasha.current ? `<p class="small">Current: ${planetName(c.dasha.current.mahadasha.lord)}${c.dasha.current.antardasha ? ` / ${planetName(c.dasha.current.antardasha.lord)}` : ''} <span class="muted">(as of ${esc(c.dasha.current.as_of)})</span></p>` : ''}
      ${dashaTimeline(c.dasha, c.subject.birth.julian_day_ut)}
      ${table(['Mahadasha', 'Years', 'Start', 'End', ''], dashaRows, { numColumns: [1] })}
      <h4>Antardashas</h4>
      ${dashaDetails}
    </div>

    <div class="section print-hide">
      <h3>Machine-readable data</h3>
      <details>
        <summary>Show chart JSON</summary>
        <pre>${esc(JSON.stringify(c, null, 2))}</pre>
      </details>
    </div>
  `;

  el.classList.remove('hidden');
  $('#print-chart').addEventListener('click', () => {
    document.querySelectorAll('#chart-result details').forEach((node) => { node.open = true; });
    window.print();
  });
  $('#dl-json').addEventListener('click', () => download(`${state.chart.fileNameBase}.json`, JSON.stringify(c, null, 2), 'application/json'));
  $('#dl-md').addEventListener('click', () => download(`${state.chart.fileNameBase}.md`, markdown, 'text/markdown'));
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
    ['Lagna / लग्न', m.dosha.from_lagna, m.mars_house_from_lagna],
    ['Moon / चंद्र', m.dosha.from_moon, m.mars_house_from_moon],
    ['Venus / शुक्र', m.dosha.from_venus, m.mars_house_from_venus],
  ];
  return `
    <div class="dosha-card">
      <div class="dosha-head">
        <strong>${esc(label)}</strong>
        ${m.any ? '<span class="badge bad">Mars flagged</span>' : '<span class="badge good">Mars not flagged</span>'}
      </div>
      <p class="small">${planetInline('Mars')} in ${signName(m.mars_sign)} · ${m.mars_house_from_lagna}th / ${m.mars_house_from_moon}th / ${m.mars_house_from_venus}th from Lagna / Moon / Venus</p>
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
    if (name === 'varna') {
      return `${bilingual(row.groom, VARNA_HINDI)} / ${bilingual(row.bride, VARNA_HINDI)}`;
    }
    if (name === 'vashya') {
      return `${bilingual(row.groom, VASHYA_HINDI)} / ${bilingual(row.bride, VASHYA_HINDI)}`;
    }
    if (name === 'yoni') {
      return `${bilingual(row.groom, YONI_HINDI)} / ${bilingual(row.bride, YONI_HINDI)}`;
    }
    if (name === 'gana') {
      return `${bilingual(row.groom, GANA_HINDI)} / ${bilingual(row.bride, GANA_HINDI)}`;
    }
    if (name === 'tara') {
      return `${row.groom_to_bride.remainder} / ${row.bride_to_groom.remainder}`;
    }
    if (name === 'graha_maitri') {
      return `${displayPlanetName(row.groom_lord)} (${bilingual(row.groom_relation, RELATION_HINDI)}) / ${displayPlanetName(row.bride_lord)} (${bilingual(row.bride_relation, RELATION_HINDI)})`;
    }
    if (name === 'bhakoot') {
      return `${row.distance}${row.dosha ? ' · dosha / दोष' : ''}`;
    }
    if (name === 'nadi') {
      return `${bilingual(row.groom, NADI_HINDI)} / ${bilingual(row.bride, NADI_HINDI)}${row.dosha ? ' · dosha / दोष' : ''}`;
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
              <span class="muted small">Lagna / लग्न: ${signName(a.summary.ascendant)}</span>
            </div>
            ${northChartSvg(chartA)}
          </div>
          <div class="match-chart-card">
            <div class="match-chart-head">
              <div><strong>${esc(b.summary.name || 'Person B')}</strong> <span class="badge">${esc(roleB)}</span></div>
              <span class="muted small">Lagna / लग्न: ${signName(b.summary.ascendant)}</span>
            </div>
            ${northChartSvg(chartB)}
          </div>
        </div>
        ${planetLegend()}
        <p class="chart-note muted small">Tap or click a house or planet for details. Houses run anti-clockwise from the Lagna.</p>
      </div>`
    : '';

  el.innerHTML = `
    <div class="results-head">
      <div>
        <h2>Kundali Match</h2>
        <div class="sub">Ashtakoota plus Mangal dosha. Raw koota values are included in the JSON for independent checking.</div>
      </div>
      <div class="actions">
        <button class="ghost" id="print-match">Print / PDF</button>
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
        ['Lagna / लग्न', signName(a.summary.ascendant), signName(b.summary.ascendant)],
        ['Sun / सूर्य', signName(a.summary.sun_sign), signName(b.summary.sun_sign)],
        ['Moon / चंद्र', `${signName(a.summary.moon_sign)} / ${nakshatraName(a.summary.moon_nakshatra)} p${a.summary.moon_pada}`, `${signName(b.summary.moon_sign)} / ${nakshatraName(b.summary.moon_nakshatra)} p${b.summary.moon_pada}`],
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

    <div class="section print-hide">
      <h3>Machine-readable data</h3>
      <details>
        <summary>Show match JSON</summary>
        <pre>${esc(JSON.stringify(match, null, 2))}</pre>
      </details>
    </div>
  `;

  el.classList.remove('hidden');
  $('#print-match').addEventListener('click', () => {
    document.querySelectorAll('#match-result details').forEach((node) => { node.open = true; });
    window.print();
  });
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
