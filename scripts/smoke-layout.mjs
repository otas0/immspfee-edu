import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getSim } from '../js/sims/registry.js';
import { CIRCUIT_LINKS, circuit } from '../js/physics/circuits.js';
import {
  uniChapterOpen,
  uniAllFoldsMap,
  UNI_FOLD_KEY,
  readUniFoldsFrom,
  writeUniFoldsTo,
  pruneUniFoldsMap,
  foldCurrentHint,
} from '../js/uni-fold.js';
import {
  clearWrongLeavingHousehold,
  clearWrongLeavingDebug,
  readoutClass,
  isCanvasBufferError,
} from '../js/ui-chrome.js';
import { getBook, flatten, findLesson } from '../js/curricula/index.js';
import { STR, t } from '../js/i18n.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Layout smoke without native canvas: record 2d ops from draw() and assert
 * teaching panels sit in the expected bands.
 */

function mockCtx() {
  const ops = [];
  const ctx = {
    ops,
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    font: '',
    textAlign: 'left',
    textBaseline: 'middle',
    clearRect() { ops.push(['clear']); },
    fillRect(x, y, w, h) { ops.push(['fillRect', +x, +y, +w, +h, String(this.fillStyle)]); },
    strokeRect(x, y, w, h) { ops.push(['strokeRect', +x, +y, +w, +h]); },
    beginPath() { ops.push(['beginPath']); },
    moveTo(x, y) { ops.push(['moveTo', +x, +y]); },
    lineTo(x, y) { ops.push(['lineTo', +x, +y]); },
    quadraticCurveTo() { ops.push(['quad']); },
    arc(x, y, r) { ops.push(['arc', +x, +y, +r]); },
    fill() { ops.push(['fill', String(this.fillStyle)]); },
    stroke() { ops.push(['stroke', String(this.strokeStyle)]); },
    closePath() {},
    setLineDash() {},
    save() {},
    restore() {},
    drawImage() { ops.push(['drawImage']); },
    fillText(str, x, y) { ops.push(['fillText', String(str), +x, +y]); },
    measureText(str) { return { width: String(str).length * 6 }; },
  };
  return ctx;
}

// Node has no canvas: mock OffscreenCanvas so Ising N≥12 uses the buffered path.
if (typeof globalThis.OffscreenCanvas === 'undefined') {
  globalThis.OffscreenCanvas = class OffscreenCanvas {
    constructor(w, h) {
      this.width = w;
      this.height = h;
    }
    getContext() {
      return mockCtx();
    }
  };
}

async function runDraw(id, w, h, patchUi = {}, patchParams = {}) {
  const sim = await getSim(id);
  if (!sim) throw new Error(`missing sim ${id}`);
  const p = { ...sim.params, ...patchParams };
  const ui = { lang: 'en', wrong: false, ...patchUi };
  const d = typeof sim.computeForUi === 'function'
    ? sim.computeForUi(p, 0, ui)
    : sim.compute(p, 0);
  const ctx = mockCtx();
  sim.draw(ctx, w, h, p, d, ui);
  return { sim, ctx, d, ui, w, h, p };
}

function panelFills(ops) {
  return ops.filter((o) => o[0] === 'fillRect' && o[5].includes('fffdf8'));
}

function hasText(ops, re) {
  return ops.some((o) => o[0] === 'fillText' && re.test(o[1]));
}

let failed = 0;

{
  const { ctx, w, h } = await runDraw('projectile', 320, 480);
  const panels = panelFills(ctx.ops);
  if (panels.length < 1) {
    failed += 1;
    console.error('FAIL projectile@320: no teachPanel');
  } else {
    const [, x, y, pw] = panels[0];
    if (!(y >= h * 0.35 && x <= w * 0.15 && pw >= w * 0.7)) {
      failed += 1;
      console.error('FAIL projectile@320: panel should be full-width under the path', { x, y, pw, w, h });
    } else {
      console.log('ok projectile@320 stacked panel', { y: y.toFixed(0), pw: pw.toFixed(0) });
    }
  }
}

{
  const { ctx, w } = await runDraw('projectile', 640, 400);
  const panels = panelFills(ctx.ops);
  const [, x] = panels[0] || [];
  if (!(panels.length >= 1 && x >= w * 0.45)) {
    failed += 1;
    console.error('FAIL projectile@640: panel should sit on the right', { x, w });
  } else console.log('ok projectile@640 right panel', { x: x.toFixed(0) });
}

