import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const TOKEN = '__' + 'BUILD__';
const sha = (process.env.GITHUB_SHA || process.env.BUILD_SHA || 'dev').slice(0, 7);

/** Always stamp these entry shells even if a token was already replaced locally. */
const REQUIRED = [
  'index.html',
  'js/app.js',
  'js/i18n.js',
  'js/sims/registry.js',
  'js/curricula/index.js',
  'css/edu.css',
  'sw.js',
];

/**
 * Policy: only rewrite files that already contain the build opt-in token.
 * Do not blanket-edit every js/** file — physics modules stay token-free;
 * sims import them with ?v=<TOKEN> (stamped in each js/sims/*.js).
 *
 * Never stamp scripts/ (especially test-edu.mjs). A dry-run that rewrote
 * assert('?v=__BUILD__') into assert('?v=testdev') already bit once.
 *
 * ui-chrome.js / uni-fold.js stay off REQUIRED and off sw.js PRECACHE: app.js
 * imports them with ?v=<TOKEN> (stamped in app.js). Revisit triggers:
 * docs/adr/001-ui-chrome-precache.md.
 */
function shouldScan(rel) {
  const n = rel.replace(/\\/g, '/');
  if (n.startsWith('scripts/')) return false;
  if (n.startsWith('_site/')) return false;
  if (n.startsWith('.local-shots/')) return false;
  if (n.startsWith('node_modules/')) return false;
  if (n.includes('test-edu') || /(^|\/)test[^/]*$/i.test(n)) return false;
  return true;
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git' || name === '_site') continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(html|js|mjs|css)$/.test(name)) out.push(p);
  }
  return out;
}

const found = new Set(REQUIRED);
for (const file of walk('.')) {
  const rel = file.replace(/^\.\//, '');
  if (!shouldScan(rel)) continue;
  const text = readFileSync(file, 'utf8');
  if (text.includes(TOKEN)) found.add(rel);
}

let stamped = 0;
for (const file of [...found].sort()) {
  const before = readFileSync(file, 'utf8');
  if (!before.includes(TOKEN)) {
    if (REQUIRED.includes(file)) console.warn(`stamp: missing ${TOKEN} in required ${file}`);
    continue;
  }
  writeFileSync(file, before.split(TOKEN).join(sha));
  stamped += 1;
}
console.log(`stamped ${TOKEN} -> ${sha} in ${stamped} files`);
