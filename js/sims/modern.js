import { fmt } from '../fmt.js';
import {
  bohrLevels, internalEnergy, energyShare, efficiency, scaleLength,
  massEnergy, halfLife, photoelectric, capacitance, resistivity, timeDilation,
  simultaneity,
} from '../physics/modern.js';
import { num, clear, line, text, lab, INK, MUTED, RAY, RAY2 } from './kit.js';

function q(id, en, zh, options, answer) { return { id, en, zh, options, answer }; }
function opt(en, zh) { return { en, zh }; }
function ro(en, zh, value) { return { en, zh, value }; }

export const atomSim = {
  id: 'atom-levels',
  timed: false,
  authority: 'Classroom hydrogen levels: E_n = −13.6 eV / n². A jump from n to n2 releases or absorbs a photon of energy |E_n2 − E_n|. No device design.',
  params: { n: 2, n2: 1 },
  schema: [
    num('n', 'Level n', '能级 n', '', 1, 5, 1),
    num('n2', 'Level n₂', '能级 n₂', '', 1, 5, 1),
  ],
  compute: (p) => bohrLevels(p),
  readouts: (d) => [
    ro('E_n', 'Eₙ', `${fmt(d.E, 2)} eV`),
    ro('E_n2', 'Eₙ₂', `${fmt(d.E2, 2)} eV`),
    ro('ΔE', 'ΔE', `${fmt(d.photon, 2)} eV`),
  ],
  checks: (d) => [
    q('E', 'The energy of level n is', '能级 n 的能量是', [
      opt(`${fmt(d.E, 2)} eV = −13.6 / n²`, `${fmt(d.E, 2)} eV = −13.6 / n²`),
      opt(`${fmt(-13.6 * d.n, 2)} eV`, `${fmt(-13.6 * d.n, 2)} eV`),
      opt('zero for every n', '对任何 n 都是零'),
    ], 0),
    q('ph', 'The photon energy for this jump is', '这次跃迁的光子能量是', [
      opt(`${fmt(Math.abs(d.photon), 2)} eV`, `${fmt(Math.abs(d.photon), 2)} eV`),
      opt(`${fmt(Math.abs(d.E), 2)} eV`, `${fmt(Math.abs(d.E), 2)} eV`),
    ], 0),
  ],
  debug: {
    en: 'Using E_n = −13.6 n invents levels that grow more bound as n rises.',
    zh: '写成 E_n = −13.6 n，n 越大能级反而更负。',
    toggleEn: 'Use E ∝ −n',
    toggleZh: '改成 E 正比于 −n',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    const x = w * 0.35;
    const levels = [1, 2, 3, 4, 5];
    const Y = (n) => h * 0.82 - ((-13.6 / (n * n) + 13.6) / 13.6) * h * 0.6;
    for (const n of levels) {
      const y = Y(n);
      const En = ui.wrong ? -13.6 * n : -13.6 / (n * n);
      line(ctx, x, y, x + w * 0.35, y, n === d.n || n === d.n2 ? RAY : MUTED, n === d.n || n === d.n2 ? 2.5 : 1);
      text(ctx, `n=${n}`, x - 28, y, MUTED, 12, 'right');
      text(ctx, `${fmt(En, 1)} eV`, x + w * 0.38, y, MUTED, 11);
    }
    const y1 = Y(d.n);
    const y2 = Y(d.n2);
    line(ctx, x + w * 0.18, y1, x + w * 0.18, y2, RAY2, 2);
    text(ctx, `ΔE=${fmt(ui.wrong ? Math.abs(-13.6 * d.n2 + 13.6 * d.n) : Math.abs(d.photon), 2)} eV`, w * 0.72, h * 0.2, ui.wrong ? '#a33' : INK, 14, 'center');
  },
  pointer() { return null; },
};

