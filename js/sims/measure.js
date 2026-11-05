import { fmt } from '../fmt.js';
import { rulerReading, stopwatchReading, balanceReading, thermometerReading } from '../physics/measure.js';
import { num, clear, line, text, handle, hit, lab, INK, MUTED, RAY, RAY2 } from './kit.js';

function q(id, en, zh, options, answer) { return { id, en, zh, options, answer }; }
function opt(en, zh) { return { en, zh }; }
function ro(en, zh, value) { return { en, zh, value }; }

export const rulerSim = {
  id: 'ruler',
  timed: false,
  authority: 'The reported length keeps one estimated digit past the division. The main mark is floor(true / division) × division; the estimated digit is how far the true edge sits into the next division, in tenths.',
  params: { trueCm: 3.64, division: 0.1 },
  schema: [
    num('trueCm', 'True length', '真实长度', 'cm', 0.5, 14, 0.01),
    num('division', 'Division', '分度值', 'cm', 0.05, 1, 0.05),
  ],
  compute: (p) => rulerReading(p),
  readouts: (d) => [
    ro('Reading', '读数', `${fmt(d.reading, d.places + 1)} cm`),
    ro('Main mark', '整格读数', `${fmt(d.main, d.places)} cm`),
    ro('Estimated digit', '估读位', String(d.estimate)),
  ],
  checks: (d) => [
    q('read', 'The reading to report is', '应当报告的读数是', [
      opt(`${fmt(d.reading, d.places + 1)} cm`, `${fmt(d.reading, d.places + 1)} cm`),
      opt(`${fmt(d.main, d.places)} cm`, `${fmt(d.main, d.places)} cm`),
      opt(`${fmt(d.trueCm, 2)} cm with no estimate`, `${fmt(d.trueCm, 2)} cm（不估读）`),
    ], 0),
    q('est', 'The estimated digit is', '估读位是', [
      opt(String(d.estimate), String(d.estimate)),
      opt(String((d.estimate + 1) % 10), String((d.estimate + 1) % 10)),
      opt('not needed', '不需要估读'),
    ], 0),
  ],
  debug: {
    en: 'Stopping at the main mark drops the estimated digit that the eye still has to report.',
    zh: '停在整格上，会丢掉眼睛还应当报出的估读位。',
    toggleEn: 'Stop at the main mark',
    toggleZh: '只报到整格',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    const x0 = w * 0.1;
    const y = h * 0.45;
    const px = (w * 0.8) / 15;
    line(ctx, x0, y, x0 + 15 * px, y, INK, 3);
    for (let cm = 0; cm <= 15; cm += 1) {
      const x = x0 + cm * px;
      line(ctx, x, y - 12, x, y + 12, INK, 1.5);
      if (cm % 1 === 0) text(ctx, String(cm), x, y + 28, MUTED, 11, 'center');
    }
    const edge = x0 + d.trueCm * px;
    line(ctx, edge, y - 40, edge, y + 40, RAY, 2);
    handle(ctx, edge, y - 48, ui.drag === 'edge');
    const shown = ui.wrong ? d.main : d.reading;
    text(ctx, `${fmt(shown, d.places + (ui.wrong ? 0 : 1))} cm`, w * 0.5, h * 0.2, ui.wrong ? '#a33' : INK, 16, 'center');
    ui._geo = { x0, px, y };
  },
  pointer(ev, p, _d, ui) {
    const g = ui._geo;
    if (!g) return null;
    const edge = g.x0 + p.trueCm * g.px;
    if (ev.type === 'down') {
      if (hit(ev.x, ev.y, edge, g.y - 48, 20)) { ui.drag = 'edge'; return {}; }
      return null;
    }
    if (ev.type === 'up') { ui.drag = null; return {}; }
    if (ev.type === 'move' && ui.drag === 'edge') {
      return { trueCm: Math.min(14, Math.max(0.5, (ev.x - g.x0) / g.px)) };
    }
    return null;
  },
};

