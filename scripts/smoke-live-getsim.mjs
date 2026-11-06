#!/usr/bin/env node
/**
 * After Pages deploy: HTTP 200 for key modules, then live getSim(id) must be non-null.
 *
 *   PAGES_BASE=https://otas0.github.io/immspfee-edu SHORT=abc1234 \
 *     node --experimental-network-imports scripts/smoke-live-getsim.mjs
 *
 * LIVE_GETSIM_IDS defaults to convex-lens,finite-well.
 */
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
  console.log('ok http', p, res.status);
}

const regUrl = `${base}/js/sims/registry.js?v=${short}`;
let getSim;
try {
  const mod = await import(regUrl);
  getSim = mod.getSim;
} catch (err) {
  console.error('FAIL network import', regUrl);
  console.error(err && err.stack ? err.stack : err);
  console.error('Run with: node --experimental-network-imports scripts/smoke-live-getsim.mjs');
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
console.log(`ok smoke-live-getsim ${ids.join(', ')}`);
