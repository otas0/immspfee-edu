import { fmt } from '../fmt.js';
import { oscillator, rigidDisk, pendulumPair, centralOrbit, normalModes, coupledPendula } from '../physics/advance.js';
import { num, clear, line, text, handle, lab, arrow, teachPanel, INK, MUTED, RAY, RAY2 } from './kit.js';

function q(id, en, zh, options, answer) { return { id, en, zh, options, answer }; }
function opt(en, zh) { return { en, zh }; }
function ro(en, zh, value) { return { en, zh, value }; }

export const oscillatorSim = {
  id: 'oscillator',
  timed: true,
  tMax: (p) => 2 * Math.PI * Math.sqrt(p.m / p.k),
  authority: 'One spring. L = ½mv² − ½kx² and H = ½mv² + ½kx². x = A cos(ωt) with ω = √(k/m) makes the Euler–Lagrange equation the same statement as ma = −kx. H stays at ½kA².',
  params: { m: 0.5, k: 8, A: 0.12 },
  schema: [
    num('m', 'Mass m', '质量 m', 'kg', 0.1, 2, 0.05),
    num('k', 'k', 'k', 'N/m', 1, 40, 0.5),
    num('A', 'Amplitude A', '振幅 A', 'm', 0.02, 0.3, 0.01),
  ],
  compute: (p, t) => oscillator(p, t),
  readouts: (d) => [
    ro('x', 'x', `${fmt(d.x, 3)} m`),
    ro('T', '动能 T', `${fmt(d.T, 3)} J`),
    ro('V', '势能 V', `${fmt(d.V, 3)} J`),
    ro('H', 'H', `${fmt(d.H, 3)} J`),
    ro('L', 'L', `${fmt(d.L, 3)} J`),
  ],
  checks: (d) => {
    const wrong = Math.abs(d.T - d.H) > 1e-3 ? d.T : d.V;
    return [
    q('H', 'The Hamiltonian is', '哈密顿量是', [
      opt(`${fmt(d.H, 3)} J`, `${fmt(d.H, 3)} J`),
      opt(`${fmt(wrong, 3)} J`, `${fmt(wrong, 3)} J`),
      opt(`${fmt(d.H + 0.05, 3)} J`, `${fmt(d.H + 0.05, 3)} J`),
    ], 0),
    q('eq', 'The equation of motion from L is', '由 L 得到的运动方程是', [
      opt('m a + kx = 0', 'm a + kx = 0'),
      opt('m a = kx', 'm a = kx'),
    ], 0),
  ];
  },
  debug: {
    en: 'Swapping the sign in L, using T + V, is H, and its stationary path is not the motion.',
    zh: '把 L 里的减号改成加号，得到的是 H，它的驻值路径不是这条运动。',
    toggleEn: 'Draw T + V in the L slot',
    toggleZh: '把 T+V 画进 L 的位置',
  },
  draw(ctx, w, h, _p, d, ui) {
    clear(ctx, w, h);
    const y = h * 0.42;
    const x0 = w * 0.18;
    const px = 400;
    const x = x0 + d.x * px;
    line(ctx, 16, y, x0, y, INK, 2);
    line(ctx, x0, y, x, y, RAY2, 2);
    ctx.fillStyle = RAY;
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.fill();
    const base = h * 0.86;
    const scale = (h * 0.28) / Math.max(d.H0, 1e-6);
    [[lab(ui, 'T', 'T'), d.T, RAY], [lab(ui, 'V', 'V'), d.V, RAY2]].forEach((bar, i) => {
      const bx = w * 0.62 + i * 40;
      ctx.fillStyle = bar[2];
      ctx.fillRect(bx, base - bar[1] * scale, 24, bar[1] * scale);
      text(ctx, bar[0], bx + 12, base + 12, MUTED, 12, 'center');
    });
    const yH = base - d.H0 * scale;
    line(ctx, w * 0.58, yH, w * 0.78, yH, INK, 1.5, [4, 3]);
    text(ctx, 'H', w * 0.8, yH, INK, 12);
    text(ctx, ui.wrong ? `T+V=${fmt(d.H, 3)}` : `L=${fmt(d.L, 3)}`, w * 0.28, h * 0.16, ui.wrong ? '#a33' : INK, 14);
  },
};

