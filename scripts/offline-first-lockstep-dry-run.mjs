#!/usr/bin/env node
/**
 * Dry-run for ADR 001 OFFLINE_FIRST flip: verify stamp REQUIRED ↔ sw.js PRECACHE
 * ↔ index.html modulepreload lockstep for ui-chrome / uni-fold — without writing files.
 *
 *   node scripts/offline-first-lockstep-dry-run.mjs
 *   OFFLINE_FIRST=1 node scripts/offline-first-lockstep-dry-run.mjs
 *
 * Default (unset/0): asserts chrome/fold stay OFF required + PRECACHE (today's main).
 * OFFLINE_FIRST=1: reports what a flip PR must add (exit 1 until those files are listed —
 * useful on a side branch that is wiring the flip).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OFFLINE = process.env.OFFLINE_FIRST === '1';
const SHELL = ['js/ui-chrome.js', 'js/uni-fold.js'];

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

const stampSrc = read('scripts/stamp-build.mjs');
const swSrc = read('sw.js');
const indexSrc = read('index.html');

const requiredMatch = stampSrc.match(/const REQUIRED = \[([\s\S]*?)\];/);
const requiredBlock = requiredMatch ? requiredMatch[1] : '';
const inRequired = (rel) => new RegExp(`['"]${rel.replace(/\./g, '\\.')}['"]`).test(requiredBlock);

const precacheMatch = swSrc.match(/const PRECACHE = \[([\s\S]*?)\];/);
const precacheBlock = precacheMatch ? precacheMatch[1] : '';
const inPrecache = (rel) => {
  const base = rel.replace(/^js\//, './js/').replace(/^(?!(\.\/))/, './');
  const candidates = [
    `./${rel}`,
    rel.startsWith('js/') ? `./${rel}` : `./js/${rel}`,
    base,
  ];
  return candidates.some((c) => precacheBlock.includes(`'${c}'`) || precacheBlock.includes(`"${c}"`));
};

const modulepreload = (rel) => {
  const re = new RegExp(`rel=["']modulepreload["'][^>]*href=["']\\./${rel.replace(/\./g, '\\.')}\\?v=`, 'i');
  return re.test(indexSrc) || indexSrc.includes(`href="./${rel}?v=`);
};

console.log('### OFFLINE_FIRST lockstep dry-run (no writes)');
console.log('');
console.log(`- OFFLINE_FIRST=${OFFLINE ? '1' : '0 (default)'}`);
console.log(`- shell: ${SHELL.join(', ')}`);
console.log('');

let failed = 0;
for (const rel of SHELL) {
  const req = inRequired(rel);
  const pre = inPrecache(rel);
  const mp = modulepreload(rel);
  console.log(`## ${rel}`);
  console.log(`- stamp REQUIRED: ${req ? 'yes' : 'no'}`);
  console.log(`- sw.js PRECACHE: ${pre ? 'yes' : 'no'}`);
  console.log(`- index.html modulepreload: ${mp ? 'yes' : 'no'}`);
  if (!OFFLINE) {
    // Today's main: must stay off REQUIRED and PRECACHE (bust via app.js only).
    if (req || pre) {
      failed += 1;
      console.error(`FAIL default path: ${rel} must stay off REQUIRED/PRECACHE (ADR 001)`);
    } else {
      console.log('ok default: off REQUIRED + PRECACHE');
    }
  } else {
    // Flip path: all three must be in lockstep.
    if (!req || !pre) {
      failed += 1;
      console.error(`FAIL OFFLINE_FIRST=1: ${rel} must be on stamp REQUIRED and sw.js PRECACHE`);
    } else if (req !== pre) {
      failed += 1;
      console.error(`FAIL OFFLINE_FIRST=1: ${rel} REQUIRED/PRECACHE out of lockstep`);
    } else {
      console.log('ok flip: REQUIRED + PRECACHE present');
    }
    // modulepreload optional for chrome/fold (loaded via app.js) but report it.
    if (!mp) {
      console.log('note: no dedicated modulepreload (ok if only imported from stamped app.js)');
    }
  }
  console.log('');
}

// Cross-check: every js/ path in PRECACHE that looks like an entry should appear in REQUIRED or be an asset/fmt-style dep.
const precacheJs = [...precacheBlock.matchAll(/['"]\.\/(js\/[^'"]+)['"]/g)].map((m) => m[1]);
for (const rel of precacheJs) {
  if (SHELL.includes(rel)) continue;
  if (!inRequired(rel) && rel !== 'js/fmt.js') {
    // fmt.js is PRECACHE + modulepreload but historically may sit outside REQUIRED — warn only.
    console.log(`note: PRECACHE has ${rel} — confirm stamp/modulepreload policy`);
  }
}

if (failed) {
  console.error(`offline-first-lockstep-dry-run: ${failed} failure(s)`);
  process.exit(1);
}
console.log(OFFLINE
  ? 'ok OFFLINE_FIRST=1 lockstep dry-run (shell on REQUIRED+PRECACHE)'
  : 'ok OFFLINE_FIRST=0 dry-run (shell stay off PRECACHE — main path)');
process.exit(0);
