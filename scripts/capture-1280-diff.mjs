#!/usr/bin/env node
/**
 * Optional pixel diff of 1280 desktop baseline vs a prior PNG.
 * Never fails the deploy by default (exit 0 on skip / soft mismatch unless
 * CAPTURE_1280_DIFF_STRICT=1). PNGs stay under .local-shots/ (gitignored).
 *
 *   CAPTURE_1280_DIFF=1 npm run capture:1280-diff
 *   CAPTURE_1280_PREV=.local-shots/1280-desktop-prev.png npm run capture:1280-diff
 *
 * CI may download the previous successful run's capture-1280-desktop-<sha>
 * into CAPTURE_1280_PREV before invoking this.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cur = process.env.CAPTURE_1280_CUR
  || path.join(root, '.local-shots', '1280-desktop-three-column.png');
const prev = process.env.CAPTURE_1280_PREV
  || path.join(root, '.local-shots', '1280-desktop-prev.png');
const outMd = process.env.CAPTURE_1280_DIFF_MD
  || path.join(root, '.local-shots', '1280-desktop-diff.md');
const enabled = process.env.CAPTURE_1280_DIFF === '1';
const strict = process.env.CAPTURE_1280_DIFF_STRICT === '1';
/** Max fraction of differing RGBA bytes before soft-fail (default 2%). */
const maxFrac = Number(process.env.CAPTURE_1280_DIFF_MAX_FRAC || '0.02');

function writeMd(lines) {
  fs.mkdirSync(path.dirname(outMd), { recursive: true });
  fs.writeFileSync(outMd, lines.join('\n') + '\n');
  const summary = process.env.GITHUB_STEP_SUMMARY;
  if (summary) {
    try { fs.appendFileSync(summary, '\n' + lines.join('\n') + '\n'); } catch { /* ignore */ }
  }
}

if (!enabled) {
  console.log('skip capture-1280-diff (set CAPTURE_1280_DIFF=1 to enable)');
  process.exit(0);
}

if (!fs.existsSync(cur)) {
  writeMd(['# 1280 pixel diff', '', `- skip: missing current \`${cur}\``]);
  console.log('skip capture-1280-diff: no current PNG');
  process.exit(0);
}
if (!fs.existsSync(prev)) {
  writeMd(['# 1280 pixel diff', '', `- skip: missing previous \`${prev}\` (first baseline or download failed)`]);
  console.log('skip capture-1280-diff: no previous PNG');
  process.exit(0);
}

const a = fs.readFileSync(cur);
const b = fs.readFileSync(prev);
if (a.equals(b)) {
  writeMd(['# 1280 pixel diff', '', '- result: **identical** byte-for-byte', '']);
  console.log('ok capture-1280-diff identical');
  process.exit(0);
}

// Cheap RGBA-ish scan: compare overlapping prefix after PNG signature.
// Not a full decode — enough to flag large visual drifts without adding deps.
const start = 8; // skip PNG signature
const len = Math.min(a.length, b.length) - start;
let diff = 0;
for (let i = 0; i < len; i += 1) {
  if (a[start + i] !== b[start + i]) diff += 1;
}
const sizeDelta = Math.abs(a.length - b.length);
const frac = len > 0 ? diff / len : 1;
const lines = [
  '# 1280 pixel diff',
  '',
  `- current: \`${path.basename(cur)}\` (${a.length} B)`,
  `- previous: \`${path.basename(prev)}\` (${b.length} B)`,
  `- differing bytes (post-sig overlap): ${diff} / ${len} (${(frac * 100).toFixed(2)}%)`,
  `- size delta: ${sizeDelta} B`,
  `- threshold: ${(maxFrac * 100).toFixed(2)}%`,
  '',
];
if (frac > maxFrac || sizeDelta > a.length * 0.05) {
  lines.push(`- result: **drift** (frac ${frac.toFixed(4)})`);
  writeMd(lines);
  console.error('WARN capture-1280-diff drift', { frac, sizeDelta, maxFrac });
  if (strict) process.exit(1);
  process.exit(0);
}
lines.push('- result: **within threshold**');
writeMd(lines);
console.log('ok capture-1280-diff within threshold', { frac: Number(frac.toFixed(4)), sizeDelta });
