import { fmt } from '../fmt.js?v=__BUILD__';
import { tuningFork, emWave, soundAbsorb, echoRange, doppler, beats, dispersion } from '../physics/waves.js?v=__BUILD__';
import { num, tog, clear, line, text, lab, arrow, teachPanel, INK, MUTED, RAY, RAY2 } from './kit.js?v=__BUILD__';

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
    // Wide: fork left / y(t) panel right. Narrow (≤360): stack.
    const narrow = w <= 360;
    const forkBoxX = narrow ? w * 0.06 : w * 0.04;
    const forkBoxY = narrow ? h * 0.06 : h * 0.1;
    const forkBoxW = narrow ? w * 0.88 : w * 0.28;
    const forkBoxH = narrow ? h * 0.36 : h * 0.8;
    const forkX = forkBoxX + forkBoxW * (narrow ? 0.5 : 0.55);
    const midY = forkBoxY + forkBoxH * 0.55;
    const spread = 18 + d.y * 22;
    const forkSpan = Math.min(forkBoxH * 0.38, 70);
    line(ctx, forkX, midY - forkSpan, forkX, midY + forkSpan, INK, 4);
    line(ctx, forkX, midY - forkSpan * 0.78, forkX - spread, midY - forkSpan * 1.28, RAY, 3);
    line(ctx, forkX, midY + forkSpan * 0.78, forkX - spread, midY + forkSpan * 1.28, RAY, 3);
    text(ctx, lab(ui, 'fork', '音叉'), forkBoxX + forkBoxW / 2, forkBoxY + 14, MUTED, 12, 'center');

    const panelX = narrow ? w * 0.06 : w * 0.36;
    const panelY = narrow ? h * 0.46 : h * 0.1;
    const panelW = narrow ? w * 0.88 : w * 0.6;
    const panelH = narrow ? h * 0.5 : h * 0.8;
    teachPanel(ctx, panelX, panelY, panelW, panelH, lab(ui, 'y = A sin(2π f t)', 'y = A sin(2π f t)'));
    const gx = panelX + panelW * 0.08;
    const gy = panelY + panelH * 0.55;
    const gw = panelW * 0.84;
    const gh = panelH * 0.28;
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
    text(ctx, `f=${fmt(d.f, 0)} Hz`, panelX + panelW * 0.35, panelY + panelH * 0.22, INK, 13, 'center');
    text(ctx, `A=${fmt(d.A, 2)}`, panelX + panelW * 0.7, panelY + panelH * 0.22, MUTED, 13, 'center');
    if (ui.wrong) text(ctx, lab(ui, 'f missing in the wave', '波形里没有 f'), panelX + panelW / 2, panelY + panelH * 0.88, '#a33', 12, 'center');
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
    // Wide: E·B travel left / c=fλ panel right. Narrow (≤360): stack.
    const narrow = w <= 360;
    const lambdaShow = ui.wrong ? d.c * d.f : d.lambda;
    const waveX = narrow ? w * 0.06 : w * 0.04;
    const waveY = narrow ? h * 0.08 : h * 0.1;
    const waveW = narrow ? w * 0.88 : w * 0.52;
    const waveH = narrow ? h * 0.42 : h * 0.8;
    const gx = waveX + waveW * 0.08;
    const gy = waveY + waveH * 0.55;
    const gw = waveW * 0.84;
    const cycles = 2;
    line(ctx, gx, gy, gx + gw, gy, MUTED, 1);
    arrow(ctx, gx, gy, gx + gw, gy, INK, 1.5);
    text(ctx, lab(ui, 'travel', '传播'), gx + gw - 4, gy + 14, MUTED, 11, 'right');
    ctx.beginPath();
    for (let i = 0; i <= 160; i += 1) {
      const u = i / 160;
      const x = gx + u * gw;
      const phase = 2 * Math.PI * cycles * u - d.omega * d.t;
      const y = gy - d.A * Math.sin(phase) * waveH * 0.28;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = RAY;
    ctx.lineWidth = 2;
    ctx.stroke();
    text(ctx, 'E', gx + 4, gy - waveH * 0.32, RAY, 12);
    for (let i = 0; i <= 10; i += 1) {
      const u = i / 10;
      const x = gx + u * gw;
      const phase = 2 * Math.PI * cycles * u - d.omega * d.t;
      const b = d.A * Math.sin(phase);
      text(ctx, b >= 0 ? '·' : '×', x, gy + waveH * 0.22, RAY2, 11, 'center');
    }
    text(ctx, 'B', gx + 4, gy + waveH * 0.28, RAY2, 12);
    const span = gw / cycles;
    line(ctx, gx, waveY + 18, gx + span, waveY + 18, INK, 1.5);
    text(ctx, `λ=${fmt(lambdaShow, ui.wrong ? 0 : 2)}${ui.wrong ? '' : ' m'}`, gx + span / 2, waveY + 10, ui.wrong ? '#a33' : INK, 12, 'center');

    const panelX = narrow ? w * 0.06 : w * 0.6;
    const panelY = narrow ? h * 0.54 : h * 0.12;
    const panelW = narrow ? w * 0.88 : w * 0.36;
    const panelH = narrow ? h * 0.42 : h * 0.76;
    teachPanel(ctx, panelX, panelY, panelW, panelH, lab(ui, 'c = f λ', 'c = f λ'));
    text(ctx, `f=${fmt(d.f / 1e6, 0)} MHz`, panelX + panelW / 2, panelY + panelH * 0.35, MUTED, 13, 'center');
    text(ctx, `λ=${fmt(lambdaShow, ui.wrong ? 0 : 2)}${ui.wrong ? '' : ' m'}`, panelX + panelW / 2, panelY + panelH * 0.55, ui.wrong ? '#a33' : INK, 14, 'center');
    text(ctx, ui.wrong ? 'λ = c f' : 'E ∥ B phase', panelX + panelW / 2, panelY + panelH * 0.78, MUTED, 12, 'center');
  },
  pointer() { return null; },
};

