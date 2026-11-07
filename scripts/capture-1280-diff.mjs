#!/usr/bin/env node
/**
 * Optional pixel diff of 1280 desktop baseline vs a prior PNG.
 * Decodes 8-bit RGB/RGBA PNG via zlib (no extra deps). Falls back to a
 * higher byte-threshold compare only if decode fails.
 * Never fails the deploy by default (exit 0 on skip / soft mismatch unless
 * CAPTURE_1280_DIFF_STRICT=1). PNGs stay under .local-shots/ (gitignored).
 *
 *   CAPTURE_1280_DIFF=1 npm run capture:1280-diff
 *   CAPTURE_1280_PREV=.local-shots/1280-desktop-prev.png npm run capture:1280-diff
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
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
/** Max fraction of differing pixels (decoded) before soft-warn (default 1.5%). */
const maxFrac = Number(process.env.CAPTURE_1280_DIFF_MAX_FRAC || '0.015');
/** Per-channel absolute delta to count a pixel as different (default 8). */
const maxChan = Number(process.env.CAPTURE_1280_DIFF_MAX_CHAN || '8');

function writeMd(lines) {
  fs.mkdirSync(path.dirname(outMd), { recursive: true });
  fs.writeFileSync(outMd, lines.join('\n') + '\n');
  const summary = process.env.GITHUB_STEP_SUMMARY;
  if (summary) {
    try { fs.appendFileSync(summary, '\n' + lines.join('\n') + '\n'); } catch { /* ignore */ }
  }
}

/** Decode 8-bit greyscale/RGB/RGBA PNG → { width, height, channels, data: Uint8Array }. */
function decodePng(buf) {
  if (buf.length < 24 || buf[0] !== 0x89 || buf[1] !== 0x50) throw new Error('not PNG');
  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 8;
  let colorType = 6;
  const idats = [];
  while (offset + 12 <= buf.length) {
    const len = buf.readUInt32BE(offset);
    const type = buf.toString('ascii', offset + 4, offset + 8);
    const data = buf.subarray(offset + 8, offset + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === 'IDAT') {
      idats.push(data);
    } else if (type === 'IEND') {
      break;
    }
    offset += 12 + len;
  }
  if (!width || !height) throw new Error('missing IHDR');
  if (bitDepth !== 8) throw new Error(`unsupported bitDepth ${bitDepth}`);
  const channels = ({ 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 })[colorType];
  if (!channels || colorType === 3) throw new Error(`unsupported colorType ${colorType}`);
  const inflated = zlib.inflateSync(Buffer.concat(idats));
  const stride = width * channels;
  const out = new Uint8Array(height * stride);
  let inPos = 0;
  let prevRow = new Uint8Array(stride);
  for (let y = 0; y < height; y += 1) {
    const filter = inflated[inPos++];
    const row = inflated.subarray(inPos, inPos + stride);
    inPos += stride;
    const dst = out.subarray(y * stride, (y + 1) * stride);
    for (let i = 0; i < stride; i += 1) {
      const x = row[i];
      const a = i >= channels ? dst[i - channels] : 0;
      const b = prevRow[i];
      const c = i >= channels ? prevRow[i - channels] : 0;
      let val = x;
      if (filter === 1) val = (x + a) & 255;
      else if (filter === 2) val = (x + b) & 255;
      else if (filter === 3) val = (x + ((a + b) >> 1)) & 255;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        const pr = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
        val = (x + pr) & 255;
      } else if (filter !== 0) {
        throw new Error(`bad filter ${filter}`);
      }
      dst[i] = val;
    }
    prevRow = Uint8Array.from(dst);
  }
  return { width, height, channels, data: out };
}

function pixelDiff(a, b) {
  const w = Math.min(a.width, b.width);
  const h = Math.min(a.height, b.height);
  const ch = Math.min(a.channels, b.channels);
  let diff = 0;
  const total = w * h;
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const ia = (y * a.width + x) * a.channels;
      const ib = (y * b.width + x) * b.channels;
      let hit = false;
      for (let c = 0; c < ch; c += 1) {
        if (Math.abs(a.data[ia + c] - b.data[ib + c]) > maxChan) {
          hit = true;
          break;
        }
      }
      if (hit) diff += 1;
    }
  }
  const sizeMismatch = a.width !== b.width || a.height !== b.height;
  return { diff, total, frac: total ? diff / total : 1, sizeMismatch, w, h, ch };
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

const aBuf = fs.readFileSync(cur);
const bBuf = fs.readFileSync(prev);
if (aBuf.equals(bBuf)) {
  writeMd(['# 1280 pixel diff', '', '- mode: decoded-pixel', '- result: **identical** byte-for-byte', '']);
  console.log('ok capture-1280-diff identical');
  process.exit(0);
}

let mode = 'decoded-pixel';
let lines;
try {
  const da = decodePng(aBuf);
  const db = decodePng(bBuf);
  const r = pixelDiff(da, db);
  lines = [
    '# 1280 pixel diff',
    '',
    `- mode: **${mode}**`,
    `- current: \`${path.basename(cur)}\` ${da.width}×${da.height}×${da.channels} (${aBuf.length} B)`,
    `- previous: \`${path.basename(prev)}\` ${db.width}×${db.height}×${db.channels} (${bBuf.length} B)`,
    `- differing pixels: ${r.diff} / ${r.total} (${(r.frac * 100).toFixed(2)}%)`,
    `- channel tolerance: ±${maxChan}`,
    `- threshold: ${(maxFrac * 100).toFixed(2)}%`,
    r.sizeMismatch ? '- note: dimension mismatch' : '',
    '',
  ].filter(Boolean);
  if (r.frac > maxFrac || r.sizeMismatch) {
    lines.push(`- result: **drift** (frac ${r.frac.toFixed(4)})`);
    writeMd(lines);
    console.error('WARN capture-1280-diff drift', { frac: r.frac, maxFrac, sizeMismatch: r.sizeMismatch });
    if (strict) process.exit(1);
    process.exit(0);
  }
  lines.push('- result: **within threshold**');
  writeMd(lines);
  console.log('ok capture-1280-diff within threshold', { mode, frac: Number(r.frac.toFixed(4)) });
} catch (err) {
  // Fallback: raised byte-threshold (was 2%; now 5%) if decode unsupported.
  mode = 'byte-fallback';
  const start = 8;
  const len = Math.min(aBuf.length, bBuf.length) - start;
  let diff = 0;
  for (let i = 0; i < len; i += 1) {
    if (aBuf[start + i] !== bBuf[start + i]) diff += 1;
  }
  const frac = len > 0 ? diff / len : 1;
  const byteMax = Math.max(maxFrac, 0.05);
  lines = [
    '# 1280 pixel diff',
    '',
    `- mode: **${mode}** (${err && err.message ? err.message : err})`,
    `- differing bytes (post-sig): ${diff} / ${len} (${(frac * 100).toFixed(2)}%)`,
    `- threshold: ${(byteMax * 100).toFixed(2)}%`,
    '',
  ];
  if (frac > byteMax) {
    lines.push(`- result: **drift** (frac ${frac.toFixed(4)})`);
    writeMd(lines);
    console.error('WARN capture-1280-diff byte-fallback drift', { frac, byteMax });
    if (strict) process.exit(1);
    process.exit(0);
  }
  lines.push('- result: **within threshold**');
  writeMd(lines);
  console.log('ok capture-1280-diff within threshold', { mode, frac: Number(frac.toFixed(4)) });
}
