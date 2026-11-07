import { fmt } from '../fmt.js?v=__BUILD__';
import {
  isingMetropolis, barrierTunnel, barrierScan, hydrogenRadial, isingTempSweep,
  gaussianPacket, gaussianPacketPsi2,
  maxwellHistogram, maxwellSpeed, fourierSquare, membraneMode, bellSinglet, sternGerlach,
  laserCavity,
} from '../physics/stat.js?v=__BUILD__';
import { thinFilm } from '../physics/optics.js?v=__BUILD__';
import { num, sel, tog, clear, line, text, lab, arrow, teachPanel, INK, MUTED, RAY, RAY2 } from './kit.js?v=__BUILD__';

const KB = 1.380649e-23;
let isingBuf = null;
let isingSweepCache = { key: '', sweep: null };
let isingAtCache = { key: '', at: null };
let isingPlayCache = { key: '', play: null };

function q(id, en, zh, options, answer) { return { id, en, zh, options, answer }; }
function opt(en, zh) { return { en, zh }; }
function ro(en, zh, value) { return { en, zh, value }; }

export const isingSim = {
  id: 'ising',
  timed: true,
  tMax: () => 1,
  authority: '2-D Ising Metropolis on an N×N lattice with H = −J Σ s_i s_j (J = 1). Play sweeps T across Onsager Tc = 2/ln(1+√2) and plots |M|(T). Paint step 2 or 3 redraws every nth cell to cut cost on large lattices.',
  params: { N: 12, T: 2.2, sweeps: 40, seed: 1, Tmin: 0.5, Tmax: 4, paintStep: 1 },
  schema: [
    num('N', 'Lattice N', '格子边长 N', '', 6, 20, 2),
    num('T', 'Probe T', '探针 T', 'J/kB', 0.5, 5, 0.1),
    num('Tmin', 'Sweep Tmin', '扫温下限', 'J/kB', 0.2, 2, 0.1),
    num('Tmax', 'Sweep Tmax', '扫温上限', 'J/kB', 2, 6, 0.1),
    num('sweeps', 'Sweeps', '扫描次数', '', 10, 120, 10),
    num('seed', 'Seed', '随机种子', '', 1, 99, 1),
    num('paintStep', 'Paint step', '降采样步长', '', 1, 3, 1),
  ],
  onParam(key, value, next) {
    const patch = {};
    let Tmin = next.Tmin;
    let Tmax = next.Tmax;
    let T = next.T;
    // Large lattices default to paint step 2 so 320px stages stay responsive.
    if (key === 'N' && value >= 16 && (next.paintStep ?? 1) < 2) patch.paintStep = 2;
    if (key === 'Tmin' && value >= Tmax - 0.2) {
      Tmax = value + 0.5;
      patch.Tmax = Tmax;
    }
    if (key === 'Tmax' && value <= Tmin + 0.2) {
      Tmin = Math.max(0.2, value - 0.5);
      patch.Tmin = Tmin;
    }
    if (key === 'Tmin') Tmin = value;
    if (key === 'Tmax') Tmax = value;
    if (key === 'T') T = value;
    // Keep probe T inside the sweep window used by the cached |M|(T) curve.
    if (T < Tmin) patch.T = Tmin;
    else if (T > Tmax) patch.T = Tmax;
    return patch;
  },
  compute: (p, t) => {
    const Tmin = p.Tmin ?? 0.5;
    const Tmax = p.Tmax ?? 4;
    const T = Math.min(Tmax, Math.max(Tmin, p.T));
    const key = [p.N, p.sweeps, p.seed, Tmin, Tmax, 20].join('|');
    if (isingSweepCache.key !== key) {
      isingSweepCache = { key, sweep: isingTempSweep({ ...p, Tmin, Tmax, steps: 20 }) };
    }
    const sweep = isingSweepCache.sweep;
    const Tplay = sweep.Tmin + Math.min(1, Math.max(0, t)) * (sweep.Tmax - sweep.Tmin);
    // Cache Metropolis lattices: probe T exact; play T quantized so scrubbing/play is not N² every frame.
    const atKey = [p.N, p.sweeps, p.seed, T].join('|');
    if (isingAtCache.key !== atKey) {
      isingAtCache = { key: atKey, at: isingMetropolis({ ...p, T }) };
    }
    const at = isingAtCache.at;
    const TplayQ = Math.round(Tplay * 10) / 10;
    const playKey = [p.N, p.sweeps, p.seed, TplayQ].join('|');
    if (isingPlayCache.key !== playKey) {
      isingPlayCache = {
        key: playKey,
        play: isingMetropolis({ ...p, T: TplayQ, seed: p.seed + Math.round(TplayQ * 10) }),
      };
    }
    const play = isingPlayCache.play;
    const paintStep = Math.max(1, Math.min(3, Math.round(p.paintStep ?? 1)));
    const cells = Math.ceil(at.N / paintStep) ** 2;
    const inSweep = p.T >= Tmin - 1e-9 && p.T <= Tmax + 1e-9;
    return {
      ...at, T, sweep, Tplay, playAbsM: play.absM, playSpins: play.spins, Tc: sweep.Tc,
      paintStep, cells, Tmin, Tmax, inSweep, tip: inSweep ? '' : `clamp T→[${Tmin},${Tmax}]`,
    };
  },
  readouts: (d) => [
    ro('|M|', '|M|', fmt(d.absM, 3)),
    ro('T', 'T', fmt(d.T, 2)),
    ro('window', '扫温窗', `[${fmt(d.Tmin, 1)}, ${fmt(d.Tmax, 1)}]`),
    { en: 'lock', zh: '互锁', value: d.inSweep ? 'T ∈ [Tmin, Tmax]' : d.tip, hi: !d.inSweep },
    ro('T▶', '扫温 T', fmt(d.Tplay, 2)),
    ro('Tc', 'Onsager Tc', fmt(d.Tc, 4)),
    ro('paint', '有效格点', `${d.cells} (×${d.paintStep})`),
  ],
  checks: (d) => [
    q('Tc', 'Onsager critical temperature (J = k_B = 1) is', 'Onsager 临界温度（J = k_B = 1）是', [
      opt(`${fmt(d.Tc, 4)} = 2/ln(1+√2)`, `${fmt(d.Tc, 4)} = 2/ln(1+√2)`),
      opt('1.0000', '1.0000'),
      opt('4.0000', '4.0000'),
    ], 0),
    q('cross', 'As the sweep passes above Tc, |M| tends to', '扫温越过 Tc 后，|M| 倾向于', [
      opt('drop toward a disordered value', '降到更接近无序'),
      opt('lock at exactly 1', '锁死在 1'),
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
    // Wide: lattice left / |M|(T) right. Narrow (≤360): lattice on top, curve below.
    const narrow = w <= 360;
    const cell = Math.min(
      (narrow ? w * 0.7 : w * 0.32) / d.N,
      (narrow ? h * 0.32 : h * 0.55) / d.N,
    );
    const x0 = narrow ? (w - cell * d.N) / 2 : w * 0.06;
    const y0 = narrow ? h * 0.08 : h * 0.22;
    const side = Math.ceil(cell * d.N);
    const spins = ui.wrong ? d.playSpins.map(() => 1) : d.playSpins;
    const step = d.paintStep || 1;
    const paint = (g, ox, oy) => {
      for (let y = 0; y < d.N; y += step) {
        for (let x = 0; x < d.N; x += step) {
          g.fillStyle = spins[y * d.N + x] > 0 ? RAY : RAY2;
          g.fillRect(ox + x * cell, oy + y * cell, cell * step - 0.5, cell * step - 0.5);
        }
      }
    };
    if (d.N >= 12) {
      if (!isingBuf || isingBuf.width !== side) {
        if (typeof OffscreenCanvas !== 'undefined') {
          isingBuf = new OffscreenCanvas(side, side);
        } else if (typeof document !== 'undefined' && typeof document.createElement === 'function') {
          isingBuf = Object.assign(document.createElement('canvas'), { width: side, height: side });
        } else {
          throw new Error(
            'Ising N≥12 needs OffscreenCanvas or document.createElement("canvas"); '
            + 'mock globalThis.OffscreenCanvas in Node smoke (see scripts/smoke-layout.mjs)',
          );
        }
      }
      const g = isingBuf.getContext('2d');
      g.clearRect(0, 0, side, side);
      paint(g, 0, 0);
      ctx.drawImage(isingBuf, x0, y0);
    } else {
      paint(ctx, x0, y0);
    }
    // |M|(T) panel: right on wide, under lattice on narrow.
    const panelX = narrow ? w * 0.06 : w * 0.44;
    const panelY = narrow ? h * 0.44 : h * 0.16;
    const panelW = narrow ? w * 0.88 : w * 0.52;
    const panelH = narrow ? h * 0.52 : h * 0.72;
    teachPanel(ctx, panelX, panelY, panelW, panelH);
    const gx = panelX + panelW * 0.1;
    const gy = panelY + panelH * 0.88;
    const gw = panelW * 0.78;
    const gh = panelH * 0.7;
    line(ctx, gx, gy, gx + gw, gy, MUTED, 1);
    line(ctx, gx, gy, gx, gy - gh, MUTED, 1);
    ctx.beginPath();
    d.sweep.curve.forEach((pt, i) => {
      const X = gx + ((pt.T - d.sweep.Tmin) / (d.sweep.Tmax - d.sweep.Tmin)) * gw;
      const Y = gy - pt.absM * gh;
      if (i === 0) ctx.moveTo(X, Y);
      else ctx.lineTo(X, Y);
    });
    ctx.strokeStyle = RAY2;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    const tcX = gx + ((d.Tc - d.sweep.Tmin) / (d.sweep.Tmax - d.sweep.Tmin)) * gw;
    line(ctx, tcX, gy, tcX, gy - gh, MUTED, 1.5, [4, 3]);
    text(ctx, 'Tc', tcX, gy - gh - 6, MUTED, 11, 'center');
    const pX = gx + ((d.Tplay - d.sweep.Tmin) / (d.sweep.Tmax - d.sweep.Tmin)) * gw;
    line(ctx, pX, gy, pX, gy - gh, RAY, 1, [2, 2]);
    text(ctx, `|M| vs T  ·  T▶=${fmt(d.Tplay, 2)}`, panelX + panelW / 2, panelY + 14, INK, 12, 'center');
  },
  pointer() { return null; },
};

export const tunnelSim = {
  id: 'barrier-tunnel',
  timed: false,
  authority: 'Rectangular barrier transmission T(E). For E < V0, T = [1 + V0² sinh²(κa)/(4E(V0−E))]^{-1}. Above V0, exact resonances when k₂ a = n π are marked against the scanned T(E) peaks.',
  params: { m: 9.1e-31, a: 1e-10, V0: 1.6e-18, E: 8e-19, samples: 120 },
  schema: [
    num('E', 'Energy E', '能量 E', 'J', 1e-19, 3e-18, 1e-19),
    num('V0', 'Barrier V0', '势垒 V0', 'J', 2e-19, 4e-18, 1e-19),
    num('a', 'Width a', '宽度 a', 'm', 2e-11, 5e-10, 1e-11),
  ],
  compute: (p) => barrierScan(p),
  readouts: (d) => {
    const rows = [
      ro('T', 'T', fmt(d.T, 4)),
      ro('Regime', '情形', { en: d.regime, zh: { tunnel: '隧穿', over: '越过', edge: '边缘' }[d.regime] || d.regime }),
      ro('Peaks', '扫描峰数', String(d.peaks.length)),
      ro('k₂a=nπ', '理论共振', String(d.resonances.length)),
    ];
    if (d.nearest) {
      rows.push(ro('En', `最近 Eₙ (n=${d.nearest.n})`, d.nearest.E.toExponential(3) + ' J'));
      rows.push(ro('ΔE', '|E−Eₙ|', d.nearest.dE.toExponential(3) + ' J'));
    }
    if (d.peakDelta?.[0]?.nearest) {
      const m = d.peakDelta[0].nearest;
      rows.push(ro('peakΔE', '首峰 ΔE', `n=${m.n}, ${m.dE.toExponential(2)} J`));
    }
    return rows;
  },
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
    // Wide: T(E) left / transmission panel right. Narrow (≤360): stack.
    const narrow = w <= 360;
    const schX = narrow ? w * 0.06 : w * 0.04;
    const schY = narrow ? h * 0.06 : h * 0.1;
    const schW = narrow ? w * 0.88 : w * 0.52;
    const schH = narrow ? h * 0.48 : h * 0.8;
    const gx = schX + schW * 0.1;
    const gy = schY + schH * 0.88;
    const gw = schW * 0.8;
    const gh = schH * 0.62;
    line(ctx, gx, gy, gx + gw, gy, MUTED, 1);
    line(ctx, gx, gy, gx, gy - gh, MUTED, 1);
    ctx.beginPath();
    d.curve.forEach((pt, i) => {
      const X = gx + ((pt.E - d.Emin) / (d.Emax - d.Emin)) * gw;
      const Y = gy - (ui.wrong && pt.regime === 'tunnel' ? 0 : pt.T) * gh;
      if (i === 0) ctx.moveTo(X, Y);
      else ctx.lineTo(X, Y);
    });
    ctx.strokeStyle = RAY2;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    const vX = gx + ((d.V0 - d.Emin) / (d.Emax - d.Emin)) * gw;
    line(ctx, vX, gy, vX, gy - gh, MUTED, 1, [3, 3]);
    text(ctx, 'V0', vX, gy - gh - 6, MUTED, 11, 'center');
    for (const pk of d.peaks) {
      const X = gx + ((pk.E - d.Emin) / (d.Emax - d.Emin)) * gw;
      const Y = gy - pk.T * gh;
      ctx.fillStyle = RAY;
      ctx.beginPath();
      ctx.arc(X, Y, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const rs of d.resonances) {
      const X = gx + ((rs.E - d.Emin) / (d.Emax - d.Emin)) * gw;
      line(ctx, X, gy, X, gy - gh, MUTED, 1, [1, 3]);
      text(ctx, String(rs.n), X, gy + 12, MUTED, 10, 'center');
    }
    const eX = gx + ((d.E - d.Emin) / (d.Emax - d.Emin)) * gw;
    line(ctx, eX, gy, eX, gy - gh, RAY, 1, [2, 2]);
    const Tshow = ui.wrong && d.regime === 'tunnel' ? 0 : d.T;

    const panelX = narrow ? w * 0.06 : w * 0.6;
    const panelY = narrow ? h * 0.58 : h * 0.12;
    const panelW = narrow ? w * 0.88 : w * 0.36;
    const panelH = narrow ? h * 0.38 : h * 0.76;
    teachPanel(ctx, panelX, panelY, panelW, panelH, lab(ui, 'T(E) barrier', 'T(E) 势垒'));
    text(ctx, `T=${fmt(Tshow, 4)}`, panelX + panelW / 2, panelY + panelH * 0.32, ui.wrong ? '#a33' : RAY, 14, 'center');
    text(ctx, `peaks=${d.peaks.length}`, panelX + panelW / 2, panelY + panelH * 0.55, MUTED, 12, 'center');
    text(ctx, `k₂a=nπ×${d.resonances.length}`, panelX + panelW / 2, panelY + panelH * 0.75, MUTED, 12, 'center');
  },
  pointer() { return null; },
};

export const hydrogenRadialSim = {
  id: 'hydrogen-radial',
  timed: false,
  authority: 'Hydrogen radial probability density P(r) = r² R_nl(r)² with Bohr radius a0. Classroom forms for n = 1…4; a trapezoid integral of P(r) checks normalisation ≈ 1.',
  params: { n: 2, l: 0, r: 1e-10 },
  schema: (p) => [
    num('n', 'n', 'n', '', 1, 4, 1),
    num('l', 'l', 'l', '', 0, Math.max(0, Math.round(p.n) - 1), 1),
    num('r', 'Probe r', '探针 r', 'm', 0, 2e-9, 2e-11),
  ],
  onParam(key, value, next) {
    if (key !== 'n') return {};
    const n = Math.max(1, Math.min(4, Math.round(value)));
    const lMax = n - 1;
    if (next.l > lMax) return { l: lMax };
    return {};
  },
  compute: (p) => hydrogenRadial(p),
  readouts: (d) => [
    ro('Rnl', 'R_nl', d.R.toExponential(3)),
    ro('r²R²', 'r² R²', d.dens.toExponential(3)),
    ro('∫P', '∫ P(r) dr', fmt(d.integ, 3)),
  ],
  checks: (d) => {
    const qs = [
      q('norm', 'The radial integral ∫ P(r) dr is about', '径向积分 ∫ P(r) dr 约为', [
        opt(`${fmt(d.integ, 3)} ≈ 1`, `${fmt(d.integ, 3)} ≈ 1`),
        opt('0', '0'),
      ], 0),
      q('form', 'The plotted density is', '图上画的是', [
        opt('r² R_nl²(r)', 'r² R_nl²(r)'),
        opt('|R_nl| alone', '只有 |R_nl|'),
      ], 0),
    ];
    if (d.n === 4 && d.l === 1) {
      qs.push(q('R41', 'For n=4, l=1 the normalisation check ∫P is', 'n=4、l=1 时归一化检查 ∫P 是', [
        opt(`∫P ≈ 1 (${fmt(d.integ, 3)})`, `∫P ≈ 1（${fmt(d.integ, 3)}）`),
        opt('∫P ≈ 0', '∫P ≈ 0'),
      ], 0));
    }
    return qs;
  },
  debug: {
    en: 'Plotting |R| without the r² weight shifts the peaks inward.',
    zh: '不乘 r² 只画 |R|，峰会往里移。',
    toggleEn: 'Plot |R| only',
    toggleZh: '只画 |R|',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    // Wide: P(r) left / radial panel right. Narrow (≤360): stack.
    const narrow = w <= 360;
    const schX = narrow ? w * 0.06 : w * 0.04;
    const schY = narrow ? h * 0.06 : h * 0.1;
    const schW = narrow ? w * 0.88 : w * 0.52;
    const schH = narrow ? h * 0.48 : h * 0.8;
    const gx = schX + schW * 0.1;
    const gy = schY + schH * 0.82;
    const gw = schW * 0.8;
    const gh = schH * 0.58;
    const rMax = d.a * (3 * d.n * d.n + 2);
    let maxY = 1e-40;
    const pts = [];
    // Fewer radial samples while dragging — shape stays clear, phones stay responsive.
    const nSamp = w <= 360 ? 72 : 100;
    for (let i = 0; i <= nSamp; i += 1) {
      const r = (rMax * i) / nSamp;
      const pt = hydrogenRadial({ n: d.n, l: d.l, r });
      const y = ui.wrong ? Math.abs(pt.R) : pt.dens;
      pts.push({ r, y });
      if (y > maxY) maxY = y;
    }
    line(ctx, gx, gy, gx + gw, gy, MUTED, 1);
    ctx.beginPath();
    pts.forEach((pt, i) => {
      const X = gx + (pt.r / rMax) * gw;
      const Y = gy - (pt.y / maxY) * gh;
      if (i === 0) ctx.moveTo(X, Y);
      else ctx.lineTo(X, Y);
    });
    ctx.strokeStyle = RAY2;
    ctx.lineWidth = 2;
    ctx.stroke();
    const px = gx + (Math.min(d.r, rMax) / rMax) * gw;
    line(ctx, px, gy, px, gy - gh, RAY, 1, [3, 3]);

    const panelX = narrow ? w * 0.06 : w * 0.6;
    const panelY = narrow ? h * 0.58 : h * 0.12;
    const panelW = narrow ? w * 0.88 : w * 0.36;
    const panelH = narrow ? h * 0.38 : h * 0.76;
    teachPanel(ctx, panelX, panelY, panelW, panelH, lab(ui, 'P(r) = r² R²', 'P(r) = r² R²'));
    text(ctx, ui.wrong ? '|R|' : 'r² R²', panelX + panelW / 2, panelY + panelH * 0.32, ui.wrong ? '#a33' : RAY, 14, 'center');
    text(ctx, `n=${d.n}, l=${d.l}`, panelX + panelW / 2, panelY + panelH * 0.55, MUTED, 12, 'center');
    text(ctx, `∫P=${fmt(d.integ, 3)}`, panelX + panelW / 2, panelY + panelH * 0.75, MUTED, 12, 'center');
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
    // Wide: |ψ|² left / σ(t) panel right. Narrow (≤360): stack.
    const narrow = w <= 360;
    const sigma = ui.wrong ? d.sigma0 : d.sigma;
    const waveX = narrow ? w * 0.06 : w * 0.04;
    const waveY = narrow ? h * 0.08 : h * 0.12;
    const waveW = narrow ? w * 0.88 : w * 0.44;
    const waveH = narrow ? h * 0.36 : h * 0.76;
    text(ctx, lab(ui, '|ψ|²', '|ψ|²'), waveX + waveW / 2, waveY, MUTED, 12, 'center');
    const gx = waveX + waveW * 0.08;
    const gy = waveY + waveH * 0.78;
    const gw = waveW * 0.84;
    const gh = waveH * 0.55;
    line(ctx, gx, gy, gx + gw, gy, MUTED, 1);
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

    const panelX = narrow ? w * 0.06 : w * 0.52;
    const panelY = narrow ? h * 0.48 : h * 0.12;
    const panelW = narrow ? w * 0.88 : w * 0.44;
    const panelH = narrow ? h * 0.48 : h * 0.76;
    teachPanel(ctx, panelX, panelY, panelW, panelH, lab(ui, 'σ(t) spread', 'σ(t) 展宽'));
    const bx = panelX + panelW * 0.18;
    const by = panelY + panelH * 0.78;
    const bw = panelW * 0.28;
    const bh = panelH * 0.45;
    const s0 = Math.max(d.sigma0, 1e-40);
    const sNow = Math.max(sigma, 1e-40);
    const h0 = bh * (s0 / Math.max(s0, sNow));
    const h1 = bh * (sNow / Math.max(s0, sNow));
    ctx.fillStyle = MUTED;
    ctx.fillRect(bx, by - h0, bw, h0);
    ctx.fillStyle = RAY;
    ctx.fillRect(bx + bw * 1.45, by - h1, bw, h1);
    text(ctx, 'σ₀', bx + bw / 2, by + 14, MUTED, 11, 'center');
    text(ctx, 'σ', bx + bw * 1.45 + bw / 2, by + 14, MUTED, 11, 'center');
    text(ctx, `σ=${sigma.toExponential(2)} m`, panelX + panelW / 2, panelY + 28, ui.wrong ? '#a33' : INK, 13, 'center');
    text(ctx, ui.wrong ? lab(ui, 'σ frozen', 'σ 冻结') : 'σ(t) ≥ σ₀', panelX + panelW / 2, panelY + 48, MUTED, 12, 'center');
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
    // Wide: histogram left / speed ladder right. Narrow (≤360): stack.
    const narrow = w <= 360;
    const histX = narrow ? w * 0.06 : w * 0.04;
    const histY = narrow ? h * 0.08 : h * 0.1;
    const histW = narrow ? w * 0.88 : w * 0.52;
    const histH = narrow ? h * 0.4 : h * 0.82;
    text(ctx, lab(ui, 'f(v)', 'f(v)'), histX + histW / 2, histY, MUTED, 12, 'center');
    const gx = histX + histW * 0.08;
    const gy = histY + histH * 0.88;
    const gw = histW * 0.84;
    const gh = histH * 0.7;
    const fPeak = maxwellSpeed({ m: d.m, T: d.T, v: d.vmp }).f;
    const scale = Math.max(fPeak, ...d.heights, 1e-12);
    const bw = gw / d.bins;
    d.heights.forEach((ht, i) => {
      const bh = (ht / scale) * gh;
      ctx.fillStyle = RAY2;
      ctx.fillRect(gx + i * bw, gy - bh, bw * 0.9, bh);
    });
    ctx.beginPath();
    for (let i = 0; i <= 100; i += 1) {
      const v = (d.vmax * i) / 100;
      const f = maxwellSpeed({ m: d.m, T: d.T, v }).f;
      const X = gx + (v / d.vmax) * gw;
      const Y = gy - (f / scale) * gh;
      if (i === 0) ctx.moveTo(X, Y);
      else ctx.lineTo(X, Y);
    }
    ctx.strokeStyle = MUTED;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    const peak = ui.wrong ? d.vrms : d.vmp;
    const px = gx + (peak / d.vmax) * gw;
    line(ctx, px, gy, px, gy - gh, RAY, 1.5, [3, 3]);
    ctx.fillStyle = RAY;
    ctx.beginPath();
    ctx.arc(px, gy - gh, 5, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, ui.wrong ? 'vrms?' : 'vmp', px, gy - gh - 12, ui.wrong ? '#a33' : INK, 12, 'center');
    ui._maxwellGeo = { gx, gw, vmax: d.vmax, narrow };

    const panelX = narrow ? w * 0.06 : w * 0.6;
    const panelY = narrow ? h * 0.52 : h * 0.12;
    const panelW = narrow ? w * 0.88 : w * 0.36;
    const panelH = narrow ? h * 0.44 : h * 0.76;
    teachPanel(ctx, panelX, panelY, panelW, panelH, lab(ui, 'vmp · ⟨v⟩ · vrms', 'vmp · ⟨v⟩ · vrms'));
    text(ctx, `vmp=${fmt(d.vmp, 0)}`, panelX + panelW / 2, panelY + panelH * 0.28, ui.wrong ? '#a33' : INK, 13, 'center');
    text(ctx, `⟨v⟩=${fmt(d.vavg, 0)}`, panelX + panelW / 2, panelY + panelH * 0.48, MUTED, 13, 'center');
    text(ctx, `vrms=${fmt(d.vrms, 0)}`, panelX + panelW / 2, panelY + panelH * 0.68, MUTED, 13, 'center');
    text(ctx, 'vmp < ⟨v⟩ < vrms', panelX + panelW / 2, panelY + panelH * 0.88, MUTED, 11, 'center');
  },
  pointer(ev, _p, d, ui) {
    if (ev.type === 'down') { ui.drag = 'vmp'; return {}; }
    if (ev.type === 'up') { ui.drag = null; return {}; }
    if (ev.type !== 'move' || ui.drag !== 'vmp') return null;
    const g = ui._maxwellGeo;
    const host = typeof document !== 'undefined' ? document.getElementById('stage') : null;
    const W = host ? host.getBoundingClientRect().width : 640;
    const gx = g?.gx ?? W * 0.1;
    const gw = g?.gw ?? W * 0.8;
    const vmax = g?.vmax ?? d.vmax;
    const v = Math.max(50, Math.min(vmax * 0.98, ((ev.x - gx) / gw) * vmax));
    const T = (d.m * v * v) / (2 * KB);
    return { T: Math.max(50, Math.min(2000, T)) };
  },
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
    // Wide: y(t) left / harmonic ladder right. Narrow (≤360): stack.
    const narrow = w <= 360;
    const nShow = ui.wrong ? 1 : d.nTerms;
    const waveX = narrow ? w * 0.06 : w * 0.04;
    const waveY = narrow ? h * 0.08 : h * 0.1;
    const waveW = narrow ? w * 0.88 : w * 0.52;
    const waveH = narrow ? h * 0.4 : h * 0.8;
    text(ctx, lab(ui, 'y(t)', 'y(t)'), waveX + waveW / 2, waveY + 4, MUTED, 12, 'center');
    const gx = waveX + waveW * 0.08;
    const gy = waveY + waveH * 0.55;
    const gw = waveW * 0.84;
    const gh = waveH * 0.32;
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

    const panelX = narrow ? w * 0.06 : w * 0.6;
    const panelY = narrow ? h * 0.52 : h * 0.12;
    const panelW = narrow ? w * 0.88 : w * 0.36;
    const panelH = narrow ? h * 0.44 : h * 0.76;
    teachPanel(ctx, panelX, panelY, panelW, panelH, lab(ui, 'odd harmonics', '奇次谐波'));
    text(ctx, `N=${nShow}`, panelX + panelW / 2, panelY + panelH * 0.28, ui.wrong ? '#a33' : INK, 15, 'center');
    text(ctx, '4A/π · sin(kωt)/k', panelX + panelW / 2, panelY + panelH * 0.48, MUTED, 12, 'center');
    const barBase = panelY + panelH * 0.88;
    const barMax = panelH * 0.28;
    const odds = [];
    for (let k = 1; k <= Math.max(1, 2 * nShow - 1); k += 2) odds.push(k);
    const show = odds.slice(0, Math.min(6, odds.length));
    const bw = panelW / (show.length + 1);
    show.forEach((k, i) => {
      const amp = 1 / k;
      const bh = amp * barMax;
      const x = panelX + bw * (i + 0.6);
      ctx.fillStyle = ui.wrong && k > 1 ? '#a33' : RAY;
      ctx.fillRect(x, barBase - bh, bw * 0.55, bh);
      text(ctx, String(k), x + bw * 0.28, barBase + 12, MUTED, 10, 'center');
    });
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
    // Keep the eigenmode grid modest — 24×18 fillRect every frame felt sticky on phones.
    const nx = 16;
    const ny = 12;
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
    // Wide: same/opp bars left / ⟨σσ⟩ panel right. Narrow (≤360): stack.
    const narrow = w <= 360;
    const corr = ui.wrong ? -d.corr : d.corr;
    const barX = narrow ? w * 0.06 : w * 0.04;
    const barY = narrow ? h * 0.08 : h * 0.12;
    const barW = narrow ? w * 0.88 : w * 0.5;
    const barH = narrow ? h * 0.4 : h * 0.76;
    const base = barY + barH * 0.82;
    const maxH = barH * 0.5;
    const bar = (xFrac, val, label) => {
      const x = barX + barW * xFrac;
      ctx.fillStyle = RAY2;
      ctx.fillRect(x, base - val * maxH, barW * 0.16, val * maxH);
      text(ctx, label, x + barW * 0.08, base + 14, MUTED, 11, 'center');
    };
    bar(0.22, d.pSame, 'same');
    bar(0.58, d.pOpp, 'opp');
    text(ctx, lab(ui, 'shares', '份额'), barX + barW / 2, barY + 12, MUTED, 12, 'center');

    const panelX = narrow ? w * 0.06 : w * 0.58;
    const panelY = narrow ? h * 0.52 : h * 0.12;
    const panelW = narrow ? w * 0.88 : w * 0.38;
    const panelH = narrow ? h * 0.44 : h * 0.76;
    teachPanel(ctx, panelX, panelY, panelW, panelH, lab(ui, '⟨σσ⟩ = −cos(α−β)', '⟨σσ⟩ = −cos(α−β)'));
    text(ctx, `⟨σσ⟩=${fmt(corr, 3)}`, panelX + panelW / 2, panelY + panelH * 0.35, ui.wrong ? '#a33' : INK, 15, 'center');
    text(ctx, lab(ui, 'not a protocol', '不是通信协议'), panelX + panelW / 2, panelY + panelH * 0.58, MUTED, 12, 'center');
    text(ctx, ui.wrong ? '+cos(θ)' : 'singlet only', panelX + panelW / 2, panelY + panelH * 0.78, MUTED, 11, 'center');
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
    // Wide: ± bars left / P(+) panel right. Narrow (≤360): stack.
    const narrow = w <= 360;
    const pUp = ui.wrong ? Math.cos((d.theta * Math.PI) / 180) ** 2 : d.pUp;
    const barX = narrow ? w * 0.06 : w * 0.04;
    const barY = narrow ? h * 0.08 : h * 0.12;
    const barW = narrow ? w * 0.88 : w * 0.5;
    const barH = narrow ? h * 0.4 : h * 0.76;
    const base = barY + barH * 0.82;
    const maxH = barH * 0.55;
    ctx.fillStyle = RAY;
    ctx.fillRect(barX + barW * 0.22, base - pUp * maxH, barW * 0.2, pUp * maxH);
    ctx.fillStyle = RAY2;
    ctx.fillRect(barX + barW * 0.58, base - (1 - pUp) * maxH, barW * 0.2, (1 - pUp) * maxH);
    text(ctx, '+', barX + barW * 0.32, base + 16, MUTED, 13, 'center');
    text(ctx, '−', barX + barW * 0.68, base + 16, MUTED, 13, 'center');
    text(ctx, lab(ui, 'outcomes', '结果'), barX + barW / 2, barY + 12, MUTED, 12, 'center');

    const panelX = narrow ? w * 0.06 : w * 0.58;
    const panelY = narrow ? h * 0.52 : h * 0.12;
    const panelW = narrow ? w * 0.88 : w * 0.38;
    const panelH = narrow ? h * 0.44 : h * 0.76;
    teachPanel(ctx, panelX, panelY, panelW, panelH, lab(ui, 'P(+) = cos²(θ/2)', 'P(+) = cos²(θ/2)'));
    text(ctx, `P(+)=${fmt(pUp, 3)}`, panelX + panelW / 2, panelY + panelH * 0.38, ui.wrong ? '#a33' : INK, 15, 'center');
    text(ctx, `P(−)=${fmt(1 - pUp, 3)}`, panelX + panelW / 2, panelY + panelH * 0.58, MUTED, 13, 'center');
    text(ctx, ui.wrong ? 'cos²θ' : `θ=${fmt(d.theta, 0)}°`, panelX + panelW / 2, panelY + panelH * 0.78, MUTED, 12, 'center');
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
    // Wide: cavity schematic left / Δν panel right. Narrow (≤360): stack.
    const narrow = w <= 360;
    const cavX = narrow ? w * 0.06 : w * 0.04;
    const cavY = narrow ? h * 0.08 : h * 0.12;
    const cavW = narrow ? w * 0.88 : w * 0.5;
    const cavH = narrow ? h * 0.4 : h * 0.76;
    const left = cavX + cavW * 0.22;
    const right = cavX + cavW * 0.78;
    const midY = cavY + cavH * 0.55;
    line(ctx, left, cavY + cavH * 0.22, left, cavY + cavH * 0.88, INK, 4);
    line(ctx, right, cavY + cavH * 0.22, right, cavY + cavH * 0.88, INK, 4);
    line(ctx, left, midY, right, midY, RAY, 1.5, [4, 4]);
    text(ctx, lab(ui, 'Fabry–Pérot', '法布里–珀罗'), cavX + cavW / 2, cavY + 12, MUTED, 12, 'center');
    text(ctx, `L=${fmt(d.L, 2)} m`, cavX + cavW / 2, cavY + cavH * 0.92, MUTED, 11, 'center');

    const panelX = narrow ? w * 0.06 : w * 0.58;
    const panelY = narrow ? h * 0.52 : h * 0.12;
    const panelW = narrow ? w * 0.88 : w * 0.38;
    const panelH = narrow ? h * 0.44 : h * 0.76;
    teachPanel(ctx, panelX, panelY, panelW, panelH, lab(ui, 'Δν = c/(2L)', 'Δν = c/(2L)'));
    const dnu = ui.wrong ? d.c / d.L : d.dnu;
    text(ctx, `Δν=${(dnu / 1e6).toFixed(2)} MHz`, panelX + panelW / 2, panelY + panelH * 0.4, ui.wrong ? '#a33' : INK, 15, 'center');
    text(ctx, ui.wrong ? 'Δν = c/L' : 'mode spacing only', panelX + panelW / 2, panelY + panelH * 0.68, MUTED, 12, 'center');
  },
  pointer() { return null; },
};

export const filmSim = {
  id: 'thin-film',
  timed: false,
  authority: 'Thin-film bright condition. Reflect (net π flip): 2 n t = (m + ½) λ. Transmit (no net flip): 2 n t = m λ. Switch the phase convention on the stage.',
  params: { n: 1.33, t: 2e-7, lambda: 5.32e-7, m: 0, mode: 'reflect' },
  schema: [
    sel('mode', 'Channel', '通道', [
      { value: 'reflect', en: 'Reflect (½)', zh: '反射（½）' },
      { value: 'transmit', en: 'Transmit (m)', zh: '透射（m）' },
    ]),
    num('n', 'Index n', '折射率 n', '', 1.1, 2, 0.01),
    num('t', 'Thickness t', '厚度 t', 'm', 5e-8, 8e-7, 1e-8),
    num('lambda', 'Wavelength λ', '波长 λ', 'm', 4e-7, 7e-7, 1e-8),
    num('m', 'Order m', '级次 m', '', 0, 5, 1),
  ],
  compute: (p) => thinFilm(p),
  readouts: (d) => [
    ro('2nt', '2nt', d.lhs.toExponential(3) + ' m'),
    ro('cond', d.half ? '(m+½)λ' : 'mλ', d.condition.toExponential(3) + ' m'),
    ro('λ_bright', '亮纹 λ', Number.isFinite(d.lambdaBright) ? d.lambdaBright.toExponential(3) + ' m' : '—'),
  ],
  checks: (d) => [
    q('cond', 'Bright condition for this channel is', '本通道亮纹条件是', [
      opt(d.half ? '2 n t = (m + ½) λ' : '2 n t = m λ', d.half ? '2 n t = (m + ½) λ' : '2 n t = m λ'),
      opt(d.half ? '2 n t = m λ only' : '2 n t = (m + ½) λ', d.half ? '只有 2 n t = m λ' : '2 n t = (m + ½) λ'),
    ], 0),
  ],
  debug: {
    en: 'Swapping the ½ convention exchanges bright and dark for this channel.',
    zh: '对调 ½ 约定，本通道的亮暗就对换。',
    toggleEn: 'Flip the ½ convention',
    toggleZh: '对调 ½ 约定',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    // Wide: film slab left / bright-condition panel right. Narrow (≤360): stack.
    const narrow = w <= 360;
    const schX = narrow ? w * 0.06 : w * 0.04;
    const schY = narrow ? h * 0.08 : h * 0.12;
    const schW = narrow ? w * 0.88 : w * 0.5;
    const schH = narrow ? h * 0.4 : h * 0.76;
    const top = schY + schH * 0.35;
    const bot = schY + schH * 0.65;
    ctx.fillStyle = 'rgba(100,160,220,0.35)';
    ctx.fillRect(schX + schW * 0.12, top, schW * 0.76, bot - top);
    line(ctx, schX + schW * 0.12, top, schX + schW * 0.88, top, INK, 2);
    line(ctx, schX + schW * 0.12, bot, schX + schW * 0.88, bot, INK, 2);
    text(ctx, lab(ui, 'thin film', '薄膜'), schX + schW / 2, schY + 14, MUTED, 12, 'center');

    const panelX = narrow ? w * 0.06 : w * 0.58;
    const panelY = narrow ? h * 0.52 : h * 0.12;
    const panelW = narrow ? w * 0.88 : w * 0.38;
    const panelH = narrow ? h * 0.44 : h * 0.76;
    const half = ui.wrong ? !d.half : d.half;
    const cond = (d.m + (half ? 0.5 : 0)) * d.lambda;
    teachPanel(ctx, panelX, panelY, panelW, panelH, lab(ui, 'bright 2nt', '亮纹 2nt'));
    text(ctx, `2nt=${d.lhs.toExponential(2)}`, panelX + panelW / 2, panelY + panelH * 0.32, INK, 14, 'center');
    text(ctx, `${half ? '(m+½)λ' : 'mλ'}=${cond.toExponential(2)}`, panelX + panelW / 2, panelY + panelH * 0.55, ui.wrong ? '#a33' : MUTED, 12, 'center');
    text(ctx, `${d.mode}`, panelX + panelW / 2, panelY + panelH * 0.78, MUTED, 12, 'center');
  },
  pointer() { return null; },
};
