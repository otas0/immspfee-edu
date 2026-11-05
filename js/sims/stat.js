import { fmt } from '../fmt.js';
import {
  isingMetropolis, barrierTunnel, gaussianPacket, gaussianPacketPsi2,
  maxwellHistogram, fourierSquare, membraneMode, bellSinglet, sternGerlach,
  lengthContraction, laserCavity,
} from '../physics/stat.js';
import { thinFilm } from '../physics/optics.js';
import { num, clear, line, text, lab, arrow, INK, MUTED, RAY, RAY2 } from './kit.js';

function q(id, en, zh, options, answer) { return { id, en, zh, options, answer }; }
function opt(en, zh) { return { en, zh }; }
function ro(en, zh, value) { return { en, zh, value }; }

export const isingSim = {
  id: 'ising',
  timed: false,
  authority: '2-D Ising Metropolis on an N×N lattice with H = −J Σ s_i s_j (J = 1). Temperature is in units of J/k_B. Magnetisation M = (1/N²) Σ s_i after a fixed number of sweeps from a seeded RNG.',
  params: { N: 16, T: 2.2, sweeps: 50, seed: 1 },
  schema: [
    num('N', 'Lattice N', '格子边长 N', '', 6, 24, 2),
    num('T', 'Temperature T', '温度 T', 'J/kB', 0.5, 5, 0.1),
    num('sweeps', 'Sweeps', '扫描次数', '', 10, 200, 10),
    num('seed', 'Seed', '随机种子', '', 1, 99, 1),
  ],
  compute: (p) => isingMetropolis(p),
  readouts: (d) => [
    ro('|M|', '|M|', fmt(d.absM, 3)),
    ro('E', 'E', fmt(d.energy, 1)),
    ro('T', 'T', fmt(d.T, 2)),
  ],
  checks: (d) => [
    q('M', 'Magnetisation magnitude |M| is', '磁化强度 |M| 是', [
      opt(fmt(d.absM, 3), fmt(d.absM, 3)),
      opt('always 1', '恒为 1'),
      opt('always 0', '恒为 0'),
    ], 0),
    q('lowT', 'Lowering T (more sweeps fixed) tends to', '降低 T（扫描次数固定）倾向于', [
      opt('increase |M| toward an ordered state', '使 |M| 增大、趋向有序'),
      opt('force |M| = 0 exactly', '强制 |M| 恰好为 0'),
    ], 0),
  ],
  debug: {
    en: 'Treating every spin flip as accepted ignores the Boltzmann factor e^{−ΔE/T}.',
    zh: '每次翻转都接受，就丢掉了玻尔兹曼因子 e^{−ΔE/T}。',
    toggleEn: 'Accept every flip',
    toggleZh: '每次翻转都接受',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    const cell = Math.min((w * 0.7) / d.N, (h * 0.7) / d.N);
    const x0 = (w - cell * d.N) / 2;
    const y0 = (h - cell * d.N) / 2;
    for (let y = 0; y < d.N; y += 1) {
      for (let x = 0; x < d.N; x += 1) {
        const s = ui.wrong ? 1 : d.spins[y * d.N + x];
        ctx.fillStyle = s > 0 ? RAY : RAY2;
        ctx.fillRect(x0 + x * cell, y0 + y * cell, cell - 0.5, cell - 0.5);
      }
    }
    text(ctx, `|M|=${fmt(ui.wrong ? 1 : d.absM, 3)}`, w * 0.5, h * 0.08, ui.wrong ? '#a33' : INK, 14, 'center');
  },
  pointer() { return null; },
};

