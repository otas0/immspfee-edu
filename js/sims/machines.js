import { fmt } from '../fmt.js?v=__BUILD__';
import { lever, pulley, workPower } from '../physics/machines.js?v=__BUILD__';
import { num, clear, line, arrow, text, handle, lab, INK, MUTED, RAY, RAY2 } from './kit.js?v=__BUILD__';

function q(id, en, zh, options, answer) { return { id, en, zh, options, answer }; }
function opt(en, zh) { return { en, zh }; }
function ro(en, zh, value) { return { en, zh, value }; }

export const leverSim = {
  id: 'lever',
  timed: false,
  authority: 'Both forces are perpendicular to the bar, so each moment arm is the distance from the fulcrum. Balance is F1 L1 = F2 L2.',
  params: { F1: 4, L1: 0.3, F2: 6, L2: 0.2 },
  schema: [
    num('F1', 'Effort F1', '动力 F1', 'N', 0, 20, 0.2),
    num('L1', 'Effort arm L1', '动力臂 L1', 'm', 0.05, 0.8, 0.01),
    num('F2', 'Load F2', '阻力 F2', 'N', 0, 20, 0.2),
    num('L2', 'Load arm L2', '阻力臂 L2', 'm', 0.05, 0.8, 0.01),
  ],
  compute: (p) => lever(p),
  readouts: (d) => [
    ro('F1 L1', 'F1 L1', `${fmt(d.tau1, 2)} N·m`),
    ro('F2 L2', 'F2 L2', `${fmt(d.tau2, 2)} N·m`),
    ro('Balance', '平衡', d.balanced ? { en: 'yes', zh: '是' } : { en: 'no', zh: '否' }),
  ],
  checks: (d) => {
    const need = d.F1forBalance == null ? '—' : `${fmt(d.F1forBalance, 2)} N`;
    return [
      q('bal', 'With these arms, the effort that balances the load is', '在这对力臂下，平衡所需的动力是', [
        opt(need, need),
        opt(`${fmt(d.F2, 2)} N`, `${fmt(d.F2, 2)} N`),
        opt(`${fmt(d.F2 * d.L1 / Math.max(d.L2, 1e-6), 2)} N`, `${fmt(d.F2 * d.L1 / Math.max(d.L2, 1e-6), 2)} N`),
      ], 0),
      q('cond', 'The lever is balanced when', '杠杆平衡的条件是', [
        opt('F1 L1 = F2 L2', 'F1 L1 = F2 L2'),
        opt('F1 = F2', 'F1 = F2'),
        opt('L1 = L2', 'L1 = L2'),
      ], 0),
    ];
  },
  debug: {
    en: 'Adding the forces and ignoring the arms treats a long arm as if it were the same as a short one.',
    zh: '只把力相加、不看力臂，等于把长臂和短臂当成一样。',
    toggleEn: 'Compare F1 + F2 instead of the moments',
    toggleZh: '改看 F1 + F2，不看力矩',
  },
  draw(ctx, w, h, _p, d, ui) {
    clear(ctx, w, h);
    const y = h * 0.55;
    const cx = w * 0.5;
    const px = Math.min(w * 0.42, h * 0.55);
    line(ctx, cx - px, y, cx + px, y, INK, 6);
    line(ctx, cx, y, cx, y + 36, INK, 3);
    const x1 = cx - d.L1 * px;
    const x2 = cx + d.L2 * px;
    const len1 = 16 + d.F1 * 4;
    const len2 = 16 + d.F2 * 4;
    arrow(ctx, x1, y, x1, y + len1, RAY, 3);
    arrow(ctx, x2, y, x2, y + len2, RAY2, 3);
    text(ctx, 'F1', x1, y + len1 + 14, RAY, 12, 'center');
    text(ctx, 'F2', x2, y + len2 + 14, RAY2, 12, 'center');
    text(ctx, lab(ui, 'fulcrum', '支点'), cx, y + 52, MUTED, 12, 'center');
    text(ctx, d.balanced ? lab(ui, 'balanced', '平衡') : lab(ui, 'not balanced', '不平衡'), w * 0.5, h * 0.16, INK, 16, 'center');
    if (ui.wrong) text(ctx, `F1+F2=${fmt(d.F1 + d.F2, 1)}`, w * 0.5, h * 0.26, '#a33', 13, 'center');
    handle(ctx, x1, y, ui.drag === 'L1');
    handle(ctx, x2, y, ui.drag === 'L2');
    ui._geo = { cx, y, px };
  },
  pointer(ev, _p, _d, ui) {
    const g = ui._geo;
    if (!g) return null;
    if (ev.type === 'down') {
      ui.drag = ev.x < g.cx ? 'L1' : 'L2';
      return {};
    }
    if (ev.type === 'up') { ui.drag = null; return {}; }
    if (!ui.drag) return null;
    const arm = Math.min(0.8, Math.max(0.05, Math.abs(ev.x - g.cx) / g.px));
    return ui.drag === 'L1' ? { L1: arm } : { L2: arm };
  },
};