{
  const { ctx, w } = await runDraw('finite-well', 640, 400);
  const panels = panelFills(ctx.ops);
  if (panels.length < 2) {
    failed += 1;
    console.error('FAIL finite-well: expected two teachPanels', panels.length);
  } else {
    const left = panels[0];
    const right = panels[1];
    if (!(left[1] < w * 0.2 && right[1] > w * 0.45)) {
      failed += 1;
      console.error('FAIL finite-well: L/R panel x', { left: left[1], right: right[1] });
    } else console.log('ok finite-well L/R panels');
  }
}

{
  const { ctx, w } = await runDraw('finite-well', 640, 400, { wrong: true });
  const tags = ctx.ops.filter((o) => o[0] === 'fillText' && /^∞\d+$/.test(o[1]));
  const clipped = tags.filter((o) => o[2] > w * 0.96);
  if (!tags.length) {
    failed += 1;
    console.error('FAIL finite-well wrong: no ∞ tags drawn');
  } else if (clipped.length) {
    failed += 1;
    console.error('FAIL finite-well wrong: ∞ tags past right edge', clipped);
  } else {
    console.log('ok finite-well wrong ∞ tags', tags.length);
  }
}

{
  const { ctx, h } = await runDraw('circuit', 640, 440, {}, {
    layout: 'household', links: CIRCUIT_LINKS.household, E: 220, r: 2, R1: 484, R2: 0, Rs: 0, t: 1, closed: true,
  });
  const panels = panelFills(ctx.ops);
  if (panels.length < 1 || panels[0][2] < h * 0.5) {
    failed += 1;
    console.error('FAIL circuit: I–U teachPanel should sit in the lower band', panels[0]);
  } else console.log('ok circuit I–U panel band', { y: panels[0][2].toFixed(0) });
}

{
  // Default N=12 uses OffscreenCanvas buffer (mocked above) — no N=8 special case.
  const { ctx, w } = await runDraw('ising', 640, 400, {}, { N: 24 });
  const panels = panelFills(ctx.ops);
  if (panels.length < 1 || panels[0][1] < w * 0.35) {
    failed += 1;
    console.error('FAIL ising: |M|(T) panel should sit on the right', panels[0]);
  } else if (!ctx.ops.some((o) => o[0] === 'drawImage')) {
    failed += 1;
    console.error('FAIL ising N=24: expected OffscreenCanvas drawImage path');
  } else console.log('ok ising |M| panel + Offscreen buffer', { x: panels[0][1].toFixed(0) });
}

{
  // Convex-lens 2F hysteresis: no flicker when crossing the landmark.
  const sim = await getSim('convex-lens');
  const ui = { lang: 'en' };
  const f = 10;
  const seq = [30, 22, 20, 16, 12, 5, 12, 20];
  const seen = [];
  for (const u of seq) {
    const p = { ...sim.params, u, f };
    const d = sim.compute(p);
    const ctx = mockCtx();
    sim.draw(ctx, 640, 400, p, d, ui);
    seen.push(hasText(ctx.ops, /^2F$/));
  }
  // far → near show; stay through soft far; hard far hide; soft far stay hidden; near show again
  const expect = [false, true, true, true, true, false, false, true];
  if (seen.length !== expect.length || seen.some((v, i) => v !== expect[i])) {
    failed += 1;
    console.error('FAIL convex-lens 2F hysteresis flicker', { seen, expect, seq });
  } else console.log('ok convex-lens 2F hysteresis', seq.join('→'));
}

{
  const panelX = 640 * 0.42;
  const gy = 0.14 * 400 + 0.78 * 400 * 0.88;
  const gh = 0.78 * 400 * 0.7;
  const envBaseY = gy - gh * 0.5;
  const screenX = panelX - 2;
  for (const envelope of [true, false]) {
    const { ctx, d } = await runDraw('double-slit', 640, 400, {}, { envelope });
    if (!!d.useEnv !== envelope) {
      failed += 1;
      console.error('FAIL double-slit: useEnv should track envelope', { envelope, useEnv: d.useEnv });
      continue;
    }
    const edgeHits = ctx.ops.filter((o) => o[0] === 'lineTo'
      && Math.abs(o[1] - screenX) < 1
      && Math.abs(o[2] - envBaseY) < 1.5);
    if (edgeHits.length < 2) {
      failed += 1;
      console.error('FAIL double-slit: guide rays should meet central-max baseline', {
        envelope, edgeHits, envBaseY,
      });
    } else console.log('ok double-slit guide rays → central max', { envelope, n: edgeHits.length });
  }
}

