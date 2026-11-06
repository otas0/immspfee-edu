#!/usr/bin/env node
/**
 * Reproducible 340px capture: long Chinese book label forces ellipsis.
 * Requires preview on :4174 and Playwright (see /tmp/pw-shot or npx).
 *
 *   bash scripts/ensure-dev-server.sh --no-exec
 *   node scripts/capture-340px-long-title.mjs
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, '.local-shots', '340px-zh-long-title-ellipsis.png');
const long = '沪科版初中物理（上海科学技术出版社·五四制全日制义务教育·2024）教学用书全称';
const url = process.env.CAPTURE_URL || 'http://127.0.0.1:4174/#/sh-junior/shj-4-4a/introduce';

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
  };
});
await page.screenshot({ path: out });
await browser.close();
console.log(info);
if (info.overflow !== 'ellipsis' || !info.overflows) {
  console.error('FAIL: expected ellipsis with text wider than select at 340px');
  process.exit(2);
}
console.log('ok wrote', out);
