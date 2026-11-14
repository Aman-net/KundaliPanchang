function table(headers, rows) {
  const head = `| ${headers.join(' | ')} |`;
  const sep = `| ${headers.map(() => '---').join(' | ')} |`;
  const body = rows.map((r) => `| ${r.join(' | ')} |`).join('\n');
  return `${head}\n${sep}\n${body}`;
}

function nameOf(chart) {
  return chart.subject.name || 'Unnamed chart';
}

function ordinal(n) {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]}`;
}

export function chartToMarkdown(chart) {
  const lines = [];
  const b = chart.subject.birth;
  const p = chart.subject.place;

  lines.push(`# Kundali — ${nameOf(chart)}`);
  lines.push('');
  lines.push(`**Birth:** ${b.local} (${chart.conventions.timezone}, ${chart.conventions.timezone_offset}) · UTC ${b.utc}`);
  lines.push(`**Place:** ${p.name || '—'} · ${p.latitude.toFixed(4)}, ${p.longitude.toFixed(4)} · ${p.elevation_m} m`);
  lines.push('');
  lines.push('**Conventions:** ' + [
    chart.conventions.zodiac,
    chart.conventions.ayanamsa + ` (${chart.conventions.ayanamsa_value}°)`,
    chart.conventions.house_system,
    chart.conventions.node,
    `Vimshottari year ${chart.conventions.dasha_year_days} days`,
  ].join(' · '));
  lines.push('');

  lines.push('## Summary');
  lines.push('');
  const s = chart.summary;
  lines.push(`- **Lagna:** ${s.ascendant.sign} ${s.ascendant.degree_in_sign}° (${s.ascendant.nakshatra} pada ${s.ascendant.pada})`);
  lines.push(`- **Sun:** ${s.sun_sign}`);
  lines.push(`- **Moon:** ${s.moon_sign} · ${s.moon_nakshatra} pada ${s.moon_pada}`);
  lines.push(`- **Vara:** ${s.vara}`);
  lines.push(`- **Tithi:** ${s.tithi}`);
  lines.push('');

  lines.push('## Birth Panchang');
  lines.push('');
  const pc = chart.panchang;
  lines.push(`- Vara: ${pc.vara}`);
  lines.push(`- Tithi: ${pc.tithi.paksha} ${pc.tithi.name} (${pc.tithi.percent_elapsed}% elapsed)`);
  lines.push(`- Nakshatra: ${pc.nakshatra.name} pada ${pc.nakshatra.pada} (lord ${pc.nakshatra.lord})`);
  lines.push(`- Yoga: ${pc.yoga.name}`);
  lines.push(`- Karana: ${pc.karana.name}`);
  lines.push(`- Sunrise: ${pc.sunrise || '—'} · Sunset: ${pc.sunset || '—'}`);
  lines.push(`- Moonrise: ${pc.moonrise || '—'} · Moonset: ${pc.moonset || '—'}`);
  lines.push('');

  lines.push('## Planets');
  lines.push('');
  lines.push(table(
    ['Planet', 'Sign', 'Deg', 'Nakshatra', 'Pada', 'House', 'Dignity', 'R', 'Combust'],
    chart.planets.map((pl) => [
      pl.id,
      pl.sign,
      pl.degree_in_sign.toFixed(2),
      pl.nakshatra,
      pl.pada,
      pl.house,
      pl.dignity,
      pl.retrograde ? 'Y' : '',
      pl.combust ? 'Y' : '',
    ]),
  ));
  lines.push('');

  lines.push('## Houses (whole sign)');
  lines.push('');
  lines.push(table(
    ['House', 'Sign', 'Lord', 'Lord in', 'Occupants', 'Bhava madhya (Sripati)'],
    chart.houses.map((h) => [h.house, h.sign, h.lord, h.lord_house ?? '—', h.occupants.join(', ') || '—', `${h.sripati_bhava_madhya.toFixed(2)}°`]),
  ));
  lines.push('');

  lines.push('## Bhava Chalit (Sripati)');
  lines.push('');
  lines.push(table(
    ['Bhava', 'Occupants'],
    chart.bhava_chalit.map((h) => [h.house, h.planets.join(', ') || '—']),
  ));
  lines.push('');

  lines.push('## Moon and Sun Charts');
  lines.push('');
  lines.push(table(
    ['House', 'Moon chart sign', 'Moon chart planets', 'Sun chart sign', 'Sun chart planets'],
    Array.from({ length: 12 }, (_, i) => [
      i + 1,
      chart.moon_chart[i].sign,
      chart.moon_chart[i].planets.join(', ') || '—',
      chart.sun_chart[i].sign,
      chart.sun_chart[i].planets.join(', ') || '—',
    ]),
  ));
  lines.push('');

  if (chart.aspects.length) {
    lines.push('## Aspects (graha drishti)');
    lines.push('');
    for (const a of chart.aspects) {
      lines.push(`- ${a.from} → ${a.to} (${ordinal(a.house_distance)}${a.special ? ', special' : ''})`);
    }
    lines.push('');
  }

  if (chart.conjunctions.length) {
    lines.push('## Conjunctions (same sign)');
    lines.push('');
    for (const c of chart.conjunctions) {
      lines.push(`- ${c.planets.join(' + ')} in ${c.sign} (${c.orb}° apart)`);
    }
    lines.push('');
  }

  lines.push('## Divisional Charts');
  lines.push('');
  for (const [key, v] of Object.entries(chart.vargas)) {
    lines.push(`### ${key} — ${v.name}`);
    lines.push('');
    lines.push(`Lagna: **${v.ascendant_sign}**`);
    lines.push('');
    const rows = Object.entries(v.placements).map(([planetKey, pl]) => [
      planetKey.charAt(0).toUpperCase() + planetKey.slice(1),
      pl.sign,
      pl.house,
    ]);
    lines.push(table(['Planet', 'Sign', 'House'], rows));
    lines.push('');
  }

  lines.push('## Vimshottari Dasha');
  lines.push('');
  const d = chart.dasha;
  lines.push(`Balance at birth: **${d.balance_at_birth.lord}** ${d.balance_at_birth.years} years (Moon in ${d.birth_nakshatra}, lord ${d.birth_nakshatra_lord})`);
  lines.push('');
  lines.push(table(
    ['Mahadasha', 'Years', 'Start', 'End', 'Includes birth'],
    d.mahadashas.map((m) => [m.lord, m.years, m.start, m.end, m.includes_birth ? 'yes' : '']),
  ));
  lines.push('');

  if (d.current) {
    lines.push(`### Current Dasha (as of ${d.current.as_of})`);
    lines.push('');
    lines.push(`- Mahadasha: **${d.current.mahadasha.lord}** (${d.current.mahadasha.start} → ${d.current.mahadasha.end})`);
    if (d.current.antardasha) {
      lines.push(`- Antardasha: **${d.current.antardasha.lord}** (${d.current.antardasha.start} → ${d.current.antardasha.end})`);
    }
    if (d.current.pratyantardasha) {
      lines.push(`- Pratyantardasha: **${d.current.pratyantardasha.lord}** (${d.current.pratyantardasha.start} → ${d.current.pratyantardasha.end})`);
    }
    lines.push('');
  }

  const birthMaha = d.mahadashas.find((m) => m.includes_birth) || d.mahadashas[0];
  if (birthMaha) {
    lines.push(`### Antardashas (birth mahadasha marked)`);
    lines.push('');
    for (const m of d.mahadashas) {
      lines.push(`#### ${m.lord} Mahadasha — ${m.start} → ${m.end}${m.includes_birth ? ' (includes birth)' : ''}`);
      lines.push('');
      lines.push(table(
        ['Antardasha', 'Years', 'Start', 'End'],
        m.antardashas.map((a) => [a.lord, a.years, a.start, a.end]),
      ));
      lines.push('');
    }
  }

  return lines.join('\n');
}

