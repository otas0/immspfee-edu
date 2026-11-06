import { getSim } from '../js/sims/registry.js';
import { CIRCUIT_LINKS, circuit } from '../js/physics/circuits.js';

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
    fillText(str, x, y) { ops.push(['fillText', String(str), +x, +y]); },
    measureText(str) { return { width: String(str).length * 6 }; },
  };
  return ctx;
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
  // N < 12 avoids OffscreenCanvas / document fallback in Node smoke.
  const { ctx, w } = await runDraw('ising', 640, 400, {}, { N: 8 });
  const panels = panelFills(ctx.ops);
  if (panels.length < 1 || panels[0][1] < w * 0.35) {
    failed += 1;
    console.error('FAIL ising: |M|(T) panel should sit on the right', panels[0]);
  } else console.log('ok ising |M| panel', { x: panels[0][1].toFixed(0) });
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
  const { ctx } = await runDraw('double-slit', 640, 400, {}, { useEnv: true });
  const rays = ctx.ops.filter((o) => o[0] === 'lineTo' || o[0] === 'moveTo');
  // Guide rays: two move/line pairs ending at the same env-baseline Y near panelX.
  const panelX = 640 * 0.42;
  const gy = 0.14 * 400 + 0.78 * 400 * 0.88;
  const gh = 0.78 * 400 * 0.7;
  const envBaseY = gy - gh * 0.5;
  const hits = ctx.ops.filter((o) => (o[0] === 'lineTo' || o[0] === 'moveTo')
    && Math.abs(o[1] - (panelX - 2)) < 1
    && Math.abs(o[2] - envBaseY) < 1.5);
  // line() uses moveTo+lineTo via kit — count lineTo at screen edge
  const edgeHits = ctx.ops.filter((o) => o[0] === 'lineTo'
    && Math.abs(o[1] - (panelX - 2)) < 1
    && Math.abs(o[2] - envBaseY) < 1.5);
  if (edgeHits.length < 2) {
    failed += 1;
    console.error('FAIL double-slit: guide rays should meet envelope baseline at panel edge', {
      edgeHits, envBaseY, hits: hits.length, sample: rays.slice(0, 6),
    });
  } else console.log('ok double-slit guide rays on envelope baseline', edgeHits.length);
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
  } else console.log('ok load-bypassed EN/ZH', val);
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

if (failed) {
  console.error(`smoke-layout: ${failed} failure(s)`);
  process.exit(1);
}
console.log('ok smoke-layout');