export const internalSim = {
  id: 'internal-energy',
  timed: false,
  authority: 'First-law teaching form for a sample: ΔU = W + Q, with work and heat into the system counted positive.',
  params: { W: 40, Q: -15 },
  schema: [
    num('W', 'Work W', '功 W', 'J', -100, 100, 5),
    num('Q', 'Heat Q', '热量 Q', 'J', -100, 100, 5),
  ],
  compute: (p) => internalEnergy(p),
  readouts: (d) => [
    ro('ΔU', 'ΔU', `${fmt(d.dU, 1)} J`),
    ro('W', 'W', `${fmt(d.W, 1)} J`),
    ro('Q', 'Q', `${fmt(d.Q, 1)} J`),
  ],
  checks: (d) => [
    q('dU', 'The change in internal energy is', '内能变化是', [
      opt(`${fmt(d.dU, 1)} J = W + Q`, `${fmt(d.dU, 1)} J = W + Q`),
      opt(`${fmt(d.W - d.Q, 1)} J`, `${fmt(d.W - d.Q, 1)} J`),
      opt(`${fmt(d.Q, 1)} J`, `${fmt(d.Q, 1)} J`),
    ], 0),
  ],
  debug: {
    en: 'Using ΔU = W − Q flips the heat sign and invents the wrong change.',
    zh: '写成 ΔU = W − Q 会把热的符号弄反。',
    toggleEn: 'Use ΔU = W − Q',
    toggleZh: '改用 ΔU = W − Q',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    const mid = h * 0.55;
    const bar = (x, val, label, color) => {
      const hh = Math.min(h * 0.35, Math.abs(val) * 1.2);
      const y0 = mid;
      const y1 = val >= 0 ? y0 - hh : y0 + hh;
      line(ctx, x, y0, x, y1, color, 10);
      text(ctx, label, x, y0 + (val >= 0 ? 18 : -12), MUTED, 12, 'center');
      text(ctx, fmt(val, 0), x, y1 + (val >= 0 ? -10 : 14), color, 12, 'center');
    };
    bar(w * 0.25, d.W, 'W', RAY);
    bar(w * 0.45, d.Q, 'Q', RAY2);
    const dUshow = ui.wrong ? d.W - d.Q : d.dU;
    bar(w * 0.7, dUshow, 'ΔU', ui.wrong ? '#a33' : INK);
    text(ctx, 'ΔU = W + Q', w * 0.5, h * 0.14, INK, 16, 'center');
  },
  pointer() { return null; },
};

export const convertSim = {
  id: 'energy-share',
  timed: false,
  authority: 'One energy store converts into another with the total conserved: E1 + E2 = E0, with share f going into store 2.',
  params: { E0: 100, f: 0.4 },
  schema: [
    num('E0', 'Total E0', '总量 E0', 'J', 10, 200, 5),
    num('f', 'Share to store 2', '转入库 2 的份额', '', 0, 1, 0.05),
  ],
  compute: (p) => energyShare(p),
  readouts: (d) => [
    ro('E1', 'E1', `${fmt(d.E1, 1)} J`),
    ro('E2', 'E2', `${fmt(d.E2, 1)} J`),
    ro('Total', '合计', `${fmt(d.total, 1)} J`),
  ],
  checks: (d) => [
    q('sum', 'E1 + E2 equals', 'E1 + E2 等于', [
      opt(`${fmt(d.E0, 1)} J`, `${fmt(d.E0, 1)} J`),
      opt(`${fmt(d.E2, 1)} J`, `${fmt(d.E2, 1)} J`),
      opt('zero', '零'),
    ], 0),
  ],
  debug: {
    en: 'Letting E2 = E0 f and E1 = E0 invents creation of energy.',
    zh: '让 E2 = E0 f 而 E1 仍等于 E0，能量就被凭空造出来了。',
    toggleEn: 'Keep E1 = E0',
    toggleZh: '让 E1 仍等于 E0',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    const y = h * 0.55;
    const maxH = h * 0.4;
    const e1 = ui.wrong ? d.E0 : d.E1;
    const e2 = d.E2;
    const h1 = (e1 / Math.max(d.E0, 1)) * maxH;
    const h2 = (e2 / Math.max(d.E0, 1)) * maxH;
    ctx.fillStyle = RAY;
    ctx.fillRect(w * 0.25 - 30, y - h1, 60, h1);
    ctx.fillStyle = RAY2;
    ctx.fillRect(w * 0.65 - 30, y - h2, 60, h2);
    text(ctx, `E1=${fmt(e1, 0)}`, w * 0.25, y + 24, MUTED, 13, 'center');
    text(ctx, `E2=${fmt(e2, 0)}`, w * 0.65, y + 24, MUTED, 13, 'center');
    text(ctx, ui.wrong ? lab(ui, 'total grows', '总量变大了') : `E1+E2=${fmt(d.total, 0)}`, w * 0.5, h * 0.14, ui.wrong ? '#a33' : INK, 15, 'center');
  },
  pointer() { return null; },
};