export const absorbSim = {
  id: 'sound-absorb',
  timed: false,
  authority: 'A barrier reflects fraction R at the face and absorbs with coefficient α through thickness d. The intensity that gets through is I = I0 (1 − R) e^{−α d}. No invented decibel scale.',
  params: { I0: 1, R: 0.3, alpha: 2, d: 0.4 },
  schema: [
    num('I0', 'Incident I0', '入射强度 I0', '', 0.2, 2, 0.1),
    num('R', 'Reflection R', '反射系数 R', '', 0, 0.9, 0.05),
    num('alpha', 'Absorption α', '吸收系数 α', '1/m', 0, 8, 0.1),
    num('d', 'Thickness d', '厚度 d', 'm', 0.05, 1.5, 0.05),
  ],
  compute: (p) => soundAbsorb(p),
  readouts: (d) => [
    ro('I', 'I', fmt(d.I, 3)),
    ro('Reflected', '反射', fmt(d.reflected, 3)),
    ro('Absorbed', '吸收', fmt(d.absorbed, 3)),
  ],
  checks: (d) => [
    q('I', 'The transmitted intensity is', '透射强度是', [
      opt(`${fmt(d.I, 3)} = I0 (1−R) e^{−α d}`, `${fmt(d.I, 3)} = I0 (1−R) e^{−α d}`),
      opt(`${fmt(d.I0 * (1 - d.R), 3)}`, `${fmt(d.I0 * (1 - d.R), 3)}`),
      opt(`${fmt(d.I0, 3)}`, `${fmt(d.I0, 3)}`),
    ], 0),
    q('thicker', 'Raising d at fixed α and R', 'α、R 不变，加大 d', [
      opt('lowers the transmitted intensity', '使透射强度减小'),
      opt('raises the transmitted intensity', '使透射强度增大'),
      opt('leaves I unchanged', '不改变 I'),
    ], 0),
  ],
  debug: {
    en: 'Dropping the exponential leaves only the face reflection and invents too much transmission.',
    zh: '丢掉指数项，只剩表面反射，透射就被算大了。',
    toggleEn: 'Drop e^{−α d}',
    toggleZh: '丢掉 e^{−α d}',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    const y = h * 0.5;
    const x0 = w * 0.12;
    const x1 = w * 0.38;
    const x2 = x1 + p.d * w * 0.28;
    const x3 = w * 0.88;
    line(ctx, x0, y, x1, y, RAY, 3);
    ctx.fillStyle = 'rgba(120,140,160,0.35)';
    ctx.fillRect(x1, y - 40, Math.max(8, x2 - x1), 80);
    line(ctx, x1, y - 40, x1, y + 40, INK, 2);
    line(ctx, x2, y - 40, x2, y + 40, INK, 2);
    const Ishow = ui.wrong ? d.I0 * (1 - d.R) : d.I;
    line(ctx, x2, y, x3, y, RAY2, 1 + 3 * (Ishow / Math.max(d.I0, 1e-6)));
    text(ctx, lab(ui, 'incident', '入射'), (x0 + x1) / 2, y - 24, MUTED, 12, 'center');
    text(ctx, lab(ui, 'barrier', '屏障'), (x1 + x2) / 2, y - 52, MUTED, 12, 'center');
    text(ctx, lab(ui, 'transmitted', '透射'), (x2 + x3) / 2, y - 24, MUTED, 12, 'center');
    text(ctx, `I=${fmt(Ishow, 3)}`, w * 0.5, h * 0.18, ui.wrong ? '#a33' : INK, 16, 'center');
    text(ctx, `R=${fmt(d.R, 2)}  α=${fmt(d.alpha, 1)}  d=${fmt(d.d, 2)} m`, w * 0.5, h * 0.82, MUTED, 12, 'center');
  },
  pointer() { return null; },
};

