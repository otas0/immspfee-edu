import { fmt } from '../fmt.js';
import { barMagnet, solenoidField, ampereForce, inductionRod, lorentzForce, cyclotronRadius } from '../physics/em.js';
import { num, tog, clear, line, text, handle, hit, lab, arrow, INK, MUTED, RAY, RAY2 } from './kit.js';

function q(id, en, zh, options, answer) { return { id, en, zh, options, answer }; }
function opt(en, zh) { return { en, zh }; }
function ro(en, zh, value) { return { en, zh, value }; }

export const magnetSim = {
  id: 'bar-magnet',
  timed: false,
  authority: 'Outside a bar magnet the field lines leave the north pole and enter the south pole. Strength only packs the drawn lines; it does not invent a new pattern.',
  params: { strength: 0.7, flip: false },
  schema: [
    num('strength', 'Strength', '磁极强弱', '', 0.2, 1, 0.05),
    tog('flip', 'Swap poles', '对调磁极'),
  ],
  compute: (p) => barMagnet(p),
  readouts: (d) => [
    ro('N', 'N', d.north === 'right' ? { en: 'right', zh: '右' } : { en: 'left', zh: '左' }),
    ro('S', 'S', d.south === 'right' ? { en: 'right', zh: '右' } : { en: 'left', zh: '左' }),
    ro('lines', '磁感线条数', String(d.lineCount)),
  ],
  checks: (d) => [
    q('out', 'Outside the magnet the lines leave', '磁体外，磁感线从哪一极离开', [
      opt('the north pole', 'N 极'),
      opt('the south pole', 'S 极'),
      opt('both poles the same way', '两极一样'),
    ], 0),
    q('n', 'With the present setting, N is on the', '当前设置下，N 极在', [
      opt(d.north === 'right' ? 'right' : 'left', d.north === 'right' ? '右侧' : '左侧'),
      opt(d.north === 'right' ? 'left' : 'right', d.north === 'right' ? '左侧' : '右侧'),
    ], 0),
  ],
  debug: {
    en: 'Drawing the outside lines from S to N reverses the teaching rule.',
    zh: '把磁体外的线画成从 S 到 N，就反了教学规则。',
    toggleEn: 'Reverse the outside lines',
    toggleZh: '反转磁体外的线',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    const cx = w * 0.5;
    const cy = h * 0.5;
    const mw = w * 0.34;
    const mh = h * 0.18;
    const leftN = d.north === 'left';
    ctx.fillStyle = leftN ? RAY : RAY2;
    ctx.fillRect(cx - mw / 2, cy - mh / 2, mw / 2, mh);
    ctx.fillStyle = leftN ? RAY2 : RAY;
    ctx.fillRect(cx, cy - mh / 2, mw / 2, mh);
    ctx.strokeStyle = INK;
    ctx.strokeRect(cx - mw / 2, cy - mh / 2, mw, mh);
    text(ctx, 'N', leftN ? cx - mw / 4 : cx + mw / 4, cy, '#fff', 18, 'center');
    text(ctx, 'S', leftN ? cx + mw / 4 : cx - mw / 4, cy, '#fff', 18, 'center');
    const wrong = !!ui.wrong;
    for (let i = 0; i < d.lineCount; i += 1) {
      const u = (i + 0.5) / d.lineCount - 0.5;
      const y0 = cy + u * mh * 0.7;
      const bulge = (0.35 + 0.25 * d.strength) * h * (0.55 - Math.abs(u));
      const nX = leftN ? cx - mw / 2 : cx + mw / 2;
      const sX = leftN ? cx + mw / 2 : cx - mw / 2;
      const from = wrong ? sX : nX;
      const to = wrong ? nX : sX;
      const sign = from < to ? 1 : -1;
      ctx.beginPath();
      ctx.moveTo(from, y0);
      ctx.bezierCurveTo(from + sign * bulge, y0 - bulge * 0.2, to - sign * bulge, y0 - bulge * 0.2, to, y0);
      ctx.strokeStyle = MUTED;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      arrow(ctx, to - sign * 18, y0 - 4, to - sign * 2, y0, RAY, 1.5);
    }
    text(ctx, lab(ui, 'outside: N → S', '磁体外：N → S'), w * 0.5, h * 0.12, INK, 14, 'center');
    if (wrong) text(ctx, lab(ui, 'lines reversed', '方向反了'), w * 0.5, h * 0.88, '#a33', 13, 'center');
  },
  pointer() { return null; },
};

