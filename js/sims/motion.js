import { fmt } from '../fmt.js?v=__BUILD__';
import {
  frames, segmentMotion, uniformAccel, vtArea, projectile, energyTrack, circularMotion,
} from '../physics/motion.js?v=__BUILD__';
import { num, sel, tog, clear, line, text, handle, hit, lab, arrow, teachPanel, INK, MUTED, RAY, RAY2 } from './kit.js?v=__BUILD__';

function q(id, en, zh, options, answer) { return { id, en, zh, options, answer }; }
function opt(en, zh) { return { en, zh }; }
function ro(en, zh, value) { return { en, zh, value }; }

const FRAMES = [
  { value: 'ground', en: 'Ground', zh: '地面' },
  { value: 'cart', en: 'Cart', zh: '小车' },
  { value: 'person', en: 'Person', zh: '人' },
];

export const frameSim = {
  id: 'frames',
  timed: true,
  tMax: () => 8,
  authority: 'Velocities are stored in the ground frame. In another frame every velocity has that frame’s ground-velocity subtracted, and every position is measured from that object.',
  params: { frame: 'cart', vCart: 2, vPerson: 0.5, xCart0: 0, xPerson0: 0 },
  schema: [
    sel('frame', 'Reference', '参照物', FRAMES),
    num('vCart', 'Cart speed', '小车速度', 'm/s', -3, 4, 0.1),
    num('vPerson', 'Person speed', '人的速度', 'm/s', -3, 4, 0.1),
  ],
  compute: (p, t) => frames(p, t),
  readouts: (d) => [
    ro('v cart', '小车速度', `${fmt(d.vCartView, 2)} m/s`),
    ro('v person', '人的速度', `${fmt(d.vPersonView, 2)} m/s`),
    ro('x person', '人的位置', `${fmt(d.xPersonView, 2)} m`),
  ],
  checks: (d) => [
    q('v', 'In this frame the person’s velocity is', '在这个参照系里，人的速度是', [
      opt(`${fmt(d.vPersonView, 2)} m/s`, `${fmt(d.vPersonView, 2)} m/s`),
      opt(`${fmt(d.vPerson, 2)} m/s`, `${fmt(d.vPerson, 2)} m/s`),
    ], 0),
    q('rest', 'An object is at rest in a frame when', '一个物体在某参照系中静止，是因为', [
      opt('its velocity in that frame is zero', '它在该参照系中的速度为零'),
      opt('its ground speed is zero', '它相对地面的速度为零'),
    ], 0),
  ],
  debug: {
    en: 'Keeping the ground velocities after the reference object changes describes a different frame from the one on the stage.',
    zh: '换了参照物却仍用相对地面的速度，描述的就不是画面上这个参照系。',
    toggleEn: 'Keep the ground velocities',
    toggleZh: '仍用相对地面的速度',
  },
  draw(ctx, w, h, _p, d, ui) {
    clear(ctx, w, h);
    const y = h * 0.58;
    const origin = w * 0.5;
    const px = 28;
    line(ctx, 20, y, w - 20, y, '#cfc6b8', 2);
    const xc = origin + (ui.wrong ? d.xCart : d.xCartView) * px;
    const xp = origin + (ui.wrong ? d.xPerson : d.xPersonView) * px;
    ctx.fillStyle = RAY2;
    ctx.fillRect(xc - 22, y - 26, 44, 22);
    text(ctx, lab(ui, 'cart', '小车'), xc, y - 40, RAY2, 12, 'center');
    ctx.fillStyle = RAY;
    ctx.beginPath();
    ctx.arc(xp, y - 16, 8, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, lab(ui, 'person', '人'), xp, y + 18, RAY, 12, 'center');
    text(ctx, lab(ui, d.frame === 'ground' ? 'ground' : d.frame === 'cart' ? 'cart frame' : 'person frame', d.frame === 'ground' ? '地面' : d.frame === 'cart' ? '以小车为参照' : '以人为参照'), w * 0.5, h * 0.16, INK, 15, 'center');
  },
};