export const efficiencySim = {
  id: 'efficiency',
  timed: false,
  authority: 'Efficiency η = E_useful / E_in. Waste is E_in − E_useful. No device design — only the public ratio.',
  params: { Ein: 100, Eu: 35 },
  schema: [
    num('Ein', 'Energy in', '输入能量', 'J', 10, 200, 5),
    num('Eu', 'Useful energy', '有用能量', 'J', 0, 200, 5),
  ],
  compute: (p) => efficiency(p),
  readouts: (d) => [
    ro('η', 'η', fmt(d.eta, 3)),
    ro('Useful', '有用', `${fmt(d.Eu, 1)} J`),
    ro('Waste', '损耗', `${fmt(d.waste, 1)} J`),
  ],
  checks: (d) => [
    q('eta', 'The efficiency is', '效率是', [
      opt(`${fmt(d.eta, 3)} = Eu / Ein`, `${fmt(d.eta, 3)} = Eu / Ein`),
      opt(`${fmt(d.Ein / Math.max(d.Eu, 1e-9), 3)}`, `${fmt(d.Ein / Math.max(d.Eu, 1e-9), 3)}`),
      opt(`${fmt(d.waste / d.Ein, 3)}`, `${fmt(d.waste / d.Ein, 3)}`),
    ], 0),
  ],
  debug: {
    en: 'Using η = Ein / Eu inverts the ratio.',
    zh: '写成 η = Ein / Eu 会把比值颠倒。',
    toggleEn: 'Use η = Ein / Eu',
    toggleZh: '改用 η = Ein / Eu',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    const y = h * 0.5;
    const total = Math.max(d.Ein, 1);
    const wu = (d.Eu / total) * w * 0.7;
    const ww = (d.waste / total) * w * 0.7;
    const x0 = w * 0.15;
    ctx.fillStyle = RAY;
    ctx.fillRect(x0, y - 24, wu, 48);
    ctx.fillStyle = MUTED;
    ctx.fillRect(x0 + wu, y - 24, ww, 48);
    const etaShow = ui.wrong ? d.Ein / Math.max(d.Eu, 1e-9) : d.eta;
    text(ctx, `η=${fmt(etaShow, 3)}`, w * 0.5, h * 0.22, ui.wrong ? '#a33' : INK, 18, 'center');
    text(ctx, lab(ui, 'useful', '有用'), x0 + wu / 2, y + 50, MUTED, 12, 'center');
    text(ctx, lab(ui, 'waste', '损耗'), x0 + wu + ww / 2, y + 50, MUTED, 12, 'center');
  },
  pointer() { return null; },
};

