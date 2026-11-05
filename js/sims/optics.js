import { fmt } from '../fmt.js';
import { pinholeImage, reflectionLaw, planeMirrorImage, snell, thinLens, lensScreen, spectacle } from '../physics/optics.js';
import { num, sel, clear, line, arrow, text, handle, hit, lab, INK, MUTED, RAY, RAY2 } from './kit.js';

function q(id, en, zh, options, answer) {
  return { id, en, zh, options, answer };
}
function opt(en, zh) { return { en, zh }; }
function ro(en, zh, value) { return { en, zh, value }; }

function pinholeGeom(w, h) {
  return { y0: h * 0.22, y1: h * 0.78, holeX: w * 0.48, mid: h * 0.5 };
}

export const pinhole = {
  id: 'pinhole',
  timed: false,
  authority: 'Similar triangles for a rectilinear pinhole. Spot diameter d(u+v)/u is the geometric penumbra of a finite hole. Diffraction is outside this model.',
  params: { H: 8, u: 20, v: 15, d: 0.4 },
  schema: [
    num('H', 'Object height H', '物高 H', 'cm', 1, 20, 0.5),
    num('u', 'Object distance u', '物距 u', 'cm', 5, 60, 0.5),
    num('v', 'Screen distance v', '屏距 v', 'cm', 5, 60, 0.5),
    num('d', 'Hole diameter d', '孔径 d', 'cm', 0.05, 3, 0.05),
  ],
  compute: (p) => pinholeImage(p),
  readouts: (d) => [
    ro('Image height', '像高', `${fmt(d.hImg, 2)} cm`),
    ro('Orientation', '像的正倒', 'inverted'),
    ro('Spot from one point', '物点光斑', `${fmt(d.spot, 2)} cm`),
  ],
  checks: (d) => [
    q('orient', 'The image on the screen is', '光屏上的像是', [
      opt('inverted', '倒立的'), opt('erect', '正立的'),
    ], 0),
    q('size', 'Image height equals', '像高等于', [
      opt('H · v / u', 'H · v / u'), opt('H · u / v', 'H · u / v'), opt('H · d', 'H · d'),
    ], 0),
    q('hole', 'A larger hole, with u and v fixed, makes the spot', 'u、v 不变时，孔径变大，物点光斑', [
      opt('larger', '变大'), opt('smaller', '变小'), opt('unchanged', '不变'),
    ], 0),
  ],
  debug: {
    en: 'A common slip is to write h = H · u / v, swapping the two distances. The overlay keeps the similar-triangle result h = H · v / u.',
    zh: '常见错误是把像高写成 H·u/v，把物距和屏距写反。图上仍是相似三角形的结果 h = H·v/u。',
    toggleEn: 'Show the swapped-ratio mark',
    toggleZh: '标出写反后的错误像高',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    const g = pinholeGeom(w, h);
    const px = Math.min((g.holeX - 28) / Math.max(p.u, 1), (w - 28 - g.holeX) / Math.max(p.v, 1));
    const objX = g.holeX - p.u * px;
    const scrX = g.holeX + p.v * px;
    const objH = p.H * px;
    const imgH = d.hImg * px;
    line(ctx, 24, g.mid, w - 24, g.mid, '#d9d2c5', 1);
    line(ctx, g.holeX, g.y0, g.holeX, g.mid - 8, INK, 3);
    line(ctx, g.holeX, g.mid + 8, g.holeX, g.y1, INK, 3);
    line(ctx, scrX, g.y0, scrX, g.y1, MUTED, 2);
    arrow(ctx, objX, g.mid, objX, g.mid - objH, RAY, 3);
    arrow(ctx, scrX, g.mid, scrX, g.mid + imgH, RAY2, 3);
    line(ctx, objX, g.mid - objH, g.holeX, g.mid, RAY, 1);
    line(ctx, g.holeX, g.mid, scrX, g.mid + imgH, RAY2, 1);
    if (ui.wrong) {
      const bad = (p.H * p.u / p.v) * px;
      line(ctx, scrX + 14, g.mid, scrX + 14, g.mid + bad, '#a33', 2, [4, 3]);
      text(ctx, 'H·u/v', scrX + 18, g.mid + bad + 12, '#a33', 11);
    }
    text(ctx, lab(ui, 'object', '物体'), objX, g.mid + 16, MUTED, 11, 'center');
    text(ctx, lab(ui, 'screen', '光屏'), scrX, g.y0 - 10, MUTED, 11, 'center');
    handle(ctx, objX, g.mid - objH, ui.drag === 'obj');
    handle(ctx, scrX, g.mid, ui.drag === 'scr');
    ui._geo = { ...g, px, objX, scrX, objH };
  },
  pointer(ev, p, _d, ui) {
    const g = ui._geo;
    if (!g) return null;
    if (ev.type === 'down') {
      if (hit(ev.x, ev.y, g.objX, g.mid - g.objH)) { ui.drag = 'obj'; return {}; }
      if (hit(ev.x, ev.y, g.scrX, g.mid, 18)) { ui.drag = 'scr'; return {}; }
      return null;
    }
    if (ev.type === 'up') { ui.drag = null; return {}; }
    if (ev.type === 'move' && ui.drag === 'obj') {
      const u = (g.holeX - ev.x) / g.px;
      const H = (g.mid - ev.y) / g.px;
      return { u: Math.min(60, Math.max(5, u)), H: Math.min(20, Math.max(1, H)) };
    }
    if (ev.type === 'move' && ui.drag === 'scr') {
      const v = (ev.x - g.holeX) / g.px;
      return { v: Math.min(60, Math.max(5, v)) };
    }
    return null;
  },
};