export const pulleySim = {
  id: 'pulley',
  timed: false,
  authority: 'Ideal string. n segments support the load and the movable pulley. F = (G + Gp) / n and the rope end moves n times as far as the load. η = Gh / (F s).',
  params: { n: 3, G: 12, Gp: 3, s: 0.6 },
  schema: [
    num('n', 'Supporting segments n', '承担段数 n', '', 1, 5, 1),
    num('G', 'Load G', '物重 G', 'N', 1, 40, 0.5),
    num('Gp', 'Movable-pulley weight', '动滑轮重', 'N', 0, 20, 0.5),
    num('s', 'Rope-end distance s', '绳端移动 s', 'm', 0, 2, 0.02),
  ],
  compute: (p) => pulley(p),
  readouts: (d) => [
    ro('F', '拉力 F', `${fmt(d.F, 2)} N`),
    ro('h = s/n', 'h = s/n', `${fmt(d.h, 3)} m`),
    ro('η', 'η', d.eta == null ? '—' : fmt(d.eta, 3)),
    ro('Useful', '有用功', `${fmt(d.useful, 2)} J`),
    ro('Extra', '额外功', `${fmt(d.extra, 2)} J`),
  ],
  checks: (d) => [
    q('h', 'When the rope end moves s, the load rises', '绳端移动 s 时，重物上升', [
      opt(`${fmt(d.h, 3)} m`, `${fmt(d.h, 3)} m`),
      opt(`${fmt(d.s, 3)} m`, `${fmt(d.s, 3)} m`),
      opt(`${fmt(d.s * d.n, 3)} m`, `${fmt(d.s * d.n, 3)} m`),
    ], 0),
    q('eta', 'Efficiency η is', '机械效率 η 是', [
      opt(d.eta == null ? '—' : fmt(d.eta, 3), d.eta == null ? '—' : fmt(d.eta, 3)),
      opt('1, because a pulley always saves all the work', '1，因为滑轮把功都省下来了'),
      opt(fmt(d.G / Math.max(d.F, 1e-6), 2), fmt(d.G / Math.max(d.F, 1e-6), 2)),
    ], 0),
  ],
  debug: {
    en: 'Counting the rope-end distance as the load’s rise makes the useful work G s, which is n times too large.',
    zh: '把绳端移动的距离当成重物上升的距离，有用功会变成 G s，大了 n 倍。',
    toggleEn: 'Use s as the load’s rise',
    toggleZh: '把 s 当成重物上升的距离',
  },
  draw(ctx, w, h, _p, d, ui) {
    clear(ctx, w, h);
    const cx = w * 0.34;
    const top = h * 0.22;
    const span = Math.min(70, w * 0.12);
    line(ctx, cx - span, top, cx + span, top, INK, 4);
    const loadY = top + 70 + d.h * 80;
    for (let i = 0; i < d.n; i += 1) {
      const x = cx - span + (2 * span * i) / Math.max(1, d.n - 1);
      line(ctx, x, top, d.n === 1 ? x : cx, loadY, '#8a8175', 2);
    }
    ctx.fillStyle = RAY2;
    ctx.fillRect(cx - 28, loadY, 56, 22);
    text(ctx, lab(ui, 'load', '重物'), cx, loadY + 34, MUTED, 12, 'center');
    const endX = w * 0.72;
    const endY = top + d.s * 90;
    line(ctx, cx + span, top, endX, endY, RAY, 2);
    handle(ctx, endX, endY, ui.drag === 'rope');
    text(ctx, `s=${fmt(d.s, 2)}`, endX + 16, endY, RAY, 12);
    text(ctx, `h=${fmt(d.h, 2)}`, cx, loadY - 16, INK, 12, 'center');
    const barX = w * 0.78;
    const maxJ = Math.max(d.total, 0.5);
    const scale = (h * 0.45) / maxJ;
    const bars = [
      [lab(ui, 'useful', '有用'), d.useful, '#2a6b3a'],
      [lab(ui, 'extra', '额外'), d.extra, '#a33'],
      [lab(ui, 'total', '总功'), d.total, INK],
    ];
    bars.forEach((bar, i) => {
      const x = barX + i * 28;
      ctx.fillStyle = bar[2];
      ctx.fillRect(x, h * 0.72 - bar[1] * scale, 18, bar[1] * scale);
      text(ctx, bar[0], x + 9, h * 0.78, MUTED, 10, 'center');
    });
    if (ui.wrong) text(ctx, `G·s=${fmt(d.G * d.s, 2)}`, w * 0.34, h * 0.9, '#a33', 13, 'center');
    ui._geo = { endX, top };
  },
  pointer(ev, p, _d, ui) {
    const g = ui._geo;
    if (!g) return null;
    if (ev.type === 'down') {
      ui.drag = 'rope';
      return {};
    }
    if (ev.type === 'up') { ui.drag = null; return {}; }
    if (ui.drag !== 'rope') return null;
    return { s: Math.min(2, Math.max(0, (ev.y - g.top) / 90)) };
  },
};