export const stSim = {
  id: 'st-graph',
  timed: true,
  tMax: () => 8,
  authority: 'Two constant-velocity pieces. The highlighted point is the position at the clock time. Average speed from the start is x/t.',
  params: { v1: 0.4, v2: 1.2, split: 3 },
  schema: [
    num('v1', 'First speed', '前段速度', 'm/s', -1, 3, 0.1),
    num('v2', 'Second speed', '后段速度', 'm/s', -1, 3, 0.1),
    num('split', 'Change at', '换速时刻', 's', 0.5, 7, 0.1),
  ],
  compute: (p, t) => segmentMotion(p, t),
  readouts: (d) => [
    ro('x', 'x', `${fmt(d.x, 2)} m`),
    ro('v', 'v', `${fmt(d.v, 2)} m/s`),
    ro('v average', '平均速度', `${fmt(d.vAvg, 2)} m/s`),
  ],
  checks: (d) => [
    q('x', 'The position at this time is', '这个时刻的位置是', [
      opt(`${fmt(d.x, 2)} m`, `${fmt(d.x, 2)} m`),
      opt(`${fmt(d.v2 * d.t, 2)} m`, `${fmt(d.v2 * d.t, 2)} m`),
    ], 0),
    q('avg', 'Average speed from the start is', '从起点算起的平均速度是', [
      opt(`${fmt(d.vAvg, 2)} m/s`, `${fmt(d.vAvg, 2)} m/s`),
      opt(`${fmt((d.v1 + d.v2) / 2, 2)} m/s`, `${fmt((d.v1 + d.v2) / 2, 2)} m/s`),
    ], 0),
  ],
  debug: {
    en: 'Using the speed of the piece the object is in now, times the whole time, skips the other piece.',
    zh: '用现在这一段的速度乘上全程时间，把另一段的路程漏掉了。',
    toggleEn: 'Use only the current speed',
    toggleZh: '只用当前这一段的速度',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    // Narrow (≤360): shrink the track band so the s–t panel keeps readable height.
    const narrow = w <= 360;
    const yRoad = narrow ? h * 0.14 : h * 0.22;
    const x0 = w * 0.12;
    const px = 36;
    text(ctx, lab(ui, 'track', '轨道'), w * 0.5, narrow ? h * 0.05 : h * 0.08, MUTED, 12, 'center');
    line(ctx, x0, yRoad, w - 24, yRoad, '#cfc6b8', 2);
    const x = x0 + d.x * px;
    ctx.fillStyle = RAY;
    ctx.fillRect(x - 10, yRoad - 18, 20, 16);
    const panelX = w * 0.06;
    const panelY = narrow ? h * 0.26 : h * 0.36;
    const panelW = w * 0.88;
    const panelH = narrow ? h * 0.7 : h * 0.58;
    teachPanel(ctx, panelX, panelY, panelW, panelH, lab(ui, 's–t graph', 's–t 图像'));
    const gx = panelX + panelW * 0.08;
    const gy = panelY + panelH * 0.82;
    const gw = panelW * 0.8;
    const gh = panelH * 0.55;
    line(ctx, gx, gy, gx + gw, gy, INK, 1.2);
    line(ctx, gx, gy, gx, gy - gh, INK, 1.2);
    text(ctx, 't', gx + gw + 8, gy, MUTED, 11);
    text(ctx, 's', gx - 10, gy - gh, MUTED, 11);
    const tMax = 8;
    const xs = [];
    for (let i = 0; i <= 40; i += 1) {
      const tt = (tMax * i) / 40;
      xs.push(segmentMotion(p, tt).x);
    }
    const xMax = Math.max(1, ...xs.map((v) => Math.abs(v)));
    ctx.beginPath();
    xs.forEach((xv, i) => {
      const X = gx + (gw * i) / 40;
      const Y = gy - (xv / xMax) * (gh * 0.8);
      if (i === 0) ctx.moveTo(X, Y);
      else ctx.lineTo(X, Y);
    });
    ctx.strokeStyle = RAY2;
    ctx.lineWidth = 2;
    ctx.stroke();
    const X = gx + (d.t / tMax) * gw;
    const Y = gy - ((ui.wrong ? d.v * d.t : d.x) / xMax) * (gh * 0.8);
    ctx.fillStyle = RAY;
    ctx.beginPath();
    ctx.arc(X, Y, 5, 0, Math.PI * 2);
    ctx.fill();
    handle(ctx, X, Y, ui.drag === 't');
    ui._geo = { gx, gw, tMax };
  },
  pointer(ev, _p, _d, ui) {
    const g = ui._geo;
    if (!g) return null;
    if (ev.type === 'down') { ui.drag = 't'; return {}; }
    if (ev.type === 'up') { ui.drag = null; return {}; }
    const t = Math.min(g.tMax, Math.max(0, ((ev.x - g.gx) / g.gw) * g.tMax));
    return { __clock: t };
  },
};