export const reflection = {
  id: 'reflection',
  timed: false,
  authority: 'Law of reflection: the angle from the normal is equal for the incident and reflected rays. Angles are not measured from the mirror surface.',
  params: { theta: 40 },
  schema: [num('theta', 'Angle from the normal θ', '与法线夹角 θ', '°', 0, 80, 1)],
  compute: (p) => reflectionLaw(p),
  readouts: (d) => [
    ro('θ incident', '入射角', `${fmt(d.theta, 1)}°`),
    ro('θ reflected', '反射角', `${fmt(d.thetaR, 1)}°`),
    ro('From the surface', '与镜面夹角', `${fmt(d.fromSurface, 1)}°`),
  ],
  checks: (d) => [
    q('law', 'The reflected angle from the normal is', '反射角（从法线量）是', [
      opt(`${fmt(d.theta, 1)}°`, `${fmt(d.theta, 1)}°`),
      opt(`${fmt(d.fromSurface, 1)}°`, `${fmt(d.fromSurface, 1)}°`),
      opt(`${fmt(90 - d.fromSurface / 2, 1)}°`, `${fmt(90 - d.fromSurface / 2, 1)}°`),
    ], 0),
    q('where', 'θ in the reflection law is measured from', '反射定律里的角从哪条线量起', [
      opt('the normal', '法线'), opt('the mirror surface', '镜面'),
    ], 0),
  ],
  debug: {
    en: 'Measuring from the mirror surface gives 90° − θ, which is not the angle in the reflection law.',
    zh: '从镜面量角得到的是 90°−θ，那不是反射定律里的入射角和反射角。',
    toggleEn: 'Mark the angle from the surface',
    toggleZh: '标出从镜面量的角',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    const cx = w * 0.5;
    const cy = h * 0.62;
    const L = Math.min(w, h) * 0.42;
    const th = (d.theta * Math.PI) / 180;
    line(ctx, cx - L, cy, cx + L, cy, INK, 3);
    line(ctx, cx, cy, cx, cy - L, MUTED, 1.5, [4, 4]);
    const ix = cx - L * 0.85 * Math.sin(th);
    const iy = cy - L * 0.85 * Math.cos(th);
    const rx = cx + L * 0.85 * Math.sin(th);
    const ry = cy - L * 0.85 * Math.cos(th);
    arrow(ctx, ix, iy, cx, cy, RAY, 2.5);
    arrow(ctx, cx, cy, rx, ry, RAY2, 2.5);
    text(ctx, lab(ui, 'normal', '法线'), cx + 8, cy - L + 8, MUTED, 12);
    text(ctx, lab(ui, 'mirror', '镜面'), cx - L, cy + 16, MUTED, 12);
    text(ctx, `θ=${fmt(d.theta, 0)}°`, cx - 36, cy - 28, RAY, 12);
    if (ui.wrong) {
      text(ctx, lab(ui, `surface ${fmt(d.fromSurface, 0)}°`, `界面 ${fmt(d.fromSurface, 0)}°`), cx + 16, cy - 18, '#a33', 12);
    }
    handle(ctx, ix, iy, ui.drag === 'ray');
    ui._geo = { cx, cy, ix, iy };
  },
  pointer(ev, _p, _d, ui) {
    const g = ui._geo;
    if (!g) return null;
    if (ev.type === 'down') {
      if (hit(ev.x, ev.y, g.ix, g.iy, 18)) { ui.drag = 'ray'; return {}; }
      return null;
    }
    if (ev.type === 'up') { ui.drag = null; return {}; }
    if (ev.type === 'move' && ui.drag === 'ray') {
      const ang = Math.atan2(g.cx - ev.x, g.cy - ev.y);
      const deg = Math.abs(ang * 180 / Math.PI);
      return { theta: Math.min(80, Math.max(0, deg)) };
    }
    return null;
  },
};

