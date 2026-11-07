import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Teaching dual-view sims must keep schematic and Cartesian axes in separate
 * regions (teachPanel). Fail if a draw body still paints both wire-like geometry
 * and axis pairs without an opaque panel helper.
 */
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const requiredTeachPanel = [
  { file: 'js/sims/circuits.js', id: 'circuit', needles: ['portsOf', 'teachPanel', 'w <= 360'] },
  { file: 'js/sims/circuits.js', id: 'ac-rms', needles: ['Im → Irms', 'w <= 360'] },
  { file: 'js/sims/circuits.js', id: 'transformer', needles: ['U · n · P', 'w <= 360'] },
  { file: 'js/sims/motion.js', id: 'projectile', needles: ['teachPanel', 'x–t', 'w <= 360'] },
  { file: 'js/sims/motion.js', id: 'st-graph / vt', needles: ['teachPanel', 'w <= 360'] },
  { file: 'js/sims/optics.js', id: 'double-slit', needles: ['teachPanel', 'screen intensity', 'w <= 360'] },
  { file: 'js/sims/optics.js', id: 'convex-lens', needles: ['teachPanel', 'w <= 360'] },
  { file: 'js/sims/optics.js', id: 'malus', needles: ['Malus I(θ)', 'w <= 360'] },
  { file: 'js/sims/optics.js', id: 'telescope', needles: ['M · tube', 'w <= 360'] },
  { file: 'js/sims/optics.js', id: 'single-slit', needles: ['y_m minima', 'w <= 360'] },
  { file: 'js/sims/stat.js', id: 'wave-packet', needles: ['σ(t) spread', 'w <= 360'] },
  { file: 'js/sims/thermal.js', id: 'heat-engine', needles: ['teachPanel', 'p–V', 'w <= 360'] },
  { file: 'js/sims/stat.js', id: 'ising', needles: ['teachPanel', 'w <= 360'] },
  { file: 'js/sims/advance.js', id: 'coupled-pendula', needles: ['teachPanel', 'w <= 360'] },
  { file: 'js/sims/uni.js', id: 'finite-well', needles: ['teachPanel', 'E ladder', 'w <= 360'] },
  { file: 'js/sims/modern.js', id: 'simultaneity', needles: ['teachPanel', 'midGutter', 'w <= 360'] },
];

/** Old circuit-style overlap: port schematic + axes rooted at h·0.8x. */
const bannedGy = /(?:const|let)\s+gy\s*=\s*h\s*\*\s*0\.8\d*/;
const simDir = path.join(root, 'js/sims');

let failed = 0;
for (const row of requiredTeachPanel) {
  const src = fs.readFileSync(path.join(root, row.file), 'utf8');
  for (const needle of row.needles) {
    if (!src.includes(needle)) {
      failed += 1;
      console.error(`FAIL ${row.id}: ${row.file} missing ${JSON.stringify(needle)}`);
    }
  }
}

for (const name of fs.readdirSync(simDir).filter((n) => n.endsWith('.js'))) {
  const src = fs.readFileSync(path.join(simDir, name), 'utf8');
  if (src.includes('portsOf') && bannedGy.test(src)) {
    failed += 1;
    console.error(`FAIL ${name}: portsOf + gy = h * 0.8x stacks I–U on the schematic; use teachPanel`);
  }
}

