import { fmt } from '../fmt.js';
import { forceElements, hooke, weight, collinearResultant, twoForce, friction, inertiaCart } from '../physics/mech.js';
import { num, tog, clear, line, arrow, text, handle, hit, lab, INK, MUTED, RAY, RAY2 } from './kit.js';

function q(id, en, zh, options, answer) { return { id, en, zh, options, answer }; }
function opt(en, zh) { return { en, zh }; }
function ro(en, zh, value) { return { en, zh, value }; }

export const forceSim = {
  id: 'force-elements',
  timed: false,
  authority: 'The moment about the bar centre is τ = s F sinθ, from τ = r × F. Same magnitude and direction with a different point of application changes τ.',
  params: { F: 8, theta: 60, s: 0.4 },
  schema: [
    num('F', 'Magnitude F', '大小 F', 'N', 0, 20, 0.5),
    num('theta', 'Direction θ from the bar', '方向 θ（相对杆）', '°', -180, 180, 1),
    num('s', 'Point along the bar s', '作用点 s', 'm', -1, 1, 0.05),
  ],
  compute: (p) => forceElements(p),
  readouts: (d) => [
    ro('F', 'F', `${fmt(d.F, 2)} N`),
    ro('θ', 'θ', `${fmt(d.theta, 1)}°`),
    ro('τ about centre', '对中心的力矩', `${fmt(d.tau, 2)} N·m`),
  ],
  checks: (d) => [
    q('tau', 'The moment about the centre is', '对中心的力矩是', [
      opt(`${fmt(d.tau, 2)} N·m`, `${fmt(d.tau, 2)} N·m`),
      opt(`${fmt(d.F, 2)} N·m`, `${fmt(d.F, 2)} N·m`),
      opt('0, because only magnitude matters', '0，因为只看大小'),
    ], 0),
    q('three', 'Changing only the point of application can change', '只改作用点，可以改变', [
      opt('the moment', '力矩'), opt('nothing at all', '任何效果都不变'),
    ], 0),
  ],
  debug: {
    en: 'Treating the force as if it acted at the centre (s = 0) drops the moment to zero even when the arrow is drawn off centre.',
    zh: '把力当成作用在中心（s = 0），力矩会变成 0，哪怕箭头画在杆的一侧。',
    toggleEn: 'Move the line of action through the centre',
    toggleZh: '把作用线改画过中心',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    const midX = w * 0.5;
    const midY = h * 0.58;
    const px = Math.min(w, h) * 0.28;
    line(ctx, midX - px, midY, midX + px, midY, INK, 6);
    const sx = midX + d.s * px;
    const rad = (d.theta * Math.PI) / 180;
    const len = 18 + d.F * 6;
    const x2 = sx + len * Math.cos(rad);
    const y2 = midY - len * Math.sin(rad);
    arrow(ctx, sx, midY, x2, y2, RAY, 3);
    if (ui.wrong) arrow(ctx, midX, midY, midX + len * Math.cos(rad), midY - len * Math.sin(rad), '#a33', 2);
    text(ctx, lab(ui, 'centre', '中心'), midX, midY + 22, MUTED, 12, 'center');
    handle(ctx, sx, midY, ui.drag === 'tail');
    handle(ctx, x2, y2, ui.drag === 'tip');
    ui._geo = { midX, midY, px, sx, x2, y2 };
  },
  pointer(ev, p, _d, ui) {
    const g = ui._geo;
    if (!g) return null;
    if (ev.type === 'down') {
      if (hit(ev.x, ev.y, g.x2, g.y2)) { ui.drag = 'tip'; return {}; }
      if (hit(ev.x, ev.y, g.sx, g.midY)) { ui.drag = 'tail'; return {}; }
      return null;
    }
    if (ev.type === 'up') { ui.drag = null; return {}; }
    if (ev.type === 'move' && ui.drag === 'tail') {
      return { s: Math.min(1, Math.max(-1, (ev.x - g.midX) / g.px)) };
    }
    if (ev.type === 'move' && ui.drag === 'tip') {
      const ang = Math.atan2(g.midY - ev.y, ev.x - g.sx);
      const len = Math.hypot(ev.x - g.sx, ev.y - g.midY);
      return { theta: (ang * 180) / Math.PI, F: Math.min(20, Math.max(0, (len - 18) / 6)) };
    }
    return null;
  },
};

