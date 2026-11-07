#!/usr/bin/env node
/**
 * Quick per-sim draw cost probe (mock canvas). Flags outliers that can feel sticky
 * when sliders fire many times per second. Not part of npm test — run on demand:
 *   node scripts/audit-draw-cost.mjs
 */
import { getSim, listSimIds } from '../js/sims/registry.js';

function mockCtx() {
  const ops = [];
  const base = {
    ops,
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    font: '',
    textAlign: 'left',
    textBaseline: 'alphabetic',
    globalAlpha: 1,
    measureText(str) { return { width: String(str).length * 6 }; },
  };
  return new Proxy(base, {
    get(t, prop) {
      if (prop in t) return t[prop];
      if (typeof prop !== 'string') return undefined;
      return (...a) => { ops.push([prop, ...a]); };
    },
    set(t, prop, v) { t[prop] = v; return true; },
  });
}

if (typeof globalThis.OffscreenCanvas === 'undefined') {
  globalThis.OffscreenCanvas = class {
    constructor(w, h) { this.width = w; this.height = h; }
    getContext() { return mockCtx(); }
  };
}

const ids = listSimIds();
const rows = [];
for (const id of ids) {
  const sim = await getSim(id);
  if (!sim?.draw || !sim?.compute) continue;
  const p = { ...sim.params };
  const ui = { lang: 'en', wrong: false };
  const d = typeof sim.computeForUi === 'function' ? sim.computeForUi(p, 0, ui) : sim.compute(p, 0);
  const ctx = mockCtx();
  const t0 = performance.now();
  const N = 40;
  for (let i = 0; i < N; i += 1) sim.draw(ctx, 640, 400, p, d, ui);
  const ms = (performance.now() - t0) / N;
  rows.push({ id, ms, ops: ctx.ops.length / N });
}
rows.sort((a, b) => b.ms - a.ms);
const hot = rows.filter((r) => r.ms >= 1.5 || r.ops >= 800);
console.log(`audited ${rows.length} sims (avg ms/draw @640×400, ${40} runs)`);
for (const r of rows.slice(0, 12)) {
  console.log(`  ${r.ms.toFixed(2)} ms  ops~${r.ops.toFixed(0).padStart(4)}  ${r.id}`);
}
if (hot.length) {
  console.log(`hot (≥1.5ms or ≥800 ops): ${hot.map((r) => r.id).join(', ')}`);
} else {
  console.log('hot: none');
}
