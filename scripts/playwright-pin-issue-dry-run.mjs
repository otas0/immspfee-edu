#!/usr/bin/env node
/**
 * Dry-run for Playwright pin → GitHub issue logic (pages.yml).
 * Does NOT create or comment on issues — only prints what CI would do.
 *
 * Usage:
 *   node scripts/playwright-pin-issue-dry-run.mjs
 *   PIN_HASH=deadbeef node scripts/playwright-pin-issue-dry-run.mjs
 *   DRY_RUN_FIXTURE=closed node scripts/playwright-pin-issue-dry-run.mjs
 *     → fixture: pretend a closed issue owns this hash; must plan **create-after-closed**.
 *   DRY_RUN_FIXTURE=open … → plan **comment**; DRY_RUN_FIXTURE=create → plan **create** (no hits).
 *
 * Exit 0 on success / info. Fixture mode exits 1 if plan is wrong.
 */
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pinPath = path.join(root, 'scripts/playwright-version.txt');
const pinVer = (process.env.PIN_VER || readFileSync(pinPath, 'utf8')).replace(/[ \n\r]/g, '');
const pinHash = (process.env.PIN_HASH || createHash('sha256').update(pinVer).digest('hex')).slice(0, 8);
const title = `Playwright pin changed (${pinHash})`;
const repo = process.env.REPO || 'otas0/immspfee-edu';
const fixture = String(process.env.DRY_RUN_FIXTURE || '').trim().toLowerCase();

function ghJson(args) {
  const r = spawnSync('gh', args, { encoding: 'utf8' });
  if (r.status !== 0) return { ok: false, err: (r.stderr || r.stdout || '').trim() };
  try {
    return { ok: true, data: JSON.parse(r.stdout || '[]') };
  } catch (e) {
    return { ok: false, err: String(e) };
  }
}

/** @returns {'comment'|'create-after-closed'|'create'} */
function planFromHits(openHit, closedHits) {
  if (openHit) return 'comment';
  if (closedHits.length) return 'create-after-closed';
  return 'create';
}

console.log('### Playwright pin issue dry-run (no create/comment)');
console.log('');
console.log(`- pin: \`${pinVer}\``);
console.log(`- hash: \`${pinHash}\``);
console.log(`- title: \`${title}\``);
console.log(`- repo: \`${repo}\``);
if (fixture) console.log(`- fixture: \`${fixture}\``);
console.log('');

let openHit = null;
let closedHits = [];

if (fixture === 'closed') {
  // Fixture: closed issue with same title — CI must create fresh, not revive closed.
  closedHits = [{ number: 999001, title, state: 'CLOSED' }];
  console.log('## Fixture: closed issue #999001 with same hash title');
  console.log('');
} else if (fixture === 'open') {
  openHit = { number: 999002, title, state: 'OPEN' };
  console.log('## Fixture: open issue #999002 with same hash title');
  console.log('');
} else if (fixture === 'create') {
  openHit = null;
  closedHits = [];
  console.log('## Fixture: no open/closed issue with this hash title');
  console.log('');
} else {
  const open = ghJson([
    'issue', 'list', '--repo', repo, '--search', `${title} in:title`, '--state', 'open',
    '--json', 'number,title,state',
  ]);
  const closed = ghJson([
    'issue', 'list', '--repo', repo, '--search', `${title} in:title`, '--state', 'closed',
    '--json', 'number,title,state',
  ]);

  if (!open.ok && !closed.ok) {
    console.log('## Offline / gh unavailable');
    console.log('');
    console.log(`Would **create** issue \`${title}\` (cannot list existing).`);
    console.log(`gh err: ${open.err || closed.err}`);
    process.exit(0);
  }

  openHit = (open.data || []).find((i) => i.title === title) || null;
  closedHits = (closed.data || []).filter((i) => i.title === title);
}

const plan = planFromHits(openHit, closedHits);

console.log('## Plan');
console.log('');
if (plan === 'comment') {
  console.log(`Would **comment** on open #${openHit.number} (same run_id dedupe still applies in CI).`);
  console.log('Would **not** create a new issue.');
} else if (plan === 'create-after-closed') {
  console.log(`Closed issue(s) with same title: ${closedHits.map((i) => `#${i.number}`).join(', ')}.`);
  console.log('Would **create a new issue** (closed same-hash must not be reused).');
} else {
  console.log(`Would **create** issue \`${title}\` (no open/closed match).`);
}
console.log('');
console.log(`plan=${plan}`);
console.log('Dry-run complete — no API write.');

if (fixture === 'closed' && plan !== 'create-after-closed') {
  console.error('FAIL fixture closed: expected plan=create-after-closed');
  process.exit(1);
}
if (fixture === 'open' && plan !== 'comment') {
  console.error('FAIL fixture open: expected plan=comment');
  process.exit(1);
}
if (fixture === 'create' && plan !== 'create') {
  console.error('FAIL fixture create: expected plan=create');
  process.exit(1);
}
process.exit(0);