export const solenoidSim = {
  id: 'solenoid',
  timed: false,
  authority: 'On the axis of a long solenoid B = μ0 n I. Curl the fingers of the right hand with the current in the coils; the thumb points along B and names the north end.',
  params: { n: 1000, I: 2, turns: 8 },
  schema: [
    num('n', 'Turns per metre n', '匝密度 n', '1/m', 200, 4000, 50),
    num('I', 'Current I', '电流 I', 'A', -5, 5, 0.1),
    num('turns', 'Drawn turns', '画出的匝数', '', 4, 16, 1),
  ],
  compute: (p) => solenoidField(p),
  readouts: (d) => [
    ro('B', 'B', `${fmt(d.B, 4)} T`),
    ro('n', 'n', `${fmt(d.n, 0)} /m`),
    ro('I', 'I', `${fmt(d.I, 2)} A`),
    ro('N', 'N 端', d.north === 'right' ? { en: 'right', zh: '右' } : { en: 'left', zh: '左' }),
  ],
  checks: (d) => [
    q('B', 'On the axis, B equals', '轴线上 B 等于', [
      opt(`${fmt(d.B, 4)} T = μ0 n I`, `${fmt(d.B, 4)} T = μ0 n I`),
      opt(`${fmt(d.n * d.I, 4)} T`, `${fmt(d.n * d.I, 4)} T`),
      opt('zero inside a solenoid', '螺线管内部为零'),
    ], 0),
    q('N', 'The north end is on the', 'N 极在', [
      opt(d.north === 'right' ? 'right' : 'left', d.north === 'right' ? '右侧' : '左侧'),
      opt(d.north === 'right' ? 'left' : 'right', d.north === 'right' ? '左侧' : '右侧'),
    ], 0),
  ],
  debug: {
    en: 'Pointing the north end opposite the right-hand thumb reverses the rule.',
    zh: '把 N 端标在右手拇指的反方向，就反了定则。',
    toggleEn: 'Flip the labelled north end',
    toggleZh: '翻转标出的 N 端',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    const x0 = w * 0.18;
    const x1 = w * 0.82;
    const cy = h * 0.5;
    const r = h * 0.16;
    const turns = Math.max(4, Math.round(d.turns));
    for (let i = 0; i < turns; i += 1) {
      const x = x0 + ((i + 0.5) / turns) * (x1 - x0);
      ctx.beginPath();
      ctx.ellipse(x, cy, 10, r, 0, 0, Math.PI * 2);
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2;
      ctx.stroke();
      const up = d.I >= 0;
      arrow(ctx, x, cy + (up ? r * 0.6 : -r * 0.6), x, cy + (up ? -r * 0.6 : r * 0.6), RAY, 1.5);
    }
    const northRight = ui.wrong ? d.north !== 'right' : d.north === 'right';
    const nx = northRight ? x1 + 8 : x0 - 8;
    const sx = northRight ? x0 - 8 : x1 + 8;
    if (Math.abs(d.I) > 1e-6) {
      arrow(ctx, (x0 + x1) / 2 - 40, cy, (x0 + x1) / 2 + 40 * (northRight ? 1 : -1), cy, RAY2, 3);
      text(ctx, 'B', (x0 + x1) / 2, cy - r - 18, RAY2, 14, 'center');
    }
    text(ctx, 'N', nx, cy - r - 8, RAY, 16, 'center');
    text(ctx, 'S', sx, cy - r - 8, MUTED, 16, 'center');
    text(ctx, `B=${fmt(d.B, 4)} T`, w * 0.5, h * 0.12, INK, 14, 'center');
    text(ctx, lab(ui, 'right-hand rule', '右手螺旋定则'), w * 0.5, h * 0.88, MUTED, 12, 'center');
    if (ui.wrong) text(ctx, lab(ui, 'N flipped', 'N 端标反了'), w * 0.5, h * 0.94, '#a33', 12, 'center');
  },
  pointer() { return null; },
};

