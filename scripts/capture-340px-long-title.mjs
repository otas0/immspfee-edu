#!/usr/bin/env node
/**
 * Reproducible 340px capture: long Chinese book label forces ellipsis.
 * Probes :4174; on failure runs ensure-dev-server --no-exec then captures.
 *
 * Playwright pin: scripts/playwright-version.txt (CI + /tmp/pw-shot local install).
 *
 *   npm run capture:340-title
 *   # or: node scripts/capture-340px-long-title.mjs
 */
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { formatCaptureFailMarkdown } from './capture-assert.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, '.local-shots', '340px-zh-long-title-ellipsis.png');
const long = '沪科版初中物理（上海科学技术出版社·五四制全日制义务教育·2024）教学用书全称';
const url = process.env.CAPTURE_URL || 'http://127.0.0.1:4174/#/sh-junior/shj-4-4a/introduce';
/** Set CAPTURE_FORCE_FAIL=1 to exercise overflow/topH summary without a real layout bug. */
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
  console.log('4174 probe failed; bash scripts/ensure-dev-server.sh --no-exec');
  const r = spawnSync('bash', ['scripts/ensure-dev-server.sh', '--no-exec'], {
    cwd: root,
    stdio: 'inherit',
  });
  if (r.status !== 0) {
    console.error('ensure-dev-server --no-exec failed');
    process.exit(r.status || 1);
  }
  for (let i = 0; i < 40; i += 1) {
    if (await probe4174()) return;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  console.error('4174 still unreachable after ensure-dev-server');
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
        /* try next */
      }
    }
    throw new Error('Install playwright (e.g. in /tmp/pw-shot) or set NODE_PATH');
  }
}

await ensurePreview();

const { chromium } = await loadPlaywright();
fs.mkdirSync(path.dirname(out), { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 340, height: 720 } });
await page.goto(url, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(800);
await page.locator('button', { hasText: '中' }).first().click();
await page.waitForTimeout(400);
await page.evaluate((label) => {
  const sel = document.querySelector('select.book-select');
  if (!sel) throw new Error('missing select.book-select');
  sel.options[sel.selectedIndex].textContent = label;
}, long);
const info = await page.evaluate(() => {
  const sel = document.querySelector('select.book-select');
  const top = document.querySelector('.top');
  const cs = getComputedStyle(sel);
  const ctx = document.createElement('canvas').getContext('2d');
  ctx.font = cs.font;
  const textW = ctx.measureText(sel.options[sel.selectedIndex].textContent).width;
  const pad = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight) + 28;
  return {
    overflow: cs.textOverflow,
    textW,
    clientW: sel.clientWidth,
    overflows: textW + pad > sel.clientWidth,
    topH: top ? top.getBoundingClientRect().height : null,
  };
});
await page.screenshot({ path: out });
await browser.close();
console.log(info);

function writeCaptureFail(title, detail) {
  const body = formatCaptureFailMarkdown(title, detail);
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
  writeCaptureFail('FORCE FAIL (CAPTURE_FORCE_FAIL=1) — summary overflow/topH block', {
    ...info,
    overflow: 'clip',
    overflows: false,
    topH: 150,
  });
  process.exit(2);
}

if (info.overflow !== 'ellipsis' || !info.overflows) {
  writeCaptureFail('FAIL: expected ellipsis with text wider than select at 340px', info);
  process.exit(2);
}
// 99f9ab8: narrow header stays under ~100px (lang no longer stacks under brand).
if (info.topH == null || info.topH > 100) {
  writeCaptureFail('FAIL: .top height should stay ≤100px at 340px after header layout', info);
  process.exit(3);
}
try {
  fs.unlinkSync(path.join(root, '.local-shots', 'capture-last-fail.md'));
} catch { /* no prior fail */ }
console.log('ok wrote', out, `(top ${info.topH.toFixed(1)}px)`);