export const stopwatchSim = {
  id: 'stopwatch',
  timed: false,
  authority: 'On a 60 s dial the hand angle is 2π t / 60. The reading is that angle turned back into seconds.',
  params: { t: 12.5 },
  schema: [num('t', 'Time t', '时间 t', 's', 0, 60, 0.1)],
  compute: (p) => stopwatchReading(p),
  readouts: (d) => [
    ro('Reading', '读数', `${fmt(d.reading, 1)} s`),
    ro('Angle', '转角', `${fmt((d.angle * 180) / Math.PI, 1)}°`),
  ],
  checks: (d) => [
    q('t', 'The stopwatch reading is', '停表读数是', [
      opt(`${fmt(d.reading, 1)} s`, `${fmt(d.reading, 1)} s`),
      opt(`${fmt(d.angle, 2)} s`, `${fmt(d.angle, 2)} s`),
      opt('60 s', '60 s'),
    ], 0),
  ],
  debug: {
    en: 'Reading the angle in degrees as if it were seconds invents a time.',
    zh: '把转角的度数当成秒数，时间就假了。',
    toggleEn: 'Read degrees as seconds',
    toggleZh: '把度数当成秒',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    const cx = w * 0.5;
    const cy = h * 0.5;
    const R = Math.min(w, h) * 0.32;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.stroke();
    for (let s = 0; s < 60; s += 5) {
      const a = -Math.PI / 2 + (s / 60) * Math.PI * 2;
      line(ctx, cx + Math.cos(a) * (R - 8), cy + Math.sin(a) * (R - 8), cx + Math.cos(a) * R, cy + Math.sin(a) * R, MUTED, 1);
      if (s % 15 === 0) text(ctx, String(s), cx + Math.cos(a) * (R - 22), cy + Math.sin(a) * (R - 22), MUTED, 11, 'center');
    }
    const ang = -Math.PI / 2 + d.angle;
    line(ctx, cx, cy, cx + Math.cos(ang) * (R - 20), cy + Math.sin(ang) * (R - 20), RAY, 3);
    handle(ctx, cx + Math.cos(ang) * (R - 20), cy + Math.sin(ang) * (R - 20), ui.drag === 'hand');
    text(ctx, `${fmt(ui.wrong ? (d.angle * 180) / Math.PI : d.reading, 1)} s`, cx, h * 0.9, ui.wrong ? '#a33' : INK, 16, 'center');
    ui._geo = { cx, cy, R };
  },
  pointer(ev, _p, _d, ui) {
    const g = ui._geo;
    if (!g) return null;
    const ang = -Math.PI / 2 + stopwatchReading({ t: _p.t }).angle;
    const hx = g.cx + Math.cos(ang) * (g.R - 20);
    const hy = g.cy + Math.sin(ang) * (g.R - 20);
    if (ev.type === 'down') {
      if (hit(ev.x, ev.y, hx, hy, 20)) { ui.drag = 'hand'; return {}; }
      return null;
    }
    if (ev.type === 'up') { ui.drag = null; return {}; }
    if (ev.type === 'move' && ui.drag === 'hand') {
      let a = Math.atan2(ev.y - g.cy, ev.x - g.cx) + Math.PI / 2;
      if (a < 0) a += Math.PI * 2;
      return { t: Math.min(60, Math.max(0, (a / (Math.PI * 2)) * 60)) };
    }
    return null;
  },
};

export const balanceSim = {
  id: 'balance',
  timed: false,
  authority: 'Left pan holds the object. Right pan holds the weights. The rider on the beam adds to the right-hand mass. Balance when m_object = m_weights + m_rider.',
  params: { object: 52.4, weights: 50, rider: 2.4 },
  schema: [
    num('object', 'Object mass', '物体质量', 'g', 1, 200, 0.1),
    num('weights', 'Weights', '砝码', 'g', 0, 200, 1),
    num('rider', 'Rider', '游码', 'g', 0, 5, 0.1),
  ],
  compute: (p) => balanceReading(p),
  readouts: (d) => [
    ro('Reading', '读数', `${fmt(d.reading, 1)} g`),
    ro('Object', '物体', `${fmt(d.object, 1)} g`),
    ro('Balance', '平衡', d.balanced ? { en: 'yes', zh: '是' } : { en: 'no', zh: '否' }),
  ],
  checks: (d) => [
    q('read', 'The mass reading is', '质量读数是', [
      opt(`${fmt(d.reading, 1)} g = weights + rider`, `${fmt(d.reading, 1)} g = 砝码 + 游码`),
      opt(`${fmt(d.weights, 1)} g`, `${fmt(d.weights, 1)} g`),
      opt(`${fmt(d.object, 1)} g from the left pan alone`, `${fmt(d.object, 1)} g（只看左盘）`),
    ], 0),
    q('bal', 'The beam is balanced when', '横梁平衡的条件是', [
      opt('object mass equals weights + rider', '物体质量 = 砝码 + 游码'),
      opt('object mass equals the rider only', '物体质量 = 游码'),
    ], 0),
  ],
  debug: {
    en: 'Leaving out the rider under-reports the mass by the rider reading.',
    zh: '丢掉游码，读数会少掉游码那一段。',
    toggleEn: 'Ignore the rider',
    toggleZh: '丢掉游码',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    const cx = w * 0.5;
    const y = h * 0.42;
    const tip = ui.wrong ? (d.weights - d.object) * 0.15 : d.delta * 0.15;
    const ang = Math.max(-0.12, Math.min(0.12, tip));
    line(ctx, cx, y - 40, cx, y, INK, 3);
    const cos = Math.cos(ang);
    const sin = Math.sin(ang);
    const L = w * 0.32;
    const lx = cx - L * cos;
    const ly = y - L * sin;
    const rx = cx + L * cos;
    const ry = y + L * sin;
    line(ctx, lx, ly, rx, ry, INK, 4);
    const pan = (x, yy, label, mass, color) => {
      line(ctx, x, yy, x, yy + 36, INK, 2);
      ctx.strokeStyle = color;
      ctx.strokeRect(x - 28, yy + 36, 56, 18);
      text(ctx, label, x, yy + 70, MUTED, 12, 'center');
      text(ctx, `${fmt(mass, 1)} g`, x, yy + 86, INK, 13, 'center');
    };
    pan(lx, ly, lab(ui, 'object', '物体'), d.object, RAY);
    pan(rx, ry, lab(ui, 'weights', '砝码'), ui.wrong ? d.weights : d.reading, RAY2);
    const riderX = cx - L + (2 * L * d.rider) / 5;
    const riderY = y - 10;
    handle(ctx, riderX, riderY, ui.drag === 'rider');
    text(ctx, lab(ui, 'rider', '游码'), riderX, riderY - 16, MUTED, 11, 'center');
    text(ctx, d.balanced && !ui.wrong ? lab(ui, 'balanced', '平衡') : lab(ui, 'not balanced', '不平衡'), cx, h * 0.88, d.balanced && !ui.wrong ? INK : '#a33', 14, 'center');
    ui._geo = { cx, L, y };
  },
  pointer(ev, p, _d, ui) {
    const g = ui._geo;
    if (!g) return null;
    const riderX = g.cx - g.L + (2 * g.L * p.rider) / 5;
    if (ev.type === 'down') {
      if (hit(ev.x, ev.y, riderX, g.y - 10, 18)) { ui.drag = 'rider'; return {}; }
      return null;
    }
    if (ev.type === 'up') { ui.drag = null; return {}; }
    if (ev.type === 'move' && ui.drag === 'rider') {
      const rider = Math.min(5, Math.max(0, ((ev.x - (g.cx - g.L)) / (2 * g.L)) * 5));
      return { rider };
    }
    return null;
  },
};