export const echoSim = {
  id: 'echo-range',
  timed: false,
  authority: 'Ultrasound ranging in air uses the public speed v = 340 m/s. Round-trip time t gives distance s = v t / 2.',
  params: { t: 0.02, v: 340 },
  schema: [
    num('t', 'Round-trip time t', '往返时间 t', 's', 0.002, 0.2, 0.002),
    num('v', 'Speed of sound v', '声速 v', 'm/s', 300, 360, 1),
  ],
  compute: (p) => echoRange(p),
  readouts: (d) => [
    ro('s', 's', `${fmt(d.s, 2)} m`),
    ro('v', 'v', `${fmt(d.v, 0)} m/s`),
    ro('t', 't', `${fmt(d.t, 3)} s`),
  ],
  checks: (d) => [
    q('s', 'The one-way distance is', '单程距离是', [
      opt(`${fmt(d.s, 2)} m = v t / 2`, `${fmt(d.s, 2)} m = v t / 2`),
      opt(`${fmt(d.v * d.t, 2)} m`, `${fmt(d.v * d.t, 2)} m`),
      opt(`${fmt(d.t / 2, 3)} m`, `${fmt(d.t / 2, 3)} m`),
    ], 0),
  ],
  debug: {
    en: 'Using s = v t forgets the echo is a round trip and doubles the distance.',
    zh: '写成 s = v t 忘了回波是往返，距离会翻倍。',
    toggleEn: 'Use s = v t',
    toggleZh: '改用 s = v t',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    // Wide: echo path left / s=vt/2 panel right. Narrow (≤360): stack.
    const narrow = w <= 360;
    const schX = narrow ? w * 0.06 : w * 0.04;
    const schY = narrow ? h * 0.08 : h * 0.12;
    const schW = narrow ? w * 0.88 : w * 0.5;
    const schH = narrow ? h * 0.4 : h * 0.76;
    const y = schY + schH * 0.5;
    const x0 = schX + schW * 0.18;
    const span = Math.min(schW * 0.55, d.s * schW * 0.12);
    const x1 = x0 + Math.max(36, span);
    ctx.fillStyle = RAY;
    ctx.fillRect(x0 - 16, y - 16, 32, 32);
    text(ctx, lab(ui, 'source', '声源'), x0, y + 36, MUTED, 11, 'center');
    line(ctx, x0 + 18, y, x1 - 8, y, INK, 1.5);
    arrow(ctx, x0 + 18, y - 18, x1 - 8, y - 18, RAY2, 2);
    arrow(ctx, x1 - 8, y + 18, x0 + 18, y + 18, RAY2, 2);
    ctx.fillStyle = MUTED;
    ctx.fillRect(x1, y - 44, 12, 88);
    text(ctx, lab(ui, 'wall', '墙'), x1 + 6, y + 62, MUTED, 11, 'center');

    const panelX = narrow ? w * 0.06 : w * 0.58;
    const panelY = narrow ? h * 0.52 : h * 0.12;
    const panelW = narrow ? w * 0.88 : w * 0.38;
    const panelH = narrow ? h * 0.44 : h * 0.76;
    teachPanel(ctx, panelX, panelY, panelW, panelH, lab(ui, 's = v t / 2', 's = v t / 2'));
    const sShow = ui.wrong ? d.v * d.t : d.s;
    text(ctx, `s=${fmt(sShow, 2)} m`, panelX + panelW / 2, panelY + panelH * 0.38, ui.wrong ? '#a33' : INK, 15, 'center');
    text(ctx, `t=${fmt(d.t, 3)} s`, panelX + panelW / 2, panelY + panelH * 0.58, MUTED, 12, 'center');
    text(ctx, ui.wrong ? 's = v t' : 'round-trip / 2', panelX + panelW / 2, panelY + panelH * 0.78, MUTED, 11, 'center');
  },
  pointer() { return null; },
};

