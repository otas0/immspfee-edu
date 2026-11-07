#!/usr/bin/env node
/**
 * Browser Network probe for university subject-volume prefetch.
 *
 * Default: uni-cm-1 → advance.js only (no optics/stat/phase).
 * Set PROBE_LESSON=uni-qm-1 (or pass arg) to expect uni.js + stat.js, still no optics.
 * Set PROBE_LESSON=uni-rel-1 for modern.js (relativity volume; no optics).
 *
 *   node scripts/probe-uni-prefetch.mjs
 *   PROBE_LESSON=uni-qm-1 node scripts/probe-uni-prefetch.mjs
 *   PREVIEW_BASE=http://127.0.0.1:4174 node scripts/probe-uni-prefetch.mjs
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
const lesson = process.env.PROBE_LESSON || process.argv[2] || 'uni-cm-1';

const PROFILES = {
  'uni-cm-1': {
    expectAny: ['advance.js'],
    forbid: ['optics.js', 'phase.js', 'stat.js', 'rel.js', 'thermal.js', 'waves.js'],
  },
  'uni-qm-1': {
    // wave-packet → stat; chapter also mounts infinite/finite-well → uni
    expectAny: ['stat.js'],
    allow: ['stat.js', 'uni.js', 'registry.js', 'kit.js'],
    forbid: ['optics.js', 'phase.js', 'rel.js', 'advance.js', 'thermal.js'],
  },
  'uni-rel-1': {
    // time-dilation → modern; chapter also length-contraction → rel, simultaneity → modern
    expectAny: ['modern.js'],
    forbid: ['optics.js', 'phase.js', 'stat.js', 'advance.js', 'thermal.js', 'uni.js'],
  },
};

const profile = PROFILES[lesson];
if (!profile) {
  console.error('FAIL unknown PROBE_LESSON', lesson, 'known', Object.keys(PROFILES));
  process.exit(1);
}

const { chromium } = await loadPlaywright();
const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();
const hits = [];
page.on('request', (req) => {
  const u = req.url();
  if (/\/js\/sims\/[^/?]+\.js/.test(u)) hits.push(u.replace(/\?.*$/, '').split('/').pop());
});
await page.goto(`${BASE}/?dev#/university/${lesson}/introduce`, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(2500);
const uniq = [...new Set(hits)].sort();
const stray = uniq.filter((n) => (profile.forbid || []).includes(n));
const missingExpect = (profile.expectAny || []).filter((n) => !uniq.includes(n));
const out = { lesson, simModules: uniq, missingExpect, stray };
console.log(JSON.stringify(out, null, 2));
await browser.close();
if (missingExpect.length || stray.length) {
  console.error('FAIL uni prefetch surface', out);
  process.exit(1);
}
console.log(`ok uni prefetch ${lesson}:`, uniq.join(', '));
