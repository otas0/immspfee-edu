#!/usr/bin/env node
/**
 * Capture Education A4 poster reference (+ 340px screen + speaker-zh + A4 fit).
 * PNGs stay under .local-shots/ (gitignored).
 *
 *   npm run capture:poster
 */
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const base = process.env.CAPTURE_URL || 'http://127.0.0.1:4174/docs/promo/poster.html';
const outA4 = path.join(root, '.local-shots', 'poster-a4-reference.png');
const out340 = path.join(root, '.local-shots', 'poster-340px-screen.png');
const outSpeaker = path.join(root, '.local-shots', 'poster-speaker-zh.png');
const outPdf = path.join(root, '.local-shots', 'poster-a4.pdf');
const outFit = path.join(root, '.local-shots', 'poster-a4-fit.json');

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

function launchOpts() {
  const opts = {};
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) {
    opts.executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
  } else {
    const fallback = path.join(
      process.env.HOME || '',
      'Library/Caches/ms-playwright/chromium-1140/chrome-mac/Chromium.app/Contents/MacOS/Chromium',
    );
    if (fs.existsSync(fallback)) opts.executablePath = fallback;
  }
  return opts;
}

function countPdfPages(buf) {
  const s = buf.toString('latin1');
  const m = s.match(/\/Type\s*\/Page[^s]/g);
  return m ? m.length : 0;
}

await ensurePreview();
spawnSync(process.execPath, ['scripts/sync-poster-books.mjs'], { cwd: root, stdio: 'inherit' });

const { chromium } = await loadPlaywright();
fs.mkdirSync(path.dirname(outA4), { recursive: true });
const browser = await chromium.launch(launchOpts());

{
  const page = await browser.newPage({ viewport: { width: 900, height: 1400 } });
  await page.goto(base, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(500);
  const sheet = page.locator('.sheet');
  await sheet.waitFor({ state: 'visible', timeout: 10000 });
  await sheet.screenshot({ path: outA4 });

  await page.emulateMedia({ media: 'print' });
  await page.waitForTimeout(200);
  const fit = await page.evaluate(() => {
    const sheetEl = document.querySelector('[data-poster-sheet]') || document.querySelector('.sheet');
    const books = document.querySelector('.books');
    const sr = sheetEl.getBoundingClientRect();
    const br = books ? books.getBoundingClientRect() : null;
    const pxPerMm = 96 / 25.4;
    const wMm = sr.width / pxPerMm;
    const hMm = sr.height / pxPerMm;
    const panes = [...document.querySelectorAll('.pane')].map((p) => ({
      client: p.clientHeight,
      scroll: p.scrollHeight,
      clipped: p.scrollHeight > p.clientHeight + 2,
    }));
    return {
      sheetWMm: Math.round(wMm * 10) / 10,
      sheetHMm: Math.round(hMm * 10) / 10,
      isA4: Math.abs(wMm - 210) < 3 && Math.abs(hMm - 297) < 3,
      sheetOverflow: sheetEl.scrollHeight > sheetEl.clientHeight + 2,
      booksVisible: br ? br.bottom <= sr.bottom + 2 : false,
      panesClipped: panes.some((p) => p.clipped),
      panes,
      brandMax: getComputedStyle(document.querySelector('.brand img')).maxWidth,
      squareFrames: (() => {
        const framed = [...document.querySelectorAll('.pane, .dock, .qr-box, .books, .callout')];
        return framed.every((el) => {
          const st = getComputedStyle(el);
          const hasBox = parseFloat(st.borderTopWidth) > 0 && st.borderTopStyle !== 'none';
          const radius = ['TopLeft', 'TopRight', 'BottomRight', 'BottomLeft']
            .map((c) => parseFloat(st[`border${c}Radius`]) || 0);
          return hasBox && radius.every((r) => r === 0);
        });
      })(),
    };
  });
  const pdfBuf = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
    preferCSSPageSize: true,
  });
  fs.writeFileSync(outPdf, pdfBuf);
  const pages = countPdfPages(pdfBuf);
  const report = {
    ...fit,
    pdfBytes: pdfBuf.length,
    pdfPages: pages,
    a4CssPx: Math.round((297 * 96) / 25.4),
    ok: pages === 1 && fit.isA4 && !fit.sheetOverflow && fit.booksVisible && !fit.panesClipped && fit.squareFrames,
  };
  fs.writeFileSync(outFit, `${JSON.stringify(report, null, 2)}\n`);
  console.log('A4 fit', report);
  if (!report.ok) {
    console.error('FAIL: must be true 210×297mm A4, 1 PDF page, no clip, square frames');
    await browser.close();
    process.exit(2);
  }
  console.log(`wrote ${path.relative(root, outA4)}`);
  console.log(`wrote ${path.relative(root, outPdf)}`);
  await page.close();
}

{
  const page = await browser.newPage({ viewport: { width: 340, height: 720 } });
  await page.goto(base, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: out340, fullPage: true });
  const check = await page.evaluate(() => {
    const layout = document.querySelector('.layout');
    const hero = document.querySelector('.hero h1.en');
    const st = layout ? getComputedStyle(layout) : null;
    const cols = st ? st.gridTemplateColumns.split(/\s+/).filter(Boolean).length : 0;
    const heroLh = hero ? parseFloat(getComputedStyle(hero).lineHeight) : 0;
    const heroFs = hero ? parseFloat(getComputedStyle(hero).fontSize) : 0;
    const overflowX = document.documentElement.scrollWidth > window.innerWidth + 1;
    return { cols, heroFs, heroLh, overflowX, ratio: heroFs ? heroLh / heroFs : 0 };
  });
  console.log('340px screen', check);
  if (check.cols !== 1 || check.overflowX || check.ratio > 1.25) {
    console.error('FAIL: 340px must stack, no overflow, hero line-height ≤1.25em', check);
    await browser.close();
    process.exit(2);
  }
  console.log(`wrote ${path.relative(root, out340)}`);
  await page.close();
}

{
  const page = await browser.newPage({ viewport: { width: 900, height: 1400 } });
  const speakerUrl = `${base}${base.includes('?') ? '&' : '?'}speaker=1&lang=zh`;
  await page.goto(speakerUrl, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(500);
  const sheet = page.locator('.sheet');
  await sheet.screenshot({ path: outSpeaker });
  const qr = await page.evaluate(() => {
    const img = document.querySelector('.qr-box img');
    return img ? img.getBoundingClientRect().width : 0;
  });
  console.log('speaker zh QR width px', qr);
  if (qr < 120) {
    console.error('FAIL: speaker QR should be enlarged for projection, got', qr);
    await browser.close();
    process.exit(2);
  }
  console.log(`wrote ${path.relative(root, outSpeaker)}`);
  await page.close();
}

await browser.close();
console.log('poster capture ok');