export const scalesSim = {
  id: 'scales',
  timed: false,
  authority: 'Orders of magnitude: log10(L) places a length on a public ladder (nucleus ~10⁻¹⁵ m, atom ~10⁻¹⁰ m, human ~1 m, Earth ~10⁷ m, 1 AU ~10¹¹ m). No invented observations.',
  params: { L: 1e-10 },
  schema: [
    num('L', 'Length L', '长度 L', 'm', 1e-16, 1e13, 1e-16),
  ],
  compute: (p) => scaleLength(p),
  readouts: (d) => [
    ro('L', 'L', d.L.toExponential(2) + ' m'),
    ro('log10', 'log₁₀ L', fmt(d.log10, 2)),
    ro('Nearest', '最近', { en: d.nearest.en, zh: d.nearest.zh }),
  ],
  checks: (d) => [
    q('log', 'log10 of this length is', '这个长度的 log₁₀ 是', [
      opt(fmt(d.log10, 2), fmt(d.log10, 2)),
      opt(fmt(d.L, 2), fmt(d.L, 2)),
      opt(fmt(Math.log(d.L), 2), fmt(Math.log(d.L), 2)),
    ], 0),
  ],
  debug: {
    en: 'Using ln L instead of log10 L shifts every decade mark.',
    zh: '用 ln L 代替 log₁₀ L，数量级刻度就全偏了。',
    toggleEn: 'Use ln L',
    toggleZh: '改用 ln L',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    const gx = w * 0.12;
    const gy = h * 0.55;
    const gw = w * 0.76;
    line(ctx, gx, gy, gx + gw, gy, INK, 1.5);
    const logs = d.refs.map((r) => Math.log10(r.L));
    const lo = Math.min(...logs, d.log10) - 1;
    const hi = Math.max(...logs, d.log10) + 1;
    const X = (lg) => gx + ((lg - lo) / (hi - lo)) * gw;
    for (const r of d.refs) {
      const x = X(Math.log10(r.L));
      line(ctx, x, gy - 8, x, gy + 8, MUTED, 1);
      text(ctx, lab(ui, r.en, r.zh), x, gy + 24, MUTED, 10, 'center');
    }
    const mark = ui.wrong ? Math.log(d.L) : d.log10;
    const xm = X(Math.min(hi, Math.max(lo, mark)));
    ctx.fillStyle = RAY;
    ctx.beginPath();
    ctx.arc(xm, gy, 7, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, ui.wrong ? `ln=${fmt(mark, 2)}` : `log10=${fmt(d.log10, 2)}`, w * 0.5, h * 0.22, ui.wrong ? '#a33' : INK, 16, 'center');
  },
  pointer() { return null; },
};

export const massEnergySim = {
  id: 'mass-energy',
  timed: false,
  authority: 'Public mass–energy relation E = m c² with c = 2.99792458×10⁸ m/s. Teaching readout only — no device or yield steps.',
  params: { m: 1e-9 },
  schema: [
    num('m', 'Mass m', '质量 m', 'kg', 1e-12, 1e-6, 1e-12),
  ],
  compute: (p) => massEnergy(p),
  readouts: (d) => [
    ro('E', 'E', `${d.E.toExponential(3)} J`),
    ro('MeV', 'MeV', d.MeV.toExponential(3)),
  ],
  checks: (d) => [
    q('E', 'The rest energy is', '静能是', [
      opt(`${d.E.toExponential(3)} J = m c²`, `${d.E.toExponential(3)} J = m c²`),
      opt(`${(d.m * d.c).toExponential(3)} J`, `${(d.m * d.c).toExponential(3)} J`),
    ], 0),
  ],
  debug: {
    en: 'Using E = m c drops one power of c.',
    zh: '写成 E = m c 会少一个 c。',
    toggleEn: 'Use E = m c',
    toggleZh: '改用 E = m c',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    const Eshow = ui.wrong ? d.m * d.c : d.E;
    text(ctx, 'E = m c²', w * 0.5, h * 0.35, INK, 22, 'center');
    text(ctx, `E = ${Eshow.toExponential(3)} J`, w * 0.5, h * 0.55, ui.wrong ? '#a33' : RAY, 18, 'center');
    text(ctx, `m = ${d.m.toExponential(2)} kg`, w * 0.5, h * 0.72, MUTED, 13, 'center');
  },
  pointer() { return null; },
};

