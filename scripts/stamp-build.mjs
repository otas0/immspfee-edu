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
 * Do not blanket-edit every js/** file — physics/sim modules stay token-free and
 * get cache-busting via registry / curricula imports instead.
 *
 * ui-chrome.js / uni-fold.js stay off REQUIRED and off sw.js PRECACHE: app.js
 * imports them with ?v=__BUILD__ (stamped in app.js). Revisit triggers:
 * docs/adr/001-ui-chrome-precache.md.
 */
function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git') continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(html|js|mjs|css)$/.test(name)) out.push(p);
  }
  return out;
}

const found = new Set(REQUIRED);
for (const file of walk('.')) {
  const text = readFileSync(file, 'utf8');
  if (text.includes(TOKEN)) found.add(file.replace(/^\.\//, ''));
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
