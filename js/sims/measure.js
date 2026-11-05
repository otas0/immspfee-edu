import { fmt } from '../fmt.js';
import { rulerReading, stopwatchReading } from '../physics/measure.js';
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
      const major = cm % 1 === 0;
      line(ctx, x, y - (major ? 18 : 10), x, y + (major ? 18 : 10), INK, major ? 2 : 1);
      if (cm % 1 === 0) text(ctx, String(cm), x, y + 28, MUTED, 11, 'center');
    }
    const step = d.division;
    for (let u = 0; u < 15; u += step) {
      if (Math.abs(u - Math.round(u)) < 1e-9) continue;
      const x = x0 + u * px;
      line(ctx, x, y - 8, x, y + 8, MUTED, 1);
    }
    const edge = ui.wrong ? d.main : d.trueCm;
    const ex = x0 + edge * px;
    line(ctx, x0, y - 40, ex, y - 40, RAY, 3);
    line(ctx, ex, y - 48, ex, y - 8, RAY, 2);
    handle(ctx, ex, y - 40, ui.drag === 'edge');
    const estX = x0 + d.reading * px;
    if (!ui.wrong) {
      text(ctx, lab(ui, `estimate ${d.estimate}`, `估读 ${d.estimate}`), estX, y - 58, RAY2, 12, 'center');
      line(ctx, estX, y - 6, estX, y + 6, RAY2, 2);
    } else {
      text(ctx, lab(ui, 'main only', '只报整格'), ex, y - 58, '#a33', 12, 'center');
    }
    text(ctx, lab(ui, 'object edge', '物体边缘'), ex + 8, y - 22, MUTED, 11);
    ui._geo = { x0, y, px };
  },
  pointer(ev, p, _d, ui) {
    const g = ui._geo;
    if (!g) return null;
    if (ev.type === 'down') {
      const edge = g.x0 + p.trueCm * g.px;
      if (hit(ev.x, ev.y, edge, g.y - 40)) { ui.drag = 'edge'; return {}; }
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
  schema: [
    num('t', 'Elapsed time', '经过时间', 's', 0, 60, 0.1),
  ],
  compute: (p) => stopwatchReading(p),
  readouts: (d) => [
    ro('Reading', '读数', `${fmt(d.reading, 1)} s`),
    ro('Hand angle', '指针转角', `${fmt((d.angle * 180) / Math.PI, 1)}°`),
  ],
  checks: (d) => [
    q('read', 'The stopwatch reading is', '停表读数是', [
      opt(`${fmt(d.reading, 1)} s`, `${fmt(d.reading, 1)} s`),
      opt(`${fmt(d.t / 60, 2)} s`, `${fmt(d.t / 60, 2)} s`),
      opt(`${fmt(d.angle, 2)} s`, `${fmt(d.angle, 2)} s`),
    ], 0),
    q('from', 'That reading comes from', '这个读数来自', [
      opt('the hand angle on the dial', '表盘上的指针转角'),
      opt('a separate canned label', '另外写好的标签'),
    ], 0),
  ],
  debug: {
    en: 'Reading the hand as if a full turn were 10 s instead of 60 s multiplies the time by 6.',
    zh: '把一整圈当成 10 s 而不是 60 s，读数会变成 6 倍。',
    toggleEn: 'Treat a full turn as 10 s',
    toggleZh: '把一整圈当成 10 s',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    const cx = w * 0.5;
    const cy = h * 0.52;
    const R = Math.min(w, h) * 0.32;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.stroke();
    for (let s = 0; s < 60; s += 1) {
      const a = -Math.PI / 2 + (s / 60) * Math.PI * 2;
      const outer = R - (s % 5 === 0 ? 14 : 7);
      line(ctx, cx + Math.cos(a) * outer, cy + Math.sin(a) * outer, cx + Math.cos(a) * R, cy + Math.sin(a) * R, INK, s % 5 === 0 ? 2 : 1);
      if (s % 5 === 0) {
        text(ctx, String(s), cx + Math.cos(a) * (R - 26), cy + Math.sin(a) * (R - 26), MUTED, 11, 'center');
      }
    }
    const shown = ui.wrong ? d.t * 6 : d.t;
    const ang = -Math.PI / 2 + (Math.min(shown, 60) / 60) * Math.PI * 2;
    line(ctx, cx, cy, cx + Math.cos(ang) * (R - 20), cy + Math.sin(ang) * (R - 20), RAY, 3);
    handle(ctx, cx + Math.cos(ang) * (R - 20), cy + Math.sin(ang) * (R - 20), ui.drag === 'hand');
    text(ctx, ui.wrong ? `${fmt(shown, 1)} s?` : `${fmt(d.reading, 1)} s`, cx, cy + R + 28, ui.wrong ? '#a33' : INK, 16, 'center');
    ui._geo = { cx, cy, R };
  },
  pointer(ev, p, _d, ui) {
    const g = ui._geo;
    if (!g) return null;
    const ang = -Math.PI / 2 + (p.t / 60) * Math.PI * 2;
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