export const halfLifeSim = {
  id: 'half-life',
  timed: false,
  authority: 'Public decay law N = N0 e^{−λ t} with λ = ln 2 / T½. Teaching count only — no device or production steps.',
  params: { N0: 1000, T: 10, t: 10 },
  schema: [
    num('N0', 'Initial N0', '初始 N0', '', 100, 5000, 50),
    num('T', 'Half-life T½', '半衰期 T½', 's', 1, 60, 1),
    num('t', 'Time t', '时间 t', 's', 0, 120, 1),
  ],
  compute: (p) => halfLife(p),
  readouts: (d) => [
    ro('N', 'N', fmt(d.N, 1)),
    ro('λ', 'λ', fmt(d.lambda, 4)),
    ro('N/N0', 'N/N0', fmt(d.remaining, 3)),
  ],
  checks: (d) => [
    q('N', 'The remaining number is', '剩余数量是', [
      opt(`${fmt(d.N, 1)} = N0 e^{−λ t}`, `${fmt(d.N, 1)} = N0 e^{−λ t}`),
      opt(`${fmt(d.N0 - d.t, 1)}`, `${fmt(d.N0 - d.t, 1)}`),
      opt(`${fmt(d.N0 / 2, 1)} always`, `${fmt(d.N0 / 2, 1)} 恒定`),
    ], 0),
  ],
  debug: {
    en: 'A linear drop N0 − t invents a decay that is not exponential.',
    zh: '写成 N0 − t 的线性下降，就不是指数衰变了。',
    toggleEn: 'Use N = N0 − t',
    toggleZh: '改用 N = N0 − t',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    const gx = w * 0.12;
    const gy = h * 0.78;
    const gw = w * 0.76;
    const gh = h * 0.55;
    line(ctx, gx, gy, gx + gw, gy, INK, 1.2);
    line(ctx, gx, gy, gx, gy - gh, INK, 1.2);
    const tEnd = Math.max(d.T * 4, d.t + 1);
    ctx.beginPath();
    for (let i = 0; i <= 60; i += 1) {
      const tt = (tEnd * i) / 60;
      const N = ui.wrong ? Math.max(0, d.N0 - tt) : d.N0 * Math.exp(-d.lambda * tt);
      const x = gx + (tt / tEnd) * gw;
      const y = gy - (N / d.N0) * gh;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = ui.wrong ? '#a33' : RAY2;
    ctx.lineWidth = 2;
    ctx.stroke();
    const Nnow = ui.wrong ? Math.max(0, d.N0 - d.t) : d.N;
    ctx.fillStyle = RAY;
    ctx.beginPath();
    ctx.arc(gx + (d.t / tEnd) * gw, gy - (Nnow / d.N0) * gh, 5, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, `N=${fmt(Nnow, 0)}`, w * 0.7, h * 0.18, ui.wrong ? '#a33' : INK, 14);
  },
  pointer() { return null; },
};

export const photoSim = {
  id: 'photoelectric',
  timed: false,
  authority: 'Einstein’s photoelectric relation: Kmax = h f − W with cutoff f0 = W / h. W is entered in eV; no device design.',
  params: { W: 2.3, f: 8e14 },
  schema: [
    num('W', 'Work function W', '逸出功 W', 'eV', 0.5, 5, 0.1),
    num('f', 'Frequency f', '频率 f', 'Hz', 1e14, 2e15, 1e13),
  ],
  compute: (p) => photoelectric(p),
  readouts: (d) => [
    ro('f0', 'f0', d.f0.toExponential(3) + ' Hz'),
    ro('Kmax', 'Kmax', `${fmt(d.Kmax, 3)} eV`),
    ro('Emits', '是否出射', d.emits ? { en: 'yes', zh: '是' } : { en: 'no', zh: '否' }),
  ],
  checks: (d) => [
    q('cut', 'The cutoff frequency is', '截止频率是', [
      opt(`${d.f0.toExponential(3)} Hz = W / h`, `${d.f0.toExponential(3)} Hz = W / h`),
      opt(`${(d.W * d.h).toExponential(3)} Hz`, `${(d.W * d.h).toExponential(3)} Hz`),
    ], 0),
    q('emit', 'At this frequency electrons', '在这个频率下电子', [
      opt(d.emits ? 'are emitted' : 'are not emitted', d.emits ? '能出射' : '不能出射'),
      opt(d.emits ? 'are not emitted' : 'are emitted', d.emits ? '不能出射' : '能出射'),
    ], 0),
  ],
  debug: {
    en: 'Using Kmax = W − h f flips the sign and invents negative kinetic energy above cutoff.',
    zh: '写成 Kmax = W − h f 会把符号弄反。',
    toggleEn: 'Use Kmax = W − hf',
    toggleZh: '改用 Kmax = W − hf',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    const gx = w * 0.12;
    const gy = h * 0.7;
    const gw = w * 0.76;
    const gh = h * 0.45;
    line(ctx, gx, gy, gx + gw, gy, INK, 1.2);
    line(ctx, gx, gy, gx, gy - gh, INK, 1.2);
    const fMax = 2e15;
    const KmaxPlot = (f) => Math.max(0, (d.h * f) / 1.602176634e-19 - d.W);
    ctx.beginPath();
    for (let i = 0; i <= 80; i += 1) {
      const f = (fMax * i) / 80;
      const K = ui.wrong ? Math.max(0, d.W - (d.h * f) / 1.602176634e-19) : KmaxPlot(f);
      const x = gx + (f / fMax) * gw;
      const y = gy - (K / 5) * gh;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = ui.wrong ? '#a33' : RAY2;
    ctx.lineWidth = 2;
    ctx.stroke();
    const x0 = gx + (d.f0 / fMax) * gw;
    line(ctx, x0, gy, x0, gy - gh, MUTED, 1, [4, 4]);
    text(ctx, 'f0', x0, gy + 16, MUTED, 11, 'center');
    text(ctx, `Kmax=${fmt(ui.wrong ? Math.max(0, d.W - (d.h * d.f) / 1.602176634e-19) : d.Kmax, 2)} eV`, w * 0.7, h * 0.18, ui.wrong ? '#a33' : INK, 14);
  },
  pointer() { return null; },
};

export const capSim = {
  id: 'capacitance',
  timed: false,
  authority: 'Definition C = Q / U for a capacitor. Teaching relation only.',
  params: { Q: 2e-6, U: 5 },
  schema: [
    num('Q', 'Charge Q', '电荷量 Q', 'C', 1e-7, 1e-5, 1e-7),
    num('U', 'Voltage U', '电压 U', 'V', 1, 20, 0.5),
  ],
  compute: (p) => capacitance(p),
  readouts: (d) => [
    ro('C', 'C', `${d.C.toExponential(3)} F`),
    ro('Q', 'Q', `${d.Q.toExponential(2)} C`),
    ro('U', 'U', `${fmt(d.U, 1)} V`),
  ],
  checks: (d) => [
    q('C', 'The capacitance is', '电容是', [
      opt(`${d.C.toExponential(3)} F = Q / U`, `${d.C.toExponential(3)} F = Q / U`),
      opt(`${(d.Q * d.U).toExponential(3)} F`, `${(d.Q * d.U).toExponential(3)} F`),
    ], 0),
  ],
  debug: {
    en: 'Using C = Q U invents a capacitance that grows with voltage for fixed Q.',
    zh: '写成 C = Q U，固定 Q 时电容会随电压变大。',
    toggleEn: 'Use C = Q U',
    toggleZh: '改用 C = Q U',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    const cx = w * 0.5;
    const y = h * 0.45;
    line(ctx, cx - 40, y - 50, cx - 40, y + 50, INK, 4);
    line(ctx, cx + 40, y - 50, cx + 40, y + 50, INK, 4);
    text(ctx, '+', cx - 40, y - 70, RAY, 18, 'center');
    text(ctx, '−', cx + 40, y - 70, RAY2, 18, 'center');
    const Cshow = ui.wrong ? d.Q * d.U : d.C;
    text(ctx, `C=${Cshow.toExponential(3)} F`, w * 0.5, h * 0.78, ui.wrong ? '#a33' : INK, 16, 'center');
  },
  pointer() { return null; },
};

export const resistivitySim = {
  id: 'resistivity',
  timed: false,
  authority: 'Resistance of a uniform wire: R = ρ L / A.',
  params: { rho: 1.7e-8, L: 2, A: 1e-6 },
  schema: [
    num('rho', 'Resistivity ρ', '电阻率 ρ', 'Ω·m', 1e-8, 1e-6, 1e-9),
    num('L', 'Length L', '长度 L', 'm', 0.2, 10, 0.1),
    num('A', 'Area A', '截面积 A', 'm²', 1e-7, 5e-6, 1e-7),
  ],
  compute: (p) => resistivity(p),
  readouts: (d) => [
    ro('R', 'R', `${fmt(d.R, 4)} Ω`),
    ro('ρ', 'ρ', d.rho.toExponential(2)),
    ro('L/A', 'L/A', fmt(d.L / d.A, 0)),
  ],
  checks: (d) => [
    q('R', 'The resistance is', '电阻是', [
      opt(`${fmt(d.R, 4)} Ω = ρ L / A`, `${fmt(d.R, 4)} Ω = ρ L / A`),
      opt(`${fmt(d.rho * d.L * d.A, 4)} Ω`, `${fmt(d.rho * d.L * d.A, 4)} Ω`),
    ], 0),
  ],
  debug: {
    en: 'Using R = ρ L A invents a resistance that grows with area.',
    zh: '写成 R = ρ L A，电阻会随截面积变大。',
    toggleEn: 'Use R = ρ L A',
    toggleZh: '改用 R = ρ L A',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    const y = h * 0.5;
    const len = Math.min(w * 0.7, 40 + d.L * 40);
    const thick = Math.min(40, 6 + Math.sqrt(d.A) * 20000);
    ctx.fillStyle = RAY;
    ctx.fillRect(w * 0.15, y - thick / 2, len, thick);
    const Rshow = ui.wrong ? d.rho * d.L * d.A : d.R;
    text(ctx, `R=${fmt(Rshow, 4)} Ω`, w * 0.5, h * 0.22, ui.wrong ? '#a33' : INK, 16, 'center');
    text(ctx, `L=${fmt(d.L, 1)} m`, w * 0.5, h * 0.78, MUTED, 12, 'center');
  },
  pointer() { return null; },
};

export const dilationSim = {
  id: 'time-dilation',
  timed: false,
  authority: 'Special-relativistic time dilation: Δt = γ Δτ with γ = 1/√(1 − v²/c²). Teaching relation only.',
  params: { v: 1.5e8, dtau: 1 },
  schema: [
    num('v', 'Speed v', '速率 v', 'm/s', 1e7, 2.9e8, 1e7),
    num('dtau', 'Proper time Δτ', '固有时 Δτ', 's', 0.2, 5, 0.1),
  ],
  compute: (p) => timeDilation(p),
  readouts: (d) => [
    ro('γ', 'γ', fmt(d.gamma, 4)),
    ro('Δt', 'Δt', `${fmt(d.dt, 3)} s`),
    ro('β', 'β', fmt(d.beta, 4)),
  ],
  checks: (d) => [
    q('dt', 'Laboratory time is', '实验室时间是', [
      opt(`${fmt(d.dt, 3)} s = γ Δτ`, `${fmt(d.dt, 3)} s = γ Δτ`),
      opt(`${fmt(d.dtau, 3)} s`, `${fmt(d.dtau, 3)} s`),
    ], 0),
  ],
  debug: {
    en: 'Using Δt = Δτ / γ shrinks laboratory time instead of stretching it.',
    zh: '写成 Δt = Δτ / γ 会把实验室时间缩短而不是拉长。',
    toggleEn: 'Use Δt = Δτ / γ',
    toggleZh: '改用 Δt = Δτ / γ',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    const dtShow = ui.wrong ? d.dtau / d.gamma : d.dt;
    line(ctx, w * 0.2, h * 0.55, w * 0.45, h * 0.55, RAY, 8);
    line(ctx, w * 0.55, h * 0.55, w * 0.55 + Math.min(w * 0.35, d.gamma * w * 0.12), h * 0.55, RAY2, 8);
    text(ctx, `Δτ=${fmt(d.dtau, 2)} s`, w * 0.32, h * 0.45, MUTED, 12, 'center');
    text(ctx, `Δt=${fmt(dtShow, 2)} s`, w * 0.75, h * 0.45, ui.wrong ? '#a33' : INK, 12, 'center');
    text(ctx, `γ=${fmt(d.gamma, 3)}`, w * 0.5, h * 0.25, INK, 16, 'center');
  },
  pointer() { return null; },
};

export const simultaneitySim = {
  id: 'simultaneity',
  timed: false,
  authority: 'Relativity of simultaneity teaching ruler: ends of a rod of proper length L0 flash together in the rod frame; in a frame where the rod moves at v, Δt = γ v L0 / c².',
  params: { L0: 3e8, v: 1.5e8 },
  schema: [
    num('L0', 'Proper length L0', '固有长度 L0', 'm', 1e7, 1e9, 1e7),
    num('v', 'Speed v', '速率 v', 'm/s', 1e7, 2.9e8, 1e7),
  ],
  compute: (p) => simultaneity(p),
  readouts: (d) => [
    ro('γ', 'γ', fmt(d.gamma, 4)),
    ro('Δt', 'Δt', d.dt.toExponential(3) + ' s'),
    ro('L', 'L', d.L.toExponential(3) + ' m'),
  ],
  checks: (d) => [
    q('dt', 'Desynchronisation of the end events is', '两端事件的时差是', [
      opt(`${d.dt.toExponential(3)} s = γ v L0 / c²`, `${d.dt.toExponential(3)} s = γ v L0 / c²`),
      opt('0 in every frame', '在每一系中都是 0'),
    ], 0),
  ],
  debug: {
    en: 'Claiming the flashes stay simultaneous in every frame denies relativity of simultaneity.',
    zh: '声称闪光在每一系都同时，就否认了同时性的相对性。',
    toggleEn: 'Force Δt = 0',
    toggleZh: '强制 Δt = 0',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    // Minkowski sketch: x horizontal, ct upward; flashes at A,B on a t=const line in the rod frame.
    const ox = w * 0.12;
    const oy = h * 0.78;
    const sx = w * 0.76;
    const sy = h * 0.58;
    line(ctx, ox, oy, ox + sx, oy, MUTED, 1);
    line(ctx, ox, oy, ox, oy - sy, MUTED, 1);
    text(ctx, 'x', ox + sx + 8, oy, MUTED, 11, 'left');
    text(ctx, 'ct', ox - 4, oy - sy - 6, MUTED, 11, 'right');
    const Lpix = Math.min(sx * 0.7, 40 + d.L0 / 1e9 * 180);
    const xA = ox + (sx - Lpix) / 2;
    const xB = xA + Lpix;
    const tRod = oy - sy * 0.35;
    line(ctx, xA, tRod, xB, tRod, INK, 2);
    // Light cones (±45°) from A and B.
    const cone = sy * 0.45;
    line(ctx, xA, tRod, xA + cone, tRod - cone, RAY2, 1, [3, 3]);
    line(ctx, xA, tRod, xA - cone * 0.4, tRod - cone * 0.4, RAY2, 1, [3, 3]);
    line(ctx, xB, tRod, xB - cone, tRod - cone, RAY2, 1, [3, 3]);
    line(ctx, xB, tRod, xB + cone * 0.4, tRod - cone * 0.4, RAY2, 1, [3, 3]);
    // Worldlines of the ends (vertical in the rod frame).
    line(ctx, xA, oy, xA, oy - sy * 0.85, MUTED, 1);
    line(ctx, xB, oy, xB, oy - sy * 0.85, MUTED, 1);
    const dtShow = ui.wrong ? 0 : d.dt;
    // In the lab frame the B event is shifted in t by Δt (teaching offset on the sketch).
    const tShift = Math.min(sy * 0.25, 8 + Math.abs(dtShow) * 1e8);
    ctx.fillStyle = RAY;
    ctx.beginPath();
    ctx.arc(xA, tRod, 5, 0, Math.PI * 2);
    ctx.arc(xB, ui.wrong ? tRod : tRod - tShift, 5, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, 'A', xA, tRod + 14, MUTED, 11, 'center');
    text(ctx, 'B', xB, (ui.wrong ? tRod : tRod - tShift) + 14, MUTED, 11, 'center');
    text(ctx, `Δt=${dtShow === 0 ? '0' : dtShow.toExponential(2)} s`, w * 0.5, h * 0.1, ui.wrong ? '#a33' : INK, 15, 'center');
    text(ctx, `γ=${fmt(d.gamma, 3)}  light cones 45°`, w * 0.5, h * 0.92, MUTED, 11, 'center');
  },
  pointer() { return null; },
};