const LETTER_F = [
  [0, 0, 0, 1],
  [0, 1, 0.62, 1],
  [0, 0.52, 0.42, 0.52],
];

export const planeMirror = {
  id: 'plane-mirror',
  timed: false,
  authority: 'Plane-mirror image: each point is as far behind the mirror as the object is in front. The image is virtual, erect, same size, and laterally reversed.',
  params: { d: 12, h: 8 },
  schema: [
    num('d', 'Object distance d', '物到镜面 d', 'cm', 2, 30, 0.5),
    num('h', 'Object height h', '物高 h', 'cm', 2, 16, 0.5),
  ],
  compute: (p) => planeMirrorImage(p),
  readouts: (d) => [
    ro('Image distance', '像距', `${fmt(d.imageD, 2)} cm`),
    ro('Image height', '像高', `${fmt(d.imageH, 2)} cm`),
    ro('Kind', '像的性质', 'virtual, erect, same size'),
  ],
  checks: (d) => [
    q('dist', 'Image distance behind the mirror is', '像到镜面的距离是', [
      opt(`${fmt(d.d, 2)} cm`, `${fmt(d.d, 2)} cm`),
      opt(`${fmt(d.d / 2, 2)} cm`, `${fmt(d.d / 2, 2)} cm`),
      opt(`${fmt(d.d * 2, 2)} cm`, `${fmt(d.d * 2, 2)} cm`),
    ], 0),
    q('kind', 'The image is', '这个像是', [
      opt('virtual', '虚像'), opt('real', '实像'),
    ], 0),
  ],
  debug: {
    en: 'Putting the image at half the object distance breaks the equal-distance property. The solid image stays at d.',
    zh: '把像画在物距的一半处，就破坏了“像距等于物距”。实线的像仍在距离 d 处。',
    toggleEn: 'Ghost the half-distance image',
    toggleZh: '画出一半距离的错误像',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    const mx = w * 0.52;
    const mid = h * 0.62;
    const px = Math.min((mx - 40) / 32, (w - mx - 40) / 32, 14);
    line(ctx, mx, 28, mx, h - 28, INK, 3);
    const ox = mx - p.d * px;
    const ix = mx + d.imageD * px;
    const drawF = (x0, yBase, scale, color, dash, flip) => {
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.setLineDash(dash || []);
      LETTER_F.forEach(([x1, y1, x2, y2]) => {
        const sx = flip ? -1 : 1;
        ctx.beginPath();
        ctx.moveTo(x0 + sx * x1 * scale, yBase - y1 * scale);
        ctx.lineTo(x0 + sx * x2 * scale, yBase - y2 * scale);
        ctx.stroke();
      });
      ctx.restore();
    };
    const scale = p.h * px;
    drawF(ox, mid, scale, RAY, null, false);
    drawF(ix, mid, scale, RAY2, [5, 4], true);
    line(ctx, ox, mid, ix, mid, MUTED, 1, [3, 3]);
    if (ui.wrong) drawF(mx + (p.d / 2) * px, mid - 8, scale, '#a33', [3, 3], true);
    text(ctx, lab(ui, 'mirror', '镜面'), mx + 8, 40, MUTED, 12);
    handle(ctx, ox, mid - scale, ui.drag === 'obj');
    ui._geo = { mx, mid, px, ox, scale };
  },
  pointer(ev, _p, _d, ui) {
    const g = ui._geo;
    if (!g) return null;
    if (ev.type === 'down') {
      if (hit(ev.x, ev.y, g.ox, g.mid - g.scale, 20)) { ui.drag = 'obj'; return {}; }
      return null;
    }
    if (ev.type === 'up') { ui.drag = null; return {}; }
    if (ev.type === 'move' && ui.drag === 'obj') {
      const dist = (g.mx - ev.x) / g.px;
      const hh = (g.mid - ev.y) / g.px;
      return { d: Math.min(30, Math.max(2, dist)), h: Math.min(16, Math.max(2, hh)) };
    }
    return null;
  },
};

