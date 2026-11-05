import { fmt } from '../fmt.js';
import { twoCharges, currentFromCharge, pointField, fieldPotential } from '../physics/charge.js';
import { num, clear, line, text, handle, hit, lab, arrow, INK, MUTED, RAY, RAY2 } from './kit.js';

function q(id, en, zh, options, answer) { return { id, en, zh, options, answer }; }
function opt(en, zh) { return { en, zh }; }
function ro(en, zh, value) { return { en, zh, value }; }

export const chargeSim = {
  id: 'charges',
  timed: false,
  authority: 'Coulomb’s law on a line: F = k |q1 q2| / r² with k = 9×10⁹ N·m²/C². Like signs repel; unlike signs attract.',
  params: { q1: 2, q2: -3, r: 0.2 },
  schema: [
    num('q1', 'Charge q1', '电荷 q1', 'µC', -5, 5, 0.1),
    num('q2', 'Charge q2', '电荷 q2', 'µC', -5, 5, 0.1),
    num('r', 'Separation r', '间距 r', 'm', 0.05, 1, 0.01),
  ],
  compute: (p) => twoCharges({ q1: p.q1 * 1e-6, q2: p.q2 * 1e-6, r: p.r }),
  readouts: (d) => [
    ro('F', 'F', `${fmt(d.F, 3)} N`),
    ro('Sense', '性质', d.sense === 'repel' ? { en: 'repel', zh: '排斥' } : d.sense === 'attract' ? { en: 'attract', zh: '吸引' } : { en: 'none', zh: '无' }),
    ro('r', 'r', `${fmt(d.r, 2)} m`),
  ],
  checks: (d) => [
    q('F', 'The force magnitude is', '力的大小是', [
      opt(`${fmt(d.F, 3)} N = k |q1 q2| / r²`, `${fmt(d.F, 3)} N = k |q1 q2| / r²`),
      opt(`${fmt(d.k * d.q1 * d.q2, 3)} N`, `${fmt(d.k * d.q1 * d.q2, 3)} N`),
      opt('independent of r', '与 r 无关'),
    ], 0),
    q('sense', 'These two charges', '这两个电荷', [
      opt(d.sense === 'repel' ? 'repel' : d.sense === 'attract' ? 'attract' : 'do not interact', d.sense === 'repel' ? '互相排斥' : d.sense === 'attract' ? '互相吸引' : '不作用'),
      opt(d.sense === 'repel' ? 'attract' : 'repel', d.sense === 'repel' ? '互相吸引' : '互相排斥'),
    ], 0),
  ],
  debug: {
    en: 'Using F = k |q1 q2| r invents a force that grows with distance.',
    zh: '写成 F = k |q1 q2| r，力会随距离变大。',
    toggleEn: 'Use F ∝ r',
    toggleZh: '改成 F 正比于 r',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    const y = h * 0.5;
    const x1 = w * 0.28;
    const x2 = w * 0.72;
    const ball = (x, q, label) => {
      ctx.beginPath();
      ctx.arc(x, y, 22, 0, Math.PI * 2);
      ctx.fillStyle = q >= 0 ? RAY : RAY2;
      ctx.fill();
      text(ctx, q >= 0 ? '+' : '−', x, y, '#fff', 18, 'center');
      text(ctx, label, x, y + 40, MUTED, 12, 'center');
    };
    ball(x1, p.q1, `q1=${fmt(p.q1, 1)} µC`);
    ball(x2, p.q2, `q2=${fmt(p.q2, 1)} µC`);
    line(ctx, x1 + 24, y, x2 - 24, y, MUTED, 1);
    text(ctx, `r=${fmt(d.r, 2)} m`, w * 0.5, y - 28, MUTED, 12, 'center');
    const Fshow = ui.wrong ? d.k * Math.abs(d.q1) * Math.abs(d.q2) * d.r : d.F;
    if (d.sense !== 'none') {
      const out = d.sense === 'repel';
      if (out) {
        arrow(ctx, x1 - 10, y - 50, x1 - 50, y - 50, RAY, 2);
        arrow(ctx, x2 + 10, y - 50, x2 + 50, y - 50, RAY, 2);
      } else {
        arrow(ctx, x1 + 30, y - 50, x1 + 70, y - 50, RAY, 2);
        arrow(ctx, x2 - 30, y - 50, x2 - 70, y - 50, RAY, 2);
      }
    }
    text(ctx, `F=${fmt(Fshow, 3)} N`, w * 0.5, h * 0.18, ui.wrong ? '#a33' : INK, 16, 'center');
    handle(ctx, x2, y + 50, ui.drag === 'r');
    text(ctx, lab(ui, 'drag r', '拖间距'), x2, y + 68, MUTED, 11, 'center');
    ui._geo = { x1, x2, y };
  },
  pointer(ev, p, _d, ui) {
    const g = ui._geo;
    if (!g) return null;
    if (ev.type === 'down') {
      if (hit(ev.x, ev.y, g.x2, g.y + 50, 18)) { ui.drag = 'r'; return {}; }
      return null;
    }
    if (ev.type === 'up') { ui.drag = null; return {}; }
    if (ev.type === 'move' && ui.drag === 'r') {
      const span = g.x2 - g.x1;
      const r = Math.min(1, Math.max(0.05, 0.05 + ((ev.x - g.x1) / span) * 0.95));
      return { r: Math.round(r * 100) / 100 };
    }
    return null;
  },
};