export const springScale = {
  id: 'spring-scale',
  timed: false,
  authority: 'Hooke\'s law F = kx for extension x at or below the stated elastic limit. Past that limit this model returns no force.',
  params: { k: 200, x: 0.04, xMax: 0.1 },
  schema: [
    num('k', 'Spring constant k', '劲度 k', 'N/m', 20, 800, 10),
    num('x', 'Extension x', '伸长 x', 'm', 0, 0.2, 0.005),
    num('xMax', 'Elastic limit', '弹性限度', 'm', 0.02, 0.2, 0.005),
  ],
  compute: (p) => hooke(p),
  readouts: (d) => [
    ro('F', 'F', d.inRange ? `${fmt(d.F, 2)} N` : '—'),
    ro('kx', 'kx', d.inRange ? `${fmt(d.k, 0)} × ${fmt(d.x, 3)}` : 'outside the elastic range'),
  ],
  checks: (d) => [
    q('hooke', 'Inside the elastic range, the scale reads', '在弹性限度内，示数是', [
      opt(d.inRange ? `${fmt(d.F, 2)} N` : 'no Hooke value', d.inRange ? `${fmt(d.F, 2)} N` : '胡克定律不给出力'),
      opt(d.inRange ? `${fmt(d.k * d.x * d.x, 2)} N` : `${fmt(d.k * d.xMax, 2)} N`, d.inRange ? `${fmt(d.k * d.x * d.x, 2)} N` : `${fmt(d.k * d.xMax, 2)} N`),
    ], 0),
    q('limit', 'Past the elastic limit, this model', '超过弹性限度后，这个模型', [
      opt('stops using F = kx', '不再使用 F = kx'),
      opt('keeps using F = kx', '仍使用 F = kx'),
    ], 0),
  ],
  debug: {
    en: 'Continuing F = kx past the elastic limit is outside the law. The scale window shows a value only while x ≤ xMax.',
    zh: '超过弹性限度仍用 F = kx，已经超出胡克定律。刻度只在 x ≤ xMax 时给出读数。',
    toggleEn: 'Print the extrapolated kx anyway',
    toggleZh: '仍标出外推的 kx',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    const x0 = w * 0.28;
    const y0 = h * 0.22;
    const rest = h * 0.34;
    const stretch = (d.x / 0.2) * h * 0.4;
    const coils = 8;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    for (let i = 0; i <= coils; i += 1) {
      const y = y0 + ((rest + stretch) * i) / coils;
      const x = x0 + (i % 2 === 0 ? -16 : 16);
      ctx.lineTo(x, y);
    }
    ctx.stroke();
    const yEnd = y0 + rest + stretch;
    line(ctx, x0, yEnd, x0, yEnd + 28, INK, 2);
    ctx.beginPath();
    ctx.arc(x0, yEnd + 40, 12, 0, Math.PI * 2);
    ctx.stroke();
    const dialX = w * 0.68;
    ctx.strokeStyle = INK;
    ctx.strokeRect(dialX, h * 0.28, 90, h * 0.4);
    const frac = d.inRange ? d.x / Math.max(d.xMax, 1e-6) : 1;
    const needle = h * 0.28 + 16 + frac * (h * 0.4 - 32);
    line(ctx, dialX + 8, needle, dialX + 82, needle, RAY, 3);
    text(ctx, d.inRange ? `${fmt(d.F, 2)} N` : '—', dialX + 45, h * 0.24, INK, 16, 'center');
    if (ui.wrong && !d.inRange) {
      text(ctx, `kx=${fmt(d.k * d.x, 1)}`, dialX + 45, h * 0.74, '#a33', 13, 'center');
    }
    handle(ctx, x0, yEnd + 40, ui.drag === 'hook');
    ui._geo = { x0, y0, rest, yEnd, pxPerM: (h * 0.4) / 0.2 };
  },
  pointer(ev, _p, _d, ui) {
    const g = ui._geo;
    if (!g) return null;
    if (ev.type === 'down') {
      if (hit(ev.x, ev.y, g.x0, g.yEnd + 40, 18)) { ui.drag = 'hook'; return {}; }
      return null;
    }
    if (ev.type === 'up') { ui.drag = null; return {}; }
    if (ev.type === 'move' && ui.drag === 'hook') {
      const x = (ev.y - (g.y0 + g.rest)) / g.pxPerM;
      return { x: Math.min(0.2, Math.max(0, x)) };
    }
    return null;
  },
};

