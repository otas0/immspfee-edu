#!/usr/bin/env node
/**
 * Education promo poster must stay on edu chrome — ban lab/buusdo instrument fonts.
 * Also keep poster-books.json synced with curricula.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const poster = path.join(root, 'docs/promo/poster.html');
const copy = path.join(root, 'docs/promo/poster-copy.js');
let failed = 0;

const html = fs.readFileSync(poster, 'utf8');
const banned = ['Space Grotesk', 'IBM Plex', 'IBM+Plex', 'Space+Grotesk'];
for (const needle of banned) {
  if (html.includes(needle)) {
    failed += 1;
    console.error(`FAIL poster.html: ban lab chassis font ${JSON.stringify(needle)}`);
  }
}
if (!html.includes('--paper: #f3efe6') && !html.includes('--paper:#f3efe6')) {
  failed += 1;
  console.error('FAIL poster.html: keep Education cream --paper #f3efe6 for sheet background');
}
if (!/\.top\s*\{[^}]*background:\s*#fff/.test(html)) {
  failed += 1;
  console.error('FAIL poster.html: .top (logo bar) must stay white');
}
if (!html.includes('var(--safe)') && !html.includes('--safe:')) {
  failed += 1;
  console.error('FAIL poster.html: keep print --safe inset so physical A4 is not cropped');
}
if (!fs.existsSync(copy) || !fs.readFileSync(copy, 'utf8').includes('export const COPY')) {
  failed += 1;
  console.error('FAIL missing docs/promo/poster-copy.js COPY export');
}

const sync = spawnSync(process.execPath, ['scripts/sync-poster-books.mjs', '--check'], {
  cwd: root,
  encoding: 'utf8',
});
if (sync.status !== 0) {
  failed += 1;
  process.stderr.write(sync.stderr || sync.stdout || 'poster-books sync failed\n');
} else {
  process.stdout.write(sync.stdout);
}

if (failed) {
  console.error(`lint-poster: ${failed} failure(s)`);
  process.exit(1);
}
console.log('ok lint-poster (no lab chassis fonts + books sync + safe print inset)');