export const rotorSim = {
  id: 'rigid-disk',
  timed: true,
  tMax: () => 4,
  authority: 'A uniform disk about its centre. The moment is τ = R F sinφ, with φ from the outward radius, and I = ½ M R². Then α = τ/I, ω = α t, θ = ½ α t² from rest.',
  params: { M: 2, R: 0.2, F: 4, phi: 90 },
  schema: [
    num('M', 'Mass M', '质量 M', 'kg', 0.2, 8, 0.1),
    num('R', 'Radius R', '半径 R', 'm', 0.05, 0.5, 0.01),
    num('F', 'Force F', '力 F', 'N', 0, 20, 0.2),
    num('phi', 'φ from the radius', 'φ（相对半径）', '°', 0, 180, 1),
  ],
  compute: (p, t) => rigidDisk(p, t),
  readouts: (d) => [
    ro('τ', 'τ', `${fmt(d.tau, 3)} N·m`),
    ro('I', 'I', `${fmt(d.I, 4)} kg·m²`),
    ro('α', 'α', `${fmt(d.alpha, 2)} rad/s²`),
    ro('θ', 'θ', `${fmt(d.theta, 2)} rad`),
  ],
  checks: (d) => [
    q('a', 'The angular acceleration is', '角加速度是', [
      opt(`${fmt(d.alpha, 2)} rad/s²`, `${fmt(d.alpha, 2)} rad/s²`),
      opt(`${fmt(d.F / d.M, 2)} rad/s²`, `${fmt(d.F / d.M, 2)} rad/s²`),
    ], 0),
    q('I', 'I for this disk is', '这个圆盘的 I 是', [
      opt(`${fmt(d.I, 4)} kg·m²`, `${fmt(d.I, 4)} kg·m²`),
      opt(`${fmt(d.M * d.R * d.R, 4)} kg·m²`, `${fmt(d.M * d.R * d.R, 4)} kg·m²`),
    ], 0),
  ],
  debug: {
    en: 'Using I = MR² instead of ½MR² doubles the inertia of a uniform disk.',
    zh: '把均匀圆盘的 I 写成 MR²，转动惯量变成了两倍。',
    toggleEn: 'Use I = MR²',
    toggleZh: '改用 I = MR²',
  },
  draw(ctx, w, h, _p, d, ui) {
    clear(ctx, w, h);
    const cx = w * 0.4;
    const cy = h * 0.52;
    const rad = Math.min(w, h) * 0.22;
    ctx.beginPath();
    ctx.arc(cx, cy, rad, 0, Math.PI * 2);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.stroke();
    const th = d.theta;
    line(ctx, cx, cy, cx + rad * Math.cos(th), cy - rad * Math.sin(th), RAY, 2);
    const phi = (d.phi * Math.PI) / 180;
    const fx = cx + rad * Math.cos(th);
    const fy = cy - rad * Math.sin(th);
    const dir = th + phi;
    line(ctx, fx, fy, fx + 40 * Math.cos(dir), fy - 40 * Math.sin(dir), RAY2, 2);
    const Ishow = ui.wrong ? d.M * d.R * d.R : d.I;
    text(ctx, `I=${fmt(Ishow, 4)}`, w * 0.72, h * 0.3, ui.wrong ? '#a33' : INK, 14);
    text(ctx, `α=${fmt(ui.wrong ? d.tau / (d.M * d.R * d.R) : d.alpha, 2)}`, w * 0.72, h * 0.4, ui.wrong ? '#a33' : INK, 14);
  },
};

