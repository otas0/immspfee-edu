import { fmt, specificHeat } from '../physics/index.js';
import { num, clear, line, text, lab, INK, MUTED, RAY, RAY2 } from './kit.js';

function q(id, en, zh, options, answer) { return { id, en, zh, options, answer }; }
function opt(en, zh) { return { en, zh }; }
function ro(en, zh, value) { return { en, zh, value }; }

export const heatSim = {
  id: 'specific-heat',
  timed: true,
  tMax(p) {
    const slow = Math.max(p.c1 * p.m1, p.c2 * p.m2);
    return Math.min(180, Math.max(8, (25 * slow) / Math.max(p.P, 1)));
  },
  authority: 'Both samples take the same heat Q = P t. The temperature rise of each is ΔT = Q / (c m). A larger specific heat, at the same mass, means a smaller rise.',
  params: { m1: 0.2, c1: 4200, m2: 0.2, c2: 900, P: 500, T0: 20 },
  schema: [
    num('P', 'Heating power', '加热功率', 'W', 50, 2000, 10),
    num('m1', 'Mass of sample 1', '样品 1 质量', 'kg', 0.05, 1, 0.01),
    num('c1', 'Specific heat c1', '比热容 c1', 'J/(kg·°C)', 200, 5000, 10),
    num('m2', 'Mass of sample 2', '样品 2 质量', 'kg', 0.05, 1, 0.01),
    num('c2', 'Specific heat c2', '比热容 c2', 'J/(kg·°C)', 200, 5000, 10),
    num('T0', 'Start temperature', '初温', '°C', 0, 40, 1),
  ],
  compute: (p, t) => specificHeat(p, t),
  readouts: (d) => [
    ro('Q', 'Q', `${fmt(d.Q, 0)} J`),
    ro('ΔT1', 'ΔT1', `${fmt(d.dT1, 2)} °C`),
    ro('ΔT2', 'ΔT2', `${fmt(d.dT2, 2)} °C`),
    ro('T1', 'T1', `${fmt(d.T1, 2)} °C`),
    ro('T2', 'T2', `${fmt(d.T2, 2)} °C`),
  ],
  checks: (d) => {
    const rise = d.dT1 > d.dT2 + 1e-6 ? 0 : d.dT2 > d.dT1 + 1e-6 ? 1 : 2;
    return [
      q('dt', 'Sample 1 rises by', '样品 1 升高', [
        opt(`${fmt(d.dT1, 2)} °C`, `${fmt(d.dT1, 2)} °C`),
        opt(`${fmt(d.Q / Math.max(d.m1, 1e-9), 2)} °C`, `${fmt(d.Q / Math.max(d.m1, 1e-9), 2)} °C`),
        opt(`${fmt(d.dT2, 2)} °C`, `${fmt(d.dT2, 2)} °C`),
      ], 0),
      q('which', 'With this heat shared, the larger temperature rise is', '同样的热量下，升温更多的是', [
        opt('sample 1', '样品 1'),
        opt('sample 2', '样品 2'),
        opt('neither — the rises match', '一样高'),
      ], rise),
    ];
  },
  debug: {
    en: 'Using the other sample’s specific heat on sample 1 swaps which line climbs faster.',
    zh: '把样品 2 的比热容套到样品 1 上，哪条线升得快就被换过来了。',
    toggleEn: 'Give sample 1 the other specific heat',
    toggleZh: '让样品 1 用另一个比热容',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    const end = heatSim.tMax(p);
    const gx = w * 0.14;
    const gy = h * 0.78;
    const gw = w * 0.74;
    const gh = h * 0.56;
    line(ctx, gx, gy, gx + gw, gy, INK, 1.2);
    line(ctx, gx, gy, gx, gy - gh, INK, 1.2);
    text(ctx, lab(ui, 'Q', '热量'), gx + gw + 8, gy, MUTED, 12);
    text(ctx, lab(ui, 'T', '温度'), gx, gy - gh - 10, MUTED, 12);
    const samples = [];
    for (let i = 0; i <= 40; i += 1) samples.push(specificHeat(p, (end * i) / 40));
    const wrongC = ui.wrong ? d.c2 : d.c1;
    const tHi = Math.max(d.T0 + 5, ...samples.map((s) => Math.max(s.T1, s.T2)), d.T0 + (samples.at(-1).Q) / (wrongC * d.m1));
    const X = (Q) => gx + (Q / Math.max(samples.at(-1).Q, 1)) * gw;
    const Y = (T) => gy - ((T - d.T0) / (tHi - d.T0)) * gh;
    const stroke = (color, pick) => {
      ctx.beginPath();
      samples.forEach((s, i) => {
        const x = X(s.Q);
        const y = Y(pick(s));
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
    };
    stroke(RAY2, (s) => s.T2);
    stroke(RAY, (s) => (ui.wrong ? d.T0 + s.Q / (d.c2 * d.m1) : s.T1));
    const y1 = ui.wrong ? d.T0 + d.Q / (d.c2 * d.m1) : d.T1;
    ctx.fillStyle = RAY;
    ctx.beginPath();
    ctx.arc(X(d.Q), Y(y1), 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = RAY2;
    ctx.beginPath();
    ctx.arc(X(d.Q), Y(d.T2), 5, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, lab(ui, 'sample 1', '样品 1'), w * 0.22, h * 0.12, RAY, 13);
    text(ctx, lab(ui, 'sample 2', '样品 2'), w * 0.42, h * 0.12, RAY2, 13);
    text(ctx, `ΔT1=${fmt(ui.wrong ? d.Q / (d.c2 * d.m1) : d.dT1, 1)}`, w * 0.7, h * 0.1, RAY, 12);
    text(ctx, `ΔT2=${fmt(d.dT2, 1)}`, w * 0.7, h * 0.16, RAY2, 12);
  },
  pointer() { return null; },
};
