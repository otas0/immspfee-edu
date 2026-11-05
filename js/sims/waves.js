import { fmt } from '../fmt.js';
import { tuningFork } from '../physics/waves.js';
import { num, clear, line, text, lab, INK, MUTED, RAY, RAY2 } from './kit.js';

function q(id, en, zh, options, answer) { return { id, en, zh, options, answer }; }
function opt(en, zh) { return { en, zh }; }
function ro(en, zh, value) { return { en, zh, value }; }

export const soundSim = {
  id: 'sound-wave',
  timed: true,
  tMax: (p) => Math.max(2, 4 / Math.max(p.f, 1) * 200),
  authority: 'The prong and the drawn wave both follow y = A sin(2π f t). Frequency is pitch; amplitude is loudness. Timbre would need a different waveform and is outside this model.',
  params: { f: 256, A: 0.8 },
  schema: [
    num('f', 'Frequency f', '频率 f', 'Hz', 80, 800, 1),
    num('A', 'Amplitude A', '振幅 A', '', 0.1, 1.5, 0.05),
  ],
  compute: (p, t) => tuningFork(p, t),
  readouts: (d) => [
    ro('f', 'f', `${fmt(d.f, 0)} Hz`),
    ro('A', 'A', fmt(d.A, 2)),
    ro('y', 'y', fmt(d.y, 3)),
    ro('T', '周期 T', `${fmt(d.period, 4)} s`),
  ],
  checks: (d) => [
    q('y', 'At this time the displacement is', '这一时刻的位移是', [
      opt(fmt(d.y, 3), fmt(d.y, 3)),
      opt(fmt(d.A, 3), fmt(d.A, 3)),
      opt(fmt(d.f, 3), fmt(d.f, 3)),
    ], 0),
    q('pitch', 'Raising f while A stays fixed changes', 'A 不变、只加大 f，改变的是', [
      opt('pitch', '音调'),
      opt('loudness', '响度'),
      opt('neither', '都不改变'),
    ], 0),
  ],
  debug: {
    en: 'Drawing y = A sin(2π t) ignores f, so the wave no longer matches the fork.',
    zh: '画成 y = A sin(2π t) 会丢掉 f，波形就和音叉对不上。',
    toggleEn: 'Drop f from the wave',
    toggleZh: '波形里丢掉 f',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    const forkX = w * 0.18;
    const midY = h * 0.45;
    const spread = 18 + d.y * 22;
    line(ctx, forkX, midY - 70, forkX, midY + 70, INK, 4);
    line(ctx, forkX, midY - 55, forkX - spread, midY - 90, RAY, 3);
    line(ctx, forkX, midY + 55, forkX - spread, midY + 90, RAY, 3);
    text(ctx, lab(ui, 'fork', '音叉'), forkX, h * 0.12, MUTED, 12, 'center');
    const gx = w * 0.32;
    const gy = midY;
    const gw = w * 0.58;
    const gh = h * 0.28;
    line(ctx, gx, gy, gx + gw, gy, MUTED, 1);
    ctx.beginPath();
    const wrong = !!ui.wrong;
    for (let i = 0; i <= 120; i += 1) {
      const u = i / 120;
      const tt = d.t - (1 - u) * Math.min(0.02, 2 / d.f);
      const yy = wrong ? d.A * Math.sin(2 * Math.PI * tt) : d.A * Math.sin(2 * Math.PI * d.f * tt);
      const x = gx + u * gw;
      const y = gy - (yy / 1.6) * gh;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = RAY2;
    ctx.lineWidth = 2;
    ctx.stroke();
    const yNow = gy - (d.y / 1.6) * gh;
    ctx.fillStyle = RAY;
    ctx.beginPath();
    ctx.arc(gx + gw, yNow, 5, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, `f=${fmt(d.f, 0)} Hz`, w * 0.55, h * 0.14, INK, 14, 'center');
    text(ctx, `A=${fmt(d.A, 2)}`, w * 0.75, h * 0.14, MUTED, 14, 'center');
    if (ui.wrong) text(ctx, lab(ui, 'f missing in the wave', '波形里没有 f'), w * 0.55, h * 0.88, '#a33', 13, 'center');
  },
  pointer() { return null; },
};
