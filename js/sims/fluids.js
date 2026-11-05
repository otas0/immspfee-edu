import { fmt } from '../fmt.js';
import {
  DENSITIES, densityOf, densityLab, solidPressure, hydrostatics, torricelli,
  bernoulliPipe, wingLift, buoyancyOrigin, weighingBuoyancy, archimedes, floatState,
} from '../physics/fluids.js';
import { num, sel, clear, line, arrow, text, handle, hit, lab, INK, MUTED, RAY, RAY2, WATER, WATER_EDGE } from './kit.js';

function q(id, en, zh, options, answer) { return { id, en, zh, options, answer }; }
function opt(en, zh) { return { en, zh }; }
function ro(en, zh, value) { return { en, zh, value }; }

const MATS = [
  { value: 'water', en: 'Water 1000', zh: '水 1000' },
  { value: 'alcohol', en: 'Alcohol 800', zh: '酒精 800' },
  { value: 'ice', en: 'Ice 900', zh: '冰 900' },
  { value: 'aluminium', en: 'Aluminium 2700', zh: '铝 2700' },
  { value: 'iron', en: 'Iron 7900', zh: '铁 7900' },
  { value: 'copper', en: 'Copper 8900', zh: '铜 8900' },
];

export const densitySim = {
  id: 'density',
  timed: false,
  authority: 'ρ = m/V. The listed densities are the rounded junior-table values. Same volume, mass follows ρ.',
  params: { material: 'iron', V: 0.001, rho: 7900 },
  schema: [
    sel('material', 'Material', '物质', MATS),
    num('V', 'Volume V', '体积 V', 'm³', 0.0002, 0.004, 0.0001),
    num('rho', 'ρ override', 'ρ（可改）', 'kg/m³', 100, 12000, 50),
  ],
  onParam(key, value) {
    if (key === 'material' && DENSITIES[value] != null) return { rho: DENSITIES[value] };
    return {};
  },
  compute(p) {
    const table = DENSITIES[p.material] ?? p.rho;
    return { ...densityOf({ V: p.V, rho: p.rho }), table, material: p.material };
  },
  readouts: (d) => [
    ro('m = ρV', 'm = ρV', `${fmt(d.m, 3)} kg`),
    ro('Table ρ', '表中 ρ', `${fmt(d.table, 0)} kg/m³`),
  ],
  checks: (d) => [
    q('m', 'Mass of this sample is', '这份样品的质量是', [
      opt(`${fmt(d.m, 3)} kg`, `${fmt(d.m, 3)} kg`),
      opt(`${fmt(d.rho, 0)} kg`, `${fmt(d.rho, 0)} kg`),
      opt(`${fmt(d.V, 3)} kg`, `${fmt(d.V, 3)} kg`),
    ], 0),
    q('samev', 'At the same volume, the larger density has', '体积相同时，密度更大的一份', [
      opt('the larger mass', '质量更大'),
      opt('the smaller mass', '质量更小'),
    ], 0),
  ],
  debug: {
    en: 'Comparing masses of different volumes does not compare densities. This stage keeps V fixed.',
    zh: '体积不同就比质量，比不出密度。这里把体积固定。',
    toggleEn: 'Pretend mass equals the density number',
    toggleZh: '把密度数字当成质量',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    const base = h * 0.75;
    const bw = 70;
    const bh = Math.min(h * 0.4, 40 + d.m * 80);
    ctx.fillStyle = '#d5dde3';
    ctx.fillRect(w * 0.32, base - bh, bw, bh);
    ctx.strokeStyle = INK;
    ctx.strokeRect(w * 0.32, base - bh, bw, bh);
    text(ctx, `${fmt(d.m, 3)} kg`, w * 0.32 + bw / 2, base - bh - 14, INK, 13, 'center');
    text(ctx, `V=${fmt(d.V, 4)} m³`, w * 0.32 + bw / 2, base + 16, MUTED, 12, 'center');
    if (ui.wrong) text(ctx, `m? ${fmt(d.rho, 0)}`, w * 0.62, base - 40, '#a33', 14);
    line(ctx, w * 0.2, base, w * 0.8, base, INK, 2);
  },
  pointer() { return null; },
};

