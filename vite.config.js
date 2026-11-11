import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * The UI is fully client-side. Vite bundles the chart engine and swaps the
 * Node ephemeris loader for the browser loader. `static/` is served at the
 * site root in development and copied verbatim into `dist/` by the build.
 */
export default defineConfig({
  root: path.resolve(__dirname, 'public'),
  base: './',
  publicDir: path.resolve(__dirname, 'static'),
  plugins: [
    {
      name: 'kundali-browser-ephemeris',
      enforce: 'pre',
      resolveId(source, importer) {
        if (source === './ephemeris.js' && importer && /[\\/]src[\\/]/.test(importer)) {
          return path.resolve(__dirname, 'src/ephemeris-browser.js');
        }
        return null;
      },
    },
  ],
  server: {
    fs: { allow: [__dirname] },
    port: 5173,
  },
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
  },
});