export const tunnelSim = {
  id: 'barrier-tunnel',
  timed: false,
  authority: 'Rectangular barrier transmission T(E). For E < V0, T = [1 + V0² sinh²(κa)/(4E(V0−E))]^{-1} with κ = √(2m(V0−E))/ℏ.',
  params: { m: 9.1e-31, a: 1e-10, V0: 1.6e-18, E: 8e-19 },
  schema: [
    num('E', 'Energy E', '能量 E', 'J', 1e-19, 3e-18, 1e-19),
    num('V0', 'Barrier V0', '势垒 V0', 'J', 2e-19, 4e-18, 1e-19),
    num('a', 'Width a', '宽度 a', 'm', 2e-11, 5e-10, 1e-11),
  ],
  compute: (p) => barrierTunnel(p),
  readouts: (d) => [
    ro('T', 'T', fmt(d.T, 4)),
    ro('Regime', '情形', { en: d.regime, zh: { tunnel: '隧穿', over: '越过', edge: '边缘' }[d.regime] || d.regime }),
  ],
  checks: (d) => [
    q('T', 'Transmission coefficient is', '透射系数是', [
      opt(fmt(d.T, 4), fmt(d.T, 4)),
      opt('1 always', '恒为 1'),
      opt('0 always when E < V0', 'E < V0 时恒为 0'),
    ], 0),
  ],
  debug: {
    en: 'Setting T = 0 for every E < V0 ignores tunneling.',
    zh: '凡是 E < V0 就令 T = 0，等于否认隧穿。',
    toggleEn: 'Force T = 0 below V0',
    toggleZh: '势垒下强制 T = 0',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    const y0 = h * 0.7;
    line(ctx, w * 0.1, y0, w * 0.35, y0, INK, 2);
    const top = y0 - h * 0.35;
    line(ctx, w * 0.35, y0, w * 0.35, top, INK, 2);
    line(ctx, w * 0.35, top, w * 0.55, top, INK, 2);
    line(ctx, w * 0.55, top, w * 0.55, y0, INK, 2);
    line(ctx, w * 0.55, y0, w * 0.9, y0, INK, 2);
    const eY = y0 - (d.E / Math.max(d.V0, d.E)) * h * 0.35;
    line(ctx, w * 0.1, eY, w * 0.9, eY, RAY, 1.5, [4, 3]);
    const Tshow = ui.wrong && d.regime === 'tunnel' ? 0 : d.T;
    text(ctx, `T=${fmt(Tshow, 4)}`, w * 0.5, h * 0.12, ui.wrong ? '#a33' : INK, 16, 'center');
  },
  pointer() { return null; },
};

export const packetSim = {
  id: 'wave-packet',
  timed: true,
  tMax: (p) => Math.min(8e-14, (6 * Math.max(p.m, 1e-40) * p.sigma0 * p.sigma0) / 1.054571817e-34),
  authority: 'Free Gaussian packet: centre moves at ℏ k0 / m and width σ(t) = σ0 √(1 + (ℏ t /(2 m σ0²))²).',
  params: { m: 9.1e-31, sigma0: 2e-10, k0: 1e10, x0: 0 },
  schema: [
    num('sigma0', 'Initial σ0', '初宽度 σ0', 'm', 5e-11, 5e-10, 1e-11),
    num('k0', 'Wave number k0', '波数 k0', '1/m', 0, 3e10, 1e9),
  ],
  compute: (p, t) => gaussianPacket(p, t),
  readouts: (d) => [
    ro('σ', 'σ', d.sigma.toExponential(3) + ' m'),
    ro('xc', 'xc', d.xc.toExponential(3) + ' m'),
  ],
  checks: (d) => [
    q('spread', 'As t increases, σ', '随时间增加，σ', [
      opt('grows (spreads)', '变大（展宽）'),
      opt('stays exactly σ0', '严格保持 σ0'),
      opt('shrinks', '变小'),
    ], 0),
  ],
  debug: {
    en: 'Holding σ fixed at σ0 denies free-packet spreading.',
    zh: '把 σ 钉在 σ0，就否认了自由波包展宽。',
    toggleEn: 'Freeze σ = σ0',
    toggleZh: '冻结 σ = σ0',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    const gx = w * 0.08;
    const gy = h * 0.75;
    const gw = w * 0.84;
    const gh = h * 0.5;
    line(ctx, gx, gy, gx + gw, gy, MUTED, 1);
    const sigma = ui.wrong ? d.sigma0 : d.sigma;
    const xMin = d.xc - 4 * sigma;
    const xMax = d.xc + 4 * sigma;
    ctx.beginPath();
    for (let i = 0; i <= 120; i += 1) {
      const x = xMin + ((xMax - xMin) * i) / 120;
      const dens = gaussianPacketPsi2({ ...p, sigma0: p.sigma0 }, ui.wrong ? 0 : d.t, x).dens;
      const X = gx + ((x - xMin) / (xMax - xMin)) * gw;
      const Y = gy - dens * gh * (sigma * Math.sqrt(Math.PI));
      if (i === 0) ctx.moveTo(X, Y);
      else ctx.lineTo(X, Y);
    }
    ctx.strokeStyle = RAY2;
    ctx.lineWidth = 2;
    ctx.stroke();
    text(ctx, `σ=${(ui.wrong ? d.sigma0 : d.sigma).toExponential(2)} m`, w * 0.5, h * 0.12, ui.wrong ? '#a33' : INK, 14, 'center');
  },
  pointer() { return null; },
};