export const ampereSim = {
  id: 'ampere-force',
  timed: false,
  authority: 'When B is perpendicular to I, the force on a straight wire is F = B I L. The right-hand rule sets the sense of F.',
  params: { B: 0.4, I: 3, L: 0.2 },
  schema: [
    num('B', 'Field B', '磁感应强度 B', 'T', 0, 1.5, 0.05),
    num('I', 'Current I', '电流 I', 'A', -8, 8, 0.1),
    num('L', 'Length L', '导线长度 L', 'm', 0.05, 0.5, 0.01),
  ],
  compute: (p) => ampereForce(p),
  readouts: (d) => [
    ro('F', 'F', `${fmt(d.F, 3)} N`),
    ro('B', 'B', `${fmt(d.B, 2)} T`),
    ro('I', 'I', `${fmt(d.I, 2)} A`),
    ro('L', 'L', `${fmt(d.L, 2)} m`),
  ],
  checks: (d) => [
    q('F', 'The magnitude of the force is', '力的大小是', [
      opt(`${fmt(d.F, 3)} N = B I L`, `${fmt(d.F, 3)} N = B I L`),
      opt(`${fmt(d.B * d.I, 3)} N`, `${fmt(d.B * d.I, 3)} N`),
      opt('zero because B is into the page', '为零，因为 B 垂直纸面向里'),
    ], 0),
  ],
  debug: {
    en: 'Drawing F parallel to the wire ignores that F is perpendicular to both B and I.',
    zh: '把 F 画成与导线平行，就丢掉了 F 同时垂直于 B 和 I。',
    toggleEn: 'Draw F along the wire',
    toggleZh: '把 F 画成沿导线',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    const y = h * 0.55;
    const x0 = w * 0.2;
    const x1 = w * 0.8;
    for (let i = 0; i < 5; i += 1) {
      for (let j = 0; j < 3; j += 1) {
        const x = w * 0.25 + i * w * 0.12;
        const yy = h * 0.28 + j * h * 0.12;
        text(ctx, '×', x, yy, MUTED, 16, 'center');
      }
    }
    text(ctx, lab(ui, 'B into page', 'B 垂直纸面向里'), w * 0.5, h * 0.14, MUTED, 12, 'center');
    line(ctx, x0, y, x1, y, INK, 4);
    if (d.I >= 0) arrow(ctx, x0 + 20, y, x1 - 20, y, RAY, 3);
    else arrow(ctx, x1 - 20, y, x0 + 20, y, RAY, 3);
    text(ctx, 'I', (x0 + x1) / 2, y + 22, RAY, 14, 'center');
    const mid = (x0 + x1) / 2;
    const Flen = Math.min(h * 0.28, 20 + d.F * 40);
    if (ui.wrong) {
      arrow(ctx, mid - 40, y - 30, mid + 40, y - 30, '#a33', 3);
      text(ctx, 'F?', mid, y - 48, '#a33', 14, 'center');
    } else if (d.F > 1e-8) {
      const up = d.sense > 0;
      arrow(ctx, mid, y, mid, y + (up ? -Flen : Flen), RAY2, 3);
      text(ctx, 'F', mid + 14, y + (up ? -Flen / 2 : Flen / 2), RAY2, 14);
    }
    text(ctx, `F=${fmt(d.F, 3)} N`, w * 0.5, h * 0.9, INK, 14, 'center');
  },
  pointer() { return null; },
};