export const densityLabSim = {
  id: 'density-lab',
  timed: false,
  authority: 'Balance reading m = ρV converted between kg/m³ and g/cm³. Cylinder: V2 = V1 + V, so ρ = m/(V2−V1). Using V2 alone is the lab error.',
  params: { material: 'aluminium', rho: 2700, V: 20, V1: 40 },
  schema: [
    sel('material', 'Specimen', '样品', MATS),
    num('rho', 'ρ', 'ρ', 'kg/m³', 100, 12000, 50),
    num('V', 'Specimen volume', '样品体积', 'cm³', 5, 80, 1),
    num('V1', 'Water before V1', '放入前水面 V1', 'cm³', 20, 80, 1),
  ],
  onParam(key, value) {
    if (key === 'material' && DENSITIES[value] != null) return { rho: DENSITIES[value] };
    return {};
  },
  compute: (p) => densityLab(p),
  readouts: (d) => [
    ro('Balance m', '天平 m', `${fmt(d.m, 2)} g`),
    ro('V2', 'V2', `${fmt(d.V2, 1)} cm³`),
    ro('V2 − V1', 'V2 − V1', `${fmt(d.V, 1)} cm³`),
    ro('ρ', 'ρ', `${fmt(d.rhoMeas, 0)} kg/m³`),
  ],
  checks: (d) => [
    q('vol', 'The specimen volume is', '样品体积是', [
      opt(`${fmt(d.V2 - d.V1, 1)} cm³`, `${fmt(d.V2 - d.V1, 1)} cm³`),
      opt(`${fmt(d.V2, 1)} cm³`, `${fmt(d.V2, 1)} cm³`),
      opt(`${fmt(d.V1, 1)} cm³`, `${fmt(d.V1, 1)} cm³`),
    ], 0),
    q('rho', 'ρ = m / (V2 − V1) gives', 'ρ = m / (V2 − V1) 得到', [
      opt(`${fmt(d.rhoMeas, 0)} kg/m³`, `${fmt(d.rhoMeas, 0)} kg/m³`),
      opt(`${fmt(d.rhoIfForgot, 0)} kg/m³`, `${fmt(d.rhoIfForgot, 0)} kg/m³`),
    ], 0),
  ],
  debug: {
    en: 'Dividing the mass by V2, instead of V2 − V1, uses the water as if it were the specimen.',
    zh: '用 V2 而不是 V2−V1 去除质量，等于把原来的水也算进了样品体积。',
    toggleEn: 'Show ρ = m / V2',
    toggleZh: '标出 ρ = m / V2',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    const x = w * 0.58;
    const top = h * 0.18;
    const bot = h * 0.82;
    const scale = (bot - top) / 120;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, top, 70, bot - top);
    const y2 = bot - d.V2 * scale;
    const y1 = bot - d.V1 * scale;
    ctx.fillStyle = WATER;
    ctx.fillRect(x, y2, 70, bot - y2);
    line(ctx, x, y1, x + 70, y1, WATER_EDGE, 1, [3, 3]);
    text(ctx, `V1 ${fmt(d.V1, 0)}`, x + 78, y1, MUTED, 12);
    text(ctx, `V2 ${fmt(d.V2, 0)}`, x + 78, y2, INK, 12);
    text(ctx, `${fmt(d.m, 2)} g`, w * 0.28, h * 0.4, INK, 18, 'center');
    text(ctx, lab(ui, 'balance', '天平'), w * 0.28, h * 0.48, MUTED, 12, 'center');
    if (ui.wrong) text(ctx, `m/V2 → ${fmt(d.rhoIfForgot, 0)}`, w * 0.28, h * 0.62, '#a33', 13, 'center');
  },
  pointer() { return null; },
};

export const solidPressureSim = {
  id: 'solid-pressure',
  timed: false,
  authority: 'p = F/A. The same force on a smaller area gives a larger pressure. The patch colour tracks p.',
  params: { F: 20, A: 0.01 },
  schema: [
    num('F', 'Force F', '压力 F', 'N', 1, 100, 1),
    num('A', 'Area A', '受力面积 A', 'm²', 0.002, 0.08, 0.001),
  ],
  compute: (p) => solidPressure(p),
  readouts: (d) => [
    ro('p = F/A', 'p = F/A', `${fmt(d.p, 1)} Pa`),
  ],
  checks: (d) => [
    q('p', 'Pressure is', '压强是', [
      opt(`${fmt(d.p, 1)} Pa`, `${fmt(d.p, 1)} Pa`),
      opt(`${fmt(d.F, 1)} Pa`, `${fmt(d.F, 1)} Pa`),
      opt(`${fmt(d.F * d.A, 3)} Pa`, `${fmt(d.F * d.A, 3)} Pa`),
    ], 0),
    q('area', 'Same F, smaller A', '压力相同、受力面积更小', [
      opt('larger p', '压强更大'),
      opt('smaller p', '压强更小'),
    ], 0),
  ],
  debug: {
    en: 'Using p = F·A makes a larger patch look like a larger pressure. The formula on the stage is p = F/A.',
    zh: '用 p = F·A 会让面积越大压强越大。图上用的是 p = F/A。',
    toggleEn: 'Mark F·A',
    toggleZh: '标出 F·A',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    const cx = w * 0.5;
    const ground = h * 0.72;
    const side = Math.max(24, Math.sqrt(d.A) * 420);
    const shade = Math.min(0.75, d.p / 8000);
    ctx.fillStyle = `rgba(196, 73, 29, ${0.15 + shade})`;
    ctx.fillRect(cx - side / 2, ground - side, side, side);
    ctx.strokeStyle = INK;
    ctx.strokeRect(cx - side / 2, ground - side, side, side);
    arrow(ctx, cx, ground - side - 10, cx, ground - side - 10 - Math.min(80, d.F), RAY, 3);
    text(ctx, `${fmt(d.p, 0)} Pa`, cx, ground + 18, INK, 14, 'center');
    text(ctx, `A=${fmt(d.A, 3)} m²`, cx, ground - side - 28, MUTED, 12, 'center');
    if (ui.wrong) text(ctx, `F·A=${fmt(d.F * d.A, 3)}`, cx, ground + 40, '#a33', 13, 'center');
    handle(ctx, cx + side / 2, ground - side / 2, ui.drag === 'area');
    ui._geo = { cx, ground, side };
  },
  pointer(ev, _p, d, ui) {
    const g = ui._geo;
    if (!g) return null;
    if (ev.type === 'down') {
      if (hit(ev.x, ev.y, g.cx + g.side / 2, g.ground - g.side / 2)) { ui.drag = 'area'; return {}; }
      return null;
    }
    if (ev.type === 'up') { ui.drag = null; return {}; }
    if (ev.type === 'move' && ui.drag === 'area') {
      const side = Math.max(24, Math.abs(ev.x - g.cx) * 2);
      const A = (side / 420) ** 2;
      return { A: Math.min(0.08, Math.max(0.002, A)) };
    }
    return null;
  },
};