export const dopplerSim = {
  id: 'doppler',
  timed: false,
  authority: 'Sound Doppler: f′ = f (v ± vo) / (v ± vs). Toward the other body uses the classroom +/− signs on the toggles.',
  params: { f: 440, v: 340, vo: 0, vs: 20, observerToward: true, sourceToward: true },
  schema: [
    num('f', 'Source f', '声源频率 f', 'Hz', 100, 1000, 10),
    num('v', 'Sound speed v', '声速 v', 'm/s', 300, 360, 1),
    num('vo', 'Observer speed', '观察者速率', 'm/s', 0, 40, 1),
    num('vs', 'Source speed', '声源速率', 'm/s', 0, 40, 1),
    tog('observerToward', 'Observer toward source', '观察者靠近声源'),
    tog('sourceToward', 'Source toward observer', '声源靠近观察者'),
  ],
  compute: (p) => doppler(p),
  readouts: (d) => [
    ro('f′', 'f′', `${fmt(d.fp, 1)} Hz`),
    ro('f', 'f', `${fmt(d.f, 0)} Hz`),
  ],
  checks: (d) => [
    q('fp', 'Heard frequency is', '听到的频率是', [
      opt(`${fmt(d.fp, 1)} Hz`, `${fmt(d.fp, 1)} Hz`),
      opt(`${fmt(d.f, 1)} Hz`, `${fmt(d.f, 1)} Hz`),
    ], 0),
  ],
  debug: {
    en: 'Swapping numerator and denominator invents the wrong shift direction.',
    zh: '把分子分母对调，频移方向就反了。',
    toggleEn: 'Swap num and den',
    toggleZh: '对调分子分母',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    // Wide: S–O schematic left / f′ panel right. Narrow (≤360): stack.
    const narrow = w <= 360;
    const schX = narrow ? w * 0.06 : w * 0.04;
    const schY = narrow ? h * 0.08 : h * 0.12;
    const schW = narrow ? w * 0.88 : w * 0.5;
    const schH = narrow ? h * 0.4 : h * 0.76;
    const sx = schX + schW * 0.28;
    const ox = schX + schW * 0.72;
    const y = schY + schH * 0.5;
    ctx.fillStyle = RAY;
    ctx.beginPath();
    ctx.arc(sx, y, 16, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, lab(ui, 'S', '声源'), sx, y + 36, MUTED, 12, 'center');
    ctx.fillStyle = RAY2;
    ctx.beginPath();
    ctx.arc(ox, y, 16, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, lab(ui, 'O', '观察者'), ox, y + 36, MUTED, 12, 'center');
    // Toward the other: arrow points to the partner; away: arrow points outward.
    if (d.vs > 1e-6) {
      if (d.sourceToward) arrow(ctx, sx + 22, y - 26, sx + 48, y - 26, RAY, 2);
      else arrow(ctx, sx - 22, y - 26, sx - 48, y - 26, RAY, 2);
    }
    if (d.vo > 1e-6) {
      if (d.observerToward) arrow(ctx, ox - 22, y - 26, ox - 48, y - 26, RAY2, 2);
      else arrow(ctx, ox + 22, y - 26, ox + 48, y - 26, RAY2, 2);
    }
    text(ctx, lab(ui, 'S · O', 'S · O'), schX + schW / 2, schY + 12, MUTED, 12, 'center');

    const panelX = narrow ? w * 0.06 : w * 0.58;
    const panelY = narrow ? h * 0.52 : h * 0.12;
    const panelW = narrow ? w * 0.88 : w * 0.38;
    const panelH = narrow ? h * 0.44 : h * 0.76;
    teachPanel(ctx, panelX, panelY, panelW, panelH, lab(ui, 'f′ = f (v±vo)/(v±vs)', 'f′ = f (v±vo)/(v±vs)'));
    const fpShow = ui.wrong ? d.f * (d.v + (d.sourceToward ? -d.vs : d.vs)) / Math.max(d.v + (d.observerToward ? d.vo : -d.vo), 1e-9) : d.fp;
    text(ctx, `f′=${fmt(fpShow, 1)} Hz`, panelX + panelW / 2, panelY + panelH * 0.38, ui.wrong ? '#a33' : INK, 15, 'center');
    text(ctx, `f=${fmt(d.f, 0)} Hz`, panelX + panelW / 2, panelY + panelH * 0.58, MUTED, 13, 'center');
    text(ctx, ui.wrong ? 'num/den swapped' : 'classroom ± signs', panelX + panelW / 2, panelY + panelH * 0.78, MUTED, 11, 'center');
  },
  pointer() { return null; },
};