export const inductionSim = {
  id: 'induction',
  timed: false,
  authority: 'On rails of width ℓ, Φ = B ℓ x and the motional emf is ε = B ℓ v. With resistance R the current is I = ε / R.',
  params: { B: 0.5, ell: 0.2, x: 0.25, v: 1.5, R: 2 },
  schema: [
    num('B', 'Field B', '磁感应强度 B', 'T', 0, 1.5, 0.05),
    num('ell', 'Rail width ℓ', '导轨间距 ℓ', 'm', 0.05, 0.5, 0.01),
    num('x', 'Rod position x', '杆位置 x', 'm', 0.05, 0.6, 0.01),
    num('v', 'Speed v', '速度 v', 'm/s', -3, 3, 0.1),
    num('R', 'Resistance R', '电阻 R', 'Ω', 0.5, 20, 0.5),
  ],
  compute: (p) => inductionRod(p),
  readouts: (d) => [
    ro('Φ', 'Φ', `${fmt(d.flux, 4)} Wb`),
    ro('ε', 'ε', `${fmt(d.emf, 3)} V`),
    ro('I', 'I', `${fmt(d.I, 3)} A`),
  ],
  checks: (d) => [
    q('emf', 'The induced emf is', '感应电动势是', [
      opt(`${fmt(d.emf, 3)} V = B ℓ v`, `${fmt(d.emf, 3)} V = B ℓ v`),
      opt(`${fmt(d.flux, 3)} V`, `${fmt(d.flux, 3)} V`),
      opt('zero while the rod is moving', '杆在动时为零'),
    ], 0),
    q('I', 'The loop current is', '回路电流是', [
      opt(`${fmt(d.I, 3)} A = ε / R`, `${fmt(d.I, 3)} A = ε / R`),
      opt(`${fmt(d.emf * d.R, 3)} A`, `${fmt(d.emf * d.R, 3)} A`),
    ], 0),
  ],
  debug: {
    en: 'Using ε = B ℓ / v inverts the speed dependence.',
    zh: '写成 ε = B ℓ / v 会把速度关系弄反。',
    toggleEn: 'Use ε = B ℓ / v',
    toggleZh: '改用 ε = B ℓ / v',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    const x0 = w * 0.18;
    const y0 = h * 0.28;
    const y1 = h * 0.72;
    const scale = (w * 0.55) / 0.6;
    const rodX = x0 + d.x * scale;
    line(ctx, x0, y0, x0 + 0.65 * scale, y0, INK, 2);
    line(ctx, x0, y1, x0 + 0.65 * scale, y1, INK, 2);
    line(ctx, x0, y0, x0, y1, INK, 3);
    line(ctx, rodX, y0, rodX, y1, RAY, 4);
    handle(ctx, rodX, (y0 + y1) / 2, false);
    for (let i = 0; i < 4; i += 1) {
      for (let j = 0; j < 3; j += 1) {
        const x = x0 + 20 + i * ((rodX - x0 - 30) / 3.5);
        const y = y0 + 20 + j * ((y1 - y0 - 40) / 2.2);
        if (x < rodX - 8) text(ctx, '×', x, y, MUTED, 14, 'center');
      }
    }
    if (Math.abs(d.v) > 1e-6) {
      const dir = d.v >= 0 ? 1 : -1;
      arrow(ctx, rodX, y0 - 24, rodX + dir * 36, y0 - 24, RAY2, 2);
      text(ctx, 'v', rodX + dir * 18, y0 - 38, RAY2, 12, 'center');
    }
    const emfShow = ui.wrong && Math.abs(d.v) > 1e-6 ? (d.B * d.ell) / d.v : d.emf;
    text(ctx, `Φ=${fmt(d.flux, 3)} Wb`, w * 0.72, h * 0.3, INK, 13);
    text(ctx, `ε=${fmt(emfShow, 3)} V`, w * 0.72, h * 0.4, ui.wrong ? '#a33' : RAY, 13);
    text(ctx, `I=${fmt(ui.wrong && Math.abs(d.v) > 1e-6 ? emfShow / d.R : d.I, 3)} A`, w * 0.72, h * 0.5, MUTED, 13);
    text(ctx, lab(ui, 'Φ = B ℓ x', 'Φ = B ℓ x'), w * 0.5, h * 0.9, MUTED, 12, 'center');
    ui._geo = { x0, scale, y: (y0 + y1) / 2 };
  },
  pointer(ev, p, _d, ui) {
    const g = ui._geo;
    if (!g) return null;
    if (ev.type === 'down' && hit(ev.x, ev.y, g.x0 + p.x * g.scale, g.y, 24)) {
      ui.drag = 'rod';
      return {};
    }
    if (ev.type === 'move' && ui.drag === 'rod') {
      const x = Math.min(0.6, Math.max(0.05, (ev.x - g.x0) / g.scale));
      return { x };
    }
    if (ev.type === 'up') {
      ui.drag = null;
      return {};
    }
    return null;
  },
};