const css = fs.readFileSync(path.join(root, 'css/edu.css'), 'utf8');
if (!/@media\s*\(max-width:\s*320px\)[\s\S]*?\.book-select-wrap\s+select[\s\S]*?text-overflow:\s*clip/.test(css)) {
  failed += 1;
  console.error('FAIL edu.css@320: .book-select-wrap select must set text-overflow: clip (beats base ellipsis)');
}
if (!/\.readout\.warn[^{]*\{[^}]*color:\s*#a33/.test(css)
  && !/\.readout\.warn span,\s*\.readout\.warn strong\s*\{\s*color:\s*#a33/.test(css)) {
  failed += 1;
  console.error('FAIL edu.css: .readout.warn must use color #a33 to match canvas fault ink');
}
// Projectile narrow stack (canvas) and book-select clip (CSS) stay on different breakpoints.
const motion = fs.readFileSync(path.join(root, 'js/sims/motion.js'), 'utf8');
if (!/w\s*<=\s*360/.test(motion)) {
  failed += 1;
  console.error('FAIL motion.js: projectile narrow branch must keep w <= 360 (not CSS 320 alone)');
}
if (!/@media\s*\(max-width:\s*320px\)/.test(css)) {
  failed += 1;
  console.error('FAIL edu.css: keep @media (max-width: 320px) for book-select; distinct from canvas w<=360');
}

// 340px hit chain: @768 sets brand|lang / nav|nav; @420 must keep or inherit; @320 must not stack lang alone.
function stripCssComments(block) {
  return String(block || '').replace(/\/\*[\s\S]*?\*\//g, '');
}
function hasTwoRowAreas(block) {
  return block && /grid-template-areas\s*:\s*[\s\S]*?["']brand\s+lang["'][\s\S]*?["']nav\s+nav["']/.test(block);
}
function mediaInner(src, maxWidthPx) {
  const re = new RegExp(`@media\\s*\\(\\s*max-width:\\s*${maxWidthPx}px\\s*\\)`);
  const start = src.search(re);
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
const block1100 = mediaInner(css, 1100);
const block768 = mediaInner(css, 768);
const block420 = mediaInner(css, 420);
const block320 = mediaInner(css, 320);
// Mobile single-column: teach (phases / params / CTA) before stage so users need not scroll past canvas.
if (!block1100 || !/\.teach\s*\{\s*order:\s*2\s*;/.test(block1100) || !/main\s*\{\s*order:\s*3\s*;/.test(block1100)) {
  failed += 1;
  console.error('FAIL edu.css@1100: .teach order:2 must precede main order:3 (mobile teach-before-stage)');
} else if (!/\.phases\s*\{[^}]*position:\s*sticky/.test(block1100)) {
  failed += 1;
  console.error('FAIL edu.css@1100: .phases must be sticky so phase CTAs stay reachable while scrolling');
} else if (!/aside\s*\{[^}]*max-height:\s*min\(\s*30vh\s*,\s*220px\s*\)/.test(block1100)) {
  failed += 1;
  console.error('FAIL edu.css@1100: aside must cap at min(30vh, 220px) so long chapters do not bury teach');
} else {
  console.log('ok edu.css@1100 teach-before-stage + sticky phases + capped aside');
}
if (!hasTwoRowAreas(block768)) {
  failed += 1;
  console.error('FAIL edu.css@768: .top grid-template-areas must be brand lang / nav nav (covers 340px)');
}
// @420: either set two-row areas, or document inherit from @768 (340 hit chain).
// Strip comments before detecting the property so inherit docs can name grid-template-areas.
function lint420AreasOrInherit(block) {
  if (!block) return null;
  const code = stripCssComments(block);
  if (/grid-template-areas/.test(code)) {
    if (!hasTwoRowAreas(code)) return 'bad-areas';
    return null;
  }
  if (!/inherit[\s\S]{0,80}@768|inherit[\s\S]{0,80}brand\s+lang|keeps?[\s\S]{0,40}two-row|inherit[\s\S]{0,40}areas/i.test(block)) {
    return 'missing-inherit-doc';
  }
  return null;
}
{
  const err420 = lint420AreasOrInherit(block420);
  if (err420 === 'bad-areas') {
    failed += 1;
    console.error('FAIL edu.css@420: grid-template-areas must stay brand lang / nav nav (340 hit chain)');
  } else if (err420 === 'missing-inherit-doc') {
    failed += 1;
    console.error('FAIL edu.css@420: if grid-template-areas omitted, comment must document inherit of brand lang / nav nav from @768');
  }
  // Reverse: bare @420 without areas and without inherit comment must be rejected.
  const bareNoDoc = '  .top { grid-template-columns: minmax(0, 1fr) auto; justify-items: stretch; }\n';
  if (lint420AreasOrInherit(bareNoDoc) !== 'missing-inherit-doc') {
    failed += 1;
    console.error('FAIL lint reverse: @420 without areas/inherit comment must return missing-inherit-doc');
  }
  // Reverse: wrong areas string (property present but not brand lang / nav nav) → bad-areas.
  const badAreas = '  .top {\n    grid-template-areas:\n      "brand brand"\n      "nav lang";\n  }\n';
  if (lint420AreasOrInherit(badAreas) !== 'bad-areas') {
    failed += 1;
    console.error('FAIL lint reverse: @420 wrong grid-template-areas must return bad-areas');
  }
  // Reverse: inherit comment present but code has wrong areas → bad-areas wins (property first).
  const inheritButBadAreas = '  /* Inherit @768 grid-template-areas: brand lang / nav nav */\n'
    + '  .top {\n    grid-template-areas:\n      "brand brand"\n      "nav lang";\n  }\n';
  if (lint420AreasOrInherit(inheritButBadAreas) !== 'bad-areas') {
    failed += 1;
    console.error('FAIL lint reverse: inherit comment + wrong areas must prefer bad-areas');
  }
  // Reverse: correct two-row areas with no inherit comment → ok (property path).
  const goodAreasNoInherit = '  .top {\n    grid-template-areas:\n      "brand lang"\n      "nav nav";\n  }\n';
  if (lint420AreasOrInherit(goodAreasNoInherit) !== null) {
    failed += 1;
    console.error('FAIL lint reverse: correct areas without inherit comment must pass');
  }
  // Reverse: correct areas + extra inherit comment still passes (property wins; comment noise ok).
  const goodAreasExtraInherit = '  /* Inherit @768 grid-template-areas: brand lang / nav nav */\n'
    + '  .top {\n    grid-template-areas:\n      "brand lang"\n      "nav nav";\n  }\n';
  if (lint420AreasOrInherit(goodAreasExtraInherit) !== null) {
    failed += 1;
    console.error('FAIL lint reverse: correct areas + extra inherit comment must still pass');
  }
}

// Pages workflow must not set OFFLINE_FIRST in env: (ADR 001 — flip only via dedicated PR).
{
  const pagesYml = fs.readFileSync(path.join(root, '.github/workflows/pages.yml'), 'utf8');
  // Forbid OFFLINE_FIRST as an env key assignment anywhere in the workflow.
  if (/(?:^|\n)\s*OFFLINE_FIRST\s*:/m.test(pagesYml)) {
    failed += 1;
    console.error('FAIL pages.yml: OFFLINE_FIRST must not appear as an env key (ADR 001)');
  } else {
    console.log('ok pages.yml: no OFFLINE_FIRST env key');
  }
}

// LIVE_GETSIM_IDS default + Pages env must cover every PATHS group (one id each).
{
  const reg = fs.readFileSync(path.join(root, 'js/sims/registry.js'), 'utf8');
  const pathKeys = [...reg.matchAll(/^\s*(\w+)\s*:\s*'\.\/[\w.-]+\.js'/gm)].map((m) => m[1]);
  const liveSrc = fs.readFileSync(path.join(root, 'scripts/smoke-live-getsim.mjs'), 'utf8');
  const pagesYml = fs.readFileSync(path.join(root, '.github/workflows/pages.yml'), 'utf8');
  const defaultBlock = liveSrc.match(/DEFAULT_LIVE_GETSIM_IDS\s*=\s*\[([\s\S]*?)\]/);
  const defaultIds = defaultBlock
    ? [...defaultBlock[1].matchAll(/'([^']+)'/g)].map((m) => m[1])
    : [];
  const pagesMatch = pagesYml.match(/LIVE_GETSIM_IDS:\s*([^\n]+)/);
  const pagesIds = pagesMatch
    ? pagesMatch[1].split(',').map((s) => s.trim()).filter(Boolean)
    : [];
  if (defaultIds.length !== pathKeys.length) {
    failed += 1;
    console.error('FAIL smoke-live-getsim DEFAULT_LIVE_GETSIM_IDS count', defaultIds.length, '!= PATHS', pathKeys.length);
  } else if (pagesIds.length !== pathKeys.length) {
    failed += 1;
    console.error('FAIL pages.yml LIVE_GETSIM_IDS count', pagesIds.length, '!= PATHS', pathKeys.length);
  } else {
    console.log('ok LIVE_GETSIM_IDS covers', pathKeys.length, 'PATHS groups');
  }
}

// Watch / doctor / offline-first fixtures must stay present (static assert; no network).
{
  const fixtures = [
    ['scripts/push-main-heartbeat.sh', /PUSH_WATCH_FLAKE_FIXTURE|watch_exit_decision|soft_ok_jobs_flake/],
    ['scripts/doctor.sh', /DOCTOR_FIXTURE=auto-ensure-0|DOCTOR_FIXTURE=auto-ensure-1|DOCTOR_FIXTURE=missing-ready/],
    ['scripts/offline-first-sidebranch-dry-run.sh', /OFFLINE_FIRST=1|OFFLINE_FIRST_REQUIRE_MP/],
  ];
  let fxOk = true;
  for (const [rel, re] of fixtures) {
    const abs = path.join(root, rel);
    if (!fs.existsSync(abs)) {
      failed += 1;
      fxOk = false;
      console.error(`FAIL missing fixture script: ${rel}`);
      continue;
    }
    const src = fs.readFileSync(abs, 'utf8');
    if (!re.test(src)) {
      failed += 1;
      fxOk = false;
      console.error(`FAIL ${rel}: missing expected fixture marker ${re}`);
    }
  }
  const pushMain = fs.readFileSync(path.join(root, 'scripts/push-main.sh'), 'utf8');
  if (!/capture-cols-fail-/.test(pushMain) || !/print_run_artifacts/.test(pushMain)) {
    failed += 1;
    fxOk = false;
    console.error('FAIL push-main.sh: print_run_artifacts must still match capture-cols-fail (legacy) names');
  }
  const pagesYml = fs.readFileSync(path.join(root, '.github/workflows/pages.yml'), 'utf8');
  // Green-run upload of capture-cols-fail removed — forbid reintroducing upload-artifact name.
  if (/name:\s*capture-cols-fail-\$\{\{/.test(pagesYml)) {
    failed += 1;
    fxOk = false;
    console.error('FAIL pages.yml: must not upload capture-cols-fail-${{…}} on green (verify-only force_cols)');
  }
  if (fxOk) console.log('ok watch/doctor/offline-first fixture scripts present');
}

// Agent-facing scripts must not run blind git-add-all (use git-stage-allow.sh).
{
  const agentFiles = [
    'AGENTS.md',
    ...fs.readdirSync(path.join(root, 'scripts'))
      .filter((n) => n.endsWith('.sh') || n.endsWith('.mjs'))
      .map((n) => path.join('scripts', n)),
  ];
  // Match real commands only; skip this lint file's own strings via warn-word gate below.
  const cmdRe = /\bgit\s+add\s+(-A|--all|\.)\b/;
  let addFails = 0;
  for (const rel of agentFiles) {
    const abs = path.join(root, rel);
    if (!fs.existsSync(abs)) continue;
    const lines = fs.readFileSync(abs, 'utf8').split(/\r?\n/);
    lines.forEach((line, i) => {
      const trimmed = line.trim();
      // Allow prose / comments / lint diagnostics that warn against the pattern.
      if (/^(#|\/\/|\*|<!--)/.test(trimmed)) return;
      if (/never|forbid|勿|禁止|do not|don't|without|must not|blind|warn against|lint forbids/i.test(line)) {
        return;
      }
      if (cmdRe.test(line)) {
        addFails += 1;
        console.error(`FAIL ${rel}:${i + 1}: agent script must not run blind git-add-all — use scripts/git-stage-allow.sh`);
      }
    });
  }
  const allowList = path.join(root, 'scripts/stage-allow.default.list');
  const preCommit = path.join(root, 'scripts/githooks/pre-commit');
  if (!fs.existsSync(allowList)) {
    failed += 1;
    console.error('FAIL missing scripts/stage-allow.default.list');
  } else if (addFails) {
    failed += addFails;
  } else if (!fs.existsSync(preCommit)) {
    failed += 1;
    console.error('FAIL missing scripts/githooks/pre-commit');
  } else {
    const hookSrc = fs.readFileSync(preCommit, 'utf8');
    // Hook must consume the same default list path (no divergent hard-coded roots).
    if (!hookSrc.includes('stage-allow.default.list')) {
      failed += 1;
      console.error('FAIL pre-commit must reference scripts/stage-allow.default.list');
    } else {
      const rules = fs.readFileSync(allowList, 'utf8')
        .split(/\r?\n/)
        .filter((l) => l && !l.startsWith('#'));
      if (rules.length < 3) {
        failed += 1;
        console.error('FAIL stage-allow.default.list looks empty');
      } else {
        console.log('ok agent scripts: no blind git-add-all + pre-commit ↔ stage-allow.default.list');
      }
    }
  }
}
if (block320) {
  const code320 = stripCssComments(block320);
  if (/grid-template-areas/.test(code320) && !hasTwoRowAreas(code320)) {
    failed += 1;
    console.error('FAIL edu.css@320: do not stack lang alone; keep brand lang / nav nav or inherit');
  }
}

// Narrow header height: @768/@420 (340 hit chain) and @320 must not force min-height > 100px.
function topMinHeightInBlock(block) {
  if (!block) return null;
  const top = block.match(/\.top\s*\{([^}]*)\}/);
  if (!top) return 'inherit';
  const mh = top[1].match(/min-height\s*:\s*([^;]+)/);
  return mh ? mh[1].trim() : 'unset';
}
for (const [w, block] of [[768, block768], [420, block420], [320, block320]]) {
  const mh = topMinHeightInBlock(block);
  if (mh == null) {
    if (w === 768 || w === 420) {
      failed += 1;
      console.error(`FAIL edu.css@${w}: missing media block for narrow header min-height lint`);
    }
    continue;
  }
  if (mh === 'inherit' || mh === 'unset' || mh === '0' || mh === '0px') continue;
  const px = Number.parseFloat(mh);
  if (Number.isFinite(px) && px > 100) {
    failed += 1;
    console.error(`FAIL edu.css@${w}: .top min-height must be ≤100px (got ${mh})`);
  }
}

if (failed) {
  console.error(`lint-teach-layout: ${failed} failure(s)`);
  process.exit(1);
}
console.log(`ok lint-teach-layout (${requiredTeachPanel.length} dual-view checks + gy scan + 320px book + warn/#a33 + narrow breakpoints + header areas/min-height)`);
