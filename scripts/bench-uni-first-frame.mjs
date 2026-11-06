#!/usr/bin/env node
/**
 * Local first-open cost for university after subject-volume split.
 * Measures cold getSim + compute + draw for uni-cm-1, and counts how many
 * distinct registry groups the open volume would prefetch vs the whole book.
 *
 * Usage: node scripts/bench-uni-first-frame.mjs
 */
import { performance } from 'node:perf_hooks';
import { getBook, flatten } from '../js/curricula/index.js';
import { getSim, prefetchSims } from '../js/sims/registry.js';

function mockCtx() {
  const ops = [];
  const proxy = new Proxy({
    ops,
    canvas: { width: 640, height: 400 },
    measureText: (s) => ({ width: String(s).length * 6 }),
  }, {
    get(t, prop) {
      if (prop in t) return t[prop];
      return (...args) => { ops.push([prop, ...args]); return t; };
    },
  });
  return proxy;
}

function groupsForSims(ids, MAP) {
  const g = new Set();
  for (const id of ids) {
    const row = MAP[id];
    if (row) g.add(row[0]);
  }
  return [...g].sort();
}

const book = getBook('university');
const rows = flatten(book);
const cm = rows.filter((r) => r.chapter.volume === 'uni-cm');
const all = rows.filter((r) => r.lesson.sim);
const cmIds = [...new Set(cm.map((r) => r.lesson.sim))];
const allIds = [...new Set(all.map((r) => r.lesson.sim))];

// Pull MAP via a throwaway getSim so registry is loaded, then read private via eval of module text is heavy —
// instead count via getSim cache warm of first id + prefetch list sizes.
const firstId = cm.find((r) => r.lesson.id === 'uni-cm-1')?.lesson.sim || cmIds[0];

const t0 = performance.now();
const sim = await getSim(firstId);
const tLoad = performance.now();
const params = { ...sim.params, ...(cm.find((r) => r.lesson.sim === firstId)?.lesson.preset || {}) };
const d = sim.compute(params, 0);
const tCompute = performance.now();
const ctx = mockCtx();
sim.draw(ctx, 640, 400, params, d, { lang: 'en' });
const tDraw = performance.now();

const loadMs = tLoad - t0;
const computeMs = tCompute - tLoad;
const drawMs = tDraw - tCompute;
const firstFrameMs = tDraw - t0;

// Prefetch surface: chapter-first for uni-cm chapter only (volume rest empty when one chapter / volume).
const chapterIds = cm.filter((r) => r.chapter.id === 'uni-cm').map((r) => r.lesson.sim);
const volumeRest = cmIds.filter((id) => !chapterIds.includes(id));

const tPref0 = performance.now();
await prefetchSims(chapterIds);
const tPref = performance.now() - tPref0;

console.log(JSON.stringify({
  firstSim: firstId,
  loadMs: +loadMs.toFixed(2),
  computeMs: +computeMs.toFixed(2),
  drawMs: +drawMs.toFixed(2),
  firstFrameMs: +firstFrameMs.toFixed(2),
  prefetchChapterMs: +tPref.toFixed(2),
  uniCmSimCount: cmIds.length,
  wholeBookSimCount: allIds.length,
  chapterPrefetchCount: chapterIds.length,
  volumeRestCount: volumeRest.length,
  subjectVolumes: book.volumes.map((v) => v.id),
  note: 'Cold Node import cost; browser network differs. Subject volumes cut idle prefetch vs one uni blob.',
}, null, 2));

if (!(firstFrameMs >= 0) || !sim?.id) {
  console.error('FAIL bench-uni-first-frame');
  process.exit(1);
}
console.log('ok bench-uni-first-frame');