{
  const bypass = circuit({
    layout: 'series', links: 'bp-s1,s2-a1,a2-b1,b2-bn,a1-a2', closed: true, E: 3, r: 0.5, R1: 4, R2: 6, Rs: 10,
  });
  const sim = await getSim('circuit');
  const row = sim.readouts(bypass).find((r) => r.en === 'Path' || r.zh === '电路');
  const val = row?.value;
  if (!val || val.en !== 'load bypassed' || val.zh !== '负载被旁路') {
    failed += 1;
    console.error('FAIL load-bypassed EN/ZH readout pair', val);
  } else if (!row.warn) {
    failed += 1;
    console.error('FAIL load-bypassed: Path readout should warn (#a33) to match canvas');
  } else console.log('ok load-bypassed EN/ZH + warn', val);
}

{
  // Minkowski β track sits below the panel with a vertical gutter for labels.
  const { ctx, w, h } = await runDraw('simultaneity', 640, 400, {}, { beta: 0.5 });
  const panels = panelFills(ctx.ops);
  if (panels.length < 1) {
    failed += 1;
    console.error('FAIL minkowski: missing teachPanel');
  } else {
    const panelBottom = panels[0][2] + panels[0][4];
    const trackY = h * 0.88;
    const midGutter = (panelBottom + trackY) / 2;
    const dragLabel = ctx.ops.find((o) => o[0] === 'fillText' && /Drag β|拖动 β/.test(o[1]));
    const betaLabel = ctx.ops.find((o) => o[0] === 'fillText' && /^β=/.test(o[1]));
    // fillText ops: [tag, str, x, y]
    const gutterOk = dragLabel && betaLabel
      && Math.abs(dragLabel[3] - (midGutter - 8)) < 1.5
      && Math.abs(betaLabel[3] - (midGutter + 8)) < 1.5
      && dragLabel[3] > panelBottom + 4
      && betaLabel[3] < trackY - 4;
    if (!gutterOk) {
      failed += 1;
      console.error('FAIL minkowski: β gutter labels should sit between panel and track', {
        panelBottom, trackY, midGutter, dragY: dragLabel?.[3], betaY: betaLabel?.[3], w,
      });
    } else console.log('ok minkowski β gutter', { midGutter: midGutter.toFixed(0) });
  }
}

{
  const house = await runDraw('circuit', 640, 400, { wrong: true }, {
    layout: 'household', links: CIRCUIT_LINKS.household, E: 220, r: 2, R1: 484, R2: 0, Rs: 0, t: 1, closed: true,
  });
  if (!house.d.batteryShort) {
    failed += 1;
    console.error('FAIL household debug bp–bn: computeForUi should report batteryShort');
  } else if (!hasText(house.ctx.ops, /short circuit|短路/)) {
    failed += 1;
    console.error('FAIL household debug bp–bn: stage should label short');
  } else console.log('ok household debug forces bp–bn short');
}

{
  // Leaving household clears ui.wrong (app setParam → clearWrongLeavingHousehold).
  const ui = { wrong: true };
  clearWrongLeavingHousehold('layout', 'series', ui);
  if (ui.wrong !== false) {
    failed += 1;
    console.error('FAIL leave household: ui.wrong should be false', ui);
  } else {
    ui.wrong = true;
    clearWrongLeavingHousehold('layout', 'household', ui);
    if (ui.wrong !== true) {
      failed += 1;
      console.error('FAIL stay on household: ui.wrong must remain');
    } else console.log('ok leave household clears ui.wrong');
  }
}

{
  // Product: leaving Debug clears ui.wrong; 上一步 Debug→Check uses the same helper.
  const ui = { wrong: true };
  clearWrongLeavingDebug('debug', 'explore', ui);
  if (ui.wrong !== false) {
    failed += 1;
    console.error('FAIL leave debug: ui.wrong should be false');
  } else {
    ui.wrong = true;
    clearWrongLeavingDebug('debug', 'check', ui);
    if (ui.wrong !== false) {
      failed += 1;
      console.error('FAIL leave debug via 上一步 (→check): ui.wrong should be false');
    } else {
      ui.wrong = true;
      clearWrongLeavingDebug('debug', 'debug', ui);
      if (ui.wrong !== true) {
        failed += 1;
        console.error('FAIL stay on debug: ui.wrong must remain');
      } else console.log('ok leave debug / 上一步 clears ui.wrong');
    }
  }
}

