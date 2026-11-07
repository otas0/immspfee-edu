#!/usr/bin/env node
/**
 * Export docs/promo/poster.html to a fixed A4 PDF via Chromium (no browser Print UI).
 *
 *   npm run poster:pdf
 *   POSTER_SPEAKER=1 npm run poster:pdf
 *   POSTER_LANG=zh POSTER_SPEAKER=1 npm run poster:pdf
 *
 * Output (gitignored): .local-shots/poster-a4.pdf
 */
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const speaker = process.env.POSTER_SPEAKER === '1';
const lang = process.env.POSTER_LANG === 'zh' ? 'zh' : 'en';
const outName = speaker
  ? (lang === 'zh' ? 'poster-a4-speaker-zh.pdf' : 'poster-a4-speaker.pdf')
  : 'poster-a4.pdf';
const out = path.join(root, '.local-shots', outName);
const qs = new URLSearchParams();
if (speaker) {
  qs.set('speaker', '1');
  qs.set('lang', lang);
}
const url = `http://127.0.0.1:4174/docs/promo/poster.html${qs.toString() ? `?${qs}` : ''}`;

function dieChromium(err) {
  console.error('poster:pdf — Chromium unavailable.');
  console.error(String(err && err.message ? err.message : err));
  console.error('');
  console.error('Install the pinned Playwright browser (see .local-shots/README.md):');
  console.error('  PW_VER=$(tr -d \" \\\\n\\\\r\" < scripts/playwright-version.txt)');
  console.error('  mkdir -p /tmp/pw-shot && cd /tmp/pw-shot');
  console.error('  npm init -y && npm install \"playwright@${PW_VER}\"');
  console.error('  npx playwright install chromium');
  console.error('  cd -');
  console.error('  NODE_PATH=/tmp/pw-shot/node_modules npm run poster:pdf');
  console.error('');
  console.error('Or point at an existing Chrome/Chromium:');
  console.error('  PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/path/to/Chromium npm run poster:pdf');
  process.exit(1);
}

async function probe4174() {
  try {
    const res = await fetch('http://127.0.0.1:4174/', {
      method: 'HEAD',
      signal: AbortSignal.timeout(2500),
    });
    return res.status > 0 && res.status < 500;
  } catch {
    return false;
  }
}

async function ensurePreview() {
  if (await probe4174()) return;
  const r = spawnSync('bash', ['scripts/ensure-dev-server.sh', '--no-exec'], {
    cwd: root,
    stdio: 'inherit',
  });
  if (r.status !== 0) process.exit(r.status || 1);
  for (let i = 0; i < 40; i += 1) {
    if (await probe4174()) return;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  console.error('4174 still unreachable — run: npm start');
  process.exit(1);
}

async function loadPlaywright() {
  const require = createRequire(import.meta.url);
  for (const candidate of ['/tmp/pw-shot/node_modules/playwright', path.join(root, 'node_modules/playwright')]) {
    try {
      return require(candidate);
    } catch {
      /* next */
    }
  }
  try {
    return await import('playwright');
  } catch (err) {
    dieChromium(err);
  }
}

await ensurePreview();
spawnSync(process.execPath, ['scripts/sync-poster-books.mjs'], { cwd: root, stdio: 'inherit' });

let chromium;
try {
  ({ chromium } = await loadPlaywright());
} catch (err) {
  dieChromium(err);
}

fs.mkdirSync(path.dirname(out), { recursive: true });
const launchOpts = {};
if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) {
  launchOpts.executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
} else {
  const fallback = path.join(
    process.env.HOME || '',
    'Library/Caches/ms-playwright/chromium-1140/chrome-mac/Chromium.app/Contents/MacOS/Chromium',
  );
  if (fs.existsSync(fallback)) launchOpts.executablePath = fallback;
}

let browser;
try {
  browser = await chromium.launch(launchOpts);
} catch (err) {
  dieChromium(err);
}

const page = await browser.newPage();
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
await page.emulateMedia({ media: 'print' });
await page.pdf({
  path: out,
  format: 'A4',
  printBackground: true,
  margin: { top: '0', right: '0', bottom: '0', left: '0' },
  preferCSSPageSize: true,
});
await browser.close();
console.log(`wrote ${path.relative(root, out)}`);
