#!/usr/bin/env node
/**
 * Optional 1280×800 desktop three-column visual baseline (Pages artifact only).
 * PNGs stay under .local-shots/ (gitignored) — never commit large shots.
 *
 *   npm run capture:1280
 *   CAPTURE_FORCE_FAIL=1 npm run capture:1280  # same overflow/topH fail template as 340
 */
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { formatCaptureFailMarkdown } from './capture-assert.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, '.local-shots', '1280-desktop-three-column.png');
const url = process.env.CAPTURE_URL || 'http://127.0.0.1:4174/#/sh-junior/shj-4-4a/introduce';
/** Set CAPTURE_FORCE_FAIL=1 to exercise overflow/topH summary (aligned with capture:340). */
const FORCE_FAIL = process.env.CAPTURE_FORCE_FAIL === '1';

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
  console.error('4174 still unreachable');
  process.exit(1);
}

async function loadPlaywright() {
  try {
    return await import('playwright');
  } catch {
    const require = createRequire(import.meta.url);
    for (const candidate of ['/tmp/pw-shot/node_modules/playwright', path.join(root, 'node_modules/playwright')]) {
      try {
        return require(candidate);
      } catch {
        /* next */
      }
    }
    throw new Error('Install playwright (e.g. in /tmp/pw-shot) or set NODE_PATH');
  }
}

function writeCaptureFail(title, detail) {
  const body = formatCaptureFailMarkdown(title, detail, { kind: 'capture:1280' });
  const failPath = path.join(root, '.local-shots', 'capture-last-fail.md');
  fs.mkdirSync(path.dirname(failPath), { recursive: true });
  fs.writeFileSync(failPath, body);
  const summary = process.env.GITHUB_STEP_SUMMARY;
  if (summary) {
    try { fs.appendFileSync(summary, body); } catch { /* ignore */ }
  }
  console.error(title, detail);
}

if (FORCE_FAIL) {
  writeCaptureFail('FORCE FAIL (CAPTURE_FORCE_FAIL=1) — summary overflow/topH block (1280)', {
    overflow: 'clip',
    overflows: false,
    topH: 150,
    viewport: '1280x800',
  });
  process.exit(2);
}

await ensurePreview();
const { chromium } = await loadPlaywright();
fs.mkdirSync(path.dirname(out), { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(1200);
const about = page.locator('.sources');
await about.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
// Non force-fail: three-column desktop layout (aside | main | .teach) must be visible side-by-side.
const cols = await page.evaluate(() => {
  const aside = document.querySelector('aside');
  const main = document.querySelector('main') || document.querySelector('.stage-wrap');
  const teach = document.querySelector('.teach') || document.querySelector('#teach');
  const box = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const st = getComputedStyle(el);
    return {
      w: r.width, h: r.height, x: r.x, y: r.y,
      display: st.display, visibility: st.visibility,
    };
  };
  return { aside: box(aside), main: box(main), teach: box(teach), vw: window.innerWidth };
});
const visible = (b) => b && b.w > 40 && b.h > 40 && b.visibility !== 'hidden' && b.display !== 'none';
if (!visible(cols.aside) || !visible(cols.main) || !visible(cols.teach)
  || cols.vw < 1100
  || !(cols.aside.x < cols.main.x && cols.main.x < cols.teach.x)) {
  writeCaptureFail('FAIL: 1280 viewport must show three columns (aside | main | teach)', cols);
  await browser.close();
  process.exit(2);
}
await page.screenshot({ path: out, fullPage: false });
await browser.close();
try {
  fs.unlinkSync(path.join(root, '.local-shots', 'capture-last-fail.md'));
} catch { /* no prior fail */ }
console.log('wrote', out, '(three-column ok)', {
  asideX: cols.aside.x, mainX: cols.main.x, teachX: cols.teach.x,
});