export const gravitySim = {
  id: 'gravity',
  timed: false,
  authority: 'Weight G = mg. g is the local gravitational field: Earth 9.80, Moon 1.62, Mars 3.71 m/s² are the conventional surface values used in class.',
  params: { m: 2, g: 9.8 },
  schema: [
    num('m', 'Mass m', '质量 m', 'kg', 0.1, 20, 0.1),
    num('g', 'g', 'g', 'm/s²', 0.5, 25, 0.01),
  ],
  compute: (p) => weight(p),
  readouts: (d) => [
    ro('G', 'G', `${fmt(d.G, 2)} N`),
    ro('g', 'g', `${fmt(d.g, 2)} m/s²`),
  ],
  checks: (d) => [
    q('g', 'G equals', 'G 等于', [
      opt(`${fmt(d.G, 2)} N`, `${fmt(d.G, 2)} N`),
      opt(`${fmt(d.m, 2)} N`, `${fmt(d.m, 2)} N`),
      opt(`${fmt(d.m * d.g * d.g, 2)} N`, `${fmt(d.m * d.g * d.g, 2)} N`),
    ], 0),
    q('mass', 'Moving the same mass to a smaller g', '同一质量换到更小的 g', [
      opt('decreases G and leaves m unchanged', 'G 变小，m 不变'),
      opt('decreases m', 'm 变小'),
    ], 0),
  ],
  debug: {
    en: 'Reading the mass number as the weight in newtons drops g out of G = mg.',
    zh: '把质量的数字直接当成重力的牛顿数，等于把 G = mg 里的 g 丢掉了。',
    toggleEn: 'Label m as if it were G',
    toggleZh: '把 m 的数字标成 G',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    const x = w * 0.42;
    const y = h * 0.42;
    ctx.fillStyle = '#d7d0c4';
    ctx.fillRect(x - 36, y - 28, 72, 56);
    ctx.strokeStyle = INK;
    ctx.strokeRect(x - 36, y - 28, 72, 56);
    const len = Math.min(h * 0.28, 16 + d.G * 2.2);
    arrow(ctx, x, y + 28, x, y + 28 + len, RAY, 3);
    text(ctx, `${fmt(d.G, 2)} N`, x + 16, y + 28 + len, RAY, 13);
    text(ctx, ui.wrong ? `G? ${fmt(d.m, 2)}` : `${fmt(d.m, 2)} kg`, x, y, INK, 14, 'center');
    text(ctx, `g = ${fmt(d.g, 2)}`, x, y + 28 + len + 22, MUTED, 12, 'center');
  },
  pointer() { return null; },
};

export const composeSim = {
  id: 'force-compose',
  timed: false,
  authority: 'Collinear signed sum. Right is positive. Fnet = F1 + F2.',
  params: { F1: 6, F2: -4 },
  schema: [
    num('F1', 'F1 (right positive)', 'F1（向右为正）', 'N', -20, 20, 0.5),
    num('F2', 'F2 (right positive)', 'F2（向右为正）', 'N', -20, 20, 0.5),
  ],
  compute: (p) => collinearResultant(p),
  readouts: (d) => [
    ro('F1 + F2', 'F1 + F2', `${fmt(d.Fnet, 2)} N`),
  ],
  checks: (d) => [
    q('net', 'The resultant is', '合力是', [
      opt(`${fmt(d.Fnet, 2)} N`, `${fmt(d.Fnet, 2)} N`),
      opt(`${fmt(Math.abs(d.F1) + Math.abs(d.F2), 2)} N`, `${fmt(Math.abs(d.F1) + Math.abs(d.F2), 2)} N`),
      opt(`${fmt(d.F1 - d.F2, 2)} N`, `${fmt(d.F1 - d.F2, 2)} N`),
    ], 0),
  ],
  debug: {
    en: 'Adding the absolute values always increases the resultant, which is wrong when the forces are opposite.',
    zh: '把两个力的绝对值相加，方向相反时会把合力算大。',
    toggleEn: 'Mark |F1| + |F2|',
    toggleZh: '标出 |F1| + |F2|',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    const y = h * 0.48;
    const x = w * 0.35;
    const scale = 8;
    arrow(ctx, x, y - 28, x + d.F1 * scale, y - 28, RAY, 3);
    arrow(ctx, x, y, x + d.F2 * scale, y, RAY2, 3);
    arrow(ctx, x, y + 36, x + d.Fnet * scale, y + 36, INK, 3);
    text(ctx, 'F1', x - 28, y - 28, RAY, 12);
    text(ctx, 'F2', x - 28, y, RAY2, 12);
    text(ctx, 'Fnet', x - 40, y + 36, INK, 12);
    if (ui.wrong) {
      text(ctx, `|F1|+|F2|=${fmt(Math.abs(d.F1) + Math.abs(d.F2), 1)}`, x, y + 64, '#a33', 13);
    }
  },
  pointer() { return null; },
};