export const beatsSim = {
  id: 'beats',
  timed: true,
  tMax: (p) => Math.max(2, 4 / Math.max(Math.abs(p.f1 - p.f2), 0.5)),
  authority: 'Two close tones: beat frequency Δf = |f1 − f2|, and the envelope is 2 A cos(π Δf t).',
  params: { f1: 256, f2: 260, A: 0.8 },
  schema: [
    num('f1', 'Frequency f1', '频率 f1', 'Hz', 100, 500, 1),
    num('f2', 'Frequency f2', '频率 f2', 'Hz', 100, 500, 1),
    num('A', 'Amplitude A', '振幅 A', '', 0.2, 1.5, 0.05),
  ],
  compute: (p, t) => beats(p, t),
  readouts: (d) => [
    ro('Δf', 'Δf', `${fmt(d.df, 2)} Hz`),
    ro('y', 'y', fmt(d.y, 3)),
  ],
  checks: (d) => [
    q('df', 'Beat frequency is', '拍频是', [
      opt(`${fmt(d.df, 2)} Hz = |f1 − f2|`, `${fmt(d.df, 2)} Hz = |f1 − f2|`),
      opt(`${fmt(d.favg, 2)} Hz`, `${fmt(d.favg, 2)} Hz`),
    ], 0),
  ],
  debug: {
    en: 'Using Δf = f1 + f2 invents a beat that is not the slow envelope.',
    zh: '写成 Δf = f1 + f2 就不是慢包络了。',
    toggleEn: 'Use Δf = f1 + f2',
    toggleZh: '改用 Δf = f1 + f2',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    // Wide: waveform left / Δf panel right. Narrow (≤360): stack.
    const narrow = w <= 360;
    const dfShow = ui.wrong ? d.f1 + d.f2 : d.df;
    const waveX = narrow ? w * 0.06 : w * 0.04;
    const waveY = narrow ? h * 0.08 : h * 0.12;
    const waveW = narrow ? w * 0.88 : w * 0.44;
    const waveH = narrow ? h * 0.36 : h * 0.76;
    text(ctx, lab(ui, 'y(t)', 'y(t)'), waveX + waveW / 2, waveY, MUTED, 12, 'center');
    const gx = waveX + waveW * 0.08;
    const gy = waveY + waveH * 0.55;
    const gw = waveW * 0.84;
    const gh = waveH * 0.35;
    line(ctx, gx, gy, gx + gw, gy, MUTED, 1);
    ctx.beginPath();
    for (let i = 0; i <= 200; i += 1) {
      const tt = d.t - (1 - i / 200) * Math.min(1, 4 / Math.max(dfShow, 0.5));
      const sample = beats({ ...p }, Math.max(0, tt));
      const env = ui.wrong ? 2 * d.A : sample.env;
      const y = ui.wrong ? env * Math.sin(2 * Math.PI * sample.favg * Math.max(0, tt)) : sample.y;
      const x = gx + (i / 200) * gw;
      const Y = gy - (y / (2.2 * d.A)) * gh;
      if (i === 0) ctx.moveTo(x, Y);
      else ctx.lineTo(x, Y);
    }
    ctx.strokeStyle = RAY2;
    ctx.lineWidth = 2;
    ctx.stroke();

    const panelX = narrow ? w * 0.06 : w * 0.52;
    const panelY = narrow ? h * 0.48 : h * 0.12;
    const panelW = narrow ? w * 0.88 : w * 0.44;
    const panelH = narrow ? h * 0.48 : h * 0.76;
    teachPanel(ctx, panelX, panelY, panelW, panelH, lab(ui, 'Δf = |f1−f2|', 'Δf = |f1−f2|'));
    text(ctx, `Δf=${fmt(dfShow, 2)} Hz`, panelX + panelW / 2, panelY + panelH * 0.32, ui.wrong ? '#a33' : INK, 15, 'center');
    text(ctx, `f̄=${fmt(d.favg, 1)} Hz`, panelX + panelW / 2, panelY + panelH * 0.5, MUTED, 13, 'center');
    text(ctx, ui.wrong ? 'Δf = f1+f2' : 'envelope ∝ cos(π Δf t)', panelX + panelW / 2, panelY + panelH * 0.7, MUTED, 12, 'center');
  },
  pointer() { return null; },
};