export const refraction = {
  id: 'refraction',
  timed: false,
  authority: 'Snell\'s law n1 sin θ1 = n2 sin θ2. When n1>n2 and θ1 exceeds arcsin(n2/n1), the model has total internal reflection and no transmitted ray.',
  params: { theta: 35, n1: 1, n2: 1.5 },
  schema: [
    num('theta', 'Incident angle θ1', '入射角 θ1', '°', 0, 85, 1),
    num('n1', 'n1', 'n1', '', 1, 2.5, 0.01),
    num('n2', 'n2', 'n2', '', 1, 2.5, 0.01),
  ],
  compute: (p) => snell(p),
  readouts: (d) => [
    ro('θ1', '入射角', `${fmt(d.theta, 2)}°`),
    ro('θ2', '折射角', d.tir ? 'TIR' : `${fmt(d.theta2, 2)}°`),
    ro('Critical angle', '临界角', d.thetaC == null ? '—' : `${fmt(d.thetaC, 2)}°`),
  ],
  checks: (d) => [
    q('snell', 'Which relation is the one being evaluated?', '正在计算的关系是', [
      opt('n1 sin θ1 = n2 sin θ2', 'n1 sin θ1 = n2 sin θ2'),
      opt('n1 θ1 = n2 θ2', 'n1 θ1 = n2 θ2'),
      opt('θ1 = θ2', 'θ1 = θ2'),
    ], 0),
    q('tir', 'At these settings the transmitted ray is', '按当前参数，折射光线', [
      opt(d.tir ? 'absent (TIR)' : 'present', d.tir ? '不存在（全反射）' : '存在'),
      opt(d.tir ? 'present' : 'absent (TIR)', d.tir ? '存在' : '不存在（全反射）'),
    ], 0),
  ],
  debug: {
    en: 'Using n1 θ1 = n2 θ2 (degrees, no sine) is not Snell\'s law. The drawn ray uses the sine form.',
    zh: '用 n1θ1 = n2θ2（角度直接相乘，没有正弦）不是折射定律。图上的折射光线用的是正弦形式。',
    toggleEn: 'Mark the no-sine angle',
    toggleZh: '标出不用正弦的错误角',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    const cx = w * 0.5;
    const cy = h * 0.5;
    const L = Math.min(w, h) * 0.38;
    ctx.fillStyle = 'rgba(70,130,170,0.28)';
    ctx.fillRect(0, cy, w, h - cy);
    line(ctx, 20, cy, w - 20, cy, INK, 2);
    line(ctx, cx, 24, cx, h - 24, MUTED, 1, [4, 4]);
    const th1 = (d.theta * Math.PI) / 180;
    const ix = cx - L * Math.sin(th1);
    const iy = cy - L * Math.cos(th1);
    arrow(ctx, ix, iy, cx, cy, RAY, 2.5);
    arrow(ctx, cx, cy, cx + L * 0.75 * Math.sin(th1), cy - L * 0.75 * Math.cos(th1), MUTED, 1.5);
    if (!d.tir) {
      const th2 = (d.theta2 * Math.PI) / 180;
      arrow(ctx, cx, cy, cx + L * Math.sin(th2), cy + L * Math.cos(th2), RAY2, 2.5);
      text(ctx, `θ2=${fmt(d.theta2, 1)}°`, cx + 16, cy + 28, RAY2, 12);
    } else {
      text(ctx, lab(ui, 'TIR', '全反射'), cx + 16, cy + 28, RAY2, 14);
    }
    if (ui.wrong && !d.tir) {
      const wrong = d.theta * (d.n1 / d.n2);
      const thw = (Math.min(wrong, 89) * Math.PI) / 180;
      line(ctx, cx, cy, cx + L * 0.7 * Math.sin(thw), cy + L * 0.7 * Math.cos(thw), '#a33', 1.5, [4, 3]);
    }
    text(ctx, `n1=${fmt(d.n1, 2)}`, cx - 70, cy - 16, MUTED, 12);
    text(ctx, `n2=${fmt(d.n2, 2)}`, cx - 70, cy + 16, MUTED, 12);
    handle(ctx, ix, iy, ui.drag === 'ray');
    ui._geo = { cx, cy, ix, iy };
  },
  pointer(ev, _p, _d, ui) {
    const g = ui._geo;
    if (!g) return null;
    if (ev.type === 'down') {
      if (hit(ev.x, ev.y, g.ix, g.iy, 18)) { ui.drag = 'ray'; return {}; }
      return null;
    }
    if (ev.type === 'up') { ui.drag = null; return {}; }
    if (ev.type === 'move' && ui.drag === 'ray') {
      const ang = Math.atan2(g.cx - ev.x, g.cy - ev.y);
      return { theta: Math.min(85, Math.max(0, Math.abs(ang * 180 / Math.PI))) };
    }
    return null;
  },
};