export const pendulumSim = {
  id: 'pendulum-pair',
  timed: true,
  tMax: () => 6,
  authority: 'θ\'\' = −(g/L) sin θ, integrated with a fixed-step Runge–Kutta from rest. A second pendulum starts δθ away. Energy per unit mass is ½(Lθ\')² + gL(1−cosθ).',
  params: { g: 9.8, L: 1, theta0: 2.5, delta: 0.02 },
  schema: [
    num('L', 'Length L', '摆长 L', 'm', 0.3, 2, 0.05),
    num('g', 'g', 'g', 'm/s²', 1, 20, 0.1),
    num('theta0', 'Start angle', '初始角度', 'rad', 0.2, 3, 0.05),
    num('delta', 'Neighbour δθ', '邻近初值 δθ', 'rad', 0.001, 0.2, 0.001),
  ],
  compute: (p, t) => pendulumPair(p, t),
  readouts: (d) => [
    ro('θ', 'θ', `${fmt(d.theta, 3)} rad`),
    ro('|Δθ|', '|Δθ|', `${fmt(d.sep, 4)} rad`),
    ro('E', 'E', `${fmt(d.E, 4)} J/kg`),
    ro('E0', 'E0', `${fmt(d.E0, 4)} J/kg`),
  ],
  checks: (d) => [
    q('sep', 'The angular separation now is', '现在的角分离是', [
      opt(`${fmt(d.sep, 4)} rad`, `${fmt(d.sep, 4)} rad`),
      opt(`${fmt(Math.abs(d.sep - Math.abs(d.delta)) > 5e-4 ? Math.abs(d.delta) : Math.abs(d.delta) + 0.05, 4)} rad`, `${fmt(Math.abs(d.sep - Math.abs(d.delta)) > 5e-4 ? Math.abs(d.delta) : Math.abs(d.delta) + 0.05, 4)} rad`),
    ], 0),
    q('E', 'The energy of the first pendulum is', '第一个摆的能量是', [
      opt(`${fmt(d.E, 4)} J/kg`, `${fmt(d.E, 4)} J/kg`),
      opt(`${fmt(d.g * d.L * d.theta, 3)} J/kg`, `${fmt(d.g * d.L * d.theta, 3)} J/kg`),
    ], 0),
  ],
  debug: {
    en: 'Replacing sinθ with θ is the small-angle pendulum. At a large start angle those are different motions.',
    zh: '把 sinθ 换成 θ 是小角度单摆。起始角度大的时候，两条运动并不相同。',
    toggleEn: 'Mark the small-angle stand-in',
    toggleZh: '标出小角度替代',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    const drawPend = (theta, color, ox) => {
      const pivotX = ox;
      const pivotY = h * 0.22;
      const len = Math.min(h * 0.4, 160);
      const x = pivotX + len * Math.sin(theta);
      const y = pivotY + len * Math.cos(theta);
      line(ctx, pivotX, pivotY, x, y, color, 2);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fill();
    };
    drawPend(d.theta, RAY, w * 0.32);
    drawPend(d.theta2, RAY2, w * 0.68);
    text(ctx, `|Δθ|=${fmt(d.sep, 3)}`, w * 0.5, h * 0.86, INK, 14, 'center');
    if (ui.wrong) {
      const small = p.theta0 * Math.cos(Math.sqrt(p.g / p.L) * d.t);
      text(ctx, `θ≈${fmt(small, 2)}`, w * 0.32, h * 0.74, '#a33', 12, 'center');
    }
  },
};