export const maxwellHistSim = {
  id: 'maxwell-speed',
  timed: false,
  authority: 'Maxwell–Boltzmann speed distribution f(v) = √(2/π) (v²/a³) e^{−v²/(2a²)} with a = √(kT/m). Histogram bars sample that pdf.',
  params: { m: 4.65e-26, T: 300, bins: 20, vmax: 1500 },
  schema: [
    num('T', 'Temperature T', '温度 T', 'K', 100, 600, 10),
    num('m', 'Mass m', '质量 m', 'kg', 1e-26, 1e-25, 1e-27),
    num('bins', 'Bins', '直方条数', '', 10, 30, 1),
  ],
  compute: (p) => maxwellHistogram(p),
  readouts: (d) => [
    ro('vmp', 'vmp', `${fmt(d.vmp, 1)} m/s`),
    ro('⟨v⟩', '⟨v⟩', `${fmt(d.vavg, 1)} m/s`),
    ro('vrms', 'vrms', `${fmt(d.vrms, 1)} m/s`),
  ],
  checks: (d) => [
    q('order', 'The three speeds satisfy', '三个特征速率满足', [
      opt('vmp < ⟨v⟩ < vrms', 'vmp < ⟨v⟩ < vrms'),
      opt('vrms < ⟨v⟩ < vmp', 'vrms < ⟨v⟩ < vmp'),
    ], 0),
  ],
  debug: {
    en: 'Labeling vrms as the most probable speed swaps the peak and the rms.',
    zh: '把 vrms 标成最可几速率，峰和方均根就对调了。',
    toggleEn: 'Call vrms the peak',
    toggleZh: '把 vrms 标成峰值',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    const gx = w * 0.1;
    const gy = h * 0.78;
    const gw = w * 0.8;
    const gh = h * 0.55;
    const maxH = Math.max(...d.heights, 1e-12);
    const bw = gw / d.bins;
    d.heights.forEach((ht, i) => {
      const bh = (ht / maxH) * gh;
      ctx.fillStyle = RAY2;
      ctx.fillRect(gx + i * bw, gy - bh, bw * 0.9, bh);
    });
    const peak = ui.wrong ? d.vrms : d.vmp;
    const px = gx + (peak / d.vmax) * gw;
    line(ctx, px, gy, px, gy - gh, RAY, 1.5, [3, 3]);
    text(ctx, ui.wrong ? 'vrms?' : 'vmp', px, gy - gh - 8, ui.wrong ? '#a33' : INK, 12, 'center');
  },
  pointer() { return null; },
};