function lensGeom(w, h, p, image) {
  const midY = h * 0.56;
  const cx = w * 0.48;
  const reach = Math.max(
    p.u, p.f * 2.3, p.screen,
    Number.isFinite(image.v) ? Math.abs(image.v) : p.f * 2,
    20,
  );
  const px = Math.min((cx - 28) / reach, (w - 28 - cx) / reach);
  return { midY, cx, px };
}

export const convexLens = {
  id: 'convex-lens',
  timed: false,
  authority: 'Paraxial thin lens in air: 1/u + 1/v = 1/f, m = −v/u. Screen blur uses the aperture and the screen-to-image gap. Spherical aberration is outside this model.',
  params: { u: 30, f: 10, h: 6, screen: 18, aperture: 2 },
  schema: [
    num('u', 'Object distance u', '物距 u', 'cm', 4, 80, 0.5),
    num('f', 'Focal length f', '焦距 f', 'cm', 4, 30, 0.5),
    num('h', 'Object height h', '物高 h', 'cm', 1, 16, 0.5),
    num('screen', 'Screen position s', '光屏位置 s', 'cm', 4, 80, 0.5),
    num('aperture', 'Aperture', '光圈口径', 'cm', 0.4, 6, 0.1),
  ],
  compute(p) {
    const image = thinLens(p);
    const screen = lensScreen(p, image);
    return { ...image, ...screen };
  },
  readouts(d) {
    const vText = Number.isFinite(d.v) ? `${fmt(d.v, 2)} cm` : '∞';
    const zhKind = { real: '实像', virtual: '虚像', none: '不成于有限远处' };
    const zhOri = { inverted: '倒立', erect: '正立', none: '—' };
    const zhSize = { magnified: '放大', diminished: '缩小', same: '等大', none: '—' };
    const nature = d.kind === 'none'
      ? { en: 'at infinity', zh: '不成于有限远处' }
      : { en: `${d.kind}, ${d.orient}, ${d.size}`, zh: `${zhKind[d.kind]}，${zhOri[d.orient]}，${zhSize[d.size]}` };
    return [
      ro('v', '像距 v', vText),
      ro('m', '放大率 m', Number.isFinite(d.m) ? fmt(d.m, 2) : '—'),
      ro('Image', '像', nature),
      ro('Screen', '光屏', d.catchesImage
        ? (d.aligned ? { en: 'sharp', zh: '清晰' } : { en: `blur ${fmt(d.blurCm, 2)} cm`, zh: `模糊 ${fmt(d.blurCm, 2)} cm` })
        : { en: 'no real image', zh: '没有实像' }),
    ];
  },
  checks(d) {
    const kindOpts = [opt('real', '实像'), opt('virtual', '虚像'), opt('none (at infinity)', '不成于有限远处')];
    const kindAns = d.kind === 'real' ? 0 : d.kind === 'virtual' ? 1 : 2;
    const oriOpts = [opt('inverted', '倒立'), opt('erect', '正立'), opt('no finite image', '没有有限远处的像')];
    const oriAns = d.kind === 'none' ? 2 : d.orient === 'inverted' ? 0 : 1;
    return [
      q('kind', 'With the object at this u, the image is', '物放在这个物距时，像是', kindOpts, kindAns),
      q('ori', 'The image orientation is', '像的正倒是', oriOpts, oriAns),
      q('screen', 'The screen at s receives a sharp real image when', '光屏在 s 处接到清晰实像，需要', [
        opt(d.catchesImage && d.aligned ? 's is at v (this setup)' : 's is at v', d.catchesImage && d.aligned ? 's 就在 v 上（当前就是）' : 's 调到 v'),
        opt('s is always sharp for any s', 's 放在哪都清晰'),
        opt('u < f and the screen is on the far side', 'u<f 且光屏在透镜另一侧'),
      ], 0),
    ];
  },
  debug: {
    en: 'When u < f the far-side screen does not catch a real image. Leaving a screen there is the usual lab mistake.',
    zh: 'u < f 时，透镜另一侧的光屏接不到实像。把光屏留在另一侧，是实验里最常见的错法。',
    toggleEn: 'Leave a screen on the far side',
    toggleZh: '把光屏留在透镜另一侧',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    const g = lensGeom(w, h, p, d);
    const { midY, cx, px } = g;
    line(ctx, 16, midY, w - 16, midY, '#cfc6b8', 1);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, midY - 78);
    ctx.quadraticCurveTo(cx + 16, midY, cx, midY + 78);
    ctx.quadraticCurveTo(cx - 16, midY, cx, midY - 78);
    ctx.stroke();
    const markF = (xCm, label) => {
      const x = cx + xCm * px;
      line(ctx, x, midY - 8, x, midY + 8, INK, 2);
      text(ctx, label, x, midY + 18, MUTED, 11, 'center');
    };
    markF(p.f, 'F');
    markF(-p.f, 'F');
    markF(2 * p.f, '2F');
    markF(-2 * p.f, '2F');
    const limit = h * 0.42;
    const yOf = (cm) => {
      if (!Number.isFinite(cm)) return midY;
      const drawn = Math.max(-limit, Math.min(limit, cm * px));
      return midY - drawn;
    };
    const ox = cx - p.u * px;
    const oy = yOf(p.h);
    arrow(ctx, ox, midY, ox, oy, RAY, 3);
    const scrX = cx + p.screen * px;
    if (d.kind !== 'virtual' || ui.wrong) {
      line(ctx, scrX, midY - 70, scrX, midY + 70, d.aligned && d.catchesImage ? '#2a6b3a' : MUTED, 3);
      text(ctx, lab(ui, 'screen', '光屏'), scrX, midY - 80, MUTED, 11, 'center');
    }
    if (Number.isFinite(d.v)) {
      const ix = cx + d.v * px;
      const iy = yOf(d.imageH);
      const dash = d.v < 0;
      arrow(ctx, ix, midY, ix, iy, RAY2, 3);
      if (dash) {
        line(ctx, ox, oy, cx, oy, RAY, 1.25);
        line(ctx, cx, oy, ix, iy, RAY2, 1.25, [5, 4]);
        line(ctx, ox, oy, ix, iy, RAY2, 1.25, [5, 4]);
      } else {
        line(ctx, ox, oy, cx, oy, RAY, 1.25);
        line(ctx, cx, oy, ix, iy, RAY2, 1.25);
        line(ctx, ox, oy, ix, iy, RAY2, 1.25);
      }
      if (d.catchesImage && !d.aligned) {
        const blur = Math.min(36, Math.abs(d.blurCm) * px);
        ctx.strokeStyle = 'rgba(196,73,29,0.7)';
        ctx.strokeRect(scrX - 8, midY - blur, 16, blur * 2);
      }
    } else {
      line(ctx, ox, oy, cx, oy, RAY, 1.25);
      line(ctx, cx, oy, w - 20, oy, RAY2, 1.25);
      line(ctx, ox, oy, cx, midY, RAY, 1.25);
    }
    handle(ctx, ox, oy, ui.drag === 'obj');
    handle(ctx, scrX, midY, ui.drag === 'scr');
    ui._geo = { ...g, ox, oy, scrX };
  },
  pointer(ev, _p, _d, ui) {
    const g = ui._geo;
    if (!g) return null;
    if (ev.type === 'down') {
      if (hit(ev.x, ev.y, g.ox, g.oy, 16)) { ui.drag = 'obj'; return {}; }
      if (hit(ev.x, ev.y, g.scrX, g.midY, 16)) { ui.drag = 'scr'; return {}; }
      return null;
    }
    if (ev.type === 'up') { ui.drag = null; return {}; }
    if (ev.type === 'move' && ui.drag === 'obj' && g.px) {
      const u = (g.cx - ev.x) / g.px;
      const hh = (g.midY - ev.y) / g.px;
      return { u: Math.min(80, Math.max(4, u)), h: Math.min(16, Math.max(1, hh)) };
    }
    if (ev.type === 'move' && ui.drag === 'scr' && g.px) {
      const s = (ev.x - g.cx) / g.px;
      return { screen: Math.min(80, Math.max(4, s)) };
    }
    return null;
  },
};