export const balanceSim = {
  id: 'two-force',
  timed: true,
  authority: 'Two-force equilibrium on one body: equal magnitude, opposite direction, same line. If the forces act on two bodies, they are an interaction pair and this 1D equilibrium test does not apply. When it does, a = Fnet/m.',
  params: { F1: 6, F2: -6, m: 2, sameBody: true, collinear: true },
  schema: [
    num('F1', 'F1 (right positive)', 'F1（向右为正）', 'N', -20, 20, 0.5),
    num('F2', 'F2 (right positive)', 'F2（向右为正）', 'N', -20, 20, 0.5),
    num('m', 'Mass m', '质量 m', 'kg', 0.2, 10, 0.1),
    tog('sameBody', 'Same body', '作用在同一物体'),
    tog('collinear', 'Same line', '同一直线'),
  ],
  compute: (p, t) => twoForce(p, t),
  readouts: (d) => [
    ro('Balanced', '平衡', d.balanced ? { en: 'yes', zh: '是' } : { en: 'no', zh: '否' }),
    ro('Fnet', '合力', d.Fnet == null ? '—' : `${fmt(d.Fnet, 2)} N`),
    ro('a', 'a', d.a == null ? '—' : `${fmt(d.a, 2)} m/s²`),
    ro('Case', '情形', {
      en: d.reason,
      zh: { equilibrium: '平衡', unbalanced: '不平衡', 'two-bodies': '两个物体', 'not-collinear': '不共线' }[d.reason] || d.reason,
    }),
  ],
  checks: (d) => [
    q('bal', 'The body is in two-force equilibrium', '物体处于二力平衡', [
      opt(d.balanced ? 'yes' : 'no', d.balanced ? '是' : '否'),
      opt(d.balanced ? 'no' : 'yes', d.balanced ? '否' : '是'),
    ], 0),
    q('why', 'Equilibrium here requires', '这里的平衡要求', [
      opt('one body, equal, opposite, collinear', '同一物体、等大、反向、共线'),
      opt('any action-reaction pair', '任意一对相互作用力'),
    ], 0),
  ],
  debug: {
    en: 'An action-reaction pair acts on two bodies. Those two arrows are not the two forces in the equilibrium condition.',
    zh: '作用力和反作用力作用在两个物体上。那一对箭头不是二力平衡里的两个力。',
    toggleEn: 'Split the forces onto two bodies',
    toggleZh: '把两个力分到两个物体上',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    const split = ui.wrong || !p.sameBody;
    const y1 = split ? h * 0.38 : h * 0.5;
    const y2 = split ? h * 0.68 : h * 0.5;
    const x = w * 0.5 + (d.x || 0) * 40;
    const box = (y, label) => {
      ctx.fillStyle = '#e7e0d4';
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2;
      ctx.fillRect(x - 40, y - 24, 80, 48);
      ctx.strokeRect(x - 40, y - 24, 80, 48);
      text(ctx, label, x, y, INK, 13, 'center');
    };
    box(y1, split ? 'A' : 'body');
    if (split) box(y2, 'B');
    const s = 7;
    arrow(ctx, x - 40, y1, x - 40 + p.F1 * s, y1, RAY, 3);
    arrow(ctx, x + 40, y2, x + 40 + p.F2 * s, y2, RAY2, 3);
    if (!p.collinear && !split) {
      line(ctx, x - 70, y1 - 36, x + 70, y1 - 36, MUTED, 1, [4, 3]);
      text(ctx, lab(ui, 'offset', '错开'), x, y1 - 48, MUTED, 12, 'center');
    }
    const reasonZh = { equilibrium: '平衡', unbalanced: '不平衡', 'two-bodies': '两个物体', 'not-collinear': '不共线' };
    text(ctx, lab(ui, d.balanced ? 'equilibrium' : d.reason, d.balanced ? '平衡' : (reasonZh[d.reason] || d.reason)), w * 0.5, h * 0.16, INK, 14, 'center');
  },
  pointer() { return null; },
};

