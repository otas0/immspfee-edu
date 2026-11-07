import { fmt } from '../fmt.js?v=__BUILD__';
import { specificHeat, ottoCycle, STROKES } from '../physics/thermal.js?v=__BUILD__';
import { num, clear, line, text, lab, teachPanel, INK, MUTED, RAY, RAY2 } from './kit.js?v=__BUILD__';

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

export const heatEngineSim = {
  id: 'heat-engine',
  timed: true,
  tMax: () => 4,
  authority: 'Ideal Otto cycle for the four-stroke classroom model. η = 1 − 1/r^(γ−1) with γ = 1.4, and W = η Qin. The shaded p–V loop is scaled so its area equals W. Stroke order is intake, compression, power, exhaust. This is the public thermodynamic relation, not a device design.',
  params: { r: 8, Qin: 1200, Vmin: 0.0002 },
  schema: [
    num('r', 'Compression ratio r', '压缩比 r', '', 2, 16, 0.5),
    num('Qin', 'Heat in per cycle Qin', '每循环吸热 Qin', 'J', 200, 4000, 50),
    num('Vmin', 'Minimum volume', '最小容积', 'm³', 0.0001, 0.001, 0.00005),
  ],
  compute: (p, t) => ottoCycle(p, t),
  readouts: (d) => [
    ro('Stroke', '冲程', { en: d.stroke.en, zh: d.stroke.zh }),
    ro('η', 'η', fmt(d.eta, 3)),
    ro('W', 'W', `${fmt(d.W, 1)} J`),
    ro('p–V area', 'p–V 面积', `${fmt(d.area, 1)} J`),
  ],
  checks: (d) => [
    q('eta', 'The Otto efficiency is', '奥托热效率是', [
      opt(fmt(d.eta, 3), fmt(d.eta, 3)),
      opt(fmt(1 - 1 / d.r, 3), fmt(1 - 1 / d.r, 3)),
      opt(fmt(1 / d.r, 3), fmt(1 / d.r, 3)),
    ], 0),
    q('work', 'The net work of one cycle is', '一个循环的净功是', [
      opt(`${fmt(d.W, 1)} J`, `${fmt(d.W, 1)} J`),
      opt(`${fmt(d.Qin, 1)} J`, `${fmt(d.Qin, 1)} J`),
      opt(`${fmt(d.Qout, 1)} J`, `${fmt(d.Qout, 1)} J`),
    ], 0),
    q('area', 'The shaded area on the p–V graph equals', 'p–V 图上的阴影面积等于', [
      opt('the net work W', '净功 W'),
      opt('the heat in Qin', '吸热 Qin'),
      opt('the compression ratio r', '压缩比 r'),
    ], 0),
  ],
  debug: {
    en: 'Writing η = 1 − 1/r (without the γ power) overstates the efficiency at this r.',
    zh: '写成 η = 1 − 1/r（去掉 γ 的幂）会把这个压缩比下的效率算大。',
    toggleEn: 'Drop the γ exponent',
    toggleZh: '去掉 γ 的幂',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    // Wide: cylinder left / p–V right. Narrow (≤360): cylinder on top, p–V below.
    const narrow = w <= 360;
    const left = narrow ? w * 0.18 : w * 0.08;
    const mid = w * 0.46;
    const cy = narrow ? h * 0.08 : h * 0.22;
    const ch = narrow ? h * 0.28 : h * 0.56;
    const cw = narrow ? w * 0.64 : w * 0.28;
    const cx = left;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.strokeRect(cx, cy, cw, ch);
    const frac = (d.V - d.V2) / Math.max(d.V1 - d.V2, 1e-12);
    const pistonY = cy + 16 + (1 - frac) * (ch - 40);
    ctx.fillStyle = '#d8d0c4';
    ctx.fillRect(cx + 4, pistonY, cw - 8, 18);
    ctx.strokeRect(cx + 4, pistonY, cw - 8, 18);
    const name = lab(ui, d.stroke.en, d.stroke.zh);
    text(ctx, name, cx + cw / 2, cy - 10, INK, narrow ? 12 : 15, 'center');
    text(ctx, `V=${fmt(d.V * 1e3, 2)} L`, cx + cw / 2, cy + ch + 14, MUTED, 12, 'center');
    const panelX = narrow ? w * 0.06 : mid;
    const panelY = narrow ? h * 0.46 : h * 0.14;
    const panelW = narrow ? w * 0.88 : w * 0.48;
    const panelH = narrow ? h * 0.5 : h * 0.74;
    teachPanel(ctx, panelX, panelY, panelW, panelH, lab(ui, 'p–V loop', 'p–V 循环'));
    const gx = panelX + panelW * 0.12;
    const gy = panelY + panelH * 0.88;
    const gw = panelW * 0.7;
    const gh = panelH * 0.68;
    line(ctx, gx, gy, gx + gw, gy, INK, 1.2);
    line(ctx, gx, gy, gx, gy - gh, INK, 1.2);
    text(ctx, 'V', gx + gw + 6, gy, MUTED, 12);
    text(ctx, 'p', gx - 4, gy - gh - 8, MUTED, 12);
    const Vs = d.loop.map((pt) => pt.V);
    const ps = d.loop.map((pt) => pt.p);
    const Vmin = Math.min(...Vs) * 0.85;
    const Vmax = Math.max(...Vs) * 1.1;
    const pmax = Math.max(...ps) * 1.1;
    const X = (V) => gx + ((V - Vmin) / (Vmax - Vmin)) * gw;
    const Y = (pv) => gy - (pv / pmax) * gh;
    const plot = ui.wrong
      ? d.loop.map((pt) => ({ V: pt.V, p: pt.p * (1 - 1 / d.r) / Math.max(d.eta, 1e-9) }))
      : d.loop;
    ctx.beginPath();
    plot.forEach((pt, i) => {
      const x = X(pt.V);
      const y = Y(pt.p);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = 'rgba(196,73,29,0.22)';
    ctx.fill();
    ctx.strokeStyle = RAY;
    ctx.lineWidth = 2;
    ctx.stroke();
    text(ctx, ui.wrong ? `η?=1−1/r → ${fmt(1 - 1 / d.r, 3)}` : `W=${fmt(d.W, 0)} J`, gx + gw * 0.35, gy - gh * 0.45, ui.wrong ? '#a33' : INK, 13);
    text(ctx, STROKES.map((s) => lab(ui, s.en[0], s.zh[0])).join('·'), panelX + panelW / 2, panelY + 30, MUTED, 12, 'center');
  },
  pointer() { return null; },
};