export const liquidPressureSim = {
  id: 'liquid-pressure',
  timed: false,
  authority: 'Gauge hydrostatic pressure p = ρgh. U-tube balance of two liquids: ρ1 h1 = ρ2 h2. Same depth means the same p; the force on the base is pA and does depend on area.',
  params: { view: 'depth', rho: 1000, g: 9.8, h: 0.2, A1: 0.02, A2: 0.008, h1: 0.12, rho2: 800 },
  schema: [
    sel('view', 'View', '视图', [
      { value: 'depth', en: 'Depth', zh: '深度' },
      { value: 'utube', en: 'U-tube', zh: 'U 型管' },
      { value: 'paradox', en: 'Vessel base', zh: '容器底部' },
    ]),
    num('rho', 'ρ', 'ρ', 'kg/m³', 500, 2000, 50),
    num('g', 'g', 'g', 'm/s²', 1, 20, 0.1),
    num('h', 'Depth h', '深度 h', 'm', 0.02, 0.5, 0.01),
    num('A1', 'Wide base area', '宽底面积', 'm²', 0.004, 0.06, 0.001),
    num('A2', 'Narrow base area', '窄底面积', 'm²', 0.002, 0.04, 0.001),
    num('h1', 'Left column h1', '左管液柱 h1', 'm', 0.02, 0.4, 0.01),
    num('rho2', 'Right liquid ρ2', '右管液体 ρ2', 'kg/m³', 500, 2000, 50),
  ],
  compute: (p) => hydrostatics(p),
  readouts: (d, p) => p.view === 'utube'
    ? [
      ro('ρ1 h1', 'ρ1 h1', fmt(d.rho * d.h1, 1)),
      ro('h2 = ρ1 h1 / ρ2', 'h2', `${fmt(d.h2, 3)} m`),
    ]
    : [
      ro('p = ρgh', 'p = ρgh', `${fmt(d.pGauge, 1)} Pa`),
      ro('F on wide base', '宽底受力', `${fmt(d.Fwide, 2)} N`),
      ro('F on narrow base', '窄底受力', `${fmt(d.Fnarrow, 2)} N`),
    ],
  checks: (d, p) => p.view === 'utube'
    ? [q('h2', 'The right column that balances h1 is', '与 h1 平衡的右管液柱是', [
      opt(`${fmt(d.h2, 3)} m`, `${fmt(d.h2, 3)} m`),
      opt(`${fmt(d.h1, 3)} m`, `${fmt(d.h1, 3)} m`),
    ], 0)]
    : [
      q('p', 'Pressure at this depth is', '这个深度的压强是', [
        opt(`${fmt(d.pGauge, 1)} Pa`, `${fmt(d.pGauge, 1)} Pa`),
        opt(`${fmt(d.rho * d.h, 1)} Pa`, `${fmt(d.rho * d.h, 1)} Pa`),
      ], 0),
      q('shape', 'At the same depth, a wider vessel has', '同一深度，更宽的容器', [
        opt('the same p and a larger force on the base', '压强相同，底部所受压力更大'),
        opt('a larger p', '压强更大'),
      ], 0),
    ],
  debug: {
    en: 'A wider vessel does not raise p at a given depth. It raises the force on the base, F = pA.',
    zh: '容器更宽，不会让同一深度的压强变大。变大的是底部所受的压力 F = pA。',
    toggleEn: 'Mark p as if it grew with width',
    toggleZh: '把压强标成随宽度变大',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    if (p.view === 'utube') {
      const mid = h * 0.78;
      const left = w * 0.38;
      const right = w * 0.62;
      const px = h * 0.9;
      ctx.strokeStyle = INK;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(left, mid - 200);
      ctx.lineTo(left, mid);
      ctx.lineTo(right, mid);
      ctx.lineTo(right, mid - 200);
      ctx.stroke();
      ctx.fillStyle = WATER;
      ctx.fillRect(left - 14, mid - d.h1 * px, 28, d.h1 * px);
      ctx.fillStyle = 'rgba(180, 140, 70, 0.45)';
      ctx.fillRect(right - 14, mid - d.h2 * px, 28, d.h2 * px);
      text(ctx, `h1=${fmt(d.h1, 2)}`, left, mid - d.h1 * px - 12, INK, 12, 'center');
      text(ctx, `h2=${fmt(d.h2, 2)}`, right, mid - d.h2 * px - 12, INK, 12, 'center');
      return;
    }
    const tank = { x: w * 0.22, y: h * 0.2, bw: w * 0.22, bh: h * 0.55 };
    const tank2 = { x: w * 0.58, bw: w * 0.12 };
    ctx.fillStyle = WATER;
    ctx.fillRect(tank.x, tank.y, tank.bw, tank.bh);
    ctx.fillRect(tank2.x, tank.y, tank2.bw, tank.bh);
    ctx.strokeStyle = WATER_EDGE;
    ctx.strokeRect(tank.x, tank.y, tank.bw, tank.bh);
    ctx.strokeRect(tank2.x, tank.y, tank2.bw, tank.bh);
    const y = tank.y + tank.bh - (d.h / 0.5) * tank.bh;
    line(ctx, tank.x, y, tank.x + tank.bw, y, RAY, 2);
    line(ctx, tank2.x, y, tank2.x + tank2.bw, y, RAY, 2);
    text(ctx, `${fmt(d.pGauge, 0)} Pa`, tank.x + tank.bw / 2, y - 12, INK, 12, 'center');
    text(ctx, `${fmt(d.pGauge, 0)} Pa`, tank2.x + tank2.bw / 2, y - 12, INK, 12, 'center');
    arrow(ctx, tank.x + tank.bw / 2, tank.y + tank.bh, tank.x + tank.bw / 2, tank.y + tank.bh + Math.min(50, d.Fwide), RAY, 3);
    arrow(ctx, tank2.x + tank2.bw / 2, tank.y + tank.bh, tank2.x + tank2.bw / 2, tank.y + tank.bh + Math.min(50, d.Fnarrow * 2), RAY2, 3);
    if (ui.wrong) text(ctx, lab(ui, 'wider ⇒ bigger p?', '更宽就压强更大？'), w * 0.5, h * 0.14, '#a33', 13, 'center');
    handle(ctx, tank.x + tank.bw, y, ui.drag === 'depth');
    ui._geo = { tank, y };
  },
  pointer(ev, p, _d, ui) {
    if (p.view === 'utube') return null;
    const g = ui._geo;
    if (!g) return null;
    if (ev.type === 'down') {
      if (hit(ev.x, ev.y, g.tank.x + g.tank.bw, g.y)) { ui.drag = 'depth'; return {}; }
      return null;
    }
    if (ev.type === 'up') { ui.drag = null; return {}; }
    if (ev.type === 'move' && ui.drag === 'depth') {
      const frac = (g.tank.y + g.tank.bh - ev.y) / g.tank.bh;
      return { h: Math.min(0.5, Math.max(0.02, frac * 0.5)) };
    }
    return null;
  },
};

