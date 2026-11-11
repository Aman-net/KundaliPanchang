import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildChart } from './chart.js';
import { matchCharts } from './match.js';
import { chartToMarkdown, matchToMarkdown } from './format.js';
import { getEphemeris } from './ephemeris.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json({ limit: '1mb' }));

// The browser UI is built by Vite. Serve the build if it exists; the API works
// independently of the UI.
const distDir = path.resolve(__dirname, '..', 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'kundali' });
});

app.post('/api/chart', async (req, res) => {
  try {
    const chart = await buildChart(req.body);
    res.json({ chart, markdown: chartToMarkdown(chart) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/match', async (req, res) => {
  try {
    const { a, b, groom = 'A' } = req.body ?? {};
    if (!a || !b) throw new Error('both a and b birth inputs are required');
    const chartA = await buildChart(a);
    const chartB = await buildChart(b);
    const match = matchCharts(chartA, chartB, { groom });
    res.json({ match, markdown: matchToMarkdown(match) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

const port = Number(process.env.PORT) || 3000;

getEphemeris()
  .then(() => {
    app.listen(port, () => {
      console.log(`Kundali UI: http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialise ephemeris:', err);
    process.exit(1);
  });
