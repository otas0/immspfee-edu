#!/usr/bin/env node
/**
 * University long-catalog + Explore sticky .phases hand-test (Chromium CDP).
 * Soft-skips without Playwright / preview. Writes .local-shots/uni-sticky-hand.json.
 *
 *   npm run capture:uni-sticky
 */
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outJson = path.join(root, '.local-shots', 'uni-sticky-hand.json');
/** QM chapter with a long lesson list; explore phase exercises sticky vs primary. */
const url = process.env.CAPTURE_URL
  || 'http://127.0.0.1:4174/#/university/uni-qm-1/explore';

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
  if (await probe4174()) return true;
  const r = spawnSync('bash', ['scripts/ensure-dev-server.sh', '--no-exec'], {
    cwd: root,
    stdio: 'inherit',
  });
  if (r.status !== 0) return false;
  for (let i = 0; i < 40; i += 1) {
    if (await probe4174()) return true;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  return false;
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
    return null;
  }
}

if (!(await ensurePreview())) {
  console.log('skip capture-uni-sticky-hand: preview unreachable');
  process.exit(0);
}
const pw = await loadPlaywright();
if (!pw) {
  console.log('skip capture-uni-sticky-hand: Playwright not installed');
  process.exit(0);
}

const widths = [320, 360, 768, 1100];
const browser = await pw.chromium.launch();
const results = [];
let failed = 0;

for (const w of widths) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 } });
  await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(500);
  // Expand chapter list scroll so sticky phases compete with a long uni catalog.
  await page.evaluate(() => {
    const main = document.querySelector('main, .teach, .layout, #app');
    if (main) main.scrollTop = 120;
    window.scrollTo(0, 180);
  });
  await page.waitForTimeout(200);
  const m = await page.evaluate(() => {
    const phases = document.querySelector('.phases');
    const primary = document.querySelector('.primary, button.primary');
    if (!phases) return { ok: false, reason: 'missing .phases' };
    const pcs = getComputedStyle(phases);
    const pr = phases.getBoundingClientRect();
    const prim = primary ? primary.getBoundingClientRect() : null;
    const sticky = pcs.position === 'sticky' || pcs.position === 'fixed';
    const topZero = pcs.top === '0px' || Number.parseFloat(pcs.top) === 0;
    return {
      ok: true,
      position: pcs.position,
      top: pcs.top,
      phasesTop: pr.top,
      phasesBottom: pr.bottom,
      primaryTop: prim ? prim.top : null,
      sticky,
      topZero,
      vw: window.innerWidth,
    };
  });
  const clearOk = w > 1100 || (m.sticky && m.topZero);
  results.push({ w, ...m, clearOk });
  if (!m.ok) {
    failed += 1;
    console.error('FAIL uni sticky hand', w, m);
  } else if (!clearOk) {
    failed += 1;
    console.error('FAIL uni sticky @' + w + ': expected position:sticky top:0', m);
  } else {
    console.log('ok uni sticky hand', { w, position: m.position, top: m.top, phasesTop: m.phasesTop });
  }
  await page.close();
}

await browser.close();
fs.mkdirSync(path.dirname(outJson), { recursive: true });
fs.writeFileSync(outJson, JSON.stringify({
  when: new Date().toISOString(),
  url,
  results,
  note: 'University explore + long catalog; sticky .phases vs .primary at 320/360/768/1100',
}, null, 2));
console.log('wrote', outJson);
if (failed) process.exit(1);
console.log('ok capture-uni-sticky-hand');
