#!/usr/bin/env node
/**
 * 320px top-bar + book-select remeasure (Chromium proxy for Safari 真机).
 * Writes .local-shots/320px-top-remeasure.json (+ optional PNG). Never commit PNGs.
 *
 *   npm run capture:320-remeasure
 *
 * Asserts: .top clientHeight ≤ 100 (prefer ~75), book-select min-height ≥ 28,
 * text-overflow clip for short PEP/沪科 titles.
 */
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outJson = path.join(root, '.local-shots', '320px-top-remeasure.json');
const outPng = path.join(root, '.local-shots', '320px-pep-zh-book.png');
const url = process.env.CAPTURE_URL || 'http://127.0.0.1:4174/#/pep-junior/pep-1-1a/introduce';

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

await ensurePreview();
const pw = await loadPlaywright();
const browser = await pw.chromium.launch();
const page = await browser.newPage({ viewport: { width: 320, height: 720 } });
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
const zh = page.locator('button', { hasText: '中' }).first();
if (await zh.count()) {
  await zh.click();
  await page.waitForTimeout(400);
}
const metrics = await page.evaluate(() => {
  const top = document.querySelector('.top');
  const sel = document.querySelector('.book-select-wrap select, select.book-select, select');
  const langBtn = document.querySelector('.lang button');
  const swBtn = document.querySelector('.sw-update button, #sw-reload');
  const tCs = top ? getComputedStyle(top) : null;
  const sCs = sel ? getComputedStyle(sel) : null;
  const opt = sel?.options?.[sel.selectedIndex];
  return {
    topH: top ? top.getBoundingClientRect().height : null,
    topMinHeight: tCs?.minHeight || null,
    bookText: opt?.textContent?.trim() || '',
    bookOverflow: sCs?.textOverflow || null,
    bookMinH: sCs ? parseFloat(sCs.minHeight) || sel.getBoundingClientRect().height : null,
    bookClientH: sel ? sel.getBoundingClientRect().height : null,
    langBtnH: langBtn ? langBtn.getBoundingClientRect().height : null,
    swBtnH: swBtn ? swBtn.getBoundingClientRect().height : null,
    vw: window.innerWidth,
  };
});
fs.mkdirSync(path.dirname(outJson), { recursive: true });
fs.writeFileSync(outJson, JSON.stringify({ when: new Date().toISOString(), metrics, note: 'Chromium proxy; Safari 真机 still authoritative for subpixel' }, null, 2));
await page.screenshot({ path: outPng });
await browser.close();

let failed = 0;
if (!(metrics.topH > 0 && metrics.topH <= 100)) {
  failed += 1;
  console.error('FAIL 320 topH must be ≤100px', metrics.topH);
} else {
  console.log('ok 320 topH', metrics.topH, metrics.topH <= 80 ? '(≤80 / ~75 band)' : '(≤100)');
}
if (!(metrics.bookClientH >= 28) || !(metrics.bookMinH >= 28)) {
  failed += 1;
  console.error('FAIL 320 book-select tap height <28', metrics);
} else {
  console.log('ok 320 book-select height ≥28', { client: metrics.bookClientH, min: metrics.bookMinH });
}
if (metrics.langBtnH != null && metrics.langBtnH < 28) {
  failed += 1;
  console.error('FAIL 320 lang button height <28', metrics.langBtnH);
} else if (metrics.langBtnH != null) {
  console.log('ok 320 lang button height ≥28', metrics.langBtnH);
}
if (metrics.bookOverflow !== 'clip') {
  failed += 1;
  console.error('FAIL 320 book text-overflow expected clip', metrics.bookOverflow);
} else {
  console.log('ok 320 book text-overflow clip', metrics.bookText);
}
// ≤320 abbreviates PEP/沪科 in the select (full name remains in title=).
if (/^(人教|沪科|大学|PEP|SH|Uni)$/.test(metrics.bookText || '')) {
  console.log('ok 320 book-select abbreviated label', metrics.bookText);
} else if (/人教版|沪科初中|沪科高中/.test(metrics.bookText || '')) {
  failed += 1;
  console.error('FAIL 320 book-select should abbreviate to 人教/沪科', metrics.bookText);
}
console.log('wrote', outJson, outPng);
if (failed) process.exit(1);
console.log('ok capture-320-remeasure');
