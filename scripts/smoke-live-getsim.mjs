#!/usr/bin/env node
/**
 * After Pages deploy: HTTP 200 for registry + every PATHS group, then getSim(id)
 * against a mirrored module graph (strips stamped ?v= for local resolution).
 *
 * Mirrors all `js/sims/*` groups from registry PATHS and crawls their relative
 * imports (kit / fmt / physics / sibling sims) so ising/phase/rel/etc. resolve.
 *
 *   PAGES_BASE=https://otas0.github.io/immspfee-edu SHORT=abc1234 \
 *     node scripts/smoke-live-getsim.mjs
 *
 * LIVE_GETSIM_IDS defaults to one sim id per PATHS group (18 groups).
 */
import { mkdtempSync, mkdirSync, writeFileSync, appendFileSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, normalize } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const base = String(process.env.PAGES_BASE || '').replace(/\/$/, '');
const short = String(process.env.SHORT || '').trim();
/** One ready id per PATHS key in registry.js (optics…rel). */
const DEFAULT_LIVE_GETSIM_IDS = [
  'convex-lens', // optics
  'friction', // mech
  'density', // fluids
  'lever', // machines
  'circuit', // circuits
  'projectile', // motion
  'melting', // phase
  'oscillator', // advance
  'heat-engine', // thermal
  'ruler', // measure
  'sound-wave', // waves
  'induction', // em
  'collide', // collide
  'charges', // charge
  'time-dilation', // modern
  'finite-well', // uni
  'maxwell-speed', // stat (rotated: … → hydrogen-radial → barrier-tunnel → maxwell-speed)
  'length-contraction', // rel
].join(',');
const ids = String(process.env.LIVE_GETSIM_IDS || DEFAULT_LIVE_GETSIM_IDS)
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
    const mirrorList = Array.isArray(extra.mirrored)
      ? [...extra.mirrored].sort()
      : [];
    const body = [
      '# live getSim fail',
      '',
      `- PAGES_BASE: \`${base}\``,
      `- SHORT: \`${short}\``,
      `- LIVE_GETSIM_IDS: \`${ids.join(',')}\``,
      `- when: ${new Date().toISOString()}`,
      extra.mirrorRoot ? `- mirror: \`${extra.mirrorRoot}\`` : '',
      mirrorList.length ? `- mirrored files: **${mirrorList.length}**` : '',
      '',
      '## Mirror file list',
      '',
      ...(mirrorList.length
        ? mirrorList.map((rel) => `- \`${rel}\``)
        : ['-(none — fail before mirror crawl)']),
      '',
      '## Log',
      '',
      '```',
      ...logLines,
      '```',
      '',
    ].filter((line) => line !== '').join('\n');
    writeFileSync(failMd, body);
    writeFileSync(join(diagDir, 'log.txt'), logLines.join('\n') + '\n');
    writeFileSync(join(diagDir, 'mirror-files.txt'), mirrorList.join('\n') + (mirrorList.length ? '\n' : ''));
    writeFileSync(join(diagDir, 'meta.json'), JSON.stringify({
      base, short, ids, when: new Date().toISOString(), mirrored: mirrorList, ...extra,
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

/** Parse PATHS from local registry (source of truth for groups). */
const regSrc = readFileSync(join(root, 'js/sims/registry.js'), 'utf8');
const pathEntries = [...regSrc.matchAll(/(\w+)\s*:\s*'\.\/([\w.-]+\.js)'/g)];
const PATHS = Object.fromEntries(pathEntries.map((m) => [m[1], m[2]]));
if (!Object.keys(PATHS).length) {
  console.error('FAIL could not parse PATHS from registry.js');
  process.exit(1);
}

const seedRels = [
  'js/sims/registry.js',
  'js/sims/kit.js',
  'js/fmt.js',
  ...Object.values(PATHS).map((f) => `js/sims/${f}`),
];

/** Pages CDN can briefly 502/503 right after deploy-pages; retry before failing CI. */
const FETCH_TRIES = Math.max(1, Number(process.env.LIVE_GETSIM_FETCH_TRIES || 5));
const FETCH_DELAY_MS = Math.max(50, Number(process.env.LIVE_GETSIM_FETCH_DELAY_MS || 400));
const TRANSIENT = new Set([502, 503, 429]);

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchOk(url, { tries = FETCH_TRIES } = {}) {
  let last = null;
  for (let i = 1; i <= tries; i += 1) {
    const res = await fetch(url, { redirect: 'follow' });
    last = res;
    if (res.ok) return res;
    if (!TRANSIENT.has(res.status) || i === tries) return res;
    note(`retry http ${url} -> ${res.status} (${i}/${tries})`);
    await sleep(FETCH_DELAY_MS * i);
  }
  return last;
}

let failed = 0;
for (const p of seedRels) {
  const url = `${base}/${p}?v=${short}`;
  const res = await fetchOk(url);
  if (!res.ok) {
    failed += 1;
    failNote(`FAIL http ${url} -> ${res.status}`);
    continue;
  }
  note(`ok http ${p} ${res.status}`);
}

const mirrorRoot = mkdtempSync(join(tmpdir(), 'immspfee-live-getsim-'));
const mirrored = new Set();

function resolveImport(fromRel, spec) {
  if (!spec.startsWith('.')) return null;
  const clean = spec.replace(/\?.*$/, '');
  const baseDir = dirname(fromRel);
  const joined = normalize(join(baseDir, clean)).replace(/\\/g, '/');
  return joined.startsWith('js/') ? joined : `js/${joined}`;
}

function importSpecs(text) {
  const specs = [];
  for (const m of text.matchAll(/from\s+['"]([^'"]+)['"]/g)) specs.push(m[1]);
  for (const m of text.matchAll(/import\s*\(\s*['"]([^'"]+)['"]\s*\)/g)) specs.push(m[1]);
  return specs;
}

async function mirror(rel) {
  if (mirrored.has(rel)) return;
  mirrored.add(rel);
  const url = `${base}/${rel}?v=${short}`;
  const res = await fetchOk(url);
  if (!res.ok) throw new Error(`mirror ${url} -> ${res.status}`);
  let text = await res.text();
  text = text.replace(/\?v=[A-Za-z0-9_-]+/g, '');
  const dest = join(mirrorRoot, rel);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, text);
  for (const spec of importSpecs(text)) {
    const next = resolveImport(rel, spec);
    if (next && next.endsWith('.js')) await mirror(next);
  }
}

try {
  for (const rel of seedRels) await mirror(rel);
  note(`ok mirrored ${mirrored.size} modules (all PATHS + imports)`);
} catch (err) {
  failNote(`FAIL mirror ${err && err.message ? err.message : err}`);
  writeDiag({ mirrorRoot, mirrored: [...mirrored] });
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
  writeDiag({ mirrorRoot, failed, mirrored: [...mirrored] });
  process.exit(1);
}
note(`ok smoke-live-getsim ${ids.join(', ')} (mirror ${mirrorRoot}, ${mirrored.size} files)`);