export const orbitSim = {
  id: 'central-orbit',
  timed: true,
  tMax(p) {
    const d = centralOrbit(p, 0);
    if (d.a) return Math.min(20, 2 * Math.PI * Math.sqrt((d.a ** 3) / p.GM));
    return 6;
  },
  authority: 'Launch is perpendicular to the radius. Specific energy E = ½v² − GM/r and h = r v. The curve is the conic with that e. GM is the model’s parameter, not a named planet.',
  params: { GM: 1, r: 1, v: 1 },
  schema: [
    num('GM', 'GM', 'GM', '', 0.2, 4, 0.1),
    num('r', 'Launch r', '发射半径 r', '', 0.4, 3, 0.05),
    num('v', 'Perpendicular v', '垂直速度 v', '', 0, 3, 0.02),
  ],
  compute: (p, t) => centralOrbit(p, t),
  readouts: (d) => [
    ro('Kind', '轨道', {
      en: d.kind,
      zh: { circle: '圆', ellipse: '椭圆', parabola: '抛物线', hyperbola: '双曲线', radial: '径向' }[d.kind] || d.kind,
    }),
    ro('e', 'e', fmt(d.e, 3)),
    ro('v circ', '环绕速度', fmt(d.vCirc, 3)),
    ro('v esc', '逃逸速度', fmt(d.vEsc, 3)),
    ro('E', '比能量', fmt(d.specificE, 3)),
  ],
  checks: (d) => [
    q('kind', 'This launch is', '这次发射是', [
      opt(d.kind, { circle: '圆', ellipse: '椭圆', parabola: '抛物线', hyperbola: '双曲线', radial: '径向' }[d.kind] || d.kind),
      opt(d.kind === 'circle' ? 'hyperbola' : 'circle', d.kind === 'circle' ? '双曲线' : '圆'),
    ], 0),
    q('esc', 'Escape speed at this r is', '这个半径上的逃逸速度是', [
      opt(fmt(d.vEsc, 3), fmt(d.vEsc, 3)),
      opt(fmt(d.vCirc, 3), fmt(d.vCirc, 3)),
    ], 0),
  ],
  debug: {
    en: 'Using √(GM/r) as the escape speed is the circular speed, short by a factor of √2.',
    zh: '把 √(GM/r) 当成逃逸速度，那是环绕速度，少了 √2。',
    toggleEn: 'Label circular speed as escape',
    toggleZh: '把环绕速度标成逃逸',
  },
  draw(ctx, w, h, _p, d, ui) {
    clear(ctx, w, h);
    const cx = w * 0.42;
    const cy = h * 0.52;
    const scale = Math.min(w, h) * 0.16 / Math.max(d.r0, 0.2);
    ctx.fillStyle = RAY2;
    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, Math.PI * 2);
    ctx.fill();
    if (d.kind !== 'radial' && d.h > 0) {
      ctx.beginPath();
      let started = false;
      const span = d.kind === 'hyperbola' || d.kind === 'parabola' ? Math.PI * 0.8 : Math.PI * 2;
      const start = d.kind === 'hyperbola' || d.kind === 'parabola' ? -span : 0;
      for (let i = 0; i <= 80; i += 1) {
        const th = start + (span * i) / 80;
        const denom = 1 + d.e * Math.cos(th);
        if (denom <= 0.05) {
          started = false;
          continue;
        }
        const radius = (d.h * d.h / d.GM) / denom;
        const x = cx + radius * Math.cos(th) * scale;
        const y = cy - radius * Math.sin(th) * scale;
        if (!started) { ctx.moveTo(x, y); started = true; }
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = '#cfc6b8';
      ctx.stroke();
    }
    ctx.fillStyle = RAY;
    ctx.beginPath();
    ctx.arc(cx + d.x * scale, cy - d.y * scale, 6, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, ui.wrong ? `vesc? ${fmt(d.vCirc, 2)}` : `vesc ${fmt(d.vEsc, 2)}`, w * 0.72, h * 0.24, ui.wrong ? '#a33' : INK, 14);
    text(ctx, lab(ui, d.kind, { circle: '圆', ellipse: '椭圆', parabola: '抛物线', hyperbola: '双曲线', radial: '径向' }[d.kind] || d.kind), w * 0.72, h * 0.34, INK, 14);
  },
};