export const lorentzSim = {
  id: 'lorentz',
  timed: false,
  authority: 'When velocity is perpendicular to B, the Lorentz force magnitude is F = |q| v B. Sense follows the right-hand rule for a positive charge.',
  params: { q: 1.6e-19, v: 2e6, B: 0.05 },
  schema: [
    num('q', 'Charge q', '电荷 q', 'C', 1e-20, 5e-19, 1e-20),
    num('v', 'Speed v', '速率 v', 'm/s', 1e5, 5e6, 1e5),
    num('B', 'Field B', '磁场 B', 'T', 0.01, 0.2, 0.01),
  ],
  compute: (p) => lorentzForce(p),
  readouts: (d) => [
    ro('F', 'F', `${d.F.toExponential(3)} N`),
    ro('v', 'v', d.v.toExponential(2) + ' m/s'),
    ro('B', 'B', `${fmt(d.B, 2)} T`),
  ],
  checks: (d) => [
    q('F', 'The force magnitude is', '力的大小是', [
      opt(`${d.F.toExponential(3)} N = |q| v B`, `${d.F.toExponential(3)} N = |q| v B`),
      opt(`${(Math.abs(d.q) * d.v / d.B).toExponential(3)} N`, `${(Math.abs(d.q) * d.v / d.B).toExponential(3)} N`),
    ], 0),
  ],
  debug: {
    en: 'Using F = |q| v / B invents the wrong dependence on B.',
    zh: '写成 F = |q| v / B，对 B 的依赖就反了。',
    toggleEn: 'Use F = |q| v / B',
    toggleZh: '改用 F = |q| v / B',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    for (let i = 0; i < 5; i += 1) {
      for (let j = 0; j < 4; j += 1) {
        text(ctx, '×', w * 0.2 + i * w * 0.12, h * 0.25 + j * h * 0.12, MUTED, 14, 'center');
      }
    }
    const cx = w * 0.5;
    const cy = h * 0.5;
    arrow(ctx, cx - 50, cy, cx + 50, cy, RAY, 2);
    text(ctx, 'v', cx + 60, cy, RAY, 12);
    arrow(ctx, cx, cy, cx, cy - 55, RAY2, 2);
    text(ctx, 'F', cx + 8, cy - 60, RAY2, 12);
    const Fshow = ui.wrong ? Math.abs(d.q) * d.v / d.B : d.F;
    text(ctx, `F=${Fshow.toExponential(3)} N`, w * 0.5, h * 0.88, ui.wrong ? '#a33' : INK, 14, 'center');
  },
  pointer() { return null; },
};

export const cyclotronSim = {
  id: 'cyclotron',
  timed: true,
  tMax: (p) => {
    const d = cyclotronRadius(p);
    return Math.min(20, 2 * d.T);
  },
  authority: 'In a uniform B with v perpendicular to B, r = m v / (|q| B) and the angular speed is ω = |q| B / m.',
  params: { m: 9.1e-31, q: -1.6e-19, v: 2e6, B: 0.05 },
  schema: [
    num('m', 'Mass m', '质量 m', 'kg', 1e-31, 5e-27, 1e-31),
    num('q', 'Charge q', '电荷 q', 'C', -5e-19, -1e-20, 1e-20),
    num('v', 'Speed v', '速率 v', 'm/s', 1e5, 5e6, 1e5),
    num('B', 'Field B', '磁场 B', 'T', 0.01, 0.2, 0.01),
  ],
  compute: (p, t) => {
    const d = cyclotronRadius(p);
    const ang = d.omega * Math.max(0, t);
    return { ...d, t: Math.max(0, t), x: d.r * Math.cos(ang), y: d.r * Math.sin(ang) };
  },
  readouts: (d) => [
    ro('r', 'r', d.r.toExponential(3) + ' m'),
    ro('T', 'T', `${fmt(d.T * 1e9, 2)} ns`),
    ro('ω', 'ω', d.omega.toExponential(3) + ' rad/s'),
  ],
  checks: (d) => [
    q('r', 'The orbit radius is', '轨道半径是', [
      opt(`${d.r.toExponential(3)} m = m v / (|q| B)`, `${d.r.toExponential(3)} m = m v / (|q| B)`),
      opt(`${(d.m * d.v * d.B / Math.abs(d.q)).toExponential(3)} m`, `${(d.m * d.v * d.B / Math.abs(d.q)).toExponential(3)} m`),
    ], 0),
  ],
  debug: {
    en: 'Putting B in the numerator invents a radius that grows with field strength.',
    zh: '把 B 放到分子上，半径会随磁场变大。',
    toggleEn: 'Use r ∝ B',
    toggleZh: '改成 r 正比于 B',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    const cx = w * 0.5;
    const cy = h * 0.52;
    const rShow = ui.wrong ? (d.m * d.v * d.B) / Math.abs(d.q) : d.r;
    const scale = Math.min(w, h) * 0.28 / Math.max(rShow, 1e-6);
    ctx.beginPath();
    ctx.arc(cx, cy, rShow * scale, 0, Math.PI * 2);
    ctx.strokeStyle = '#cfc6b8';
    ctx.stroke();
    ctx.fillStyle = RAY;
    ctx.beginPath();
    ctx.arc(cx + d.x * scale * (rShow / d.r), cy - d.y * scale * (rShow / d.r), 5, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, `r=${rShow.toExponential(2)} m`, w * 0.5, h * 0.12, ui.wrong ? '#a33' : INK, 14, 'center');
  },
  pointer() { return null; },
};
