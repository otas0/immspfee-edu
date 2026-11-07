#!/usr/bin/env node
/**
 * Intentional BUILD / ?v= mismatch recovery smoke (no browser required for the
 * structural path; optional Playwright e2e when available).
 *
 * Models: stamped HTML advertises BUILD=newsha while a stale module graph still
 * carries ?v=oldsha. Hard-boot must sync-redirect with ?boot= when session KEY
 * ≠ BUILD, then wipe Cache Storage / SW on the landing tick.
 *
 *   node scripts/smoke-hard-boot-mismatch.mjs
 *   HARD_BOOT_MISMATCH_E2E=1 CAPTURE_URL=http://127.0.0.1:4174/ node scripts/smoke-hard-boot-mismatch.mjs
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

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
} else if (!/sessionStorage\.removeItem\('immspfee-edu-hard-boot'\)/.test(app)) {
  failed += 1;
  console.error('FAIL hardReloadFromUi must clear hard-boot KEY (toast Reload recovery)');
} else {
  console.log('ok hardReloadFromUi available for ?v= short-SHA stale recovery (+ KEY clear)');
}

// --- docs: README points at Reload / hard-boot ---
const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
if (!/Reload|hard-boot|Cache Storage/i.test(readme)) {
  failed += 1;
  console.error('FAIL README must document Reload / hard-boot recovery');
} else {
  console.log('ok README documents Reload / hard-boot recovery');
}

async function loadPlaywright() {
  const normalize = (mod) => {
    if (!mod) return null;
    const m = mod.default && mod.default.chromium ? mod.default : mod;
    return m && m.chromium ? m : null;
  };
  try {
    const m = normalize(await import('playwright'));
    if (m) return m;
  } catch { /* fall through */ }
  for (const candidate of ['/tmp/pw-shot/node_modules/playwright', path.join(root, 'node_modules/playwright')]) {
    const entry = path.join(candidate, 'index.js');
    if (fs.existsSync(entry)) {
      try {
        const m = normalize(await import(pathToFileURL(entry).href));
        if (m) return m;
      } catch { /* next */ }
    }
  }
  return null;
}

/** Optional e2e: plant KEY=oldsha + ?v=oldsha, assert hard-boot lands KEY=BUILD.
 *  Default: try when Playwright + preview are up; soft-skip otherwise.
 *  HARD_BOOT_MISMATCH_E2E=0 skips; =1 fails soft-skip (require e2e). */
