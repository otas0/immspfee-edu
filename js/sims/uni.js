import { fmt } from '../fmt.js';
import {
  vacuumPlaneWave, idealGas, carnotEta, kineticGas, infiniteWell, finiteWell,
  transmissionLine, imageCharge, waveguideCutoff, dipolePattern,
} from '../physics/uni.js';
import { num, clear, line, text, lab, arrow, INK, MUTED, RAY, RAY2 } from './kit.js';

function q(id, en, zh, options, answer) { return { id, en, zh, options, answer }; }
function opt(en, zh) { return { en, zh }; }
function ro(en, zh, value) { return { en, zh, value }; }

export const maxwellSim = {
  id: 'maxwell-wave',
  timed: true,
  tMax: (p) => Math.max(2e-8, 4 / Math.max(p.f, 1)),
  authority: 'In vacuum c = 1/√(μ0 ε0) = f λ. A plane wave keeps E and B in phase with |B| = |E|/c. The displacement current density is Jd = ε0 ∂E/∂t — a teaching readout from Maxwell, not a device.',
  params: { f: 1e8, E0: 1 },
  schema: [
    num('f', 'Frequency f', '频率 f', 'Hz', 1e7, 3e8, 1e7),
    num('E0', 'E amplitude', 'E 振幅', 'V/m', 0.2, 3, 0.1),
  ],
  compute: (p, t) => vacuumPlaneWave(p, t),
  readouts: (d) => [
    ro('c', 'c', `${(d.c / 1e8).toFixed(3)}×10⁸ m/s`),
    ro('λ', 'λ', `${fmt(d.lambda, 2)} m`),
    ro('E', 'E', `${fmt(d.E, 3)} V/m`),
    ro('Jd', 'Jd', `${d.Jd.toExponential(2)} A/m²`),
  ],
  checks: (d) => [
    q('c', 'Vacuum c equals', '真空中 c 等于', [
      opt('1/√(μ0 ε0) = f λ', '1/√(μ0 ε0) = f λ'),
      opt('μ0 ε0', 'μ0 ε0'),
    ], 0),
    q('Jd', 'Displacement current density is', '位移电流密度是', [
      opt('ε0 ∂E/∂t', 'ε0 ∂E/∂t'),
      opt('μ0 ∂B/∂t', 'μ0 ∂B/∂t'),
    ], 0),
  ],
  debug: {
    en: 'Dropping ε0 from Jd invents a displacement current with the wrong units.',
    zh: 'Jd 里丢掉 ε0，单位就不对了。',
    toggleEn: 'Drop ε0 from Jd',
    toggleZh: 'Jd 丢掉 ε0',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    const gx = w * 0.1;
    const gy = h * 0.55;
    const gw = w * 0.8;
    line(ctx, gx, gy, gx + gw, gy, MUTED, 1);
    ctx.beginPath();
    for (let i = 0; i <= 120; i += 1) {
      const u = i / 120;
      const phase = 2 * Math.PI * 2 * u - d.omega * d.t;
      const y = gy - d.E0 * Math.sin(phase) * h * 0.2;
      if (i === 0) ctx.moveTo(gx + u * gw, y);
      else ctx.lineTo(gx + u * gw, y);
    }
    ctx.strokeStyle = RAY;
    ctx.lineWidth = 2;
    ctx.stroke();
    const JdShow = ui.wrong ? d.dEdt : d.Jd;
    text(ctx, `Jd=${JdShow.toExponential(2)}`, w * 0.7, h * 0.18, ui.wrong ? '#a33' : INK, 14);
    text(ctx, lab(ui, 'E plane wave', 'E 平面波'), w * 0.5, h * 0.88, MUTED, 12, 'center');
  },
  pointer() { return null; },
};

