#!/usr/bin/env node
/**
 * Hang optics.js via page.route; assert Loading then simLoadSlow toast + Reload
 * after LOAD_TOAST_MS (8s). Requires Playwright + Chromium.
 *
 *   PREVIEW_BASE=http://127.0.0.1:4174 node scripts/smoke-slow-load-toast.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASE = (process.env.PREVIEW_BASE || 'http://127.0.0.1:4174').replace(/\/$/, '');
const LOAD_MS = Number(process.env.LOAD_TOAST_MS || 8000);

async function probe() {
  try {
    const res = await fetch(`${BASE}/`, { method: 'HEAD', signal: AbortSignal.timeout(2500) });
    return res.status > 0 && res.status < 500;
  } catch {
    return false;
  }
}

if (!(await probe())) {
  const r = spawnSync('bash', ['scripts/ensure-dev-server.sh', '--no-exec'], {
    cwd: root,
    stdio: 'inherit',
  });
  if (r.status !== 0) process.exit(r.status || 1);
}

async function loadPlaywright() {
  const require = createRequire(import.meta.url);
  for (const candidate of ['/tmp/pw-shot/node_modules/playwright', path.join(root, 'node_modules/playwright')]) {
    try { return require(candidate); } catch { /* next */ }
  }
  return import('playwright');
}

const { chromium } = await loadPlaywright();
const launchOpts = {};
const fallback = path.join(
  process.env.HOME || '',
  'Library/Caches/ms-playwright/chromium-1140/chrome-mac/Chromium.app/Contents/MacOS/Chromium',
);
if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) {
  launchOpts.executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
} else if (fs.existsSync(fallback)) {
  launchOpts.executablePath = fallback;
}

const browser = await chromium.launch(launchOpts);
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage();

await page.route(/\/js\/sims\/optics\.js/, async () => {
  await new Promise(() => {});
});

await page.goto(`${BASE}/?dev#/pep-junior/pep-5-3a/introduce`, {
  waitUntil: 'domcontentloaded',
  timeout: 60000,
});

await page.waitForFunction(() => {
  const teach = document.querySelector('.teach');
  return teach && /正在加载|Loading simulation/i.test(teach.innerText || '');
}, null, { timeout: 15000 });
console.log('ok Loading visible while optics.js hung');

await page.waitForFunction(() => {
  const host = document.getElementById('toast');
  if (!host || host.hidden) return false;
  const text = host.innerText || '';
  return /仍在加载|Still loading/i.test(text) && !!host.querySelector('button');
}, null, { timeout: LOAD_MS + 5000 });

const toast = await page.evaluate(() => {
  const host = document.getElementById('toast');
  const btn = host?.querySelector('button');
  return {
    text: (host?.innerText || '').trim().slice(0, 120),
    reload: (btn?.textContent || '').trim(),
    hidden: !!host?.hidden,
  };
});
console.log('ok slow toast', toast);

if (!/仍在加载|Still loading/i.test(toast.text) || !/刷新|Reload/i.test(toast.reload)) {
  console.error('FAIL toast missing slow copy or Reload', toast);
  await browser.close();
  process.exit(1);
}

await browser.close();
console.log('ok smoke-slow-load-toast');
