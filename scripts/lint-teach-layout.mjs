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
  { file: 'js/sims/motion.js', id: 'projectile', needles: ['teachPanel', 'x–t'] },
  { file: 'js/sims/motion.js', id: 'st-graph / vt', needles: ['teachPanel'] },
  { file: 'js/sims/optics.js', id: 'double-slit', needles: ['teachPanel', 'screen intensity'] },
  { file: 'js/sims/thermal.js', id: 'heat-engine', needles: ['teachPanel', 'p–V'] },
  { file: 'js/sims/stat.js', id: 'ising', needles: ['teachPanel'] },
  { file: 'js/sims/advance.js', id: 'coupled-pendula', needles: ['teachPanel'] },
  { file: 'js/sims/uni.js', id: 'finite-well', needles: ['teachPanel', 'E ladder'] },
  { file: 'js/sims/modern.js', id: 'simultaneity', needles: ['teachPanel'] },
];

/** Sims whose draw still mixes port wires and full-stage I–U without a panel — banned patterns. */
const banned = [
  {
    file: 'js/sims/circuits.js',
    id: 'circuit',
    // Old layout put gy near the floor while ports spanned most of the stage.
    bad: /const gy = h \* 0\.8[0-9]/,
    hint: 'I–U must live inside teachPanel, not at h·0.8x over the schematic',
  },
];

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
for (const row of banned) {
  const src = fs.readFileSync(path.join(root, row.file), 'utf8');
  if (row.bad.test(src)) {
    failed += 1;
    console.error(`FAIL ${row.id}: ${row.hint}`);
  }
}

if (failed) {
  console.error(`lint-teach-layout: ${failed} failure(s)`);
  process.exit(1);
}
console.log(`ok lint-teach-layout (${requiredTeachPanel.length} dual-view checks)`);
