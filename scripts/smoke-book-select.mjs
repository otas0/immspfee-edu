/**
 * CI smoke for 320px Chinese book-select (CSSOM-style, no browser).
 * Asserts PEP zh title + @media (max-width: 320px) clip specificity,
 * and documents the 321–360px canvas-vs-CSS boundary.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getBook, findLesson, flatten } from '../js/curricula/index.js';
import { t } from '../js/i18n.js';
import { uniFoldHintFromQuery, applyFoldHintEl } from '../js/uni-fold.js';
import { createDom } from './dom-lite.mjs';

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
} else if (!/\.local-shots/.test(agents)) {
  failed += 1;
  console.error('FAIL AGENTS.md must link .local-shots capture for 321–360px band');
} else {
  console.log('ok 321–360px boundary documented (canvas stack vs CSS ellipsis)');
}

const shotsReadme = path.join(root, '.local-shots', 'README.md');
const shotsTxt = fs.existsSync(shotsReadme) ? fs.readFileSync(shotsReadme, 'utf8') : '';
if (!/340px-projectile-ellipsis/.test(shotsTxt) || !/340px-zh-long-title-ellipsis/.test(shotsTxt)) {
  failed += 1;
  console.error('FAIL .local-shots/README.md must describe 340px stack + long-title ellipsis captures');
} else if (!/321\s*[–-]\s*360/.test(shotsTxt) || !/≤\s*320|max-width:\s*320/.test(shotsTxt)
  || !/ellipsis/.test(shotsTxt) || !/clip/.test(shotsTxt)
  || !/\|[^\n]*321[^\n]*\|[^\n]*\|/.test(shotsTxt)) {
  failed += 1;
  console.error('FAIL .local-shots/README.md needs 321–360 vs ≤320 book-title strategy table');
} else {
  console.log('ok .local-shots/README.md documents 340px band captures + strategy table');
}

// Narrow header CSSOM: 340px uses ≤768/420 two-row areas; 320 must not re-stack lang.
const block768 = mediaBlock(css, /@media\s*\(\s*max-width:\s*768px\s*\)/);
const block420 = mediaBlock(css, /@media\s*\(\s*max-width:\s*420px\s*\)/);
function hasTwoRowTop(block) {
  if (!block) return false;
  return /grid-template-areas\s*:\s*[\s\S]*?["']brand\s+lang["'][\s\S]*?["']nav\s+nav["']/.test(block);
}
function areasOkOrInherited(block, label) {
  if (!block || !/grid-template-areas/.test(block)) return true; // inherit prior media
  if (hasTwoRowTop(block)) return true;
  console.error(`FAIL edu.css@${label} CSSOM: grid-template-areas must stay brand lang / nav nav`);
  return false;
}
if (!hasTwoRowTop(block768)) {
  failed += 1;
  console.error('FAIL edu.css@768 CSSOM: .top must use grid-template-areas brand lang / nav nav (340px band)');
} else if (!areasOkOrInherited(block420, '420') || !areasOkOrInherited(block320, '320')) {
  failed += 1;
} else {
  console.log('ok narrow header CSSOM grid-template-areas @340/@320');
}

// Whitespace / all-space query → idle fold hint via real createElement (not mock el).
{
  const uni = getBook('university');
  const rows = flatten(uni);
  const sample = findLesson('university', rows[0]?.lesson?.id);
  const ch = sample?.chapter;
  const labels = {
    currentLabel: t('zh', 'foldCurrent'),
    searchLabel: t('zh', 'foldSearchOpen'),
    chapterTitle: ch?.title?.zh || '',
  };
  const { document } = createDom();
  const host = document.createElement('div');
  document.body.appendChild(host);
  const queries = ['', '   ', '\t  \n'];
  for (const q of queries) {
    const fold = uniFoldHintFromQuery(q, ch, labels);
    const el = document.createElement('span');
    host.appendChild(el);
    applyFoldHintEl(el, fold.chapterId, fold.text, fold.searching);
  }
  const last = host.children[host.children.length - 1];
  const idle = uniFoldHintFromQuery('', ch, labels);
  const ws = uniFoldHintFromQuery('   ', ch, labels);
  const tab = uniFoldHintFromQuery('\t  \n', ch, labels);
  if (ws.searching || tab.searching || idle.searching
    || last.getAttribute('data-searching') != null
    || !last.textContent.startsWith(t('zh', 'foldCurrent'))
    || document.querySelector('[data-searching="1"]')) {
    failed += 1;
    console.error('FAIL uniFoldHintFromQuery whitespace DOM (book-select grade)', {
      ws, tab, idle, lastAttr: last.getAttribute('data-searching'), text: last.textContent,
    });
  } else {
    // Compound querySelector('span.fold-hint') / span.fold-hint[data-searching="1"].
    host.children.length = 0;
    const searchFold = uniFoldHintFromQuery('动量', ch, labels);
    const hintEl = document.createElement('span');
    host.appendChild(hintEl);
    applyFoldHintEl(hintEl, searchFold.chapterId, searchFold.text, searchFold.searching);
    const byCompound = document.querySelector('span.fold-hint');
    const byCompoundAttr = document.querySelector('span.fold-hint[data-searching="1"]');
    if (!byCompound || byCompound !== hintEl || !byCompoundAttr || byCompoundAttr !== hintEl
      || byCompoundAttr.getAttribute('data-searching') !== '1') {
      failed += 1;
      console.error('FAIL dom-lite querySelector span.fold-hint compound', {
        byCompound: !!byCompound, same: byCompound === hintEl,
        byCompoundAttr: byCompoundAttr?.getAttribute('data-searching'),
      });
    } else {
      console.log('ok uniFoldHintFromQuery whitespace/blank DOM + span.fold-hint compound');
    }
  }
}

if (failed) {
  console.error(`smoke-book-select: ${failed} failure(s)`);
  process.exit(1);
}
console.log('ok smoke-book-select');
