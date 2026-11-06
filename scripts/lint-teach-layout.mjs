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
  { file: 'js/sims/circuits.js', id: 'circuit', needles: ['portsOf', 'teachPanel'] },
  { file: 'js/sims/motion.js', id: 'projectile', needles: ['teachPanel', 'x–t', 'w <= 360'] },
  { file: 'js/sims/motion.js', id: 'st-graph / vt', needles: ['teachPanel'] },
  { file: 'js/sims/optics.js', id: 'double-slit', needles: ['teachPanel', 'screen intensity'] },
  { file: 'js/sims/thermal.js', id: 'heat-engine', needles: ['teachPanel', 'p–V'] },
  { file: 'js/sims/stat.js', id: 'ising', needles: ['teachPanel'] },
  { file: 'js/sims/advance.js', id: 'coupled-pendula', needles: ['teachPanel'] },
  { file: 'js/sims/uni.js', id: 'finite-well', needles: ['teachPanel', 'E ladder'] },
  { file: 'js/sims/modern.js', id: 'simultaneity', needles: ['teachPanel', 'midGutter'] },
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

if (failed) {
  console.error(`lint-teach-layout: ${failed} failure(s)`);
  process.exit(1);
}
console.log(`ok lint-teach-layout (${requiredTeachPanel.length} dual-view checks + gy scan + 320px book + warn/#a33 + narrow breakpoints)`);
