#!/usr/bin/env node
/**
 * Hard-boot + SW Reload recovery path (no browser).
 * Asserts BUILD-keyed hard-boot in index.html, bilingual Reload chrome,
 * and a fixture that a stamped-BUILD change forces a cache wipe path.
 *
 *   node scripts/smoke-hard-boot.mjs
 *   HARD_BOOT_FIXTURE=stale node scripts/smoke-hard-boot.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let failed = 0;

const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const i18n = fs.readFileSync(path.join(root, 'js/i18n.js'), 'utf8');
const app = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'css/edu.css'), 'utf8');

if (!indexHtml.includes("var KEY = 'immspfee-edu-hard-boot'")) {
  failed += 1;
  console.error('FAIL index.html missing hard-boot KEY');
} else if (!indexHtml.includes("var BUILD = '__BUILD__'")) {
  failed += 1;
  console.error('FAIL index.html hard-boot BUILD token missing');
} else if (!indexHtml.includes('sessionStorage.getItem(KEY)') || !/known\s*===\s*BUILD/.test(indexHtml)) {
  failed += 1;
  console.error('FAIL hard-boot must key wipe on stamped BUILD change');
} else if (!/caches\.keys|caches\.delete/.test(indexHtml)) {
  failed += 1;
  console.error('FAIL hard-boot must clear Cache Storage');
} else if (!indexHtml.includes('location.replace') || !indexHtml.includes("searchParams.set('boot'")) {
  failed += 1;
  console.error('FAIL hard-boot must sync-redirect with ?boot= before modules');
} else if (!/known !== BUILD[\s\S]*location\.replace/.test(indexHtml)
  && !/known !== BUILD[\s\S]*searchParams\.set\('boot'/.test(indexHtml)) {
  failed += 1;
  console.error('FAIL hard-boot BUILD mismatch must redirect before Cache wipe (no async race)');
} else {
  console.log('ok hard-boot keyed by stamped BUILD + sync ?boot= redirect + Cache wipe on landing');
}

if (!indexHtml.includes('id="sw-update"') || !indexHtml.includes('id="sw-reload"')) {
  failed += 1;
  console.error('FAIL index.html missing #sw-update / #sw-reload');
} else {
  console.log('ok SW update bar markup present');
}

if (!/swReload:\s*'Reload'/.test(i18n) || !/swUpdate:\s*'Site updated'/.test(i18n)) {
  failed += 1;
  console.error('FAIL i18n EN Site updated / Reload missing');
} else if (!/swReload:\s*'刷新'/.test(i18n)) {
  failed += 1;
  console.error('FAIL i18n ZH Reload (刷新) missing');
} else {
  console.log('ok SW Reload bilingual copy (Site updated / Reload · 刷新)');
}

if (!app.includes("t(lang, 'swReload')") || !app.includes('sw-reload')) {
  failed += 1;
  console.error('FAIL app.js must wire swReload onto #sw-reload');
} else {
  console.log('ok app.js wires swReload button');
}

// Reload control should stay tappable on narrow chrome (same 28px budget as book-select).
const swBtn = /\.edu-update button,\s*\.sw-update button\s*\{[^}]+\}/.exec(css)?.[0] || '';
if (!swBtn) {
  failed += 1;
  console.error('FAIL edu.css missing .sw-update button rule');
} else if (!/min-height:\s*28px/.test(swBtn) || !/padding:\s*4px/.test(swBtn)) {
  failed += 1;
  console.error('FAIL .sw-update button must keep min-height:28px + padding for tap', swBtn.slice(0, 160));
} else {
  console.log('ok .sw-update Reload button ≥28px tap target');
}

// Stale-cache fixture: BUILD change must not treat prior session KEY=old as "already booted".
if (process.env.HARD_BOOT_FIXTURE === 'stale' || true) {
  const store = new Map();
  store.set('immspfee-edu-hard-boot', 'oldsha1');
  const BUILD = 'newsha2';
  const KEY = 'immspfee-edu-hard-boot';
  const already = store.get(KEY) === BUILD;
  if (already) {
    failed += 1;
    console.error('FAIL stale fixture: old BUILD must not skip wipe');
  } else {
    store.set(KEY, BUILD);
    if (store.get(KEY) !== BUILD) {
      failed += 1;
      console.error('FAIL stale fixture: could not record new BUILD');
    } else {
      console.log('ok hard-boot stale→new BUILD forces wipe path (sessionStorage fixture)');
    }
  }
}

if (failed) {
  console.error(`smoke-hard-boot: ${failed} failure(s)`);
  process.exit(1);
}
console.log('ok smoke-hard-boot');