export const dispersionSim = {
  id: 'dispersion',
  timed: false,
  authority: 'Dispersion relation ω² = ω0² + c² k² gives phase velocity vp = ω/k and group velocity vg = c² k / ω.',
  params: { omega0: 2, c: 1, k: 1.5 },
  schema: [
    num('omega0', 'ω0', 'ω0', '', 0, 5, 0.1),
    num('c', 'c', 'c', '', 0.2, 3, 0.1),
    num('k', 'Wave number k', '波数 k', '', 0.2, 4, 0.1),
  ],
  compute: (p) => dispersion(p),
  readouts: (d) => [
    ro('ω', 'ω', fmt(d.omega, 3)),
    ro('vp', 'vp', fmt(d.vp, 3)),
    ro('vg', 'vg', fmt(d.vg, 3)),
  ],
  checks: (d) => [
    q('vg', 'Group velocity is', '群速度是', [
      opt(`${fmt(d.vg, 3)} = c² k / ω`, `${fmt(d.vg, 3)} = c² k / ω`),
      opt(`${fmt(d.vp, 3)}`, `${fmt(d.vp, 3)}`),
    ], 0),
  ],
  debug: {
    en: 'Calling vp the group velocity confuses the two speeds.',
    zh: '把相速度当成群速度，两个速度就混了。',
    toggleEn: 'Label vp as vg',
    toggleZh: '把 vp 标成 vg',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    // Wide: ω(k) left / vp·vg panel right. Narrow (≤360): stack.
    const narrow = w <= 360;
    const plotX = narrow ? w * 0.06 : w * 0.04;
    const plotY = narrow ? h * 0.08 : h * 0.1;
    const plotW = narrow ? w * 0.88 : w * 0.5;
    const plotH = narrow ? h * 0.4 : h * 0.8;
    text(ctx, lab(ui, 'ω(k)', 'ω(k)'), plotX + plotW / 2, plotY + 4, MUTED, 12, 'center');
    const gx = plotX + plotW * 0.12;
    const gy = plotY + plotH * 0.88;
    const gw = plotW * 0.78;
    const gh = plotH * 0.7;
    line(ctx, gx, gy, gx + gw, gy, MUTED, 1);
    line(ctx, gx, gy, gx, gy - gh, MUTED, 1);
    const kMax = Math.max(4, d.k * 1.6);
    let wMax = 1e-9;
    const pts = [];
    for (let i = 0; i <= 80; i += 1) {
      const k = (kMax * i) / 80 || 1e-9;
      const sample = dispersion({ omega0: d.omega0, c: d.c, k });
      pts.push({ k, omega: sample.omega });
      if (sample.omega > wMax) wMax = sample.omega;
    }
    ctx.beginPath();
    pts.forEach((pt, i) => {
      const X = gx + (pt.k / kMax) * gw;
      const Y = gy - (pt.omega / wMax) * gh;
      if (i === 0) ctx.moveTo(X, Y);
      else ctx.lineTo(X, Y);
    });
    ctx.strokeStyle = RAY2;
    ctx.lineWidth = 2;
    ctx.stroke();
    const kx = gx + (d.k / kMax) * gw;
    const ky = gy - (d.omega / wMax) * gh;
    ctx.fillStyle = RAY;
    ctx.beginPath();
    ctx.arc(kx, ky, 4.5, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, 'k', gx + gw + 8, gy, MUTED, 11, 'left');
    text(ctx, 'ω', gx - 10, gy - gh, MUTED, 11, 'right');

    const panelX = narrow ? w * 0.06 : w * 0.58;
    const panelY = narrow ? h * 0.52 : h * 0.12;
    const panelW = narrow ? w * 0.88 : w * 0.38;
    const panelH = narrow ? h * 0.44 : h * 0.76;
    teachPanel(ctx, panelX, panelY, panelW, panelH, lab(ui, 'vp · vg', 'vp · vg'));
    text(ctx, `vp=${fmt(d.vp, 2)}`, panelX + panelW / 2, panelY + panelH * 0.32, RAY, 15, 'center');
    text(ctx, ui.wrong ? `vg?=${fmt(d.vp, 2)}` : `vg=${fmt(d.vg, 2)}`, panelX + panelW / 2, panelY + panelH * 0.52, ui.wrong ? '#a33' : RAY2, 15, 'center');
    text(ctx, `ω=${fmt(d.omega, 2)}`, panelX + panelW / 2, panelY + panelH * 0.72, MUTED, 13, 'center');
    text(ctx, ui.wrong ? 'vp labeled as vg' : 'vg = c² k / ω', panelX + panelW / 2, panelY + panelH * 0.88, MUTED, 11, 'center');
  },
  pointer() { return null; },
};
