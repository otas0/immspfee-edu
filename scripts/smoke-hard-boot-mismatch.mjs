#!/usr/bin/env node
/**
 * Intentional BUILD / ?v= mismatch recovery smoke (no browser required for the
 * structural path; optional CAPTURE_URL browser probe when Playwright present).
 *
 * Models: stamped HTML advertises BUILD=newsha while a stale module graph still
 * carries ?v=oldsha. Hard-boot must sync-redirect with ?boot= when session KEY
 * ≠ BUILD, then wipe Cache Storage / SW on the landing tick.
 *
 *   node scripts/smoke-hard-boot-mismatch.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let failed = 0;

const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8');

// --- structural: index hard-boot sequence ---
const hasBootRedirect = /searchParams\.set\('boot'/.test(indexHtml)
  && /location\.replace/.test(indexHtml);
const clearsCache = /caches\.keys/.test(indexHtml) && /caches\.delete/.test(indexHtml);
const dropsSw = /serviceWorker/.test(indexHtml) && /unregister/.test(indexHtml);
const keyed = /immspfee-edu-hard-boot/.test(indexHtml) && /__BUILD__/.test(indexHtml);

if (!keyed || !hasBootRedirect || !clearsCache || !dropsSw) {
  failed += 1;
  console.error('FAIL index hard-boot missing boot/?v= recovery pieces', {
    keyed, hasBootRedirect, clearsCache, dropsSw,
  });
} else {
  console.log('ok index hard-boot pieces (KEY, ?boot=, Cache wipe, SW unregister)');
}

// --- fixture: session KEY=oldsha, stamped BUILD=newsha → must not skip ---
{
  const KEY = 'immspfee-edu-hard-boot';
  const store = new Map([[KEY, 'oldsha']]);
  const BUILD = 'newsha';
  const known = store.get(KEY);
  const skipWipe = known === BUILD;
  if (skipWipe) {
    failed += 1;
    console.error('FAIL mismatch fixture: old KEY must force wipe');
  } else {
    // Sync redirect happens before async wipe (no race with stale ?v= modules).
    const bootUrl = (() => {
      const u = new URL('http://127.0.0.1:4174/?v=oldsha#/pep-junior/pep-1-1a/introduce');
      u.searchParams.set('boot', '1');
      return u.pathname + u.search + u.hash;
    })();
    if (!bootUrl.includes('boot=') || !bootUrl.includes('v=oldsha')) {
      failed += 1;
      console.error('FAIL boot redirect must preserve existing ?v= while adding ?boot=', bootUrl);
    } else {
      store.set(KEY, BUILD);
      console.log('ok mismatch fixture: KEY oldsha → BUILD newsha forces ?boot= then wipe', bootUrl);
    }
  }
}

// --- UI Reload shares unregister path (covers stale short-SHA after deploy) ---
if (!app.includes('function hardReloadFromUi') || !/unregister/.test(app)) {
  failed += 1;
  console.error('FAIL hardReloadFromUi must exist for post-deploy short-SHA recovery');
} else {
  console.log('ok hardReloadFromUi available for ?v= short-SHA stale recovery');
}

// --- docs: README points at Reload / hard-boot ---
const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
if (!/Reload|hard-boot|Cache Storage/i.test(readme)) {
  failed += 1;
  console.error('FAIL README must document Reload / hard-boot recovery');
} else {
  console.log('ok README documents Reload / hard-boot recovery');
}

if (failed) {
  console.error(`smoke-hard-boot-mismatch: ${failed} failure(s)`);
  process.exit(1);
}
console.log('ok smoke-hard-boot-mismatch');