export const fourierSim = {
  id: 'fourier-square',
  timed: true,
  tMax: (p) => Math.max(2, 2 / Math.max(p.f0, 0.1)),
  authority: 'Square-wave Fourier partial sum: (4A/π) Σ_{k odd} sin(k ω t)/k with nTerms odd harmonics.',
  params: { nTerms: 5, f0: 1, A: 1 },
  schema: [
    num('nTerms', 'Odd harmonics N', '奇次项数 N', '', 1, 20, 1),
    num('f0', 'Fundamental f0', '基频 f0', 'Hz', 0.5, 5, 0.5),
    num('A', 'Amplitude A', '振幅 A', '', 0.2, 2, 0.1),
  ],
  compute: (p, t) => fourierSquare(p, t),
  readouts: (d) => [
    ro('y', 'y', fmt(d.y, 3)),
    ro('N', 'N', String(d.nTerms)),
  ],
  checks: (d) => [
    q('first', 'The first term uses', '第一项使用', [
      opt('sin(ω t) with coefficient 4A/π', 'sin(ω t)，系数 4A/π'),
      opt('cos(ω t) only', '只有 cos(ω t)'),
    ], 0),
  ],
  debug: {
    en: 'Keeping only the first sine and calling it the full square wave ignores Gibbs ringing from higher terms.',
    zh: '只用第一项正弦就当成方波，会丢掉高次项的吉布斯现象。',
    toggleEn: 'Use only the first term',
    toggleZh: '只用第一项',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    const gx = w * 0.08;
    const gy = h * 0.5;
    const gw = w * 0.84;
    const gh = h * 0.35;
    line(ctx, gx, gy, gx + gw, gy, MUTED, 1);
    ctx.beginPath();
    for (let i = 0; i <= 200; i += 1) {
      const tt = (i / 200) * (2 / d.f0);
      const sample = fourierSquare(ui.wrong ? { ...p, nTerms: 1 } : p, tt);
      const x = gx + (i / 200) * gw;
      const y = gy - (sample.y / Math.max(d.A, 1e-6)) * gh * 0.7;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = ui.wrong ? '#a33' : RAY2;
    ctx.lineWidth = 2;
    ctx.stroke();
    text(ctx, `N=${ui.wrong ? 1 : d.nTerms}`, w * 0.5, h * 0.12, ui.wrong ? '#a33' : INK, 14, 'center');
  },
  pointer() { return null; },
};

export const membraneSim = {
  id: 'membrane',
  timed: true,
  tMax: (p) => {
    const d = membraneMode(p, 0);
    return Math.min(8, (4 * Math.PI) / Math.max(d.omega, 0.2));
  },
  authority: 'Rectangular membrane eigenmode u_mn = sin(mπx/a) sin(nπy/b) cos(ω t) with ω = π c √((m/a)²+(n/b)²).',
  params: { m: 1, n: 2, a: 1, b: 1, c: 1 },
  schema: [
    num('m', 'Mode m', '模态 m', '', 1, 4, 1),
    num('n', 'Mode n', '模态 n', '', 1, 4, 1),
    num('a', 'Width a', '边长 a', '', 0.5, 2, 0.1),
    num('b', 'Height b', '边长 b', '', 0.5, 2, 0.1),
    num('c', 'Wave speed c', '波速 c', '', 0.5, 3, 0.1),
  ],
  compute: (p, t) => membraneMode(p, t),
  readouts: (d) => [
    ro('ω', 'ω', fmt(d.omega, 3)),
    ro('u', 'u', fmt(d.u, 3)),
  ],
  checks: (d) => [
    q('nodes', 'Mode (m,n) has nodal lines', '模态 (m,n) 的节线', [
      opt(`m−1 vertical and n−1 horizontal interiors`, `竖直 m−1 条、水平 n−1 条（内部）`),
      opt('none ever', '永远没有'),
    ], 0),
  ],
  debug: {
    en: 'Using ω = π c (m/a + n/b) invents the wrong dispersion.',
    zh: '写成 ω = π c (m/a + n/b)，色散关系就错了。',
    toggleEn: 'Use ω ∝ m/a + n/b',
    toggleZh: '改成 ω 正比于 m/a+n/b',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    const gx = w * 0.15;
    const gy = h * 0.15;
    const gw = w * 0.7;
    const gh = h * 0.65;
    const nx = 24;
    const ny = 18;
    const omegaShow = ui.wrong
      ? Math.PI * d.c * (d.m / d.a + d.n / d.b)
      : d.omega;
    for (let j = 0; j <= ny; j += 1) {
      for (let i = 0; i <= nx; i += 1) {
        const x = (d.a * i) / nx;
        const y = (d.b * j) / ny;
        const u = Math.sin((d.m * Math.PI * x) / d.a) * Math.sin((d.n * Math.PI * y) / d.b) * Math.cos(omegaShow * d.t);
        const bright = Math.floor(128 + 100 * u);
        ctx.fillStyle = `rgb(${bright},${180},${255 - bright})`;
        ctx.fillRect(gx + (i / nx) * gw, gy + (j / ny) * gh, gw / nx + 0.5, gh / ny + 0.5);
      }
    }
    text(ctx, `ω=${fmt(omegaShow, 2)}`, w * 0.5, h * 0.92, ui.wrong ? '#a33' : INK, 14, 'center');
  },
  pointer() { return null; },
};

export const bellSim = {
  id: 'bell-singlet',
  timed: false,
  authority: 'Singlet teaching correlation ⟨σ_a · σ_b⟩ = −cos(α−β). Outcome shares follow that angle. Not a communication protocol.',
  params: { alpha: 0, beta: 60 },
  schema: [
    num('alpha', 'Angle α', '角度 α', '°', 0, 180, 5),
    num('beta', 'Angle β', '角度 β', '°', 0, 180, 5),
  ],
  compute: (p) => bellSinglet(p),
  readouts: (d) => [
    ro('corr', '⟨σσ⟩', fmt(d.corr, 3)),
    ro('P(same)', '同号概率', fmt(d.pSame, 3)),
    ro('P(opp)', '异号概率', fmt(d.pOpp, 3)),
  ],
  checks: (d) => [
    q('corr', 'The correlation is', '关联是', [
      opt(`${fmt(d.corr, 3)} = −cos(α−β)`, `${fmt(d.corr, 3)} = −cos(α−β)`),
      opt(`${fmt(-d.corr, 3)}`, `${fmt(-d.corr, 3)}`),
    ], 0),
  ],
  debug: {
    en: 'Using +cos(θ) flips the singlet correlation sign.',
    zh: '写成 +cos(θ) 会把单态关联符号弄反。',
    toggleEn: 'Use +cos(θ)',
    toggleZh: '改用 +cos(θ)',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    const corr = ui.wrong ? -d.corr : d.corr;
    text(ctx, `⟨σσ⟩=${fmt(corr, 3)}`, w * 0.5, h * 0.25, ui.wrong ? '#a33' : INK, 18, 'center');
    text(ctx, lab(ui, 'not a protocol', '不是通信协议'), w * 0.5, h * 0.45, MUTED, 13, 'center');
    const bar = (x, val, label) => {
      ctx.fillStyle = RAY2;
      ctx.fillRect(x, h * 0.7 - val * h * 0.25, 40, val * h * 0.25);
      text(ctx, label, x + 20, h * 0.78, MUTED, 11, 'center');
    };
    bar(w * 0.3, d.pSame, 'same');
    bar(w * 0.55, d.pOpp, 'opp');
  },
  pointer() { return null; },
};

export const sternSim = {
  id: 'stern-gerlach',
  timed: false,
  authority: 'Spin-1/2 prepared +z, measured at polar angle θ: P(+) = cos²(θ/2), P(−) = sin²(θ/2). Teaching probabilities only — no apparatus design.',
  params: { theta: 60 },
  schema: [
    num('theta', 'Polar angle θ', '极角 θ', '°', 0, 180, 5),
  ],
  compute: (p) => sternGerlach(p),
  readouts: (d) => [
    ro('P(+)', 'P(+)', fmt(d.pUp, 3)),
    ro('P(−)', 'P(−)', fmt(d.pDown, 3)),
  ],
  checks: (d) => [
    q('sum', 'P(+) + P(−) equals', 'P(+) + P(−) 等于', [
      opt('1', '1'),
      opt(fmt(d.pUp, 3), fmt(d.pUp, 3)),
    ], 0),
    q('p', 'P(+) is', 'P(+) 是', [
      opt(`${fmt(d.pUp, 3)} = cos²(θ/2)`, `${fmt(d.pUp, 3)} = cos²(θ/2)`),
      opt(`${fmt(d.pDown, 3)}`, `${fmt(d.pDown, 3)}`),
    ], 0),
  ],
  debug: {
    en: 'Using P(+) = cos²θ forgets the half-angle.',
    zh: '写成 P(+) = cos²θ 会丢掉半角。',
    toggleEn: 'Use cos²θ',
    toggleZh: '改用 cos²θ',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    const pUp = ui.wrong ? Math.cos((d.theta * Math.PI) / 180) ** 2 : d.pUp;
    ctx.fillStyle = RAY;
    ctx.fillRect(w * 0.25, h * 0.7 - pUp * h * 0.4, 60, pUp * h * 0.4);
    ctx.fillStyle = RAY2;
    ctx.fillRect(w * 0.55, h * 0.7 - (1 - pUp) * h * 0.4, 60, (1 - pUp) * h * 0.4);
    text(ctx, '+', w * 0.28 + 20, h * 0.78, MUTED, 14, 'center');
    text(ctx, '−', w * 0.58 + 20, h * 0.78, MUTED, 14, 'center');
    text(ctx, `P(+)=${fmt(pUp, 3)}`, w * 0.5, h * 0.18, ui.wrong ? '#a33' : INK, 16, 'center');
  },
  pointer() { return null; },
};

export const lengthSim = {
  id: 'length-contraction',
  timed: false,
  authority: 'Length contraction: ℓ = ℓ0 / γ with γ = 1/√(1 − v²/c²). Teaching relation only.',
  params: { L0: 1, v: 1.5e8 },
  schema: [
    num('L0', 'Proper length ℓ0', '固有长度 ℓ0', 'm', 0.2, 5, 0.1),
    num('v', 'Speed v', '速率 v', 'm/s', 1e7, 2.9e8, 1e7),
  ],
  compute: (p) => lengthContraction(p),
  readouts: (d) => [
    ro('γ', 'γ', fmt(d.gamma, 4)),
    ro('ℓ', 'ℓ', `${fmt(d.L, 3)} m`),
  ],
  checks: (d) => [
    q('L', 'Contracted length is', '收缩后长度是', [
      opt(`${fmt(d.L, 3)} m = ℓ0 / γ`, `${fmt(d.L, 3)} m = ℓ0 / γ`),
      opt(`${fmt(d.L0 * d.gamma, 3)} m`, `${fmt(d.L0 * d.gamma, 3)} m`),
    ], 0),
  ],
  debug: {
    en: 'Using ℓ = ℓ0 γ lengthens the rod instead of contracting it.',
    zh: '写成 ℓ = ℓ0 γ 会把杆拉长而不是缩短。',
    toggleEn: 'Use ℓ = ℓ0 γ',
    toggleZh: '改用 ℓ = ℓ0 γ',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    const Lshow = ui.wrong ? d.L0 * d.gamma : d.L;
    line(ctx, w * 0.15, h * 0.35, w * 0.15 + d.L0 * w * 0.12, h * 0.35, RAY, 10);
    line(ctx, w * 0.15, h * 0.6, w * 0.15 + Lshow * w * 0.12, h * 0.6, RAY2, 10);
    text(ctx, `ℓ0=${fmt(d.L0, 2)}`, w * 0.5, h * 0.28, MUTED, 12, 'center');
    text(ctx, `ℓ=${fmt(Lshow, 2)}`, w * 0.5, h * 0.72, ui.wrong ? '#a33' : INK, 12, 'center');
  },
  pointer() { return null; },
};

export const cavitySim = {
  id: 'laser-cavity',
  timed: false,
  authority: 'Fabry–Pérot mode spacing Δν = c / (2 L). Frequency spacing only — not how to prepare a gain medium.',
  params: { L: 0.5 },
  schema: [
    num('L', 'Cavity length L', '腔长 L', 'm', 0.05, 2, 0.05),
  ],
  compute: (p) => laserCavity(p),
  readouts: (d) => [
    ro('Δν', 'Δν', `${(d.dnu / 1e6).toFixed(3)} MHz`),
    ro('L', 'L', `${fmt(d.L, 2)} m`),
  ],
  checks: (d) => [
    q('dnu', 'Mode spacing is', '模间隔是', [
      opt(`${(d.dnu / 1e6).toFixed(3)} MHz = c/(2L)`, `${(d.dnu / 1e6).toFixed(3)} MHz = c/(2L)`),
      opt(`${(d.c / d.L / 1e6).toFixed(3)} MHz`, `${(d.c / d.L / 1e6).toFixed(3)} MHz`),
    ], 0),
  ],
  debug: {
    en: 'Using Δν = c/L doubles the spacing.',
    zh: '写成 Δν = c/L 会把间隔翻倍。',
    toggleEn: 'Use Δν = c/L',
    toggleZh: '改用 Δν = c/L',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    line(ctx, w * 0.25, h * 0.3, w * 0.25, h * 0.7, INK, 4);
    line(ctx, w * 0.75, h * 0.3, w * 0.75, h * 0.7, INK, 4);
    line(ctx, w * 0.25, h * 0.5, w * 0.75, h * 0.5, RAY, 1.5, [4, 4]);
    const dnu = ui.wrong ? d.c / d.L : d.dnu;
    text(ctx, `Δν=${(dnu / 1e6).toFixed(2)} MHz`, w * 0.5, h * 0.18, ui.wrong ? '#a33' : INK, 16, 'center');
  },
  pointer() { return null; },
};

export const filmSim = {
  id: 'thin-film',
  timed: false,
  authority: 'Thin-film constructive reflection with a net π phase flip: 2 n t = (m + ½) λ.',
  params: { n: 1.33, t: 2e-7, lambda: 5.32e-7, m: 0 },
  schema: [
    num('n', 'Index n', '折射率 n', '', 1.1, 2, 0.01),
    num('t', 'Thickness t', '厚度 t', 'm', 5e-8, 8e-7, 1e-8),
    num('lambda', 'Wavelength λ', '波长 λ', 'm', 4e-7, 7e-7, 1e-8),
    num('m', 'Order m', '级次 m', '', 0, 5, 1),
  ],
  compute: (p) => thinFilm(p),
  readouts: (d) => [
    ro('2nt', '2nt', d.lhs.toExponential(3) + ' m'),
    ro('(m+½)λ', '(m+½)λ', d.condition.toExponential(3) + ' m'),
    ro('λ_bright', '亮纹 λ', d.lambdaBright.toExponential(3) + ' m'),
  ],
  checks: (d) => [
    q('cond', 'Constructive reflection uses', '反射相长使用', [
      opt('2 n t = (m + ½) λ', '2 n t = (m + ½) λ'),
      opt('2 n t = m λ only', '只有 2 n t = m λ'),
    ], 0),
  ],
  debug: {
    en: 'Dropping the ½ turns the bright condition into the dark one for this phase convention.',
    zh: '丢掉 ½，在这个相位约定下亮纹条件就变成暗纹了。',
    toggleEn: 'Use 2nt = m λ',
    toggleZh: '改用 2nt = m λ',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    ctx.fillStyle = 'rgba(100,160,220,0.35)';
    ctx.fillRect(w * 0.2, h * 0.4, w * 0.6, h * 0.2);
    line(ctx, w * 0.2, h * 0.4, w * 0.8, h * 0.4, INK, 2);
    line(ctx, w * 0.2, h * 0.6, w * 0.8, h * 0.6, INK, 2);
    const cond = ui.wrong ? d.m * d.lambda : d.condition;
    text(ctx, `2nt=${d.lhs.toExponential(2)}`, w * 0.5, h * 0.2, INK, 14, 'center');
    text(ctx, ui.wrong ? `mλ=${cond.toExponential(2)}` : `(m+½)λ=${cond.toExponential(2)}`, w * 0.5, h * 0.78, ui.wrong ? '#a33' : MUTED, 13, 'center');
  },
  pointer() { return null; },
};
