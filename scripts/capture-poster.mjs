#!/usr/bin/env node
/**
 * Capture Education A4 poster reference (+ optional 340px screen readability check).
 * PNGs stay under .local-shots/ (gitignored) — never commit large shots.
 *
 *   npm run capture:poster
 *   → .local-shots/poster-a4-reference.png
 *   → .local-shots/poster-340px-screen.png (screen CSS @ 340×720)
 */
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const url = process.env.CAPTURE_URL || 'http://127.0.0.1:4174/docs/promo/poster.html';
const outA4 = path.join(root, '.local-shots', 'poster-a4-reference.png');
const out340 = path.join(root, '.local-shots', 'poster-340px-screen.png');

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
  const require = createRequire(import.meta.url);
  // Prefer pin install in /tmp/pw-shot so sandbox/global Playwright cannot steal Chromium rev.
  for (const candidate of ['/tmp/pw-shot/node_modules/playwright', path.join(root, 'node_modules/playwright')]) {
    try {
      return require(candidate);
    } catch {
      /* next */
    }
  }
  try {
    return await import('playwright');
  } catch {
    throw new Error('Install playwright (e.g. in /tmp/pw-shot) or set NODE_PATH');
  }
}

await ensurePreview();
const { chromium } = await loadPlaywright();
fs.mkdirSync(path.dirname(outA4), { recursive: true });
const browser = await chromium.launch();

// A4 reference at ~96dpi (210mm ≈ 794px, 297mm ≈ 1123px) + hint chrome
{
  const page = await browser.newPage({ viewport: { width: 900, height: 1400 } });
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(400);
  const sheet = page.locator('.sheet');
  await sheet.waitFor({ state: 'visible', timeout: 10000 });
  await sheet.screenshot({ path: outA4 });
  const brand = await page.evaluate(() => {
    const img = document.querySelector('.brand img');
    if (!img) return null;
    const r = img.getBoundingClientRect();
    return { w: r.width, h: r.height, maxCss: getComputedStyle(img).maxWidth };
  });
  console.log('brand', brand);
  if (!brand || brand.w < 200 || brand.w > 310) {
    console.error('FAIL: brand width should track site max 300px, got', brand);
    await browser.close();
    process.exit(2);
  }
  console.log(`wrote ${path.relative(root, outA4)}`);
  await page.close();
}

// 321–360 screen band readability
{
  const page = await browser.newPage({ viewport: { width: 340, height: 720 } });
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: out340, fullPage: true });
  const check = await page.evaluate(() => {
    const layout = document.querySelector('.layout');
    const hero = document.querySelector('.hero h1.en');
    const books = document.querySelector('.books');
    const st = layout ? getComputedStyle(layout) : null;
    const cols = st ? st.gridTemplateColumns.split(/\s+/).filter(Boolean).length : 0;
    const heroFs = hero ? parseFloat(getComputedStyle(hero).fontSize) : 0;
    const booksFs = books ? parseFloat(getComputedStyle(books).fontSize) : 0;
    const overflowX = document.documentElement.scrollWidth > window.innerWidth + 1;
    return {
      cols,
      heroFs,
      booksFs,
      overflowX,
      scrollW: document.documentElement.scrollWidth,
      innerW: window.innerWidth,
    };
  });
  console.log('340px screen', check);
  if (check.cols !== 1) {
    console.error('FAIL: 340px screen layout should stack to 1 column');
    await browser.close();
    process.exit(2);
  }
  if (check.heroFs < 12 || check.booksFs < 11) {
    console.error('FAIL: 340px type too small', check);
    await browser.close();
    process.exit(2);
  }
  if (check.overflowX) {
    console.error('FAIL: 340px horizontal overflow', check);
    await browser.close();
    process.exit(2);
  }
  console.log(`wrote ${path.relative(root, out340)}`);
  await page.close();
}

await browser.close();
console.log('poster capture ok');
