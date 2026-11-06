#!/usr/bin/env node
/**
 * After Pages deploy: HTTP 200 for key modules, then getSim(id) against a
 * mirrored module graph (strips stamped ?v= for local resolution).
 *
 *   PAGES_BASE=https://otas0.github.io/immspfee-edu SHORT=abc1234 \
 *     node scripts/smoke-live-getsim.mjs
 *
 * LIVE_GETSIM_IDS defaults to convex-lens,finite-well.
 */
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const base = String(process.env.PAGES_BASE || '').replace(/\/$/, '');
const short = String(process.env.SHORT || '').trim();
const ids = String(process.env.LIVE_GETSIM_IDS || 'convex-lens,finite-well')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

if (!base || !short) {
  console.error('FAIL smoke-live-getsim: set PAGES_BASE and SHORT');
  process.exit(1);
}

const httpPaths = [
  'js/sims/registry.js',
  'js/sims/kit.js',
  'js/sims/optics.js',
  'js/sims/uni.js',
  'js/fmt.js',
  'js/physics/optics.js',
  'js/physics/uni.js',
];

let failed = 0;
for (const p of httpPaths) {
  const url = `${base}/${p}?v=${short}`;
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) {
    failed += 1;
    console.error('FAIL http', url, '->', res.status);
    continue;
  }
  const text = await res.text();
  if (p.endsWith('uni.js') && p.includes('/sims/') && !/finiteWellSim|export const finiteWell/.test(text)
    && !text.includes('finiteWell')) {
    // soft: export name may vary; getSim check is authoritative
  }
  if (p.endsWith('optics.js') && p.includes('/sims/') && !text.includes('convexLens')) {
    failed += 1;
    console.error('FAIL optics.js missing convexLens export text');
  }
  if (p.endsWith('uni.js') && p.includes('/sims/') && !text.includes('finiteWell')) {
    failed += 1;
    console.error('FAIL uni.js missing finiteWell export text');
  }
  console.log('ok http', p, res.status);
}

const mirrorRoot = mkdtempSync(join(tmpdir(), 'immspfee-live-getsim-'));
async function mirror(rel) {
  const url = `${base}/${rel}?v=${short}`;
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`mirror ${url} -> ${res.status}`);
  let text = await res.text();
  // Local file imports cannot carry the stamped query; strip for the temp graph.
  text = text.replace(/\?v=[A-Za-z0-9_-]+/g, '');
  const dest = join(mirrorRoot, rel);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, text);
  return dest;
}

const mirrorList = [
  'js/sims/registry.js',
  'js/sims/kit.js',
  'js/sims/optics.js',
  'js/sims/uni.js',
  'js/fmt.js',
  'js/physics/optics.js',
  'js/physics/uni.js',
];
try {
  for (const rel of mirrorList) await mirror(rel);
} catch (err) {
  console.error('FAIL mirror', err && err.message ? err.message : err);
  process.exit(1);
}

const regUrl = pathToFileURL(join(mirrorRoot, 'js/sims/registry.js')).href;
let getSim;
try {
  const mod = await import(regUrl);
  getSim = mod.getSim;
} catch (err) {
  console.error('FAIL import mirrored registry', err && err.stack ? err.stack : err);
  process.exit(1);
}

for (const id of ids) {
  try {
    const sim = await getSim(id);
    if (!sim || !sim.id) {
      failed += 1;
      console.error('FAIL live getSim empty', id);
      continue;
    }
    console.log('ok live getSim', id, '->', sim.id);
  } catch (err) {
    failed += 1;
    console.error('FAIL live getSim', id, err && err.message ? err.message : err);
  }
}

if (failed) process.exit(1);
console.log(`ok smoke-live-getsim ${ids.join(', ')} (mirror ${mirrorRoot})`);
