import fs from 'node:fs';
import { buildChart, DEFAULT_VARGAS } from './chart.js';
import { chartToMarkdown } from './format.js';

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    const value = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
    out[key] = value;
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));

if (args.help || !args.date) {
  console.log(`Usage:
  node src/cli.js --date 2000-08-15 --time 10:30 --lat 25.483 --lon 80.334 \\
    [--tz Asia/Kolkata] [--elev 124] [--name "Name"] [--place Banda] \\
    [--vargas D1,D9,D10] [--depth 2] [--json out.json] [--md out.md]

Options:
  --date      Birth date, YYYY-MM-DD (required)
  --time      Birth time, HH:MM or HH:MM:SS (default 00:00)
  --lat       Latitude (required)
  --lon       Longitude (required)
  --tz        IANA zone or +/-HH:MM offset (default Asia/Kolkata)
  --elev      Elevation in metres (default 0)
  --vargas    Comma-separated divisional charts (default ${DEFAULT_VARGAS.join(',')})
  --depth     Dasha depth: 2 = maha+antar, 3 = adds pratyantar
  --json      Write chart JSON to this file
  --md        Write markdown digest to this file
`);
  process.exit(args.help ? 0 : 1);
}

const input = {
  name: args.name || null,
  date: args.date,
  time: args.time || '00:00',
  timeZone: args.tz || 'Asia/Kolkata',
  latitude: Number(args.lat),
  longitude: Number(args.lon),
  elevation: Number(args.elev || 0),
  placeName: args.place || null,
  vargas: args.vargas ? String(args.vargas).split(',').map((s) => s.trim()) : DEFAULT_VARGAS,
  dashaDepth: Number(args.depth || 2),
};

const chart = await buildChart(input);
const markdown = chartToMarkdown(chart);

if (args.json) fs.writeFileSync(args.json, JSON.stringify(chart, null, 2));
if (args.md) fs.writeFileSync(args.md, markdown);

if (!args.json && !args.md) {
  console.log(markdown);
} else {
  console.log(`Wrote ${args.json ?? ''} ${args.md ?? ''}`.trim());
}