export const modesSim = {
  id: 'normal-modes',
  timed: true,
  tMax: (p) => 2 * Math.PI * Math.sqrt(p.m / p.k),
  authority: 'Walls fixed, two equal masses, three equal springs. The symmetric frequency is √(k/m) and the antisymmetric frequency is √(3k/m). A general start is the sum of those two modes.',
  params: { m: 1, k: 4, A1: 0.4, A2: 0.25 },
  schema: [
    num('m', 'Mass m', '质量 m', 'kg', 0.2, 3, 0.1),
    num('k', 'k', 'k', 'N/m', 1, 20, 0.5),
    num('A1', 'Symmetric A1', '对称模 A1', 'm', 0, 0.8, 0.02),
    num('A2', 'Antisymmetric A2', '反对称模 A2', 'm', 0, 0.8, 0.02),
  ],
  compute: (p, t) => normalModes(p, t),
  readouts: (d) => [
    ro('ω1', 'ω1', `${fmt(d.w1, 3)} rad/s`),
    ro('ω2', 'ω2', `${fmt(d.w2, 3)} rad/s`),
    ro('E', 'E', `${fmt(d.E, 3)} J`),
    ro('E0', 'E₀ = kA₁²+3kA₂²', `${fmt(d.E0, 3)} J`),
  ],
  checks: (d) => [
    q('w', 'The antisymmetric frequency is', '反对称模的角频率是', [
      opt(`${fmt(d.w2, 3)} rad/s`, `${fmt(d.w2, 3)} rad/s`),
      opt(`${fmt(d.w1, 3)} rad/s`, `${fmt(d.w1, 3)} rad/s`),
    ], 0),
    q('E0', 'The conserved E₀ equals', '守恒的 E₀ 等于', [
      opt(`${fmt(d.E0, 3)} J = kA₁²+3kA₂²`, `${fmt(d.E0, 3)} J = kA₁²+3kA₂²`),
      opt(`${fmt(d.E0 / 2, 3)} J = ½k(A₁²+A₂²)`, `${fmt(d.E0 / 2, 3)} J = ½k(A₁²+A₂²)`),
    ], 0),
    q('E', 'Mechanical energy E = T + V stays', '机械能 E = T + V 保持', [
      opt(`${fmt(d.E, 3)} J ≈ E₀`, `${fmt(d.E, 3)} J ≈ E₀`),
      opt('only kinetic', '只有动能'),
    ], 0),
  ],
  debug: {
    en: 'Giving both modes the lower frequency keeps the masses moving as if the middle spring were never stretched differently.',
    zh: '两个模都用较低的那个频率，中间弹簧的额外拉伸就不会出现在运动里。',
    toggleEn: 'Use ω1 for both modes',
    toggleZh: '两个模都用 ω1',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    const y = h * 0.5;
    const x0 = w * 0.15;
    const x3 = w * 0.85;
    const rest1 = x0 + (x3 - x0) / 3;
    const rest2 = x0 + (2 * (x3 - x0)) / 3;
    const px = 80;
    let x1 = rest1 + d.x1 * px;
    let x2 = rest2 + d.x2 * px;
    if (ui.wrong) {
      const s = p.A1 * Math.cos(d.w1 * d.t);
      const a = p.A2 * Math.cos(d.w1 * d.t);
      x1 = rest1 + (s + a) * px;
      x2 = rest2 + (s - a) * px;
    }
    line(ctx, x0, y, x1, y, RAY2, 2);
    line(ctx, x1, y, x2, y, RAY2, 2);
    line(ctx, x2, y, x3, y, RAY2, 2);
    line(ctx, x0, y - 30, x0, y + 30, INK, 3);
    line(ctx, x3, y - 30, x3, y + 30, INK, 3);
    ctx.fillStyle = RAY;
    ctx.beginPath();
    ctx.arc(x1, y, 12, 0, Math.PI * 2);
    ctx.arc(x2, y, 12, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, '1', x1, y - 22, MUTED, 12, 'center');
    text(ctx, '2', x2, y - 22, MUTED, 12, 'center');
    const resid = d.E - d.E0;
    const ok = Math.abs(resid) <= 0.02 * Math.max(1, Math.abs(d.E0));
    text(ctx, `E−E₀=${resid >= 0 ? '+' : ''}${fmt(resid, 3)} J`, w * 0.5, h * 0.14, ok ? INK : '#a33', 13, 'center');
    text(ctx, ok ? 'E ≈ E₀' : 'E ≉ E₀', w * 0.5, h * 0.22, ok ? MUTED : '#a33', 12, 'center');
  },
};