export const atmosphereSim = {
  id: 'atmosphere',
  timed: false,
  authority: 'Torricelli: h = P / (ρ_Hg g) with ρ_Hg = 13.6×10³ kg/m³. The force to separate an evacuated hemisphere is P·πr².',
  params: { P: 1.013e5, g: 9.8, r: 0.1 },
  schema: [
    num('P', 'Pressure P', '压强 P', 'Pa', 5e4, 1.2e5, 1000),
    num('g', 'g', 'g', 'm/s²', 1, 20, 0.1),
    num('r', 'Hemisphere radius r', '半球半径 r', 'm', 0.02, 0.3, 0.01),
  ],
  compute: (p) => torricelli(p),
  readouts: (d) => [
    ro('Mercury column', '水银柱', `${fmt(d.h, 3)} m`),
    ro('Hemisphere force', '拉开半球的力', `${fmt(d.F, 1)} N`),
  ],
  checks: (d) => [
    q('h', 'The mercury column is', '水银柱高度是', [
      opt(`${fmt(d.h, 3)} m`, `${fmt(d.h, 3)} m`),
      opt(`${fmt(d.P / 1000, 1)} m`, `${fmt(d.P / 1000, 1)} m`),
    ], 0),
    q('F', 'The separating force is', '拉开半球所需的力是', [
      opt('P · πr²', 'P · πr²'),
      opt('P · 2πr', 'P · 2πr'),
    ], 0),
  ],
  debug: {
    en: 'Using the circumference instead of the disk area understates the Magdeburg force.',
    zh: '用圆周长代替圆盘面积，会把马德堡半球要拉开的力算小。',
    toggleEn: 'Mark P · 2πr',
    toggleZh: '标出 P · 2πr',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    const x = w * 0.32;
    const base = h * 0.8;
    const colH = Math.min(h * 0.55, d.h * h * 0.6);
    ctx.fillStyle = 'rgba(150,150,160,0.85)';
    ctx.fillRect(x, base - colH, 18, colH);
    ctx.strokeStyle = INK;
    ctx.strokeRect(x - 10, base - 8, 38, 16);
    text(ctx, `${fmt(d.h, 3)} m`, x + 28, base - colH, INK, 12);
    const cx = w * 0.7;
    const cy = h * 0.5;
    const rad = 20 + d.r * 160;
    ctx.beginPath();
    ctx.arc(cx - 2, cy, rad, Math.PI / 2, -Math.PI / 2, true);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + 2, cy, rad, -Math.PI / 2, Math.PI / 2, true);
    ctx.stroke();
    text(ctx, `${fmt(d.F, 0)} N`, cx, cy + rad + 16, INK, 13, 'center');
    if (ui.wrong) text(ctx, `2πrP=${fmt(d.P * 2 * Math.PI * d.r, 0)}`, cx, cy - rad - 12, '#a33', 12, 'center');
  },
  pointer() { return null; },
};

