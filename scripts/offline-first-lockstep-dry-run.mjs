#!/usr/bin/env node
/**
 * Dry-run for ADR 001 OFFLINE_FIRST flip: verify stamp REQUIRED ↔ sw.js PRECACHE
 * ↔ index.html modulepreload lockstep for ui-chrome / uni-fold — without writing main.
 *
 *   node scripts/offline-first-lockstep-dry-run.mjs
 *   OFFLINE_FIRST=1 node scripts/offline-first-lockstep-dry-run.mjs
 *   OFFLINE_FIRST_FIXTURE=1 …          → minimal temp tree (green)
 *   OFFLINE_FIRST_REALTREE=1 …         → copy real stamp/sw/index, inject chrome/fold (green; main untouched)
 *
 * Default (unset/0): asserts chrome/fold stay OFF required + PRECACHE (today's main).
 * OFFLINE_FIRST=1 against real main tree: exit 1 until a flip side branch lists those files.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FIXTURE = process.env.OFFLINE_FIRST_FIXTURE === '1';
const REALTREE = process.env.OFFLINE_FIRST_REALTREE === '1';
const OFFLINE = FIXTURE || REALTREE || process.env.OFFLINE_FIRST === '1';
/** Sidebranch / flip PR: require index.html modulepreload for shell modules. */
const REQUIRE_MP = process.env.OFFLINE_FIRST_REQUIRE_MP === '1';
const SHELL = ['js/ui-chrome.js', 'js/uni-fold.js'];

function buildFixtureTree() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'immspfee-offline-first-'));
  const stamp = `const REQUIRED = [
  'index.html',
  'js/app.js',
  'js/ui-chrome.js',
  'js/uni-fold.js',
  'sw.js',
];
`;
  const sw = `const PRECACHE = [
  './index.html',
  './js/app.js',
  './js/ui-chrome.js',
  './js/uni-fold.js',
];
`;
  const index = `<link rel="modulepreload" href="./js/app.js?v=__BUILD__">
`;
  fs.mkdirSync(path.join(dir, 'scripts'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'scripts/stamp-build.mjs'), stamp);
  fs.writeFileSync(path.join(dir, 'sw.js'), sw);
  fs.writeFileSync(path.join(dir, 'index.html'), index);
  return dir;
}

/** Side-branch simulation: patch a copy of the real stamp/sw/index (never writes main). */
function buildRealTreeFlip() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'immspfee-offline-realtree-'));
  fs.mkdirSync(path.join(dir, 'scripts'), { recursive: true });
  let stamp = fs.readFileSync(path.join(root, 'scripts/stamp-build.mjs'), 'utf8');
  let sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  let index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  // Inject shell into REQUIRED array (before closing ]).
  if (!/js\/ui-chrome\.js/.test(stamp)) {
    stamp = stamp.replace(
      /const REQUIRED = \[/,
      "const REQUIRED = [\n  'js/ui-chrome.js',\n  'js/uni-fold.js',",
    );
  }
  if (!/ui-chrome\.js/.test(sw)) {
    sw = sw.replace(
      /const PRECACHE = \[/,
      "const PRECACHE = [\n  './js/ui-chrome.js',\n  './js/uni-fold.js',",
    );
  }
  // Optional lockstep with ADR flip template (OFFLINE_FIRST_REQUIRE_MP=1).
  if (REQUIRE_MP) {
    for (const rel of SHELL) {
      const needle = `href="./${rel}?v=__BUILD__"`;
      if (!index.includes(needle)) {
        index = index.replace(
          '<link rel="modulepreload" href="./js/app.js?v=__BUILD__">',
          `<link rel="modulepreload" href="./js/app.js?v=__BUILD__">\n  <link rel="modulepreload" href="./${rel}?v=__BUILD__">`,
        );
      }
    }
  }
  fs.writeFileSync(path.join(dir, 'scripts/stamp-build.mjs'), stamp);
  fs.writeFileSync(path.join(dir, 'sw.js'), sw);
  fs.writeFileSync(path.join(dir, 'index.html'), index);
  return dir;
}

let treeRoot = root;
let tempKind = '';
if (FIXTURE) {
  treeRoot = buildFixtureTree();
  tempKind = 'fixture';
} else if (REALTREE) {
  treeRoot = buildRealTreeFlip();
  tempKind = 'realtree';
}

function read(rel) {
  return fs.readFileSync(path.join(treeRoot, rel), 'utf8');
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
  const candidates = [
    `./${rel}`,
    rel.startsWith('js/') ? `./${rel}` : `./js/${rel}`,
  ];
  return candidates.some((c) => precacheBlock.includes(`'${c}'`) || precacheBlock.includes(`"${c}"`));
};

const modulepreload = (rel) => {
  const re = new RegExp(`rel=["']modulepreload["'][^>]*href=["']\\./${rel.replace(/\./g, '\\.')}\\?v=`, 'i');
  return re.test(indexSrc) || indexSrc.includes(`href="./${rel}?v=`);
};

console.log('### OFFLINE_FIRST lockstep dry-run (no writes to main)');
console.log('');
console.log(`- OFFLINE_FIRST=${OFFLINE ? '1' : '0 (default)'}${tempKind ? ` (${tempKind} temp tree)` : ''}`);
console.log(`- shell: ${SHELL.join(', ')}`);
if (tempKind) console.log(`- temp: ${treeRoot}`);
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
    if (req || pre) {
      failed += 1;
      console.error(`FAIL default path: ${rel} must stay off REQUIRED/PRECACHE (ADR 001)`);
    } else {
      console.log('ok default: off REQUIRED + PRECACHE');
    }
  } else if (!req || !pre) {
    failed += 1;
    console.error(`FAIL OFFLINE_FIRST=1: ${rel} must be on stamp REQUIRED and sw.js PRECACHE`);
  } else if (req !== pre) {
    failed += 1;
    console.error(`FAIL OFFLINE_FIRST=1: ${rel} REQUIRED/PRECACHE out of lockstep`);
  } else {
    console.log('ok flip: REQUIRED + PRECACHE present');
    if (REQUIRE_MP && !mp) {
      failed += 1;
      console.error(`FAIL OFFLINE_FIRST_REQUIRE_MP=1: ${rel} must have index.html modulepreload (ADR flip lockstep)`);
    } else if (!mp) {
      console.log('note: no dedicated modulepreload (ok if only imported from stamped app.js)');
    } else {
      console.log('ok flip: modulepreload present');
    }
  }
  console.log('');
}

if (tempKind) {
  try {
    fs.rmSync(treeRoot, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
}

if (failed) {
  console.error(`offline-first-lockstep-dry-run: ${failed} failure(s)`);
  process.exit(1);
}
if (FIXTURE) {
  console.log('ok OFFLINE_FIRST_FIXTURE=1 lockstep green (temp tree; main untouched)');
} else if (REALTREE) {
  console.log('ok OFFLINE_FIRST_REALTREE=1 lockstep green (patched real-file copy; main untouched)');
} else {
  console.log(OFFLINE
    ? 'ok OFFLINE_FIRST=1 lockstep dry-run (shell on REQUIRED+PRECACHE)'
    : 'ok OFFLINE_FIRST=0 dry-run (shell stay off PRECACHE — main path)');
}
process.exit(0);