export const coupledPendulaSim = {
  id: 'coupled-pendula',
  timed: true,
  tMax: (p) => {
    const w0 = Math.sqrt(p.g / p.L);
    const wa = Math.sqrt(w0 * w0 + 2 * Math.max(p.kappa, 0));
    const beat = Math.abs(wa - w0);
    return beat > 1e-6 ? (4 * Math.PI) / beat : (4 * Math.PI) / Math.max(w0, 0.1);
  },
  authority: 'Two equal pendulums coupled by a weak spring: θ1′′ = −ω0²θ1 − κ(θ1−θ2), θ2′′ = −ω0²θ2 − κ(θ2−θ1). Energy per unit mass exchanges between the two when one starts displaced.',
  params: { g: 9.8, L: 1, kappa: 2, A1: 0.3, A2: 0 },
  schema: [
    num('L', 'Length L', '摆长 L', 'm', 0.4, 2, 0.05),
    num('kappa', 'Coupling κ', '耦合 κ', '1/s²', 0, 8, 0.2),
    num('A1', 'θ1(0)', 'θ1(0)', 'rad', -0.5, 0.5, 0.05),
    num('A2', 'θ2(0)', 'θ2(0)', 'rad', -0.5, 0.5, 0.05),
  ],
  compute: (p, t) => coupledPendula(p, t),
  readouts: (d) => [
    ro('E1', 'E1', fmt(d.E1, 4)),
    ro('E2', 'E2', fmt(d.E2, 4)),
    ro('P 1→2', 'E1↔E2', `${d.Pflow >= 0 ? '+' : ''}${fmt(d.Pflow, 3)}`),
    ro('E', 'E', fmt(d.E, 4)),
    ro('ωs', 'ωs', fmt(d.ws, 3)),
    ro('ωa', 'ωa', fmt(d.wa, 3)),
  ],
  checks: (d) => [
    q('ex', 'When only one pendulum starts displaced, energy', '只有一端初位移时，能量', [
      opt('exchanges between the two pendulums', '在两摆之间交换'),
      opt('stays forever in the first pendulum only', '永远只在第一摆'),
    ], 0),
    q('E', 'Total energy E1+E2+Ecoup stays', '总能量 E1+E2+Ecoup 保持', [
      opt(`${fmt(d.E, 4)} conserved`, `${fmt(d.E, 4)} 守恒`),
      opt('only E1', '只有 E1'),
    ], 0),
  ],
  debug: {
    en: 'Setting κ = 0 freezes each pendulum’s energy and kills the exchange.',
    zh: '令 κ = 0 会冻住各摆能量，交换就消失了。',
    toggleEn: 'Set κ = 0',
    toggleZh: '令 κ = 0',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    const pivotY = h * 0.14;
    const scale = Math.min(h * 0.32, d.L * 100);
    const x1p = w * 0.28;
    const x2p = w * 0.52;
    const kappa = ui.wrong ? 0 : d.kappa;
    const state = ui.wrong ? coupledPendula({ ...p, kappa: 0 }, d.t) : d;
    const bob = (xp, th) => [xp + scale * Math.sin(th), pivotY + scale * Math.cos(th)];
    const [bx1, by1] = bob(x1p, state.th1);
    const [bx2, by2] = bob(x2p, state.th2);
    line(ctx, x1p, pivotY, bx1, by1, INK, 2);
    line(ctx, x2p, pivotY, bx2, by2, INK, 2);
    line(ctx, bx1, by1, bx2, by2, kappa > 0 ? RAY2 : MUTED, 1.5, kappa > 0 ? [] : [4, 4]);
    ctx.fillStyle = RAY;
    ctx.beginPath();
    ctx.arc(bx1, by1, 9, 0, Math.PI * 2);
    ctx.arc(bx2, by2, 9, 0, Math.PI * 2);
    ctx.fill();
    const eMax = Math.max(state.E1 + state.E2, 1e-9);
    ctx.fillStyle = RAY;
    ctx.fillRect(w * 0.08, h * 0.52, (state.E1 / eMax) * w * 0.28, 7);
    ctx.fillStyle = RAY2;
    ctx.fillRect(w * 0.4, h * 0.52, (state.E2 / eMax) * w * 0.28, 7);
    text(ctx, `E1=${fmt(state.E1, 3)}`, w * 0.22, h * 0.48, INK, 11, 'center');
    text(ctx, `E2=${fmt(state.E2, 3)}`, w * 0.54, h * 0.48, INK, 11, 'center');
    // Power-flow panel under the energy bars (separate from the pendula).
    const tMax = this.tMax(p);
    const panelX = w * 0.06;
    const panelY = h * 0.62;
    const panelW = w * 0.88;
    const panelH = h * 0.32;
    teachPanel(ctx, panelX, panelY, panelW, panelH, lab(ui, 'P₁→₂(t)', '功率流 P₁→₂(t)'));
    const gx = panelX + panelW * 0.06;
    const gy = panelY + panelH * 0.78;
    const gw = panelW * 0.88;
    const gh = panelH * 0.5;
    line(ctx, gx, gy, gx + gw, gy, MUTED, 1);
    line(ctx, gx, gy - gh / 2, gx + gw, gy - gh / 2, MUTED, 1, [2, 2]);
    let pMax = 1e-9;
    const pts = [];
    for (let i = 0; i <= 80; i += 1) {
      const tt = (tMax * i) / 80;
      const s = coupledPendula({ ...p, kappa }, tt);
      pts.push(s.Pflow);
      pMax = Math.max(pMax, Math.abs(s.Pflow));
    }
    ctx.beginPath();
    pts.forEach((pf, i) => {
      const X = gx + (i / 80) * gw;
      const Y = gy - gh / 2 - (pf / pMax) * (gh * 0.45);
      if (i === 0) ctx.moveTo(X, Y);
      else ctx.lineTo(X, Y);
    });
    ctx.strokeStyle = RAY;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    const nowX = gx + (Math.min(1, d.t / tMax)) * gw;
    line(ctx, nowX, gy - gh, nowX, gy, MUTED, 1, [2, 2]);
    text(ctx, `now=${fmt(ui.wrong ? 0 : state.Pflow, 2)}`, gx + gw * 0.5, panelY + 28, MUTED, 11, 'center');
  },
  pointer() { return null; },
};

