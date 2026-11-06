#!/usr/bin/env node
/**
 * Browser Network probe: cold-open university uni-cm-1 and list sim group modules fetched.
 * Expect advance.js (oscillator) early; no optics.js / phase.js / ising path (stat.js) until idle volume rest (uni-cm has only advance sims).
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
async function loadPlaywright() {
  try { return await import('playwright'); } catch (_) {}
  const require = createRequire(import.meta.url);
  for (const candidate of ['/tmp/pw-shot/node_modules/playwright', path.join(root, 'node_modules/playwright')]) {
    try { return require(candidate); } catch (_) {}
  }
  throw new Error('Install playwright (e.g. in /tmp/pw-shot)');
}

const BASE = (process.env.PAGES_BASE || process.env.PREVIEW_BASE || 'http://127.0.0.1:4174').replace(/\/$/, '');
const { chromium } = await loadPlaywright();
const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();
const hits = [];
page.on('request', (req) => {
  const u = req.url();
  if (/\/js\/sims\/[^/?]+\.js/.test(u)) hits.push(u.replace(/\?.*$/, '').split('/').pop());
});
await page.goto(`${BASE}/?dev#/university/uni-cm-1/introduce`, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(2500); // allow chapter prefetch + idle schedule (2s in app)
const uniq = [...new Set(hits)];
const bad = uniq.filter((n) => /^(optics|phase|stat|rel|thermal|waves)\.js$/.test(n));
const good = uniq.filter((n) => /^(advance|registry|kit)\.js$/.test(n) || n === 'registry.js');
const out = { simModules: uniq.sort(), hasAdvance: uniq.includes('advance.js'), stray: bad };
console.log(JSON.stringify(out, null, 2));
await browser.close();
if (!out.hasAdvance || bad.length) {
  console.error('FAIL uni-cm prefetch surface', out);
  process.exit(1);
}
console.log('ok uni-cm prefetch: advance only among lesson groups (+ registry/kit)');