export const gasSim = {
  id: 'ideal-gas',
  timed: false,
  authority: 'Ideal gas law p V = n R T with R = 8.314 J/(mol·K).',
  params: { n: 1, T: 300, V: 0.024 },
  schema: [
    num('n', 'Amount n', '物质的量 n', 'mol', 0.1, 5, 0.1),
    num('T', 'Temperature T', '温度 T', 'K', 200, 600, 10),
    num('V', 'Volume V', '体积 V', 'm³', 0.005, 0.1, 0.001),
  ],
  compute: (p) => idealGas(p),
  readouts: (d) => [
    ro('p', 'p', `${d.p.toExponential(3)} Pa`),
    ro('nRT', 'nRT', `${fmt(d.nRT, 1)} J`),
  ],
  checks: (d) => [
    q('law', 'p V equals', 'p V 等于', [
      opt(`${fmt(d.nRT, 1)} J = n R T`, `${fmt(d.nRT, 1)} J = n R T`),
      opt(`${fmt(d.n * d.T, 1)} J`, `${fmt(d.n * d.T, 1)} J`),
    ], 0),
  ],
  debug: {
    en: 'Using p = n R T / V² invents the wrong volume dependence.',
    zh: '写成 p = n R T / V²，对体积的依赖就错了。',
    toggleEn: 'Use p ∝ 1/V²',
    toggleZh: '改成 p 正比于 1/V²',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    const pShow = ui.wrong ? (d.n * d.R * d.T) / (d.V * d.V) : d.p;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.strokeRect(w * 0.3, h * 0.25, w * 0.4, h * 0.4);
    text(ctx, `p=${pShow.toExponential(2)} Pa`, w * 0.5, h * 0.18, ui.wrong ? '#a33' : INK, 16, 'center');
    text(ctx, `V=${fmt(d.V, 3)} m³  T=${fmt(d.T, 0)} K`, w * 0.5, h * 0.78, MUTED, 13, 'center');
  },
  pointer() { return null; },
};

export const carnotSim = {
  id: 'carnot',
  timed: false,
  authority: 'Carnot efficiency η = 1 − Tc/Th between hot and cold reservoirs (absolute temperatures).',
  params: { Th: 600, Tc: 300 },
  schema: [
    num('Th', 'Hot Th', '高温 Th', 'K', 350, 900, 10),
    num('Tc', 'Cold Tc', '低温 Tc', 'K', 200, 400, 10),
  ],
  compute: (p) => carnotEta(p),
  readouts: (d) => [
    ro('η', 'η', fmt(d.eta, 3)),
    ro('Tc/Th', 'Tc/Th', fmt(d.Tc / d.Th, 3)),
  ],
  checks: (d) => [
    q('eta', 'Carnot efficiency is', '卡诺效率是', [
      opt(`${fmt(d.eta, 3)} = 1 − Tc/Th`, `${fmt(d.eta, 3)} = 1 − Tc/Th`),
      opt(`${fmt(d.Th / d.Tc, 3)}`, `${fmt(d.Th / d.Tc, 3)}`),
    ], 0),
  ],
  debug: {
    en: 'Using η = Tc/Th drops the “1 −” and invents an efficiency below 1 for the wrong reason.',
    zh: '写成 η = Tc/Th 丢掉了“1 −”。',
    toggleEn: 'Use η = Tc/Th',
    toggleZh: '改用 η = Tc/Th',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    const etaShow = ui.wrong ? d.Tc / d.Th : d.eta;
    ctx.fillStyle = RAY;
    ctx.fillRect(w * 0.2, h * 0.3, w * 0.25, h * 0.35);
    ctx.fillStyle = RAY2;
    ctx.fillRect(w * 0.55, h * 0.45, w * 0.25, h * 0.2);
    text(ctx, `Th=${fmt(d.Th, 0)} K`, w * 0.32, h * 0.25, MUTED, 12, 'center');
    text(ctx, `Tc=${fmt(d.Tc, 0)} K`, w * 0.67, h * 0.4, MUTED, 12, 'center');
    text(ctx, `η=${fmt(etaShow, 3)}`, w * 0.5, h * 0.85, ui.wrong ? '#a33' : INK, 18, 'center');
  },
  pointer() { return null; },
};

