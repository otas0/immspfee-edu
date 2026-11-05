import { fmt } from '../fmt.js';
import { tuningFork, emWave } from '../physics/waves.js';
import { num, clear, line, text, lab, arrow, INK, MUTED, RAY, RAY2 } from './kit.js';

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

export const emWaveSim = {
  id: 'em-wave',
  timed: true,
  tMax: (p) => Math.max(2e-8, 4 / Math.max(p.f, 1)),
  authority: 'In vacuum c = f λ. E and B stay in phase and perpendicular to each other and to the travel direction. The drawn amplitudes share one phase from that relation.',
  params: { f: 1e8, A: 1 },
  schema: [
    num('f', 'Frequency f', '频率 f', 'Hz', 1e7, 3e8, 1e7),
    num('A', 'E amplitude', 'E 振幅', 'V/m', 0.2, 2, 0.1),
  ],
  compute: (p, t) => emWave(p, t),
  readouts: (d) => [
    ro('f', 'f', `${fmt(d.f / 1e6, 0)} MHz`),
    ro('λ', 'λ', `${fmt(d.lambda, 2)} m`),
    ro('c', 'c', `${fmt(d.c / 1e8, 3)}×10⁸ m/s`),
    ro('E', 'E', `${fmt(d.E, 3)} V/m`),
  ],
  checks: (d) => [
    q('c', 'In vacuum, c equals', '真空中 c 等于', [
      opt(`${fmt(d.lambda, 2)} m × ${fmt(d.f / 1e6, 0)} MHz`, `${fmt(d.lambda, 2)} m × ${fmt(d.f / 1e6, 0)} MHz`),
      opt(`${fmt(d.f * d.A, 2)} m/s`, `${fmt(d.f * d.A, 2)} m/s`),
      opt('only the wavelength', '只由波长决定'),
    ], 0),
    q('EB', 'At this instant E and B are', '这一时刻 E 和 B', [
      opt('in phase and perpendicular', '同相位且互相垂直'),
      opt('out of phase by π/2', '相位差 π/2'),
      opt('parallel', '互相平行'),
    ], 0),
  ],
  debug: {
    en: 'Using λ = c f instead of λ = c / f inverts the wavelength.',
    zh: '写成 λ = c f 而不是 λ = c / f，波长就反了。',
    toggleEn: 'Use λ = c f',
    toggleZh: '改用 λ = c f',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    const lambdaShow = ui.wrong ? d.c * d.f : d.lambda;
    const gx = w * 0.1;
    const gy = h * 0.55;
    const gw = w * 0.8;
    const cycles = 2;
    line(ctx, gx, gy, gx + gw, gy, MUTED, 1);
    arrow(ctx, gx, gy, gx + gw, gy, INK, 1.5);
    text(ctx, lab(ui, 'travel', '传播'), gx + gw - 8, gy + 16, MUTED, 11, 'right');
    ctx.beginPath();
    for (let i = 0; i <= 160; i += 1) {
      const u = i / 160;
      const x = gx + u * gw;
      const phase = 2 * Math.PI * cycles * u - d.omega * d.t;
      const y = gy - d.A * Math.sin(phase) * h * 0.22;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = RAY;
    ctx.lineWidth = 2;
    ctx.stroke();
    text(ctx, 'E', gx + 8, gy - h * 0.28, RAY, 13);
    for (let i = 0; i <= 12; i += 1) {
      const u = i / 12;
      const x = gx + u * gw;
      const phase = 2 * Math.PI * cycles * u - d.omega * d.t;
      const b = d.A * Math.sin(phase);
      const mark = b >= 0 ? '·' : '×';
      text(ctx, mark, x, gy + h * 0.18, RAY2, 12, 'center');
    }
    text(ctx, 'B', gx + 8, gy + h * 0.22, RAY2, 13);
    const span = gw / cycles;
    line(ctx, gx, h * 0.12, gx + span, h * 0.12, INK, 1.5);
    text(ctx, `λ=${fmt(lambdaShow, ui.wrong ? 0 : 2)}${ui.wrong ? '' : ' m'}`, gx + span / 2, h * 0.08, ui.wrong ? '#a33' : INK, 13, 'center');
    text(ctx, `c=fλ → ${fmt(d.f / 1e6, 0)} MHz`, w * 0.7, h * 0.1, MUTED, 12, 'center');
    if (ui.wrong) text(ctx, lab(ui, 'λ = c f', 'λ = c f'), w * 0.5, h * 0.92, '#a33', 13, 'center');
  },
  pointer() { return null; },
};
