import { getSim } from '../js/sims/registry.js';

/**
 * Layout smoke without native canvas: record 2d ops from draw() and assert
 * teaching panels sit in the expected bands (projectile @320, finite-well L/R).
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

async function runDraw(id, w, h, patchUi = {}) {
  const sim = await getSim(id);
  if (!sim) throw new Error(`missing sim ${id}`);
  const p = { ...sim.params };
  const d = typeof sim.tMax === 'function'
    ? sim.compute(p, 0)
    : sim.compute(p, 0);
  const ui = { lang: 'en', wrong: false, ...patchUi };
  const ctx = mockCtx();
  sim.draw(ctx, w, h, p, d, ui);
  return { sim, ctx, d, ui, w, h };
}

function panelFills(ops) {
  return ops.filter((o) => o[0] === 'fillRect' && o[5].includes('fffdf8'));
}

let failed = 0;

{
  const { ctx, w, h } = await runDraw('projectile', 320, 480);
  const panels = panelFills(ctx.ops);
  if (panels.length < 1) {
    failed += 1;
    console.error('FAIL projectile@320: no teachPanel');
  } else {
    const [, x, y, pw, ph] = panels[0];
    // Narrow stack: panel starts in the lower half.
    if (!(y >= h * 0.35 && x <= w * 0.15 && pw >= w * 0.7)) {
      failed += 1;
      console.error('FAIL projectile@320: panel should be full-width under the path', { x, y, pw, ph, w, h });
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

if (failed) {
  console.error(`smoke-layout: ${failed} failure(s)`);
  process.exit(1);
}
console.log('ok smoke-layout');