export const kineticSim = {
  id: 'kinetic-gas',
  timed: false,
  authority: 'Kinetic theory teaching form: p = (1/3) ρ v_rms².',
  params: { rho: 1.2, vrms: 500 },
  schema: [
    num('rho', 'Density ρ', '密度 ρ', 'kg/m³', 0.2, 5, 0.1),
    num('vrms', 'rms speed', '方均根速率', 'm/s', 100, 2000, 10),
  ],
  compute: (p) => kineticGas(p),
  readouts: (d) => [
    ro('p', 'p', `${fmt(d.p, 1)} Pa`),
    ro('ρ', 'ρ', `${fmt(d.rho, 2)} kg/m³`),
  ],
  checks: (d) => [
    q('p', 'The pressure is', '压强是', [
      opt(`${fmt(d.p, 1)} Pa = (1/3) ρ v_rms²`, `${fmt(d.p, 1)} Pa = (1/3) ρ v_rms²`),
      opt(`${fmt(d.rho * d.vrms, 1)} Pa`, `${fmt(d.rho * d.vrms, 1)} Pa`),
    ], 0),
  ],
  debug: {
    en: 'Dropping the 1/3 invents a pressure three times too large.',
    zh: '丢掉 1/3，压强会大到三倍。',
    toggleEn: 'Use p = ρ v_rms²',
    toggleZh: '改用 p = ρ v_rms²',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    const pShow = ui.wrong ? d.rho * d.vrms * d.vrms : d.p;
    for (let i = 0; i < 40; i += 1) {
      ctx.fillStyle = RAY;
      ctx.beginPath();
      ctx.arc(w * 0.15 + (i % 8) * w * 0.09, h * 0.25 + Math.floor(i / 8) * h * 0.1, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    text(ctx, `p=${fmt(pShow, 0)} Pa`, w * 0.5, h * 0.85, ui.wrong ? '#a33' : INK, 16, 'center');
  },
  pointer() { return null; },
};

export const wellSim = {
  id: 'infinite-well',
  timed: false,
  authority: 'Infinite square well 0…L: E_n = n² π² ℏ² / (2 m L²) and ψ_n = √(2/L) sin(n π x / L).',
  params: { n: 1, m: 9.1e-31, L: 1e-9 },
  schema: [
    num('n', 'Quantum number n', '量子数 n', '', 1, 5, 1),
    num('L', 'Width L', '阱宽 L', 'm', 5e-10, 5e-9, 1e-10),
  ],
  compute: (p) => infiniteWell(p),
  readouts: (d) => [
    ro('E_n', 'Eₙ', `${d.En.toExponential(3)} J`),
    ro('ψ(L/2)', 'ψ(L/2)', fmt(d.psi, 3)),
  ],
  checks: (d) => [
    q('E', 'The level energy scales as', '能级能量正比于', [
      opt('n² / L²', 'n² / L²'),
      opt('n / L', 'n / L'),
      opt('L² only', '只与 L² 有关'),
    ], 0),
  ],
  debug: {
    en: 'Using E ∝ n / L invents the wrong quantum-number dependence.',
    zh: '写成 E 正比于 n / L，量子数依赖就错了。',
    toggleEn: 'Use E ∝ n/L',
    toggleZh: '改成 E 正比于 n/L',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    const gx = w * 0.12;
    const gy = h * 0.7;
    const gw = w * 0.76;
    const gh = h * 0.4;
    line(ctx, gx, gy, gx, gy - gh, INK, 2);
    line(ctx, gx + gw, gy, gx + gw, gy - gh, INK, 2);
    line(ctx, gx, gy, gx + gw, gy, MUTED, 1);
    ctx.beginPath();
    for (let i = 0; i <= 80; i += 1) {
      const x = (d.L * i) / 80;
      const sample = infiniteWell(p, x);
      const psi = ui.wrong ? Math.sqrt(2 / d.L) * Math.sin((Math.PI * x) / d.L) * (d.n / 2) : sample.psi;
      const X = gx + (i / 80) * gw;
      const Y = gy - (psi / Math.sqrt(2 / d.L)) * gh * 0.8;
      if (i === 0) ctx.moveTo(X, Y);
      else ctx.lineTo(X, Y);
    }
    ctx.strokeStyle = ui.wrong ? '#a33' : RAY2;
    ctx.lineWidth = 2;
    ctx.stroke();
    text(ctx, `n=${d.n}`, w * 0.5, h * 0.12, INK, 14, 'center');
  },
  pointer() { return null; },
};

export const finiteWellSim = {
  id: 'finite-well',
  timed: false,
  authority: 'Finite square well of width L and depth V0: bound levels from even/odd matching. Continuum probe uses rectangular-barrier T(E) of the same height and width for对照 with infinite-well E_n.',
  params: { m: 9.1e-31, L: 1e-9, V0: 1.6e-18, E: 2e-18 },
  schema: [
    num('L', 'Width L', '阱宽 L', 'm', 5e-10, 3e-9, 1e-10),
    num('V0', 'Depth V0', '阱深 V0', 'J', 4e-19, 4e-18, 1e-19),
    num('E', 'Probe E', '探针 E', 'J', 2e-19, 5e-18, 1e-19),
  ],
  compute: (p) => finiteWell(p),
  readouts: (d) => [
    ro('E1f', 'E₁ finite', d.E1f == null ? '—' : d.E1f.toExponential(3) + ' J'),
    ro('E1∞', 'E₁ infinite', d.E1inf.toExponential(3) + ' J'),
    ro('T', 'T(E)', fmt(d.T, 4)),
    ro('Nbound', '束缚态数', String(d.bound.length)),
  ],
  checks: (d) => [
    q('lower', 'Relative to the infinite well of the same L, the finite-well ground energy is', '相对同宽无限深阱，有限阱基态能量', [
      opt('lower (E1f < E1∞)', '更低（E1f < E1∞）'),
      opt('always higher', '总是更高'),
    ], 0),
    q('T', 'Continuum transmission at the probe is', '探针处连续谱透射是', [
      opt(fmt(d.T, 4), fmt(d.T, 4)),
      opt('exactly 0', '恰好为 0'),
    ], 0),
  ],
  debug: {
    en: 'Claiming the finite well has the same E_n as the infinite well ignores wavefunction leakage.',
    zh: '说有限阱能级与无限深阱相同，就忽略了波函数渗出。',
    toggleEn: 'Draw only infinite-well levels',
    toggleZh: '只画无限深能级',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    const gx = w * 0.12;
    const gy = h * 0.78;
    const gw = w * 0.76;
    const gh = h * 0.5;
    line(ctx, gx, gy, gx + gw, gy, MUTED, 1);
    line(ctx, gx, gy, gx, gy - gh, MUTED, 1);
    const Emax = Math.max(d.V0, d.E1inf * 4, d.E);
    const yOf = (E) => gy - (E / Emax) * gh;
    line(ctx, gx, yOf(d.V0), gx + gw, yOf(d.V0), MUTED, 1, [3, 3]);
    text(ctx, 'V0', gx + gw + 4, yOf(d.V0), MUTED, 11);
    const levels = ui.wrong ? d.Einf.map((E, i) => ({ E, tag: `∞${i + 1}` }))
      : d.bound.map((b, i) => ({ E: b.E, tag: `${i + 1}` }));
    levels.forEach((lv, i) => {
      const y = yOf(lv.E);
      line(ctx, gx + gw * 0.15, y, gx + gw * 0.55, y, RAY2, 2);
      text(ctx, lv.tag, gx + gw * 0.58, y, INK, 11);
      if (!ui.wrong && d.Einf[i] != null) {
        line(ctx, gx + gw * 0.7, yOf(d.Einf[i]), gx + gw * 0.95, yOf(d.Einf[i]), MUTED, 1, [2, 2]);
      }
    });
    line(ctx, gx, yOf(d.E), gx + gw, yOf(d.E), RAY, 1, [4, 2]);
    text(ctx, `T=${fmt(d.T, 3)}`, w * 0.5, h * 0.1, INK, 14, 'center');
  },
  pointer() { return null; },
};

export const lineSim = {
  id: 'transmission-line',
  timed: false,
  authority: 'Lossless TEM line: Z0 = √(L′/C′) and v = 1/√(L′ C′).',
  params: { L: 2.5e-7, C: 1e-10 },
  schema: [
    num('L', 'L′', 'L′', 'H/m', 1e-7, 1e-6, 1e-8),
    num('C', 'C′', 'C′', 'F/m', 2e-11, 5e-10, 1e-11),
  ],
  compute: (p) => transmissionLine(p),
  readouts: (d) => [
    ro('Z0', 'Z0', `${fmt(d.Z0, 1)} Ω`),
    ro('v', 'v', `${(d.v / 1e8).toFixed(3)}×10⁸ m/s`),
  ],
  checks: (d) => [
    q('Z', 'Characteristic impedance is', '特性阻抗是', [
      opt(`${fmt(d.Z0, 1)} Ω = √(L′/C′)`, `${fmt(d.Z0, 1)} Ω = √(L′/C′)`),
      opt(`${fmt(d.L * d.C, 1)} Ω`, `${fmt(d.L * d.C, 1)} Ω`),
    ], 0),
  ],
  debug: {
    en: 'Using Z0 = √(L′ C′) mixes impedance with a time constant.',
    zh: '写成 Z0 = √(L′ C′) 会和阻抗对不上。',
    toggleEn: 'Use Z0 = √(L′C′)',
    toggleZh: '改用 Z0 = √(L′C′)',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    line(ctx, w * 0.15, h * 0.4, w * 0.85, h * 0.4, INK, 3);
    line(ctx, w * 0.15, h * 0.55, w * 0.85, h * 0.55, INK, 3);
    const Z = ui.wrong ? Math.sqrt(d.L * d.C) : d.Z0;
    text(ctx, `Z0=${fmt(Z, 1)} Ω`, w * 0.5, h * 0.25, ui.wrong ? '#a33' : INK, 16, 'center');
  },
  pointer() { return null; },
};

export const imageSim = {
  id: 'image-charge',
  timed: false,
  authority: 'Grounded conducting plane: image −q at −h. Force on +q is toward the plane with magnitude k q² / (2h)².',
  params: { q: 1e-6, h: 0.1 },
  schema: [
    num('q', 'Charge q', '电荷 q', 'C', 1e-7, 5e-6, 1e-7),
    num('h', 'Height h', '高度 h', 'm', 0.02, 0.5, 0.01),
  ],
  compute: (p) => imageCharge(p),
  readouts: (d) => [
    ro('F', 'F', `${d.F.toExponential(3)} N`),
    ro('h', 'h', `${fmt(d.h, 2)} m`),
  ],
  checks: (d) => [
    q('F', 'The force magnitude is', '力的大小是', [
      opt(`${d.F.toExponential(3)} N = k q² / (2h)²`, `${d.F.toExponential(3)} N = k q² / (2h)²`),
      opt(`${(d.k * d.q * d.q / (d.h * d.h)).toExponential(3)} N`, `${(d.k * d.q * d.q / (d.h * d.h)).toExponential(3)} N`),
    ], 0),
  ],
  debug: {
    en: 'Using separation h instead of 2h invents too large a force.',
    zh: '间距用 h 而不是 2h，力会被算大。',
    toggleEn: 'Use separation h',
    toggleZh: '间距改用 h',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    line(ctx, w * 0.1, h * 0.55, w * 0.9, h * 0.55, INK, 3);
    const y = h * 0.55 - Math.min(h * 0.35, d.h * h * 2);
    ctx.fillStyle = RAY;
    ctx.beginPath();
    ctx.arc(w * 0.5, y, 12, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, '+', w * 0.5, y, '#fff', 14, 'center');
    const yi = h * 0.55 + (h * 0.55 - y);
    ctx.fillStyle = RAY2;
    ctx.beginPath();
    ctx.arc(w * 0.5, yi, 12, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, '−', w * 0.5, yi, '#fff', 14, 'center');
    const Fshow = ui.wrong ? (d.k * d.q * d.q) / (d.h * d.h) : d.F;
    text(ctx, `F=${Fshow.toExponential(2)} N`, w * 0.5, h * 0.12, ui.wrong ? '#a33' : INK, 14, 'center');
  },
  pointer() { return null; },
};

export const guideSim = {
  id: 'waveguide',
  timed: false,
  authority: 'TE10 cutoff for a rectangular guide of width a: fc = c / (2 a). Modes with f < fc do not propagate.',
  params: { a: 0.05, f: 4e9 },
  schema: [
    num('a', 'Width a', '宽边 a', 'm', 0.02, 0.1, 0.005),
    num('f', 'Frequency f', '频率 f', 'Hz', 1e9, 1e10, 1e8),
  ],
  compute: (p) => waveguideCutoff(p),
  readouts: (d) => [
    ro('fc', 'fc', `${(d.fc / 1e9).toFixed(3)} GHz`),
    ro('Propagates', '能否传播', d.propagates ? { en: 'yes', zh: '是' } : { en: 'no', zh: '否' }),
  ],
  checks: (d) => [
    q('fc', 'Cutoff frequency is', '截止频率是', [
      opt(`${(d.fc / 1e9).toFixed(3)} GHz = c/(2a)`, `${(d.fc / 1e9).toFixed(3)} GHz = c/(2a)`),
      opt(`${(d.c / d.a / 1e9).toFixed(3)} GHz`, `${(d.c / d.a / 1e9).toFixed(3)} GHz`),
    ], 0),
  ],
  debug: {
    en: 'Using fc = c/a doubles the cutoff.',
    zh: '写成 fc = c/a 会把截止频率翻倍。',
    toggleEn: 'Use fc = c/a',
    toggleZh: '改用 fc = c/a',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    ctx.strokeStyle = INK;
    ctx.strokeRect(w * 0.25, h * 0.3, w * 0.5, h * 0.3);
    const fcShow = ui.wrong ? d.c / d.a : d.fc;
    text(ctx, `fc=${(fcShow / 1e9).toFixed(2)} GHz`, w * 0.5, h * 0.2, ui.wrong ? '#a33' : INK, 16, 'center');
    text(ctx, d.propagates && !ui.wrong ? lab(ui, 'propagating', '可传播') : lab(ui, 'cut off?', '截止？'), w * 0.5, h * 0.75, MUTED, 13, 'center');
  },
  pointer() { return null; },
};

export const dipoleSim = {
  id: 'dipole-radiation',
  timed: false,
  authority: 'Far-field intensity of an electric dipole scales as sin²θ relative to the dipole axis. Teaching angular factor only.',
  params: { theta: 90 },
  schema: [
    num('theta', 'Angle θ', '角度 θ', '°', 0, 180, 5),
  ],
  compute: (p) => dipolePattern(p),
  readouts: (d) => [
    ro('sin²θ', 'sin²θ', fmt(d.factor, 3)),
  ],
  checks: (d) => [
    q('fac', 'Relative intensity factor is', '相对强度因子是', [
      opt(`${fmt(d.factor, 3)} = sin²θ`, `${fmt(d.factor, 3)} = sin²θ`),
      opt(`${fmt(Math.cos((d.theta * Math.PI) / 180) ** 2, 3)}`, `${fmt(Math.cos((d.theta * Math.PI) / 180) ** 2, 3)}`),
    ], 0),
  ],
  debug: {
    en: 'Using cos²θ swaps the nulls and the lobes.',
    zh: '写成 cos²θ 会把零点和瓣颠倒。',
    toggleEn: 'Use cos²θ',
    toggleZh: '改用 cos²θ',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    const cx = w * 0.5;
    const cy = h * 0.55;
    const R = Math.min(w, h) * 0.28;
    ctx.beginPath();
    for (let i = 0; i <= 180; i += 1) {
      const th = (i * Math.PI) / 180;
      const fac = ui.wrong ? Math.cos(th) ** 2 : Math.sin(th) ** 2;
      const r = R * fac;
      const x = cx + r * Math.sin(th);
      const y = cy - r * Math.cos(th);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = ui.wrong ? '#a33' : RAY2;
    ctx.stroke();
    arrow(ctx, cx, cy + 40, cx, cy - 40, INK, 2);
    text(ctx, 'p', cx + 12, cy - 40, MUTED, 12);
    text(ctx, `sin²θ=${fmt(ui.wrong ? Math.cos((d.theta * Math.PI) / 180) ** 2 : d.factor, 3)}`, w * 0.5, h * 0.12, ui.wrong ? '#a33' : INK, 14, 'center');
  },
  pointer() { return null; },
};