export const bernoulliSim = {
  id: 'bernoulli',
  timed: false,
  authority: 'Incompressible continuity A1 v1 = A2 v2. Horizontal Bernoulli: P2 = P1 + ½ρ(v1² − v2²). Wing lift uses the same ½ρΔ(v²) with the two speeds given as inputs; the flow field is not solved. If P2 < 0 the horizontal-pipe assumptions have failed and the value is still reported.',
  params: { mode: 'pipe', A1: 0.02, A2: 0.008, v1: 2, rho: 1000, P1: 120000, vTop: 30, vBottom: 24, area: 0.4 },
  schema: [
    sel('mode', 'Case', '情形', [
      { value: 'pipe', en: 'Pipe', zh: '管道' },
      { value: 'wing', en: 'Wing speeds', zh: '机翼两侧速度' },
    ]),
    num('A1', 'A1', 'A1', 'm²', 0.004, 0.05, 0.001),
    num('A2', 'A2', 'A2', 'm²', 0.002, 0.04, 0.001),
    num('v1', 'v1', 'v1', 'm/s', 0, 8, 0.1),
    num('rho', 'ρ', 'ρ', 'kg/m³', 1, 1500, 10),
    num('P1', 'P1', 'P1', 'Pa', 20000, 200000, 1000),
    num('vTop', 'v top', '上表面速度', 'm/s', 0, 80, 1),
    num('vBottom', 'v bottom', '下表面速度', 'm/s', 0, 80, 1),
    num('area', 'Wing area', '机翼面积', 'm²', 0.05, 2, 0.05),
  ],
  compute(p) {
    if (p.mode === 'wing') return { mode: 'wing', ...wingLift(p) };
    return { mode: 'pipe', ...bernoulliPipe(p) };
  },
  readouts(d) {
    if (d.mode === 'wing') {
      return [
        ro('ΔP', 'ΔP', `${fmt(d.dP, 1)} Pa`),
        ro('Lift ΔP·A', '升力', `${fmt(d.lift, 1)} N`),
      ];
    }
    return [
      ro('v2', 'v2', `${fmt(d.v2, 2)} m/s`),
      ro('P2', 'P2', `${fmt(d.P2, 1)} Pa`),
      ro('P2 ≥ 0', 'P2 ≥ 0', d.valid ? 'yes' : 'no'),
    ];
  },
  checks(d) {
    if (d.mode === 'wing') {
      return [q('lift', 'With these two speeds the lift is', '按这两个速度，升力是', [
        opt(`${fmt(d.lift, 1)} N`, `${fmt(d.lift, 1)} N`),
        opt(`${fmt(-d.lift, 1)} N`, `${fmt(-d.lift, 1)} N`),
      ], 0)];
    }
    return [
      q('v', 'The narrower section has', '较窄的一段', [
        opt(d.v2 > d.v1 ? 'the higher speed' : 'the lower speed', d.v2 > d.v1 ? '速度更大' : '速度更小'),
        opt(d.v2 > d.v1 ? 'the lower speed' : 'the higher speed', d.v2 > d.v1 ? '速度更小' : '速度更大'),
      ], 0),
      q('p', 'Where the speed is higher, Bernoulli gives', '速度更大的地方，伯努利关系给出', [
        opt('the lower pressure', '更小的压强'),
        opt('the higher pressure', '更大的压强'),
      ], 0),
    ];
  },
  debug: {
    en: 'The street-level mistake is to say that a faster stream pushes harder. Along this streamline the higher speed is the lower pressure.',
    zh: '常见说法是“流得快就推得更狠”。沿这条流线，速度大的地方压强更小。',
    toggleEn: 'Swap the pressure labels',
    toggleZh: '把压强标签对调',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    if (d.mode === 'wing') {
      const y = h * 0.5;
      ctx.beginPath();
      ctx.moveTo(w * 0.25, y);
      ctx.quadraticCurveTo(w * 0.5, y - 50, w * 0.75, y);
      ctx.quadraticCurveTo(w * 0.5, y + 16, w * 0.25, y);
      ctx.strokeStyle = INK;
      ctx.stroke();
      text(ctx, `v=${fmt(d.vTop, 0)}`, w * 0.5, y - 64, RAY, 12, 'center');
      text(ctx, `v=${fmt(d.vBottom, 0)}`, w * 0.5, y + 36, RAY2, 12, 'center');
      text(ctx, `L=${fmt(d.lift, 0)} N`, w * 0.5, y + 70, INK, 14, 'center');
      return;
    }
    const y = h * 0.5;
    const h1 = 20 + d.A1 * 800;
    const h2 = 20 + d.A2 * 800;
    ctx.fillStyle = WATER;
    ctx.beginPath();
    ctx.moveTo(40, y - h1 / 2);
    ctx.lineTo(w * 0.48, y - h1 / 2);
    ctx.lineTo(w * 0.55, y - h2 / 2);
    ctx.lineTo(w - 40, y - h2 / 2);
    ctx.lineTo(w - 40, y + h2 / 2);
    ctx.lineTo(w * 0.55, y + h2 / 2);
    ctx.lineTo(w * 0.48, y + h1 / 2);
    ctx.lineTo(40, y + h1 / 2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = WATER_EDGE;
    ctx.stroke();
    text(ctx, `v1=${fmt(d.v1, 2)}`, w * 0.25, y - h1 / 2 - 16, INK, 12, 'center');
    text(ctx, `v2=${fmt(d.v2, 2)}`, w * 0.75, y - h2 / 2 - 16, INK, 12, 'center');
    const p1 = ui.wrong ? d.P2 : d.P1;
    const p2 = ui.wrong ? d.P1 : d.P2;
    text(ctx, `${fmt(p1, 0)} Pa`, w * 0.25, y + h1 / 2 + 18, MUTED, 12, 'center');
    text(ctx, `${fmt(p2, 0)} Pa`, w * 0.75, y + h2 / 2 + 18, MUTED, 12, 'center');
  },
  pointer() { return null; },
};

export const buoyOriginSim = {
  id: 'buoyancy-origin',
  timed: false,
  authority: 'Gauge pressure on a cube. Fb = Fup − Fdown = ρgVsub. Atmosphere on both faces is omitted because it cancels.',
  params: { a: 0.1, rho: 1000, g: 9.8, hTop: 0.05 },
  schema: [
    num('a', 'Cube side a', '立方体边长 a', 'm', 0.04, 0.2, 0.01),
    num('rho', 'Liquid ρ', '液体 ρ', 'kg/m³', 500, 2000, 50),
    num('g', 'g', 'g', 'm/s²', 1, 20, 0.1),
    num('hTop', 'Depth of the top face', '上表面深度', 'm', -0.15, 0.3, 0.01),
  ],
  compute: (p) => buoyancyOrigin(p),
  readouts: (d) => [
    ro('P top', '上表面压强', `${fmt(d.Ptop, 1)} Pa`),
    ro('P bottom', '下表面压强', `${fmt(d.Pbot, 1)} Pa`),
    ro('Fb = Fup − Fdown', '浮力', `${fmt(d.Fb, 2)} N`),
    ro('ρgVsub', 'ρgVsub', `${fmt(d.rho * d.g * d.Vsub, 2)} N`),
  ],
  checks: (d) => [
    q('which', 'The bottom face is pushed', '下表面受到的压力比上表面', [
      opt(d.Fup >= d.Fdown ? 'harder, so the difference is upward' : 'less', d.Fup >= d.Fdown ? '更大，所以压力差向上' : '更小'),
      opt('equally when the cube is underwater', '只要浸在水里就一样大'),
    ], 0),
    q('arch', 'Fup − Fdown equals', 'Fup − Fdown 等于', [
      opt(`${fmt(d.Fb, 2)} N`, `${fmt(d.Fb, 2)} N`),
      opt(`${fmt(d.Fup, 2)} N`, `${fmt(d.Fup, 2)} N`),
    ], 0),
  ],
  debug: {
    en: 'Using only the top pressure misses the upward force on the bottom face, which is what makes the buoyant force.',
    zh: '只看上表面的压强，会漏掉下表面向上的压力，浮力正是来自这个差。',
    toggleEn: 'Show only the downward arrow',
    toggleZh: '只画向下的压力',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    const waterY = h * 0.42;
    ctx.fillStyle = WATER;
    ctx.fillRect(0, waterY, w, h - waterY);
    line(ctx, 0, waterY, w, waterY, WATER_EDGE, 2);
    const px = 360;
    const side = d.a * px;
    const x = w * 0.5 - side / 2;
    const y = waterY + d.hTop * px;
    ctx.fillStyle = '#e6dccb';
    ctx.fillRect(x, y, side, side);
    ctx.strokeStyle = INK;
    ctx.strokeRect(x, y, side, side);
    const up = Math.min(70, d.Fup * 4);
    const down = Math.min(70, d.Fdown * 4);
    if (!ui.wrong) arrow(ctx, x + side / 2, y + side, x + side / 2, y + side - up, RAY2, 3);
    arrow(ctx, x + side / 2, y, x + side / 2, y + down, RAY, 3);
    text(ctx, `Fb=${fmt(d.Fb, 2)} N`, w * 0.5, h * 0.16, INK, 14, 'center');
    handle(ctx, x + side, y, ui.drag === 'cube');
    ui._geo = { waterY, px, x, y, side };
  },
  pointer(ev, _p, _d, ui) {
    const g = ui._geo;
    if (!g) return null;
    if (ev.type === 'down') {
      if (hit(ev.x, ev.y, g.x + g.side, g.y, 18)) { ui.drag = 'cube'; return {}; }
      return null;
    }
    if (ev.type === 'up') { ui.drag = null; return {}; }
    if (ev.type === 'move' && ui.drag === 'cube') {
      return { hTop: Math.min(0.3, Math.max(-0.15, (ev.y - g.waterY) / g.px)) };
    }
    return null;
  },
};

export const weighSim = {
  id: 'buoyancy-weigh',
  timed: false,
  authority: 'A hanging object: tension T = G − Fb when it can be held fully under, with Fb = ρ_liquid g V. If G < ρ_liquid g V the string goes slack and the object is not held fully submerged.',
  params: { V: 0.0002, g: 9.8, rhoL: 1000, rhoO: 2700 },
  schema: [
    num('V', 'Volume V', '体积 V', 'm³', 0.00005, 0.001, 0.00001),
    num('rhoO', 'Object ρ', '物体 ρ', 'kg/m³', 200, 9000, 50),
    num('rhoL', 'Liquid ρ', '液体 ρ', 'kg/m³', 500, 2000, 50),
    num('g', 'g', 'g', 'm/s²', 1, 20, 0.1),
  ],
  compute: (p) => weighingBuoyancy(p),
  readouts: (d) => [
    ro('G', '重力 G', `${fmt(d.G, 2)} N`),
    ro('Fb', '浮力 Fb', `${fmt(d.Fb, 2)} N`),
    ro('Scale T', '弹簧测力计 T', `${fmt(d.T, 2)} N`),
    ro('Fully held under', '被吊着完全浸没', d.heldUnder ? 'yes' : 'no'),
  ],
  checks: (d) => [
    q('T', 'The scale reads', '测力计示数是', [
      opt(`${fmt(d.T, 2)} N`, `${fmt(d.T, 2)} N`),
      opt(`${fmt(d.G, 2)} N`, `${fmt(d.G, 2)} N`),
      opt(`${fmt(d.G + d.Fb, 2)} N`, `${fmt(d.G + d.Fb, 2)} N`),
    ], 0),
    q('method', 'The weighing method uses', '称重法用的是', [
      opt('Fb = G − T', 'Fb = G − T'),
      opt('Fb = G + T', 'Fb = G + T'),
    ], 0),
  ],
  debug: {
    en: 'Adding the scale reading to the weight double-counts. The liquid takes part of the weight, so T = G − Fb.',
    zh: '把测力计示数和重力相加，会把力重复计算。液体承担了一部分，所以 T = G − Fb。',
    toggleEn: 'Mark G + T',
    toggleZh: '标出 G + T',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    const x = w * 0.5;
    const water = h * 0.48;
    ctx.fillStyle = WATER;
    ctx.fillRect(w * 0.3, water, w * 0.4, h * 0.4);
    line(ctx, x, h * 0.12, x, water - 10, INK, 2);
    text(ctx, `${fmt(d.T, 2)} N`, x + 16, h * 0.2, INK, 14);
    const y = d.heldUnder ? water + 30 : water - 20;
    ctx.fillStyle = '#e6dccb';
    ctx.fillRect(x - 24, y, 48, 40);
    ctx.strokeStyle = INK;
    ctx.strokeRect(x - 24, y, 48, 40);
    if (ui.wrong) text(ctx, `G+T=${fmt(d.G + d.T, 2)}`, x, h * 0.9, '#a33', 13, 'center');
  },
  pointer() { return null; },
};

export const archimedesSim = {
  id: 'archimedes',
  timed: false,
  authority: 'Archimedes: Fb = ρ_liquid g V_disp. V_disp is the submerged fraction times the object volume, and it is the volume collected by an overflow.',
  params: { V: 0.0003, frac: 0.6, rho: 1000, g: 9.8 },
  schema: [
    num('V', 'Object volume V', '物体体积 V', 'm³', 0.00005, 0.001, 0.00001),
    num('frac', 'Submerged fraction', '浸没比例', '', 0, 1, 0.02),
    num('rho', 'Liquid ρ', '液体 ρ', 'kg/m³', 500, 2000, 50),
    num('g', 'g', 'g', 'm/s²', 1, 20, 0.1),
  ],
  compute: (p) => archimedes(p),
  readouts: (d) => [
    ro('Vdisp', '排开体积', `${fmt(d.Vdisp, 5)} m³`),
    ro('Fb', '浮力', `${fmt(d.Fb, 3)} N`),
  ],
  checks: (d) => [
    q('v', 'Displaced volume is', '排开的体积是', [
      opt(`${fmt(d.Vdisp, 5)} m³`, `${fmt(d.Vdisp, 5)} m³`),
      opt(
        Math.abs(d.Vdisp - d.V) < 1e-12 ? 'only the dry part' : `${fmt(d.V, 5)} m³`,
        Math.abs(d.Vdisp - d.V) < 1e-12 ? '只有露出水面的部分' : `${fmt(d.V, 5)} m³`,
      ),
    ], 0),
    q('f', 'Fb equals', '浮力等于', [
      opt('ρ g Vdisp', 'ρ g Vdisp'),
      opt('ρ g V, using the whole object even when it is only partly under', 'ρ g V，即使只浸入一部分也用整个体积'),
    ], 0),
  ],
  debug: {
    en: 'Using the whole object volume when only part of it is under water overstates Fb.',
    zh: '只浸入一部分时仍用整个物体体积，会把浮力算大。',
    toggleEn: 'Mark ρgV instead of ρgVdisp',
    toggleZh: '标出 ρgV 而不是 ρgVdisp',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    const water = h * 0.5;
    ctx.fillStyle = WATER;
    ctx.fillRect(w * 0.18, water, w * 0.36, h * 0.38);
    const side = 70;
    const sunk = side * (1 - d.frac);
    ctx.fillStyle = '#e6dccb';
    ctx.fillRect(w * 0.32, water - sunk, side, side);
    ctx.strokeStyle = INK;
    ctx.strokeRect(w * 0.32, water - sunk, side, side);
    const cupX = w * 0.68;
    const cupH = 20 + d.frac * 80;
    ctx.strokeRect(cupX, h * 0.7 - cupH, 40, cupH + 10);
    ctx.fillStyle = WATER;
    ctx.fillRect(cupX, h * 0.7 - cupH, 40, cupH);
    text(ctx, lab(ui, 'overflow', '溢出'), cupX + 20, h * 0.78, MUTED, 12, 'center');
    text(ctx, `${fmt(d.Fb, 2)} N`, w * 0.36, h * 0.22, INK, 14, 'center');
    if (ui.wrong) text(ctx, `ρgV=${fmt(d.rho * d.g * d.V, 2)}`, w * 0.36, h * 0.3, '#a33', 12, 'center');
    handle(ctx, w * 0.32 + side, water - sunk + side * d.frac, ui.drag === 'frac');
    ui._geo = { water, side, x: w * 0.32 };
  },
  pointer(ev, _p, _d, ui) {
    const g = ui._geo;
    if (!g) return null;
    if (ev.type === 'down') {
      if (hit(ev.x, ev.y, g.x + g.side, g.water, 20)) { ui.drag = 'frac'; return {}; }
      return null;
    }
    if (ev.type === 'up') { ui.drag = null; return {}; }
    if (ev.type === 'move' && ui.drag === 'frac') {
      const frac = (g.water + g.side - ev.y) / g.side;
      return { frac: Math.min(1, Math.max(0, frac)) };
    }
    return null;
  },
};

const STATE_EN = { floating: 'floating', suspended: 'suspended', sunk: 'sunk' };
const STATE_ZH = { floating: '漂浮', suspended: '悬浮', sunk: '沉底' };

export const floatSim = {
  id: 'float-sink',
  timed: false,
  authority: 'Equilibrium of weight and Archimedes force. Floating: Vdisp/V = ρ_avg/ρ_liquid and Fb = G. Suspended: ρ_avg = ρ_liquid. Sunk: Fb = ρ_liquid g V < G, normal force from the bottom N = G − Fb. Ship and submarine use total mass over hull volume.',
  params: { mode: 'solid', rhoO: 600, rhoL: 1000, V: 0.002, g: 9.8, mass: 800, ballast: 200 },
  schema: [
    sel('mode', 'Body', '物体', [
      { value: 'solid', en: 'Solid', zh: '实心物体' },
      { value: 'ship', en: 'Ship', zh: '轮船' },
      { value: 'submarine', en: 'Submarine', zh: '潜艇' },
    ]),
    num('rhoO', 'Solid ρ', '实心密度', 'kg/m³', 100, 8000, 50),
    num('rhoL', 'Liquid ρ', '液体 ρ', 'kg/m³', 500, 2000, 50),
    num('V', 'Volume / hull volume', '体积或船体容积', 'm³', 0.0005, 2, 0.0005),
    num('mass', 'Hull mass (ship, sub)', '船体质量', 'kg', 50, 2000, 10),
    num('ballast', 'Ballast water', '压载水', 'kg', 0, 2000, 10),
    num('g', 'g', 'g', 'm/s²', 1, 20, 0.1),
  ],
  onParam(key, value) {
    if (key !== 'mode') return {};
    if (value === 'solid') return { V: 0.002, rhoO: 600 };
    if (value === 'ship') return { V: 1.2, mass: 800 };
    if (value === 'submarine') return { V: 1.2, mass: 900, ballast: 200 };
    return {};
  },
  compute: (p) => floatState(p),
  readouts: (d) => [
    ro('State', '状态', { en: STATE_EN[d.state], zh: STATE_ZH[d.state] }),
    ro('ρ avg', '平均密度', `${fmt(d.rhoAvg, 1)} kg/m³`),
    ro('Vdisp / V', '排开比例', fmt(d.fraction, 3)),
    ro('Fb', '浮力', `${fmt(d.Fb, 1)} N`),
    ro('G', '重力', `${fmt(d.G, 1)} N`),
    ro('Bottom normal', '底部支持力', `${fmt(d.N, 1)} N`),
  ],
  checks: (d) => [
    q('state', 'The body is', '物体处于', [
      opt(STATE_EN[d.state], STATE_ZH[d.state]),
      opt(d.state === 'floating' ? 'sunk' : 'floating', d.state === 'floating' ? '沉底' : '漂浮'),
    ], 0),
    q('fb', 'While floating or suspended, Fb compared with G is', '漂浮或悬浮时，浮力与重力', [
      opt(d.state === 'sunk' ? 'Fb < G (this one is sunk)' : 'Fb = G', d.state === 'sunk' ? 'Fb < G（当前是沉底）' : 'Fb = G'),
      opt('Fb > G', 'Fb > G'),
    ], 0),
  ],
  debug: {
    en: 'A hollow ship is not “light steel”. It floats when the average density, total mass over hull volume, is below the liquid.',
    zh: '轮船不是“钢铁变轻了”。平均密度（总质量除以船体容积）小于液体时才会浮起来。',
    toggleEn: 'Compare with solid steel at 7900',
    toggleZh: '拿实心钢 7900 来比',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    const water = h * 0.48;
    ctx.fillStyle = WATER;
    ctx.fillRect(0, water, w, h - water);
    line(ctx, 0, water, w, water, WATER_EDGE, 2);
    const bodyH = 70;
    const bodyW = d.mode === 'solid' ? 64 : 120;
    let top;
    if (d.state === 'sunk') top = h * 0.78 - bodyH;
    else if (d.state === 'suspended') top = water - bodyH * 0.5;
    else top = water - bodyH * (1 - d.fraction);
    const x = w * 0.5 - bodyW / 2;
    ctx.fillStyle = d.mode === 'solid' ? '#e6dccb' : '#c5ccd1';
    ctx.beginPath();
    if (d.mode === 'solid') ctx.rect(x, top, bodyW, bodyH);
    else {
      ctx.moveTo(x, top + 16);
      ctx.lineTo(x + bodyW, top + 16);
      ctx.lineTo(x + bodyW - 16, top + bodyH);
      ctx.lineTo(x + 16, top + bodyH);
      ctx.closePath();
    }
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.stroke();
    text(ctx, ui.lang === 'zh' ? STATE_ZH[d.state] : STATE_EN[d.state], w * 0.5, h * 0.16, INK, 16, 'center');
    text(ctx, `ρ̄=${fmt(d.rhoAvg, 0)}`, w * 0.5, h * 0.24, MUTED, 12, 'center');
    if (ui.wrong) text(ctx, lab(ui, 'solid steel 7900 sinks', '实心钢 7900 会下沉'), w * 0.5, h * 0.9, '#a33', 13, 'center');
  },
  pointer() { return null; },
};
