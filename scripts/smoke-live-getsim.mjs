#!/usr/bin/env node
/**
 * After Pages deploy: HTTP 200 for key modules, then getSim(id) against a
 * mirrored module graph (strips stamped ?v= for local resolution).
 *
 *   PAGES_BASE=https://otas0.github.io/immspfee-edu SHORT=abc1234 \
 *     node scripts/smoke-live-getsim.mjs
 *
 * LIVE_GETSIM_IDS defaults to convex-lens,finite-well,barrier-tunnel,ising.
 * On failure writes .local-shots/live-getsim-fail.md (+ optional diag dir) for
 * the Pages artifact upload step.
 */
import { mkdtempSync, mkdirSync, writeFileSync, appendFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const base = String(process.env.PAGES_BASE || '').replace(/\/$/, '');
const short = String(process.env.SHORT || '').trim();
const ids = String(process.env.LIVE_GETSIM_IDS || 'convex-lens,finite-well,barrier-tunnel,ising')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const diagDir = process.env.LIVE_GETSIM_DIAG_DIR
  || join(root, '.local-shots', 'live-getsim-diag');
const failMd = process.env.LIVE_GETSIM_FAIL_MD
  || join(root, '.local-shots', 'live-getsim-fail.md');

if (!base || !short) {
  console.error('FAIL smoke-live-getsim: set PAGES_BASE and SHORT');
  process.exit(1);
}

const logLines = [];
function note(line) {
  logLines.push(line);
  console.log(line);
}
function failNote(line) {
  logLines.push(line);
  console.error(line);
}

function writeDiag(extra = {}) {
  try {
    mkdirSync(diagDir, { recursive: true });
    mkdirSync(dirname(failMd), { recursive: true });
    const body = [
      '# live getSim fail',
      '',
      `- PAGES_BASE: \`${base}\``,
      `- SHORT: \`${short}\``,
      `- LIVE_GETSIM_IDS: \`${ids.join(',')}\``,
      `- when: ${new Date().toISOString()}`,
      '',
      '## Log',
      '',
      '```',
      ...logLines,
      '```',
      '',
      extra.mirrorRoot ? `- mirror: \`${extra.mirrorRoot}\`` : '',
      '',
    ].filter(Boolean).join('\n');
    writeFileSync(failMd, body);
    writeFileSync(join(diagDir, 'log.txt'), logLines.join('\n') + '\n');
    writeFileSync(join(diagDir, 'meta.json'), JSON.stringify({
      base, short, ids, when: new Date().toISOString(), ...extra,
    }, null, 2));
    const summary = process.env.GITHUB_STEP_SUMMARY;
    if (summary) {
      try {
        appendFileSync(summary, `\n### ❌ live getSim failed\n\nSee artifact \`live-getsim-fail-${short}\`.\n\n`);
        appendFileSync(summary, body + '\n');
      } catch { /* ignore */ }
    }
  } catch (err) {
    console.error('warn: could not write live-getsim diag', err && err.message ? err.message : err);
  }
}

const httpPaths = [
  'js/sims/registry.js',
  'js/sims/kit.js',
  'js/sims/optics.js',
  'js/sims/uni.js',
  'js/sims/stat.js',
  'js/fmt.js',
  'js/physics/optics.js',
  'js/physics/uni.js',
  'js/physics/stat.js',
];

let failed = 0;
for (const p of httpPaths) {
  const url = `${base}/${p}?v=${short}`;
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) {
    failed += 1;
    failNote(`FAIL http ${url} -> ${res.status}`);
    continue;
  }
  const text = await res.text();
  if (p.endsWith('optics.js') && p.includes('/sims/') && !text.includes('convexLens')) {
    failed += 1;
    failNote('FAIL optics.js missing convexLens export text');
  }
  if (p.endsWith('uni.js') && p.includes('/sims/') && !text.includes('finiteWell')) {
    failed += 1;
    failNote('FAIL uni.js missing finiteWell export text');
  }
  if (p.endsWith('stat.js') && p.includes('/sims/')) {
    if (!text.includes('tunnelSim') && !text.includes('barrier-tunnel')) {
      failed += 1;
      failNote('FAIL stat.js missing barrier-tunnel / tunnelSim export text');
    }
    if (!text.includes('isingSim') && !text.includes("id: 'ising'")) {
      failed += 1;
      failNote('FAIL stat.js missing ising export text');
    }
  }
  note(`ok http ${p} ${res.status}`);
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
  'js/sims/stat.js',
  'js/fmt.js',
  'js/physics/optics.js',
  'js/physics/uni.js',
  'js/physics/stat.js',
];
try {
  for (const rel of mirrorList) await mirror(rel);
} catch (err) {
  failNote(`FAIL mirror ${err && err.message ? err.message : err}`);
  writeDiag({ mirrorRoot });
  try { rmSync(mirrorRoot, { recursive: true, force: true }); } catch { /* ignore */ }
  process.exit(1);
}

const regUrl = pathToFileURL(join(mirrorRoot, 'js/sims/registry.js')).href;
let getSim;
try {
  const mod = await import(regUrl);
  getSim = mod.getSim;
} catch (err) {
  failNote(`FAIL import mirrored registry ${err && err.stack ? err.stack : err}`);
  writeDiag({ mirrorRoot });
  process.exit(1);
}

for (const id of ids) {
  try {
    const sim = await getSim(id);
    if (!sim || !sim.id) {
      failed += 1;
      failNote(`FAIL live getSim empty ${id}`);
      continue;
    }
    note(`ok live getSim ${id} -> ${sim.id}`);
  } catch (err) {
    failed += 1;
    failNote(`FAIL live getSim ${id} ${err && err.message ? err.message : err}`);
  }
}

if (failed) {
  writeDiag({ mirrorRoot, failed });
  process.exit(1);
}
note(`ok smoke-live-getsim ${ids.join(', ')} (mirror ${mirrorRoot})`);