export const workSim = {
  id: 'work',
  timed: false,
  authority: 'Work is W = F s cosθ, with θ between the force and the displacement. Average power is P = W/t.',
  params: { F: 10, s: 2, theta: 60, t: 4 },
  schema: [
    num('F', 'Force F', '力 F', 'N', 0, 40, 0.5),
    num('s', 'Displacement s', '位移 s', 'm', 0, 10, 0.1),
    num('theta', 'Angle θ', '夹角 θ', '°', 0, 180, 1),
    num('t', 'Time t', '时间 t', 's', 0.2, 20, 0.1),
  ],
  compute: (p) => workPower(p),
  readouts: (d) => [
    ro('W', 'W', `${fmt(d.W, 2)} J`),
    ro('P', 'P', `${fmt(d.P, 2)} W`),
    ro('cos θ', 'cos θ', fmt(d.cos, 3)),
  ],
  checks: (d) => [
    q('W', 'The work is', '功是', [
      opt(`${fmt(d.W, 2)} J`, `${fmt(d.W, 2)} J`),
      opt(`${fmt(d.F * d.s, 2)} J`, `${fmt(d.F * d.s, 2)} J`),
      opt(`${fmt(d.F * d.t, 2)} J`, `${fmt(d.F * d.t, 2)} J`),
    ], 0),
    q('P', 'The average power is', '平均功率是', [
      opt(`${fmt(d.P, 2)} W`, `${fmt(d.P, 2)} W`),
      opt(`${fmt(d.W, 2)} W`, `${fmt(d.W, 2)} W`),
    ], 0),
  ],
  debug: {
    en: 'Dropping cosθ counts the whole force even when it is not along the displacement.',
    zh: '去掉 cosθ 之后，力不沿位移方向也会被算进全部的功。',
    toggleEn: 'Drop the cosine',
    toggleZh: '去掉余弦',
  },
  draw(ctx, w, h, _p, d, ui) {
    clear(ctx, w, h);
    const y = h * 0.62;
    const x0 = w * 0.18;
    const px = Math.min(w * 0.55, 80);
    line(ctx, x0, y, x0 + Math.max(d.s, 0.2) * px + 40, y, '#cfc6b8', 2);
    const x = x0 + d.s * px;
    ctx.fillStyle = INK;
    ctx.fillRect(x - 16, y - 28, 32, 28);
    const rad = (d.theta * Math.PI) / 180;
    const len = 30 + d.F * 2;
    arrow(ctx, x, y - 14, x + len * Math.cos(rad), y - 14 - len * Math.sin(rad), RAY, 3);
    text(ctx, `W=${fmt(d.W, 1)} J`, w * 0.5, h * 0.18, INK, 16, 'center');
    if (ui.wrong) text(ctx, `F·s=${fmt(d.F * d.s, 1)}`, w * 0.5, h * 0.28, '#a33', 13, 'center');
    handle(ctx, x, y - 14, ui.drag === 's');
    ui._geo = { x0, y, px };
  },
  pointer(ev, _p, _d, ui) {
    const g = ui._geo;
    if (!g) return null;
    if (ev.type === 'down') { ui.drag = 's'; return {}; }
    if (ev.type === 'up') { ui.drag = null; return {}; }
    return { s: Math.min(10, Math.max(0, (ev.x - g.x0) / g.px)) };
  },
};