export const frictionSim = {
  id: 'friction',
  timed: true,
  authority: 'Horizontal surface, N = mg. Static friction matches the applied force up to μs N; kinetic friction is μk N opposite the applied force. Contact area does not enter.',
  params: { F: 4, m: 2, g: 9.8, muS: 0.4, muK: 0.3, area: 0.04 },
  schema: [
    num('F', 'Applied force F', '拉力 F', 'N', -20, 20, 0.5),
    num('m', 'Mass m', '质量 m', 'kg', 0.2, 10, 0.1),
    num('g', 'g', 'g', 'm/s²', 1, 20, 0.1),
    num('muS', 'μs', 'μs', '', 0, 1.2, 0.01),
    num('muK', 'μk', 'μk', '', 0, 1.2, 0.01),
    num('area', 'Contact area (drawing)', '接触面积（只影响图）', 'm²', 0.01, 0.12, 0.005),
  ],
  compute: (p, t) => friction(p, t),
  readouts: (d, p) => [
    ro('N', 'N', `${fmt(d.N, 2)} N`),
    ro('Friction', '摩擦力', `${fmt(d.friction, 2)} N`),
    ro('Regime', '状态', d.regime === 'static' ? { en: 'static', zh: '静止' } : { en: 'kinetic', zh: '滑动' }),
    ro('a', 'a', `${fmt(d.a, 2)} m/s²`),
    ro('Area used in f?', '面积进入摩擦力公式？', { en: 'no', zh: '否' }),
    ro('Patch pressure N/A', '接触面压强 N/A', `${fmt(d.N / Math.max(p.area, 1e-9), 1)} Pa`),
  ],
  checks: (d) => [
    q('reg', 'The block is', '木块现在是', [
      opt(d.regime === 'static' ? 'at rest (static friction)' : 'sliding (kinetic friction)', d.regime === 'static' ? '静止（静摩擦）' : '滑动（滑动摩擦）'),
      opt(d.regime === 'static' ? 'sliding' : 'at rest', d.regime === 'static' ? '滑动' : '静止'),
    ], 0),
    q('area', 'In this model, doubling the contact area', '在这个模型里，接触面积加倍', [
      opt('does not change f', '不改变摩擦力'),
      opt('doubles f', '摩擦力加倍'),
    ], 0),
  ],
  debug: {
    en: 'Letting f grow with contact area contradicts the Coulomb model used in this section. The patch colour is N/A; f is still μN or the static match.',
    zh: '让摩擦力随接触面积变大，和本节用的库仑摩擦模型不一致。色块表示的是 N/A；摩擦力仍由 μN 或静摩擦平衡决定。',
    toggleEn: 'Annotate an area-proportional f',
    toggleZh: '标出按面积成比例的错误摩擦力',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    const ground = h * 0.72;
    line(ctx, 16, ground, w - 16, ground, INK, 2);
    const bw = 40 + p.area * 400;
    const x = w * 0.45 + d.x * 30;
    ctx.fillStyle = '#ddd4c6';
    ctx.fillRect(x - bw / 2, ground - 36, bw, 36);
    ctx.strokeStyle = INK;
    ctx.strokeRect(x - bw / 2, ground - 36, bw, 36);
    const pressure = d.N / Math.max(p.area, 1e-9);
    ctx.fillStyle = `rgba(196, 73, 29, ${Math.min(0.55, pressure / 2000)})`;
    ctx.fillRect(x - bw / 2, ground - 6, bw, 6);
    arrow(ctx, x + bw / 2, ground - 18, x + bw / 2 + p.F * 6, ground - 18, RAY, 3);
    arrow(ctx, x - bw / 2, ground - 18, x - bw / 2 + d.friction * 6, ground - 18, RAY2, 3);
    if (ui.wrong) {
      text(ctx, `f∝A → ${fmt(d.friction * (p.area / 0.04), 1)}`, x, ground - 52, '#a33', 12, 'center');
    }
    text(ctx, lab(ui, d.regime, d.regime === 'static' ? '静止' : '滑动'), x, ground + 18, MUTED, 12, 'center');
  },
  pointer() { return null; },
};

