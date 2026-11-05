import { fmt } from '../fmt.js';
import { twoCharges, currentFromCharge } from '../physics/charge.js';
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