export const currentSim = {
  id: 'current',
  timed: false,
  authority: 'Steady current is I = Q / t: charge passing a cross-section in time t.',
  params: { Q: 12, t: 4 },
  schema: [
    num('Q', 'Charge Q', '电荷量 Q', 'C', 0.5, 40, 0.5),
    num('t', 'Time t', '时间 t', 's', 0.5, 20, 0.5),
  ],
  compute: (p) => currentFromCharge(p),
  readouts: (d) => [
    ro('I', 'I', `${fmt(d.I, 3)} A`),
    ro('Q', 'Q', `${fmt(d.Q, 1)} C`),
    ro('t', 't', `${fmt(d.t, 1)} s`),
  ],
  checks: (d) => [
    q('I', 'The current is', '电流是', [
      opt(`${fmt(d.I, 3)} A = Q / t`, `${fmt(d.I, 3)} A = Q / t`),
      opt(`${fmt(d.Q * d.t, 3)} A`, `${fmt(d.Q * d.t, 3)} A`),
      opt('Q alone', '只由 Q 决定'),
    ], 0),
  ],
  debug: {
    en: 'Using I = Q t invents a current that grows with time for fixed charge.',
    zh: '写成 I = Q t，固定 Q 时电流会随时间变大。',
    toggleEn: 'Use I = Q t',
    toggleZh: '改用 I = Q t',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    const y = h * 0.45;
    line(ctx, w * 0.15, y, w * 0.85, y, INK, 4);
    for (let i = 0; i < 5; i += 1) {
      const x = w * 0.25 + i * w * 0.12;
      arrow(ctx, x - 12, y, x + 12, y, RAY, 2);
    }
    text(ctx, lab(ui, 'wire', '导线'), w * 0.5, y - 28, MUTED, 12, 'center');
    const Ishow = ui.wrong ? d.Q * d.t : d.I;
    text(ctx, `I = Q/t = ${fmt(Ishow, 3)} A`, w * 0.5, h * 0.7, ui.wrong ? '#a33' : INK, 18, 'center');
    text(ctx, `Q=${fmt(d.Q, 1)} C, t=${fmt(d.t, 1)} s`, w * 0.5, h * 0.82, MUTED, 13, 'center');
  },
  pointer() { return null; },
};