export const inertiaSim = {
  id: 'inertia',
  timed: true,
  authority: 'Before the stopper, cart and block share v0 (no horizontal force in this idealisation). At xStop the cart velocity becomes 0. The block then has a = −μg from kinetic friction with the cart. μ = 0 keeps the block at constant velocity.',
  params: { v0: 1.2, mu: 0.15, g: 9.8, xStop: 1.0 },
  schema: [
    num('v0', 'Initial speed v0', '初速度 v0', 'm/s', 0, 3, 0.05),
    num('mu', 'Block–cart μ', '木块与小车间 μ', '', 0, 0.8, 0.01),
    num('g', 'g', 'g', 'm/s²', 1, 20, 0.1),
    num('xStop', 'Stopper position', '挡板位置', 'm', 0.2, 2.5, 0.05),
  ],
  compute: (p, t) => inertiaCart(p, t),
  readouts: (d) => [
    ro('Cart x', '小车 x', `${fmt(d.xCart, 2)} m`),
    ro('Block x', '木块 x', `${fmt(d.xBlock, 2)} m`),
    ro('Block v', '木块 v', `${fmt(d.vBlock, 2)} m/s`),
    ro('Phase', '阶段', d.phase),
  ],
  checks: (d, p) => [
    q('go', 'When the cart hits the stopper, the block', '小车碰到挡板时，木块', [
      opt('keeps moving forward', '继续向前运动'),
      opt('stops with the cart for any μ', '无论 μ 多大，都和小车一起停'),
    ], 0),
    q('mu', 'With μ = 0 after the stop, the block', '挡板之后若 μ = 0，木块', [
      opt('moves at constant v0', '以 v0 匀速运动'),
      opt('stops at once', '立刻停下'),
    ], p.mu === 0 || d.phase !== 'together' ? 0 : 0),
  ],
  debug: {
    en: 'The Aristotelian slip is to stop the block with the cart even when nothing horizontal acts on the block.',
    zh: '常见的亚里士多德式错法，是小车一停，木块也跟着停，即使水平方向没有力作用在木块上。',
    toggleEn: 'Glue the block to the cart',
    toggleZh: '把木块画成粘在小车上',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    const ground = h * 0.68;
    const scale = (w - 80) / Math.max(p.xStop + 1.4, 2);
    const xOf = (xm) => 40 + xm * scale;
    line(ctx, 24, ground, w - 24, ground, INK, 2);
    const stopX = xOf(p.xStop);
    line(ctx, stopX, ground - 48, stopX, ground, RAY, 3);
    const cartX = xOf(d.xCart);
    const blockX = xOf(ui.wrong ? d.xCart : d.xBlock);
    ctx.fillStyle = '#cfc6b8';
    ctx.fillRect(cartX - 28, ground - 18, 56, 18);
    ctx.strokeStyle = INK;
    ctx.strokeRect(cartX - 28, ground - 18, 56, 18);
    ctx.fillStyle = '#e7d2b8';
    ctx.fillRect(blockX - 14, ground - 40, 28, 22);
    ctx.strokeRect(blockX - 14, ground - 40, 28, 22);
    text(ctx, lab(ui, 'stopper', '挡板'), stopX, ground - 58, RAY, 11, 'center');
    const phaseZh = { rest: '静止', together: '一起运动', sliding: '滑行', stopped: '停下' };
    text(ctx, lab(ui, d.phase, phaseZh[d.phase] || d.phase), w * 0.5, h * 0.2, INK, 14, 'center');
  },
  pointer() { return null; },
};