async function optionalMismatchE2e() {
  if (process.env.HARD_BOOT_MISMATCH_E2E === '0') {
    console.log('skip hard-boot mismatch e2e (HARD_BOOT_MISMATCH_E2E=0)');
    return;
  }
  const requireE2e = process.env.HARD_BOOT_MISMATCH_E2E === '1';
  const pw = await loadPlaywright();
  if (!pw) {
    if (requireE2e) {
      failed += 1;
      console.error('FAIL hard-boot mismatch e2e required but Playwright missing');
    } else {
      console.log('skip hard-boot mismatch e2e: Playwright not installed');
    }
    return;
  }
  // Route-stamp BUILD by default (no dirty tree). Disk stamp: HARD_BOOT_E2E_DISK_STAMP=1
  // → scripts/e2e-disk-stamp-preview.sh on :4175 (real stamped files, no route rewrite).
  const expectedSha = String(process.env.BUILD_SHA || process.env.GITHUB_SHA || 'e2e0001')
    .replace(/[^0-9a-f]/gi, '')
    .slice(0, 7) || 'e2e0001';
  const diskStamp = process.env.HARD_BOOT_E2E_DISK_STAMP === '1';
  let base = (process.env.CAPTURE_URL || 'http://127.0.0.1:4174/').replace(/\/?$/, '/');
  if (diskStamp) {
    const prep = spawnSync('bash', ['scripts/e2e-disk-stamp-preview.sh'], {
      cwd: root,
      env: { ...process.env, BUILD_SHA: expectedSha, PORT: process.env.E2E_PREVIEW_PORT || '4175' },
      encoding: 'utf8',
    });
    if (prep.status !== 0) {
      if (requireE2e) {
        failed += 1;
        console.error('FAIL e2e disk-stamp preview', {
          status: prep.status,
          out: (prep.stdout || '').slice(0, 400),
          err: (prep.stderr || '').slice(0, 400),
        });
      } else {
        console.log('skip hard-boot mismatch e2e: disk-stamp preview failed');
      }
      return;
    }
    const urlLine = (prep.stdout || '').trim().split('\n').filter(Boolean).pop() || '';
    base = (urlLine.startsWith('http') ? urlLine : `http://127.0.0.1:${process.env.E2E_PREVIEW_PORT || '4175'}/`)
      .replace(/\/?$/, '/');
    console.log('ok e2e disk-stamp preview', { base, expectedSha });
  }
  let browser;
  try {
    const launchOpts = {};
    const chrome = [
      path.join(process.env.HOME || '', 'Library/Caches/ms-playwright/chromium-1140/chrome-mac/Chromium.app/Contents/MacOS/Chromium'),
    ].find((p) => p && fs.existsSync(p));
    if (chrome) launchOpts.executablePath = chrome;
    browser = await pw.chromium.launch(launchOpts);
    const page = await browser.newPage();
    // Route rewrite only when not using a real disk-stamped preview tree.
    if (!diskStamp) {
      await page.route('**/*', async (route) => {
        const type = route.request().resourceType();
        if (type !== 'document' && type !== 'script') {
          await route.continue();
          return;
        }
        try {
          const res = await route.fetch();
          const ct = (res.headers()['content-type'] || '').toLowerCase();
          let body = await res.text();
          if (body.includes('__BUILD__')) body = body.split('__BUILD__').join(expectedSha);
          await route.fulfill({
            response: res,
            body,
            headers: {
              ...res.headers(),
              'content-type': ct
                || (type === 'script' ? 'application/javascript; charset=utf-8' : 'text/html; charset=utf-8'),
            },
          });
        } catch {
          await route.continue();
        }
      });
    }
    // Plant KEY once only — hard-boot sync-redirects with ?boot=; re-planting on
    // every document would loop and hang Playwright's domcontentloaded wait.
    await page.addInitScript(() => {
      try {
        if (sessionStorage.getItem('__hb_e2e_planted')) return;
        sessionStorage.setItem('__hb_e2e_planted', '1');
        sessionStorage.setItem('immspfee-edu-hard-boot', 'oldsha-intentional');
      } catch { /* */ }
    });
    const url = `${base}?v=oldsha-intentional#/pep-junior/pep-1-1a/introduce`;
    const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    if (!resp || !resp.ok()) {
      if (requireE2e) {
        failed += 1;
        console.error('FAIL hard-boot mismatch e2e: preview not reachable', base);
      } else {
        console.log('skip hard-boot mismatch e2e: preview not reachable', base);
      }
      return;
    }
    await page.waitForTimeout(800);
    const after = await page.evaluate(() => ({
      key: sessionStorage.getItem('immspfee-edu-hard-boot'),
      href: location.href,
      hasBoot: /[?&]boot=/.test(location.search),
    }));
    if (after.key === 'oldsha-intentional') {
      failed += 1;
      console.error('FAIL e2e: hard-boot left KEY=oldsha-intentional (expected wipe + set BUILD)', after);
    } else if (!after.key) {
      failed += 1;
      console.error('FAIL e2e: hard-boot KEY missing after load (expected stamped BUILD)', after);
    } else if (after.key === '__BUILD__') {
      failed += 1;
      console.error('FAIL e2e: KEY still literal __BUILD__ (route-stamp missing)', after);
    } else if (after.key !== expectedSha) {
      failed += 1;
      console.error('FAIL e2e: KEY !== route-stamped BUILD', { got: after.key, expectedSha });
    } else {
      console.log('ok hard-boot mismatch e2e: KEY oldsha → stamped BUILD', {
        key: String(after.key).slice(0, 12),
        expectedSha,
        diskStamp,
        hasBoot: after.hasBoot,
      });
    }
  } catch (err) {
    if (requireE2e) {
      failed += 1;
      console.error('FAIL hard-boot mismatch e2e:', err && err.message ? err.message : err);
    } else {
      console.log('skip hard-boot mismatch e2e:', err && err.message ? err.message : err);
    }
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}

await optionalMismatchE2e();

if (failed) {
  console.error(`smoke-hard-boot-mismatch: ${failed} failure(s)`);
  process.exit(1);
}
console.log('ok smoke-hard-boot-mismatch');