export const fieldSim = {
  id: 'point-field',
  timed: false,
  authority: 'Field of a point charge on the radial line: E = k |q| / r². Direction is away if q > 0 and toward if q < 0.',
  params: { q: 2, r: 0.2 },
  schema: [
    num('q', 'Charge q', '电荷 q', 'µC', -5, 5, 0.1),
    num('r', 'Distance r', '距离 r', 'm', 0.05, 1, 0.01),
  ],
  compute: (p) => pointField({ q: p.q * 1e-6, r: p.r }),
  readouts: (d) => [
    ro('E', 'E', `${fmt(d.E, 3)} N/C`),
    ro('Sense', '方向', d.sense === 'away' ? { en: 'away', zh: '向外' } : { en: 'toward', zh: '向内' }),
  ],
  checks: (d) => [
    q('E', 'The field magnitude is', '场强大小是', [
      opt(`${fmt(d.E, 3)} N/C = k |q| / r²`, `${fmt(d.E, 3)} N/C = k |q| / r²`),
      opt(`${fmt(d.k * Math.abs(d.q) * d.r, 3)} N/C`, `${fmt(d.k * Math.abs(d.q) * d.r, 3)} N/C`),
    ], 0),
  ],
  debug: {
    en: 'Using E ∝ r invents a field that grows with distance.',
    zh: '写成 E 正比于 r，场强会随距离变大。',
    toggleEn: 'Use E ∝ r',
    toggleZh: '改成 E 正比于 r',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    const cx = w * 0.35;
    const cy = h * 0.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, Math.PI * 2);
    ctx.fillStyle = p.q >= 0 ? RAY : RAY2;
    ctx.fill();
    text(ctx, p.q >= 0 ? '+' : '−', cx, cy, '#fff', 18, 'center');
    const px = cx + Math.min(w * 0.45, d.r * w * 0.6);
    handle(ctx, px, cy, false);
    const Eshow = ui.wrong ? d.k * Math.abs(d.q) * d.r : d.E;
    if (d.sense === 'away') arrow(ctx, px - 10, cy - 40, px + 40, cy - 40, RAY, 2);
    else arrow(ctx, px + 40, cy - 40, px - 10, cy - 40, RAY, 2);
    text(ctx, `E=${fmt(Eshow, 3)} N/C`, w * 0.65, h * 0.22, ui.wrong ? '#a33' : INK, 14, 'center');
    ui._geo = { cx, cy, scale: w * 0.6 };
  },
  pointer(ev, _p, _d, ui) {
    const g = ui._geo;
    if (!g) return null;
    if (ev.type === 'down') { ui.drag = 'r'; return {}; }
    if (ev.type === 'up') { ui.drag = null; return {}; }
    if (ev.type === 'move' && ui.drag === 'r') {
      const r = Math.min(1, Math.max(0.05, (ev.x - g.cx) / g.scale));
      return { r: Math.round(r * 100) / 100 };
    }
    return null;
  },
};

export const potentialSim = {
  id: 'field-potential',
  timed: false,
  authority: 'In a uniform field, U = E d between plates separated by d, and the work on charge q along the field is W = q U.',
  params: { E: 200, d: 0.05, q: 2e-6 },
  schema: [
    num('E', 'Field E', '电场 E', 'N/C', 50, 1000, 10),
    num('d', 'Separation d', '间距 d', 'm', 0.01, 0.2, 0.01),
    num('q', 'Charge q', '电荷 q', 'C', 1e-7, 5e-6, 1e-7),
  ],
  compute: (p) => fieldPotential(p),
  readouts: (d) => [
    ro('U', 'U', `${fmt(d.U, 2)} V`),
    ro('W', 'W', `${d.W.toExponential(3)} J`),
  ],
  checks: (d) => [
    q('U', 'The potential difference is', '电势差是', [
      opt(`${fmt(d.U, 2)} V = E d`, `${fmt(d.U, 2)} V = E d`),
      opt(`${fmt(d.E / d.d, 2)} V`, `${fmt(d.E / d.d, 2)} V`),
    ], 0),
  ],
  debug: {
    en: 'Using U = E / d invents the wrong dependence on separation.',
    zh: '写成 U = E / d，对间距的依赖就反了。',
    toggleEn: 'Use U = E / d',
    toggleZh: '改用 U = E / d',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    const y0 = h * 0.3;
    const y1 = y0 + Math.min(h * 0.4, d.d * h * 4);
    line(ctx, w * 0.25, y0, w * 0.75, y0, RAY, 4);
    line(ctx, w * 0.25, y1, w * 0.75, y1, RAY2, 4);
    text(ctx, '+', w * 0.2, y0, RAY, 16, 'center');
    text(ctx, '−', w * 0.2, y1, RAY2, 16, 'center');
    arrow(ctx, w * 0.5, y0 + 10, w * 0.5, y1 - 10, INK, 2);
    const Ushow = ui.wrong ? d.E / d.d : d.U;
    text(ctx, `U=${fmt(Ushow, 2)} V`, w * 0.5, h * 0.85, ui.wrong ? '#a33' : INK, 16, 'center');
  },
  pointer() { return null; },
};