export const vision = {
  id: 'vision',
  timed: false,
  authority: 'Spectacle correction with the school sign convention. Myopia: distant object imaged at the far point, f = −D. Hyperopia: object at the reading distance imaged at the near point, 1/u + 1/(−N) = 1/f. This is a single correcting lens, not a full eye model.',
  params: { mode: 'myopia', farCm: 50, objectCm: 800, readingCm: 25, nearCm: 100 },
  schema: [
    sel('mode', 'Eye', '眼睛', [
      { value: 'myopia', en: 'Myopia', zh: '近视' },
      { value: 'hyperopia', en: 'Hyperopia', zh: '远视' },
    ]),
    num('farCm', 'Far point', '远点', 'cm', 15, 200, 1),
    num('objectCm', 'Object distance (myopia)', '物距（近视）', 'cm', 20, 800, 5),
    num('readingCm', 'Reading distance', '阅读距离', 'cm', 15, 40, 1),
    num('nearCm', 'Near point (hyperopia)', '近点（远视）', 'cm', 40, 200, 1),
  ],
  compute: (p) => spectacle(p),
  readouts: (d) => [
    ro('f', '镜片焦距 f', `${fmt(d.fCm, 2)} cm`),
    ro('Power', '焦度', `${fmt(d.power, 2)} D`),
    ro('Lens', '镜片', d.kind),
  ],
  checks: (d) => [
    q('sign', 'The correcting lens is', '矫正镜片是', [
      opt(d.kind === 'diverging' ? 'diverging (f < 0)' : 'converging (f > 0)', d.kind === 'diverging' ? '凹透镜（f < 0）' : '凸透镜（f > 0）'),
      opt(d.kind === 'diverging' ? 'converging (f > 0)' : 'diverging (f < 0)', d.kind === 'diverging' ? '凸透镜（f > 0）' : '凹透镜（f < 0）'),
    ], 0),
    q('power', 'The power 100/f(cm) is about', '焦度 100/f(cm) 约为', [
      opt(`${fmt(d.power, 1)} D`, `${fmt(d.power, 1)} D`),
      opt(`${fmt(-d.power, 1)} D`, `${fmt(-d.power, 1)} D`),
      opt('0 D', '0 D'),
    ], 0),
  ],
  debug: {
    en: 'Swapping the lens sign (concave for hyperopia, convex for myopia) puts the image on the wrong side of the far or near point.',
    zh: '把镜片正负号对调（远视用凹、近视用凸），像会落到远点或近点的错误一侧。',
    toggleEn: 'Show the swapped-sign focal point',
    toggleZh: '标出正负号对调后的焦点',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    const y = h * 0.55;
    const lensX = w * 0.42;
    const eyeX = w * 0.72;
    line(ctx, 20, y, w - 20, y, '#cfc6b8', 1);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(lensX, y - 50);
    ctx.quadraticCurveTo(lensX + (d.kind === 'diverging' ? -12 : 14), y, lensX, y + 50);
    ctx.quadraticCurveTo(lensX + (d.kind === 'diverging' ? 12 : -14), y, lensX, y - 50);
    ctx.stroke();
    ctx.strokeStyle = MUTED;
    ctx.strokeRect(eyeX, y - 28, 54, 56);
    text(ctx, lab(ui, 'eye', '眼睛'), eyeX + 27, y, MUTED, 12, 'center');
    const px = 1.6;
    const mark = d.kind === 'diverging' ? -Math.abs(d.fCm) : Math.abs(d.fCm);
    const fx = lensX + mark * px;
    line(ctx, fx, y - 10, fx, y + 10, RAY2, 2);
    text(ctx, `f=${fmt(d.fCm, 1)} cm`, fx, y - 18, RAY2, 12, 'center');
    arrow(ctx, 30, y - 26, lensX, y - 10, RAY, 2);
    arrow(ctx, 30, y + 26, lensX, y + 10, RAY, 2);
    if (ui.wrong) {
      const bad = lensX - mark * px;
      line(ctx, bad, y - 14, bad, y + 14, '#a33', 2, [4, 3]);
      text(ctx, lab(ui, 'swapped', '装反了'), bad, y + 28, '#a33', 11, 'center');
    }
    text(ctx, lab(ui, d.kind, { diverging: '发散', converging: '会聚' }[d.kind] || d.kind), lensX, y + 68, INK, 13, 'center');
    ui._geo = { lensX, y };
  },
  pointer() { return null; },
};
