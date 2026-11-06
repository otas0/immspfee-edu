#!/usr/bin/env node
/**
 * Optional 1280×800 desktop three-column visual baseline (Pages artifact only).
 * PNGs stay under .local-shots/ (gitignored) — never commit large shots.
 *
 *   npm run capture:1280
 */
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, '.local-shots', '1280-desktop-three-column.png');
const url = process.env.CAPTURE_URL || 'http://127.0.0.1:4174/#/sh-junior/shj-4-4a/introduce';

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
const { chromium } = await loadPlaywright();
fs.mkdirSync(path.dirname(out), { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(1200);
const about = page.locator('.sources');
await about.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
await page.screenshot({ path: out, fullPage: false });
await browser.close();
console.log('wrote', out);
