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
function stripCssComments(block) {
  return String(block || '').replace(/\/\*[\s\S]*?\*\//g, '');
}
function hasTwoRowTop(block) {
  if (!block) return false;
  return /grid-template-areas\s*:\s*[\s\S]*?["']brand\s+lang["'][\s\S]*?["']nav\s+nav["']/.test(block);
}
function areasOkOrInherited(block, label) {
  const code = stripCssComments(block);
  // Comments may name grid-template-areas; only the property counts.
  if (!block || !/grid-template-areas/.test(code)) return true; // inherit prior media
  if (hasTwoRowTop(code)) return true;
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
    const byChapterId = document.querySelector('span.fold-hint[data-chapter-id]');
    hintEl.className = 'fold-hint extra';
    const byMulti = document.querySelector('span.fold-hint.extra');
    if (!byCompound || byCompound !== hintEl || !byCompoundAttr || byCompoundAttr !== hintEl
      || byCompoundAttr.getAttribute('data-searching') !== '1'
      || !byChapterId || byChapterId !== hintEl
      || byChapterId.getAttribute('data-chapter-id') !== String(ch.id)
      || !byMulti || byMulti !== hintEl) {
      failed += 1;
      console.error('FAIL dom-lite querySelector span.fold-hint compound / bare attr / multi-class', {
        byCompound: !!byCompound, same: byCompound === hintEl,
        byCompoundAttr: byCompoundAttr?.getAttribute('data-searching'),
        chapterId: byChapterId?.getAttribute('data-chapter-id'),
        multi: !!byMulti,
      });
    } else {
      const byComma = document.querySelector('div.missing, span.fold-hint.extra');
      const byDesc = document.querySelector('div span.fold-hint');
      const byChild = document.querySelector('div > span.fold-hint');
      const byFirst = document.querySelector('span.fold-hint:first-child');
      // Nest a non-matching sibling so :last-child is not the fold-hint.
      const trailing = document.createElement('em');
      host.appendChild(trailing);
      const byLastWrong = document.querySelector('span.fold-hint:last-child');
      const byLastEm = document.querySelector('em:last-child');
      const byAdj = document.querySelector('span.fold-hint + em');
      const byAdjMiss = document.querySelector('em + span.fold-hint');
      if (!byComma || byComma !== hintEl) {
        failed += 1;
        console.error('FAIL dom-lite comma selector list', { byComma: !!byComma });
      } else if (!byDesc || byDesc !== hintEl) {
        failed += 1;
        console.error('FAIL dom-lite descendant div span.fold-hint', { byDesc: !!byDesc });
      } else if (!byChild || byChild !== hintEl) {
        failed += 1;
        console.error('FAIL dom-lite child combinator div > span.fold-hint', { byChild: !!byChild });
      } else if (!byFirst || byFirst !== hintEl || byLastWrong || !byLastEm || byLastEm !== trailing) {
        failed += 1;
        console.error('FAIL dom-lite :first-child / :last-child', {
          byFirst: !!byFirst, byLastWrong: !!byLastWrong, byLastEm: !!byLastEm,
        });
      } else if (!byAdj || byAdj !== trailing || byAdjMiss) {
        failed += 1;
        console.error('FAIL dom-lite adjacent sibling span.fold-hint + em', {
          byAdj: !!byAdj, byAdjMiss: !!byAdjMiss,
        });
      } else {
        const byMixed = document.querySelector('div > span.fold-hint + em');
        const byMixedMiss = document.querySelector('div > em + span.fold-hint');
        const byMixedPseudo = document.querySelector('div > span.fold-hint.extra + em:last-child');
        if (!byMixed || byMixed !== trailing || byMixedMiss) {
          failed += 1;
          console.error('FAIL dom-lite mixed combinator div > span.fold-hint + em', {
            byMixed: !!byMixed, byMixedMiss: !!byMixedMiss,
          });
        } else if (!byMixedPseudo || byMixedPseudo !== trailing) {
          failed += 1;
          console.error('FAIL dom-lite mixed+pseudo div > span.fold-hint.extra + em:last-child', {
            byMixedPseudo: !!byMixedPseudo,
          });
        } else {
          let notThrew = false;
          try {
            document.querySelector('span:not(.fold-hint)');
          } catch (e) {
            notThrew = /:not\(\)/.test(String(e && e.message));
          }
          let isThrew = false;
          try {
            document.querySelector('span:is(.fold-hint)');
          } catch (e) {
            isThrew = /:is\(\)/.test(String(e && e.message));
          }
          let whereThrew = false;
          try {
            document.querySelector('span:where(.fold-hint)');
          } catch (e) {
            whereThrew = /:where\(\)/.test(String(e && e.message));
          }
          let hasThrew = false;
          try {
            document.querySelector('div:has(span.fold-hint)');
          } catch (e) {
            hasThrew = /:has\(\)/.test(String(e && e.message));
          }
          let nthThrew = false;
          try {
            document.querySelector('span:nth-child(2)');
          } catch (e) {
            nthThrew = /:nth-child\(\)/.test(String(e && e.message));
          }
          let nthTypeThrew = false;
          try {
            document.querySelector('span:nth-of-type(2)');
          } catch (e) {
            nthTypeThrew = /:nth-of-type\(\)/.test(String(e && e.message));
          }
          if (!notThrew) {
            failed += 1;
            console.error('FAIL dom-lite must reject :not() with an Error');
          } else if (!isThrew) {
            failed += 1;
            console.error('FAIL dom-lite must reject :is() with an Error');
          } else if (!whereThrew) {
            failed += 1;
            console.error('FAIL dom-lite must reject :where() with an Error');
          } else if (!hasThrew) {
            failed += 1;
            console.error('FAIL dom-lite must reject :has() with an Error');
          } else if (!nthThrew) {
            failed += 1;
            console.error('FAIL dom-lite must reject :nth-child() with an Error');
          } else if (!nthTypeThrew) {
            failed += 1;
            console.error('FAIL dom-lite must reject :nth-of-type() with an Error');
          } else {
            console.log('ok uniFoldHintFromQuery DOM + compound/attr/multi/comma/descendant/child/pseudo/adjacent/mixed/:not/:is/:where/:has/:nth-child/:nth-of-type-reject');
          }
        }
      }
    }
  }
}

{
  // Playwright pin dry-run fixtures (no API write).
  const { spawnSync } = await import('node:child_process');
  const dryClosed = spawnSync(process.execPath, ['scripts/playwright-pin-issue-dry-run.mjs'], {
    cwd: root,
    env: { ...process.env, DRY_RUN_FIXTURE: 'closed', PIN_HASH: 'fixture01' },
    encoding: 'utf8',
  });
  if (dryClosed.status !== 0 || !/plan=create-after-closed/.test(dryClosed.stdout || '')) {
    failed += 1;
    console.error('FAIL pw pin dry-run fixture closed', {
      status: dryClosed.status, out: (dryClosed.stdout || '').slice(0, 400), err: dryClosed.stderr,
    });
  } else {
    console.log('ok pw pin dry-run fixture closed → create-after-closed');
  }
  const dryOpen = spawnSync(process.execPath, ['scripts/playwright-pin-issue-dry-run.mjs'], {
    cwd: root,
    env: { ...process.env, DRY_RUN_FIXTURE: 'open', PIN_HASH: 'fixture01' },
    encoding: 'utf8',
  });
  if (dryOpen.status !== 0 || !/plan=comment/.test(dryOpen.stdout || '')) {
    failed += 1;
    console.error('FAIL pw pin dry-run fixture open', {
      status: dryOpen.status, out: (dryOpen.stdout || '').slice(0, 400), err: dryOpen.stderr,
    });
  } else {
    console.log('ok pw pin dry-run fixture open → comment');
  }
  const dryCreate = spawnSync(process.execPath, ['scripts/playwright-pin-issue-dry-run.mjs'], {
    cwd: root,
    env: { ...process.env, DRY_RUN_FIXTURE: 'create', PIN_HASH: 'fixture01' },
    encoding: 'utf8',
  });
  if (dryCreate.status !== 0 || !/plan=create/.test(dryCreate.stdout || '')
    || /plan=create-after-closed/.test(dryCreate.stdout || '')) {
    failed += 1;
    console.error('FAIL pw pin dry-run fixture create', {
      status: dryCreate.status, out: (dryCreate.stdout || '').slice(0, 400), err: dryCreate.stderr,
    });
  } else {
    console.log('ok pw pin dry-run fixture create → create');
  }
}

{
  // capture-assert markdown: overflow/topH + kind headings for 340 / 1280.
  const { formatCaptureFailMarkdown } = await import('./capture-assert.mjs');
  const md = formatCaptureFailMarkdown('FORCE FAIL probe', {
    overflow: 'clip', overflows: false, topH: 150,
  });
  const md340 = formatCaptureFailMarkdown('340 probe', {
    overflow: 'clip', overflows: false, topH: 150,
  }, { kind: 'capture:340-title' });
  const md1280 = formatCaptureFailMarkdown('1280 probe', {
    overflow: 'clip', overflows: false, topH: 150,
  }, { kind: 'capture:1280' });
  if (!md.includes('- overflow:') || !md.includes('- overflows:') || !md.includes('- topH:')
    || !md.includes('```json')) {
    failed += 1;
    console.error('FAIL formatCaptureFailMarkdown missing overflow/topH block', md.slice(0, 200));
  } else if (!md340.includes('### capture:340-title assertion failed')
    || !md1280.includes('### capture:1280 assertion failed')) {
    failed += 1;
    console.error('FAIL formatCaptureFailMarkdown kind headings', {
      h340: md340.split('\n')[0], h1280: md1280.split('\n')[0],
    });
  } else {
    console.log('ok capture-assert overflow/topH + kind headings capture:340 / capture:1280');
  }
}

{
  // ADR 001: default OFFLINE_FIRST path keeps ui-chrome/uni-fold off REQUIRED+PRECACHE.
  const { spawnSync } = await import('node:child_process');
  const dry = spawnSync(process.execPath, ['scripts/offline-first-lockstep-dry-run.mjs'], {
    cwd: root,
    env: { ...process.env, OFFLINE_FIRST: '0' },
    encoding: 'utf8',
  });
  if (dry.status !== 0) {
    failed += 1;
    console.error('FAIL offline-first lockstep dry-run (default off)', {
      status: dry.status, out: (dry.stdout || '').slice(0, 400), err: dry.stderr,
    });
  } else {
    console.log('ok offline-first lockstep dry-run (shell stay off PRECACHE)');
  }
  // Temp fixture tree: OFFLINE_FIRST=1 lockstep green without touching main.
  const fix = spawnSync(process.execPath, ['scripts/offline-first-lockstep-dry-run.mjs'], {
    cwd: root,
    env: { ...process.env, OFFLINE_FIRST_FIXTURE: '1' },
    encoding: 'utf8',
  });
  if (fix.status !== 0 || !/OFFLINE_FIRST_FIXTURE=1 lockstep green/.test(fix.stdout || '')) {
    failed += 1;
    console.error('FAIL offline-first fixture lockstep green', {
      status: fix.status, out: (fix.stdout || '').slice(0, 400), err: fix.stderr,
    });
  } else {
    console.log('ok offline-first OFFLINE_FIRST_FIXTURE=1 lockstep green (temp tree)');
  }
  // Real-file copy with chrome/fold injected (side-branch simulation; main untouched).
  const real = spawnSync(process.execPath, ['scripts/offline-first-lockstep-dry-run.mjs'], {
    cwd: root,
    env: { ...process.env, OFFLINE_FIRST_REALTREE: '1' },
    encoding: 'utf8',
  });
  if (real.status !== 0 || !/OFFLINE_FIRST_REALTREE=1 lockstep green/.test(real.stdout || '')) {
    failed += 1;
    console.error('FAIL offline-first realtree lockstep green', {
      status: real.status, out: (real.stdout || '').slice(0, 400), err: real.stderr,
    });
  } else {
    console.log('ok offline-first OFFLINE_FIRST_REALTREE=1 lockstep green (patched copy)');
  }
}

{
  // Heartbeats FAIL mark + push-resume fixtures + doctor AUTO_ENSURE=0 (no server).
  const { spawnSync } = await import('node:child_process');
  const hb = spawnSync('bash', ['scripts/push-main-heartbeat.sh'], {
    cwd: root,
    env: { ...process.env, HEARTBEAT_FIXTURE: '1' },
    encoding: 'utf8',
  });
  if (hb.status !== 0 || !/ok heartbeat FAIL fixture/.test(hb.stdout || '')) {
    failed += 1;
    console.error('FAIL heartbeat FAIL fixture', {
      status: hb.status, out: (hb.stdout || '').slice(0, 400), err: hb.stderr,
    });
  } else {
    console.log('ok heartbeat FAIL fixture (**FAIL** prefix + mid-FAIL dedupe)');
  }
  const resume = spawnSync('bash', ['scripts/push-main-heartbeat.sh'], {
    cwd: root,
    env: { ...process.env, PUSH_RESUME_FIXTURE: '1' },
    encoding: 'utf8',
  });
  if (resume.status !== 0 || !/ok push-resume fixture/.test(resume.stdout || '')) {
    failed += 1;
    console.error('FAIL push-resume fixture (push ok + fetch fail + gh ok)', {
      status: resume.status, out: (resume.stdout || '').slice(0, 400), err: resume.stderr,
    });
  } else {
    console.log('ok push-resume fixture (fetch mock + gh resume + latest-SHA pick)');
  }
  const watchFlake = spawnSync('bash', ['scripts/push-main-heartbeat.sh'], {
    cwd: root,
    env: { ...process.env, PUSH_WATCH_FLAKE_FIXTURE: '1' },
    encoding: 'utf8',
  });
  if (watchFlake.status !== 0 || !/ok push-watch flake fixture/.test(watchFlake.stdout || '')) {
    failed += 1;
    console.error('FAIL push-watch flake fixture (jobs miss after success → soft exit 0)', {
      status: watchFlake.status, out: (watchFlake.stdout || '').slice(0, 400), err: watchFlake.stderr,
    });
  } else {
    console.log('ok push-watch flake fixture (jobs miss after success → soft exit 0)');
  }
  const doc = spawnSync('bash', ['scripts/doctor.sh'], {
    cwd: root,
    env: { ...process.env, DOCTOR_FIXTURE: 'auto-ensure-0' },
    encoding: 'utf8',
  });
  if (doc.status !== 0 || !/ok doctor AUTO_ENSURE=0 fixture/.test(doc.stdout || '')) {
    failed += 1;
    console.error('FAIL doctor AUTO_ENSURE=0 fixture', {
      status: doc.status, out: (doc.stdout || '').slice(0, 400), err: doc.stderr,
    });
  } else {
    console.log('ok doctor AUTO_ENSURE=0 fixture (clear sidecars, tip only, no server)');
  }
  const doc1 = spawnSync('bash', ['scripts/doctor.sh'], {
    cwd: root,
    env: { ...process.env, DOCTOR_FIXTURE: 'auto-ensure-1' },
    encoding: 'utf8',
  });
  if (doc1.status !== 0 || !/ok doctor AUTO_ENSURE=1 fixture/.test(doc1.stdout || '')) {
    failed += 1;
    console.error('FAIL doctor AUTO_ENSURE=1 fixture', {
      status: doc1.status, out: (doc1.stdout || '').slice(0, 400), err: doc1.stderr,
    });
  } else {
    console.log('ok doctor AUTO_ENSURE=1 fixture (mock ensure, no server)');
  }
  const side = spawnSync('bash', ['scripts/offline-first-sidebranch-dry-run.sh'], {
    cwd: root,
    encoding: 'utf8',
  });
  if (side.status !== 0 || !/ok offline-first sidebranch dry-run/.test(side.stdout || '')) {
    failed += 1;
    console.error('FAIL offline-first sidebranch dry-run', {
      status: side.status, out: (side.stdout || '').slice(0, 500), err: (side.stderr || '').slice(0, 400),
    });
  } else {
    console.log('ok offline-first sidebranch dry-run (local worktree; not pushed)');
  }
}

{
  // CAPTURE_FORCE_COLS_FAIL writes capture-last-fail.md (1280 three-column fail → upload path).
  const { spawnSync } = await import('node:child_process');
  const failPath = path.join(root, '.local-shots', 'capture-last-fail.md');
  try { fs.unlinkSync(failPath); } catch { /* none */ }
  const cols = spawnSync(process.execPath, ['scripts/capture-1280-desktop.mjs'], {
    cwd: root,
    env: { ...process.env, CAPTURE_FORCE_COLS_FAIL: '1' },
    encoding: 'utf8',
  });
  const body = fs.existsSync(failPath) ? fs.readFileSync(failPath, 'utf8') : '';
  try { fs.unlinkSync(failPath); } catch { /* none */ }
  if (cols.status === 0 || !body.includes('### capture:1280 assertion failed')
    || !body.includes('three columns')) {
    failed += 1;
    console.error('FAIL capture:1280 FORCE_COLS_FAIL must write capture-last-fail.md', {
      status: cols.status, hasBody: !!body, err: (cols.stderr || '').slice(0, 200),
    });
  } else {
    console.log('ok capture:1280 FORCE_COLS_FAIL → capture-last-fail.md (upload path)');
  }
}

if (failed) {
  console.error(`smoke-book-select: ${failed} failure(s)`);
  process.exit(1);
}
console.log('ok smoke-book-select');