export const vtSim = {
  id: 'vt-area',
  timed: true,
  tMax: (p) => p.tEnd,
  authority: 'Constant acceleration: v = v0 + a t and x = v0 t + ½ a t². The signed area under v–t from t1 to t2 equals x(t2) − x(t1).',
  params: { v0: 2, a: 1, t1: 1, t2: 3, tEnd: 6 },
  schema: [
    num('v0', 'v0', 'v0', 'm/s', -4, 8, 0.1),
    num('a', 'a', 'a', 'm/s²', -3, 3, 0.1),
    num('t1', 'Interval start', '区间起点', 's', 0, 6, 0.05),
    num('t2', 'Interval end', '区间终点', 's', 0, 6, 0.05),
    num('tEnd', 'Graph length', '图的时长', 's', 2, 8, 0.1),
  ],
  compute(p, t) {
    const motion = uniformAccel(p, Math.min(t, p.tEnd));
    return { ...motion, ...vtArea(p), tEnd: p.tEnd };
  },
  readouts: (d) => [
    ro('v', 'v', `${fmt(d.v, 2)} m/s`),
    ro('x', 'x', `${fmt(d.x, 2)} m`),
    ro('Area t1→t2', 't1 到 t2 的面积', `${fmt(d.area, 2)} m`),
    ro('Δx', 'Δx', `${fmt(d.displacement, 2)} m`),
  ],
  checks: (d) => [
    q('area', 'The signed area from t1 to t2 is', 't1 到 t2 的有向面积是', [
      opt(`${fmt(d.area, 2)} m`, `${fmt(d.area, 2)} m`),
      opt(`${fmt(d.v2 * (d.t2 - d.t1), 2)} m`, `${fmt(d.v2 * (d.t2 - d.t1), 2)} m`),
      opt(`${fmt(d.v, 2)} m`, `${fmt(d.v, 2)} m`),
    ], 0),
    q('eq', 'That area equals', '这块面积等于', [
      opt('the displacement over the same interval', '同一段时间里的位移'),
      opt('the acceleration', '加速度'),
    ], 0),
  ],
  debug: {
    en: 'Using only the final velocity times the duration drops the triangle (or the other end of the trapezium).',
    zh: '只用末速度乘时间，会把梯形另一端的那一块漏掉。',
    toggleEn: 'Use v(t2) × Δt',
    toggleZh: '改用 v(t2)×Δt',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    // Narrow (≤360): shrink the cart band so the v–t panel keeps readable height.
    const narrow = w <= 360;
    const roadY = narrow ? h * 0.12 : h * 0.18;
    const x0 = w * 0.08;
    const span = Math.max(4, Math.abs(uniformAccel(p, d.tEnd).x));
    const cart = x0 + ((d.x + span) / (2 * span)) * (w * 0.84);
    line(ctx, x0, roadY, w - 16, roadY, '#cfc6b8', 2);
    ctx.fillStyle = RAY;
    ctx.fillRect(cart - 12, roadY - 18, 24, 16);
    text(ctx, lab(ui, 'cart', '小车'), cart, roadY - (narrow ? 22 : 28), MUTED, 11, 'center');
    const panelX = w * 0.06;
    const panelY = narrow ? h * 0.24 : h * 0.32;
    const panelW = w * 0.88;
    const panelH = narrow ? h * 0.72 : h * 0.62;
    teachPanel(ctx, panelX, panelY, panelW, panelH, lab(ui, 'v–t graph', 'v–t 图像'));
    const gx = panelX + panelW * 0.08;
    const gy = panelY + panelH * 0.55;
    const gw = panelW * 0.8;
    const gh = panelH * 0.7;
    const vPeak = Math.max(2, Math.abs(d.v0), Math.abs(d.v0 + d.a * d.tEnd));
    const X = (t) => gx + (t / d.tEnd) * gw;
    const Y = (v) => gy - (v / vPeak) * (gh * 0.42);
    line(ctx, gx, gy, gx + gw, gy, INK, 1);
    line(ctx, gx, Y(vPeak), gx, Y(-vPeak), INK, 1);
    text(ctx, 't', gx + gw + 8, gy, MUTED, 11);
    text(ctx, 'v', gx - 10, Y(vPeak), MUTED, 11);
    const t1 = d.t1;
    const t2 = d.t2;
    ctx.beginPath();
    ctx.moveTo(X(t1), Y(0));
    ctx.lineTo(X(t1), Y(d.v1));
    ctx.lineTo(X(t2), Y(d.v2));
    ctx.lineTo(X(t2), Y(0));
    ctx.closePath();
    ctx.fillStyle = 'rgba(196,73,29,0.28)';
    ctx.fill();
    line(ctx, X(0), Y(d.v0), X(d.tEnd), Y(d.v0 + d.a * d.tEnd), RAY2, 2);
    line(ctx, X(d.t), Y(-vPeak), X(d.t), Y(vPeak), RAY, 1);
    handle(ctx, X(t1), Y(d.v1), ui.drag === 't1');
    handle(ctx, X(t2), Y(d.v2), ui.drag === 't2');
    handle(ctx, X(d.t), Y(d.v), ui.drag === 't');
    const wrong = d.v2 * (t2 - t1);
    if (ui.wrong) text(ctx, `v2·Δt=${fmt(wrong, 2)}`, gx + gw * 0.55, panelY + 28, '#a33', 12);
    else text(ctx, `Δx=${fmt(d.displacement, 2)} m`, gx + gw * 0.55, panelY + 28, INK, 12);
    ui._geo = { gx, gw, tEnd: d.tEnd };
  },
  pointer(ev, _p, d, ui) {
    const g = ui._geo;
    if (!g) return null;
    const tOf = (x) => Math.min(g.tEnd, Math.max(0, ((x - g.gx) / g.gw) * g.tEnd));
    if (ev.type === 'down') {
      const xt = g.gx + (d.t / g.tEnd) * g.gw;
      const x1 = g.gx + (d.t1 / g.tEnd) * g.gw;
      const x2 = g.gx + (d.t2 / g.tEnd) * g.gw;
      if (hit(ev.x, ev.y, xt, ev.y, 14)) ui.drag = 't';
      else if (Math.abs(ev.x - x1) < Math.abs(ev.x - x2)) ui.drag = 't1';
      else ui.drag = 't2';
      return {};
    }
    if (ev.type === 'up') { ui.drag = null; return {}; }
    const t = tOf(ev.x);
    if (ui.drag === 't') return { __clock: t };
    if (ui.drag === 't1') return { t1: t };
    if (ui.drag === 't2') return { t2: t };
    return null;
  },
};

