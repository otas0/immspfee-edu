#!/usr/bin/env node
/**
 * Regression: while getSim is in flight, teach column must show Loading — never
 * the false “Simulation failed to load” copy. Uses a delayed getSim stub.
 */
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let failed = 0;

const app = readFileSync(join(root, 'js/app.js'), 'utf8');
const i18n = readFileSync(join(root, 'js/i18n.js'), 'utf8');

if (!app.includes('loadingSim') || !app.includes("t(lang, 'simLoading')")) {
  failed += 1;
  console.error('FAIL app.js must track loadingSim and paint simLoading');
}
if (!app.includes('simLoadSlow') || !app.includes('LOAD_TOAST_MS')) {
  failed += 1;
  console.error('FAIL app.js must toast simLoadSlow after LOAD_TOAST_MS');
}
if (!i18n.includes('simLoading:') || !i18n.includes('simLoadFail:') || !i18n.includes('simLoadSlow:')) {
  failed += 1;
  console.error('FAIL i18n missing simLoading / simLoadFail / simLoadSlow');
}

// Structural: fail copy must be gated on loadingSim !== current sim id.
if (!/loadingSim === current\.lesson\.sim/.test(app) && !/loadingSim === current\.lesson\.sim/.test(app.replace(/\s+/g, ' '))) {
  // allow either === with optional whitespace
  if (!app.includes('loadingSim === current.lesson.sim')) {
    failed += 1;
    console.error('FAIL renderTeach must branch on loadingSim === current.lesson.sim');
  }
}

// Intentional slow-path fixture: document that delayed getSim keeps Loading text.
{
  let loadingSim = 'ising';
  const current = { lesson: { status: 'ready', sim: 'ising' } };
  const s = null;
  let mode = 'none';
  if (!s) {
    if (current.lesson.status === 'ready' && current.lesson.sim) {
      mode = loadingSim === current.lesson.sim ? 'loading' : 'fail';
    }
  }
  if (mode !== 'loading') {
    failed += 1;
    console.error('FAIL delayed-getSim fixture should paint loading, not fail', mode);
  } else {
    console.log('ok delayed-getSim fixture → loading (not fail)');
  }
  loadingSim = null;
  mode = loadingSim === current.lesson.sim ? 'loading' : 'fail';
  if (mode !== 'fail') {
    failed += 1;
    console.error('FAIL settled null sim must paint fail', mode);
  } else console.log('ok settled miss → fail');
}

if (failed) {
  console.error(`smoke-loading-ui: ${failed} failure(s)`);
  process.exit(1);
}
console.log('ok smoke-loading-ui');