export function matchToMarkdown(match) {
  const lines = [];
  const a = match.a.summary;
  const b = match.b.summary;

  lines.push('# Kundali Match');
  lines.push('');
  lines.push(table(
    ['', 'Person A', 'Person B'],
    [
      ['Name', a.name || '—', b.name || '—'],
      ['Role', match.groom === 'A' ? 'Groom (वर)' : 'Bride (वधू)', match.groom === 'B' ? 'Groom (वर)' : 'Bride (वधू)'],
      ['Birth', a.birth.local, b.birth.local],
      ['Place', a.place.name || '—', b.place.name || '—'],
      ['Lagna', a.ascendant, b.ascendant],
      ['Sun', a.sun_sign, b.sun_sign],
      ['Moon', `${a.moon_sign} / ${a.moon_nakshatra} p${a.moon_pada}`, `${b.moon_sign} / ${b.moon_nakshatra} p${b.moon_pada}`],
    ],
  ));
  lines.push('');

  const k = match.ashtakoota;
  lines.push('## Ashtakoota');
  lines.push('');
  lines.push(table(
    ['Koota', 'Score', 'Max', 'Detail'],
    Object.entries(k.rows).map(([name, row]) => [
      name.replace(/_/g, ' '),
      row.score,
      row.max,
      describeKoota(name, row),
    ]),
  ));
  lines.push('');
  lines.push(`**Total: ${k.score} / ${k.max}**`);
  lines.push('');
  lines.push(`_${k.note}_`);
  lines.push('');

  lines.push('## Mangal Dosha');
  lines.push('');
  for (const [label, person] of [['Person A', match.a], ['Person B', match.b]]) {
    const m = person.mangal_dosha;
    lines.push(`- **${label}:** ${m.any ? 'present' : 'not indicated'} — Mars in ${m.mars_sign}; ` +
      `houses from lagna ${m.mars_house_from_lagna}, Moon ${m.mars_house_from_moon}, Venus ${m.mars_house_from_venus}`);
    for (const note of m.notes) lines.push(`  - ${note}`);
  }
  lines.push('');

  return lines.join('\n');
}

function describeKoota(name, row) {
  switch (name) {
    case 'varna':
      return `${row.groom} / ${row.bride}`;
    case 'vashya':
      return `${row.groom} / ${row.bride}`;
    case 'tara':
      return `${row.groom_to_bride.remainder}/${row.bride_to_groom.remainder}`;
    case 'yoni':
      return `${row.groom} / ${row.bride}`;
    case 'graha_maitri':
      return `${row.groom_lord} (${row.groom_relation}) / ${row.bride_lord} (${row.bride_relation})`;
    case 'gana':
      return `${row.groom} / ${row.bride}`;
    case 'bhakoot':
      return `${ordinal(row.distance)}${row.dosha ? ' (dosha)' : ''}`;
    case 'nadi':
      return `${row.groom} / ${row.bride}${row.dosha ? ' (dosha)' : ''}`;
    default:
      return '';
  }
}
