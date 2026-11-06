/**
 * CI smoke for 320px Chinese book-select (CSSOM-style, no browser).
 * Asserts PEP zh title + @media (max-width: 320px) clip specificity,
 * and documents the 321–360px canvas-vs-CSS boundary.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getBook } from '../js/curricula/index.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let failed = 0;

const pep = getBook('pep-junior');
const zhTitle = pep?.title?.zh || '';
if (!/人教版初中物理/.test(zhTitle)) {
  failed += 1;
  console.error('FAIL pep-junior title.zh must be 人教版初中物理', zhTitle);
} else {
  console.log('ok pep-junior zh title', zhTitle);
}

const css = fs.readFileSync(path.join(root, 'css/edu.css'), 'utf8');
const baseEllipsis = /\.book-select-wrap\s+select[\s\S]*?text-overflow:\s*ellipsis/.test(css)
  || /\.book-select\s*\{[^}]*text-overflow:\s*ellipsis/.test(css);
if (!baseEllipsis) {
  failed += 1;
  console.error('FAIL edu.css: base book-select should use text-overflow: ellipsis above 320px');
}

function mediaBlock(src, queryRe) {
  const start = src.search(queryRe);
  if (start < 0) return null;
  const brace = src.indexOf('{', start);
  if (brace < 0) return null;
  let depth = 0;
  for (let i = brace; i < src.length; i += 1) {
    if (src[i] === '{') depth += 1;
    else if (src[i] === '}') {
      depth -= 1;
      if (depth === 0) return src.slice(brace + 1, i);
    }
  }
  return null;
}

const block320 = mediaBlock(css, /@media\s*\(\s*max-width:\s*320px\s*\)/);
if (!block320) {
  failed += 1;
  console.error('FAIL edu.css: missing @media (max-width: 320px) block');
} else if (!/\.book-select-wrap\s+select[\s\S]*?text-overflow:\s*clip/.test(block320)) {
  failed += 1;
  console.error('FAIL edu.css@320 CSSOM: .book-select-wrap select must set text-overflow: clip');
} else {
  console.log('ok 320px CSSOM book-select-wrap select → clip');
}

// Title character budget: at 11px tabular-ish, 「人教版初中物理」(7 chars) must fit ~280px.
const approxPx = zhTitle.length * 11;
if (approxPx > 280) {
  failed += 1;
  console.error('FAIL pep zh title likely overflows 320px select', { zhTitle, approxPx });
} else {
  console.log('ok pep zh title width budget', { chars: zhTitle.length, approxPx });
}

const motion = fs.readFileSync(path.join(root, 'js/sims/motion.js'), 'utf8');
const agents = fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8');
if (!/w\s*<=\s*360/.test(motion)) {
  failed += 1;
  console.error('FAIL motion.js missing w <= 360 narrow stack');
}
if (!/321|360px|w\s*<=\s*360/.test(agents) || !/320px/.test(agents)) {
  failed += 1;
  console.error('FAIL AGENTS.md must document 320px book-select vs w<=360 projectile boundary');
} else {
  console.log('ok 321–360px boundary documented (canvas stack vs CSS ellipsis)');
}

if (failed) {
  console.error(`smoke-book-select: ${failed} failure(s)`);
  process.exit(1);
}
console.log('ok smoke-book-select');