export const thermometerSim = {
  id: 'thermometer',
  timed: false,
  authority: 'On a linear scale the reading is the temperature T. Column height is the fraction (T − Tmin) / (Tmax − Tmin).',
  params: { T: 36.5, Tmin: -20, Tmax: 100 },
  schema: [
    num('T', 'Temperature T', '温度 T', '°C', -20, 100, 0.5),
    num('Tmin', 'Scale min', '刻度下限', '°C', -40, 0, 1),
    num('Tmax', 'Scale max', '刻度上限', '°C', 50, 120, 1),
  ],
  compute: (p) => thermometerReading(p),
  readouts: (d) => [
    ro('Reading', '读数', `${fmt(d.reading, 1)} °C`),
    ro('Fraction', '柱高比例', fmt(d.frac, 3)),
  ],
  checks: (d) => [
    q('T', 'The thermometer reading is', '温度计读数是', [
      opt(`${fmt(d.reading, 1)} °C`, `${fmt(d.reading, 1)} °C`),
      opt(`${fmt(d.Tmax, 1)} °C`, `${fmt(d.Tmax, 1)} °C`),
      opt('the scale length', '刻度长度'),
    ], 0),
  ],
  debug: {
    en: 'Reading the top of the scale instead of the column top invents a temperature.',
    zh: '读成刻度顶端而不是液柱顶端，温度就假了。',
    toggleEn: 'Read the top of the scale',
    toggleZh: '读成刻度顶端',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    const x = w * 0.45;
    const y0 = h * 0.15;
    const y1 = h * 0.85;
    line(ctx, x, y0, x, y1, INK, 2);
    const frac = ui.wrong ? 1 : d.frac;
    const yCol = y1 - frac * (y1 - y0);
    line(ctx, x, y1, x, yCol, RAY, 8);
    for (let i = 0; i <= 6; i += 1) {
      const u = i / 6;
      const y = y1 - u * (y1 - y0);
      const T = d.Tmin + u * (d.Tmax - d.Tmin);
      line(ctx, x, y, x + 14, y, MUTED, 1);
      text(ctx, `${fmt(T, 0)}`, x + 22, y, MUTED, 11);
    }
    handle(ctx, x - 18, yCol, ui.drag === 'T');
    text(ctx, `${fmt(ui.wrong ? d.Tmax : d.reading, 1)} °C`, w * 0.7, h * 0.5, ui.wrong ? '#a33' : INK, 18, 'center');
    ui._geo = { x, y0, y1 };
  },
  pointer(ev, p, _d, ui) {
    const g = ui._geo;
    if (!g) return null;
    if (ev.type === 'down') { ui.drag = 'T'; return {}; }
    if (ev.type === 'up') { ui.drag = null; return {}; }
    if (ev.type === 'move' && ui.drag === 'T') {
      const frac = Math.min(1, Math.max(0, (g.y1 - ev.y) / (g.y1 - g.y0)));
      const T = p.Tmin + frac * (p.Tmax - p.Tmin);
      return { T: Math.round(T * 2) / 2 };
    }
    return null;
  },
};