{
  // DOM class + CSS: Path warn → .readout.warn → #a33 (same as canvas fault ink).
  const bypass = circuit({
    layout: 'series', links: 'bp-s1,s2-a1,a2-b1,b2-bn,a1-a2', closed: true, E: 3, r: 0.5, R1: 4, R2: 6, Rs: 10,
  });
  const sim = await getSim('circuit');
  const row = sim.readouts(bypass).find((r) => r.en === 'Path');
  const cls = readoutClass(row);
  const css = fs.readFileSync(path.join(root, 'css/edu.css'), 'utf8');
  const cssOk = /\.readout\.warn span,\s*\.readout\.warn strong\s*\{\s*color:\s*#a33/.test(css);
  if (cls !== 'readout warn' || !cssOk) {
    failed += 1;
    console.error('FAIL bypass Path DOM warn/#a33', { cls, cssOk });
  } else console.log('ok bypass Path .readout.warn → #a33');
}

{
  // University fold: empty map → only current chapter open.
  const book = getBook('university');
  const rows = flatten(book);
  const currentCh = rows[0]?.chapter?.id;
  if (!currentCh || book.chapters.length < 2) {
    failed += 1;
    console.error('FAIL uni fold: need ≥2 chapters');
  } else {
    const openIds = book.chapters
      .filter((ch) => uniChapterOpen(ch.id, currentCh, {}, false))
      .map((ch) => ch.id);
    const searchOpen = book.chapters.every((ch) => uniChapterOpen(ch.id, currentCh, {}, true));
    const savedKeepsClosed = uniChapterOpen(currentCh, currentCh, { [currentCh]: false }, false) === false;
    if (openIds.length !== 1 || openIds[0] !== currentCh) {
      failed += 1;
      console.error('FAIL uni fold default: only current chapter open', { openIds, currentCh });
    } else if (!searchOpen || !savedKeepsClosed) {
      failed += 1;
      console.error('FAIL uni fold search/saved map', { searchOpen, savedKeepsClosed });
    } else console.log('ok uni fold default current-only + search/saved', { currentCh });
  }

  // Expand all / collapse all tools ↔ uniChapterOpen.
  const expandMap = uniAllFoldsMap(book.chapters, true);
  const collapseMap = uniAllFoldsMap(book.chapters, false);
  const allOpen = book.chapters.every((ch) => uniChapterOpen(ch.id, currentCh, expandMap, false));
  const allClosed = book.chapters.every((ch) => uniChapterOpen(ch.id, currentCh, collapseMap, false) === false);
  if (!allOpen || !allClosed || Object.keys(expandMap).length !== book.chapters.length) {
    failed += 1;
    console.error('FAIL uni fold expand/collapse all', { allOpen, allClosed, n: Object.keys(expandMap).length });
  } else console.log('ok uni fold expand/collapse all ↔ uniChapterOpen');

  // fold-hint 「当前学科」 names the same chapter that defaults to open.
  const sample = findLesson('university', rows[0].lesson.id);
  const hintCh = sample?.chapter;
  const hint = foldCurrentHint(t('zh', 'foldCurrent'), hintCh?.title?.zh || '');
  const defaultOpen = book.chapters.find((ch) => uniChapterOpen(ch.id, hintCh?.id, {}, false));
  if (!hintCh || !defaultOpen || defaultOpen.id !== hintCh.id || !hint.includes(hintCh.title.zh)) {
    failed += 1;
    console.error('FAIL uni fold hint vs default open chapter', { hint, hintCh: hintCh?.id, defaultOpen: defaultOpen?.id });
  } else console.log('ok uni fold hint ↔ default open chapter', hintCh.id);

  // Mock localStorage: expand-all write → read → prune stale ids.
  const mem = new Map();
  const storage = {
    getItem: (k) => (mem.has(k) ? mem.get(k) : null),
    setItem: (k, v) => { mem.set(k, String(v)); },
  };
  writeUniFoldsTo(storage, uniAllFoldsMap(book.chapters, true));
  const stored = readUniFoldsFrom(storage);
  const valid = new Set(book.chapters.map((ch) => ch.id));
  stored['__gone__'] = true;
  writeUniFoldsTo(storage, stored);
  const pruned = pruneUniFoldsMap(readUniFoldsFrom(storage), valid);
  if (pruned.map.__gone__ || !pruned.changed || Object.keys(pruned.map).length !== book.chapters.length) {
    failed += 1;
    console.error('FAIL uni fold storage mock prune', pruned);
  } else if (storage.getItem(UNI_FOLD_KEY) == null) {
    failed += 1;
    console.error('FAIL uni fold storage key missing');
  } else {
    writeUniFoldsTo(storage, pruned.map);
    const again = readUniFoldsFrom(storage);
    const stillAllOpen = book.chapters.every((ch) => uniChapterOpen(ch.id, currentCh, again, false));
    if (!stillAllOpen) {
      failed += 1;
      console.error('FAIL uni fold storage round-trip expand map');
    } else console.log('ok uni fold localStorage mock write/read/prune');
  }
}

{
  // Double-slit: envelope toggle + width-bar drag updates a.
  const sim = await getSim('double-slit');
  const ui = { lang: 'en', wrong: false };
  let p = { ...sim.params, envelope: false, a: 4e-5 };
  let d = sim.compute(p);
  if (d.useEnv) {
    failed += 1;
    console.error('FAIL double-slit: envelope false → useEnv false');
  } else {
    const ctx = mockCtx();
    sim.draw(ctx, 640, 400, p, d, ui);
    const g = ui._slit;
    if (!g) {
      failed += 1;
      console.error('FAIL double-slit: missing _slit after draw');
    } else {
      sim.pointer({ type: 'down', x: g.barX, y: g.yLo }, p, d, ui);
      if (ui.drag !== 'width') {
        failed += 1;
        console.error('FAIL double-slit: width bar down should set drag');
      } else {
        const a0 = p.a;
        const patch = sim.pointer({ type: 'move', x: g.barX, y: g.yLo - 50 }, p, d, ui);
        if (!patch || Math.abs(patch.a - a0) < 1e-12) {
          failed += 1;
          console.error('FAIL double-slit: width drag should change a', { patch, a0 });
        } else {
          p = { ...p, ...patch, envelope: true };
          d = sim.compute(p);
          if (!d.useEnv) {
            failed += 1;
            console.error('FAIL double-slit: envelope true → useEnv true');
          } else {
            const ctx2 = mockCtx();
            sim.draw(ctx2, 640, 400, p, d, ui);
            const g2 = ui._slit;
            ui.drag = null;
            sim.pointer({ type: 'down', x: g2.barX, y: g2.yLo }, p, d, ui);
            if (ui.drag !== 'width') {
              failed += 1;
              console.error('FAIL double-slit: width bar must stay hittable after envelope on');
            } else {
              p = { ...p, envelope: false };
              d = sim.compute(p);
              sim.draw(mockCtx(), 640, 400, p, d, ui);
              const g3 = ui._slit;
              ui.drag = null;
              sim.pointer({ type: 'down', x: g3.barX, y: (g3.yLo + g3.yHi) / 2 }, p, d, ui);
              if (ui.drag !== 'width') {
                failed += 1;
                console.error('FAIL double-slit: width bar must stay hittable after envelope off');
              } else {
                // Clamp a to schema [1e-5, 2e-4].
                const aField = sim.schema.find((f) => f.key === 'a');
                const amin = aField.min;
                const amax = aField.max;
                ui.drag = 'width';
                const gClamp = ui._slit;
                // Near envelope baseline → tiny half → a hits max.
                const atMax = sim.pointer({
                  type: 'move',
                  x: gClamp.barX,
                  y: gClamp.gy - gClamp.gh * 0.5,
                }, p, d, ui);
                ui._betaLast = null;
                const atMin = sim.pointer({
                  type: 'move',
                  x: gClamp.barX,
                  y: gClamp.gy,
                }, p, d, ui);
                sim.pointer({ type: 'up', x: g3.barX, y: g3.yLo }, p, d, ui);
                if (!atMax || Math.abs(atMax.a - amax) > 1e-12 || !atMin || Math.abs(atMin.a - amin) > 1e-12) {
                  failed += 1;
                  console.error('FAIL double-slit width drag clamp to schema a', { atMax, atMin, amin, amax });
                } else {
                  console.log('ok double-slit envelope + width-bar drag/hit/clamp', { a0, amin, amax });
                }
              }
            }
          }
        }
      }
    }
  }
}

{
  // Minkowski β pointer snaps to 0.05; onParam lockstep.
  const sim = await getSim('simultaneity');
  const ui = { lang: 'en', wrong: false };
  let p = { ...sim.params, beta: 0.5 };
  let d = sim.compute(p);
  const ctx = mockCtx();
  sim.draw(ctx, 640, 400, p, d, ui);
  const tr = ui._vTrack;
  const snap = sim.onParam('beta', 0.73);
  const loSnap = sim.onParam('beta', 0.049);
  const hiSnap = sim.onParam('beta', 0.951);
  if (!snap.beta || Math.abs(snap.beta - 0.75) > 1e-9) {
    failed += 1;
    console.error('FAIL minkowski onParam: 0.73 should snap to 0.75', snap);
  } else if (!loSnap.beta || Math.abs(loSnap.beta - 0.05) > 1e-9
    || !hiSnap.beta || Math.abs(hiSnap.beta - 0.95) > 1e-9) {
    failed += 1;
    console.error('FAIL minkowski onParam endpoints 0.049→0.05 / 0.951→0.95', { loSnap, hiSnap });
  } else if (!tr) {
    failed += 1;
    console.error('FAIL minkowski: missing _vTrack');
  } else {
    const target = 0.7;
    const hx = tr.trackX0 + ((target - 0.05) / 0.9) * (tr.trackX1 - tr.trackX0);
    ui._betaLast = null;
    ui._betaAt = 0;
    sim.pointer({ type: 'down', x: hx, y: tr.trackY }, p, d, ui);
    const patch = sim.pointer({ type: 'move', x: hx, y: tr.trackY }, p, d, ui);
    if (!patch || Math.abs(patch.beta - target) > 1e-9) {
      failed += 1;
      console.error('FAIL minkowski pointer: β should snap to 0.05 grid', { patch, target });
    } else {
      // Sequence along the track stays on 0.05 steps, including endpoints.
      const steps = [0.05, 0.1, 0.25, 0.55, 0.9, 0.95];
      let bad = null;
      for (const b of steps) {
        const x = tr.trackX0 + ((b - 0.05) / 0.9) * (tr.trackX1 - tr.trackX0);
        ui._betaLast = null;
        ui._betaAt = 0;
        const expect = Math.round(b / 0.05) * 0.05;
        const got = sim.pointer({ type: 'move', x, y: tr.trackY }, p, d, ui);
        if (!got || Math.abs(got.beta - expect) > 1e-9) {
          bad = { b, expect, got };
          break;
        }
      }
      ui._betaLast = null;
      ui._betaAt = 0;
      const lo = sim.pointer({ type: 'move', x: tr.trackX0 - 20, y: tr.trackY }, p, d, ui);
      ui._betaLast = null;
      ui._betaAt = 0;
      const hi = sim.pointer({ type: 'move', x: tr.trackX1 + 20, y: tr.trackY }, p, d, ui);
      if (bad) {
        failed += 1;
        console.error('FAIL minkowski β pointer sequence lockstep', bad);
      } else if (!lo || Math.abs(lo.beta - 0.05) > 1e-9 || !hi || Math.abs(hi.beta - 0.95) > 1e-9) {
        failed += 1;
        console.error('FAIL minkowski β endpoints 0.05/0.95', { lo, hi });
      } else console.log('ok minkowski β pointer + endpoints 0.05/0.95 lockstep');
    }
  }
}

{
  // Ising without OffscreenCanvas/document must throw a clear error (then restore mock).
  // Use a new N so isingBuf side changes and recreation is attempted.
  const saved = globalThis.OffscreenCanvas;
  delete globalThis.OffscreenCanvas;
  const hadDoc = typeof globalThis.document !== 'undefined';
  const savedDoc = globalThis.document;
  if (hadDoc) delete globalThis.document;
  let threw = null;
  try {
    await runDraw('ising', 700, 420, {}, { N: 36 });
  } catch (e) {
    threw = e;
  }
  globalThis.OffscreenCanvas = saved;
  if (hadDoc) globalThis.document = savedDoc;
  else if ('document' in globalThis) delete globalThis.document;
  if (!threw || !isCanvasBufferError(threw)) {
    failed += 1;
    console.error('FAIL ising: N≥12 without canvas APIs should throw a clear Error', threw);
  } else if (!STR.en.isingCanvasNeed || !STR.zh.isingCanvasNeed) {
    failed += 1;
    console.error('FAIL ising: i18n isingCanvasNeed toast keys missing');
  } else console.log('ok ising clear error + i18n toast keys');
}

if (failed) {
  console.error(`smoke-layout: ${failed} failure(s)`);
  process.exit(1);
}
console.log('ok smoke-layout');
