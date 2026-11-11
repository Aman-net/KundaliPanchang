import fs from 'node:fs';
import path from 'node:path';

const source = path.resolve('node_modules/sweph-wasm/dist/wasm/swisseph.wasm');
const targetDir = path.resolve('static/wasm');
const target = path.join(targetDir, 'swisseph.wasm');

if (!fs.existsSync(source)) {
  throw new Error(`Missing ${source}. Run npm install first.`);
}

fs.mkdirSync(targetDir, { recursive: true });
fs.copyFileSync(source, target);
console.log(`Copied ${path.relative(process.cwd(), target)}`);