export const projectileSim = {
  id: 'projectile',
  timed: true,
  tMax: (p) => projectile(p, 0).tLand,
  authority: 'Horizontal launch, no air resistance. x = v0 t and y = H − ½ g t², with y the height above the floor. Strobes are equal time steps of the same equations.',
  params: { v0: 4, H: 5, g: 10 },
  schema: [
    num('v0', 'Horizontal v0', '水平初速', 'm/s', 0.5, 12, 0.1),
    num('H', 'Release height', '抛出高度', 'm', 0.5, 12, 0.1),
    num('g', 'g', 'g', 'm/s²', 1, 20, 0.1),
  ],
  compute: (p, t) => projectile(p, t),
  readouts: (d) => [
    ro('x', 'x', `${fmt(d.x, 2)} m`),
    ro('y', 'y', `${fmt(d.y, 2)} m`),
    ro('vx', 'vx', `${fmt(d.vx, 2)} m/s`),
    ro('vy', 'vy', `${fmt(d.vy, 2)} m/s`),
    ro('Range', '水平射程', `${fmt(d.range, 2)} m`),
  ],
  checks: (d) => [
    q('x', 'The horizontal displacement at this time is', '这个时刻的水平位移是', [
      opt(`${fmt(d.x, 2)} m`, `${fmt(d.x, 2)} m`),
      opt(`${fmt(d.v0 * d.t - 0.5 * d.g * d.t * d.t, 2)} m`, `${fmt(d.v0 * d.t - 0.5 * d.g * d.t * d.t, 2)} m`),
    ], 0),
    q('y', 'The height is', '高度是', [
      opt(`${fmt(d.y, 2)} m`, `${fmt(d.y, 2)} m`),
      opt(`${fmt(d.H, 2)} m`, `${fmt(d.H, 2)} m`),
    ], 0),
  ],
  debug: {
    en: 'Giving the horizontal motion the same ½gt² as the fall makes x shrink as if gravity pulled sideways.',
    zh: '让水平方向也减去 ½gt²，等于让重力去拉水平位移。',
    toggleEn: 'Subtract ½gt² from x',
    toggleZh: '水平位移也减 ½gt²',
  },
  draw(ctx, w, h, _p, d, ui) {
    clear(ctx, w, h);
    // Wide: left path / right graphs. Narrow (≤360): path on top, graphs below.
    const narrow = w <= 360;
    const ox = w * 0.06;
    const floor = narrow ? h * 0.34 : h * 0.72;
    const pathW = narrow ? w * 0.88 : w * 0.42;
    const px = Math.min(pathW / Math.max(d.range, 0.5), (floor - (narrow ? 28 : 36)) / Math.max(d.H, 0.5));
    text(ctx, lab(ui, 'strobe path', '频闪轨迹'), narrow ? w * 0.5 : ox + pathW * 0.45, h * 0.06, MUTED, 12, 'center');
    line(ctx, ox, floor, ox + d.range * px + 16, floor, '#cfc6b8', 2);
    ctx.beginPath();
    for (let i = 0; i <= 40; i += 1) {
      const tt = (d.tLand * i) / 40;
      const x = ox + d.v0 * tt * px;
      const y = floor - (d.H - 0.5 * d.g * tt * tt) * px;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#cfc6b8';
    ctx.stroke();
    const step = d.tLand / 8;
    for (let tt = 0; tt <= d.tLand + 1e-9; tt += step) {
      const x = ox + d.v0 * tt * px;
      const y = floor - Math.max(0, d.H - 0.5 * d.g * tt * tt) * px;
      ctx.fillStyle = tt <= d.t + 1e-6 ? RAY : '#cfc6b8';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    const xNow = ox + (ui.wrong ? d.v0 * d.t - 0.5 * d.g * d.t * d.t : d.x) * px;
    const yNow = floor - d.y * px;
    ctx.strokeStyle = RAY;
    ctx.strokeRect(xNow - 5, yNow - 5, 10, 10);

    const panelX = narrow ? w * 0.06 : w * 0.52;
    const panelY = narrow ? h * 0.4 : h * 0.1;
    const panelW = narrow ? w * 0.88 : w * 0.44;
    const panelH = narrow ? h * 0.56 : h * 0.82;
    teachPanel(ctx, panelX, panelY, panelW, panelH, lab(ui, 'x–t · y–t', 'x–t · y–t'));
    const graph = (label, x, y, series, color) => {
      const gw = panelW * 0.78;
      const gh = panelH * 0.32;
      line(ctx, x, y + gh, x + gw, y + gh, INK, 1);
      line(ctx, x, y, x, y + gh, INK, 1);
      text(ctx, label, x, y - 8, MUTED, 11);
      const max = Math.max(0.5, ...series.map((v) => Math.abs(v)));
      ctx.beginPath();
      series.forEach((v, i) => {
        const X = x + (gw * i) / (series.length - 1);
        const Y = y + gh - ((v + max) / (2 * max)) * gh * 0.8 - gh * 0.05;
        if (i === 0) ctx.moveTo(X, Y);
        else ctx.lineTo(X, Y);
      });
      ctx.strokeStyle = color;
      ctx.stroke();
      const mark = x + (d.t / Math.max(d.tLand, 1e-6)) * gw;
      line(ctx, mark, y, mark, y + gh, color, 1);
    };
    const xs = [];
    const ys = [];
    for (let i = 0; i <= 20; i += 1) {
      const tt = (d.tLand * i) / 20;
      xs.push(d.v0 * tt);
      ys.push(d.H - 0.5 * d.g * tt * tt);
    }
    const gx = panelX + panelW * 0.1;
    graph('x–t', gx, panelY + panelH * 0.14, xs, RAY);
    graph('y–t', gx, panelY + panelH * 0.55, ys, RAY2);
  },
};

export const energySim = {
  id: 'energy',
  timed: true,
  tMax(p) {
    const d = energyTrack(p, 0);
    if (!d.slides) return 4;
    return Math.min(12, d.tSlope + 3);
  },
  authority: 'Released from rest on an incline of angle α, then onto a horizontal floor. Along the slope a = g sinα − μ g cosα. Mechanical energy is mgh + ½mv². It stays at mgH when μ = 0.',
  params: { m: 1, g: 9.8, H: 1.2, alpha: 30, mu: 0 },
  schema: [
    num('m', 'Mass', '质量', 'kg', 0.2, 5, 0.1),
    num('g', 'g', 'g', 'm/s²', 1, 20, 0.1),
    num('H', 'Release height', '释放高度', 'm', 0.2, 3, 0.05),
    num('alpha', 'Slope angle', '斜面倾角', '°', 15, 60, 1),
    num('mu', 'Friction μ', '摩擦因数 μ', '', 0, 0.6, 0.01),
  ],
  compute: (p, t) => energyTrack(p, t),
  readouts: (d) => [
    ro('KE', '动能', `${fmt(d.KE, 2)} J`),
    ro('PE', '势能', `${fmt(d.PE, 2)} J`),
    ro('E', '机械能', `${fmt(d.E, 2)} J`),
    ro('mgH', 'mgH', `${fmt(d.E0, 2)} J`),
  ],
  checks: (d) => [
    q('E', 'Mechanical energy now is', '现在的机械能是', [
      opt(`${fmt(d.E, 2)} J`, `${fmt(d.E, 2)} J`),
      opt(`${fmt(d.KE, 2)} J`, `${fmt(d.KE, 2)} J`),
      opt(`${fmt(d.E0 + d.KE, 2)} J`, `${fmt(d.E0 + d.KE, 2)} J`),
    ], 0),
    q('cons', 'Compared with mgH', '和 mgH 相比', [
      opt(Math.abs(d.E - d.E0) < 0.02 * Math.max(1, d.E0) ? 'it matches, μ is not taking energy' : 'it is lower, friction has taken energy', Math.abs(d.E - d.E0) < 0.02 * Math.max(1, d.E0) ? '相等，摩擦没有拿走能量' : '更低，摩擦拿走了能量'),
      opt('it is always mgH, even with friction', '即使有摩擦也总是 mgH'),
    ], 0),
  ],
  debug: {
    en: 'Drawing the total as a constant mgH after friction has acted hides the energy that left the mechanical account.',
    zh: '摩擦已经做了负功，仍把总能量画成不变的 mgH，会把离开机械能的那一部分藏起来。',
    toggleEn: 'Hold the total at mgH',
    toggleZh: '把总能量钉在 mgH',
  },
  draw(ctx, w, h, _p, d, ui) {
    clear(ctx, w, h);
    const x0 = w * 0.1;
    const floor = h * 0.62;
    const px = Math.min(80, (floor - 30) / Math.max(d.H, 0.3));
    const Lpx = d.L * px * Math.cos((d.alpha * Math.PI) / 180);
    const Hpx = d.H * px;
    line(ctx, x0, floor - Hpx, x0 + Lpx, floor, INK, 2);
    line(ctx, x0 + Lpx, floor, w * 0.62, floor, INK, 2);
    let cx;
    let cy;
    if (d.onSlope && d.L > 0) {
      const f = d.s / d.L;
      cx = x0 + f * Lpx;
      cy = floor - Hpx + f * Hpx;
    } else {
      cx = x0 + Lpx + (d.s - d.L) * px * 0.35;
      cy = floor;
    }
    ctx.fillStyle = RAY;
    ctx.beginPath();
    ctx.arc(cx, cy - 8, 8, 0, Math.PI * 2);
    ctx.fill();
    const base = h * 0.9;
    const scale = (h * 0.22) / Math.max(d.E0, d.E, 0.5);
    const shownE = ui.wrong ? d.E0 : d.E;
    const bars = [[lab(ui, 'KE', '动能'), d.KE, RAY], [lab(ui, 'PE', '势能'), d.PE, RAY2]];
    bars.forEach((bar, i) => {
      const x = w * 0.72 + i * 36;
      ctx.fillStyle = bar[2];
      ctx.fillRect(x, base - bar[1] * scale, 24, bar[1] * scale);
      text(ctx, bar[0], x + 12, base + 12, MUTED, 11, 'center');
    });
    const yE = base - shownE * scale;
    line(ctx, w * 0.68, yE, w * 0.92, yE, INK, 1.5, [4, 3]);
    text(ctx, lab(ui, 'E', '总能量'), w * 0.93, yE, INK, 11);
  },
};

export const circularSim = {
  id: 'circular',
  timed: true,
  tMax: (p) => Math.max(4, (4 * Math.PI) / Math.max(Math.abs(p.omega), 0.2)),
  authority: 'Uniform circular motion: v = ω r, a = v² / r = ω² r, and the rope (or rod) force toward the centre is F = m a.',
  params: { m: 0.5, r: 0.4, omega: 4 },
  schema: [
    num('m', 'Mass m', '质量 m', 'kg', 0.1, 2, 0.05),
    num('r', 'Radius r', '半径 r', 'm', 0.1, 1, 0.02),
    num('omega', 'Angular speed ω', '角速度 ω', 'rad/s', 0.5, 10, 0.1),
  ],
  compute: (p, t) => circularMotion(p, t),
  readouts: (d) => [
    ro('v', 'v', `${fmt(d.v, 2)} m/s`),
    ro('a', 'a', `${fmt(d.a, 2)} m/s²`),
    ro('F', 'F', `${fmt(d.F, 2)} N`),
    ro('T', 'T', `${fmt(d.T, 2)} s`),
  ],
  checks: (d) => [
    q('v', 'The linear speed is', '线速度是', [
      opt(`${fmt(d.v, 2)} m/s = ω r`, `${fmt(d.v, 2)} m/s = ω r`),
      opt(`${fmt(d.omega / d.r, 2)} m/s`, `${fmt(d.omega / d.r, 2)} m/s`),
      opt('zero because the path is closed', '为零，因为路径闭合'),
    ], 0),
    q('F', 'The centripetal force is', '向心力是', [
      opt(`${fmt(d.F, 2)} N = m v² / r`, `${fmt(d.F, 2)} N = m v² / r`),
      opt(`${fmt(d.m * d.v, 2)} N`, `${fmt(d.m * d.v, 2)} N`),
      opt('outward along the radius', '沿半径向外'),
    ], 0),
  ],
  debug: {
    en: 'Drawing the force outward treats the need for a centripetal force as a centrifugal push.',
    zh: '把力画成向外，就变成了离心推开，而不是向心力。',
    toggleEn: 'Draw F outward',
    toggleZh: '把 F 画成向外',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    const cx = w * 0.42;
    const cy = h * 0.52;
    const scale = Math.min(w, h) * 0.32 / Math.max(d.r, 0.2);
    const R = d.r * scale;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.strokeStyle = MUTED;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
    const px = cx + d.x * scale;
    const py = cy - d.y * scale;
    line(ctx, cx, cy, px, py, INK, 2);
    ctx.fillStyle = RAY;
    ctx.beginPath();
    ctx.arc(px, py, 8, 0, Math.PI * 2);
    ctx.fill();
    const tx = -Math.sin(d.theta);
    const ty = -Math.cos(d.theta);
    arrow(ctx, px, py, px + tx * 36, py + ty * 36, RAY2, 2);
    text(ctx, 'v', px + tx * 44, py + ty * 44, RAY2, 12, 'center');
    const inward = ui.wrong ? -1 : 1;
    const fx = cx + (px - cx) * (1 - 0.35 * inward);
    const fy = cy + (py - cy) * (1 - 0.35 * inward);
    arrow(ctx, px, py, fx, fy, ui.wrong ? '#a33' : RAY, 2.5);
    text(ctx, 'F', fx, fy - 12, ui.wrong ? '#a33' : RAY, 12, 'center');
    text(ctx, `v=${fmt(d.v, 2)} m/s`, w * 0.78, h * 0.3, INK, 13);
    text(ctx, `a=${fmt(d.a, 2)} m/s²`, w * 0.78, h * 0.4, MUTED, 13);
    text(ctx, `F=${fmt(d.F, 2)} N`, w * 0.78, h * 0.5, RAY, 13);
    const rs = w * 0.78;
    handle(ctx, rs, h * 0.7, ui.drag === 'r');
    text(ctx, lab(ui, 'drag r', '拖半径'), rs, h * 0.78, MUTED, 11, 'center');
    ui._geo = { rs, hy: h * 0.7 };
  },
  pointer(ev, p, _d, ui) {
    const g = ui._geo;
    if (!g) return null;
    if (ev.type === 'down' && hit(ev.x, ev.y, g.rs, g.hy, 20)) {
      ui.drag = 'r';
      return {};
    }
    if (ev.type === 'move' && ui.drag === 'r') {
      const r = Math.min(1, Math.max(0.1, 0.1 + ((g.hy - ev.y) / 120)));
      return { r };
    }
    if (ev.type === 'up') {
      ui.drag = null;
      return {};
    }
    return null;
  },
};

