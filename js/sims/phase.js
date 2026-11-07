import { fmt } from '../fmt.js?v=__BUILD__';
import { melting, boiling, sublimation } from '../physics/motion.js?v=__BUILD__';
import { num, tog, clear, line, text, lab, teachPanel, INK, MUTED, RAY, RAY2 } from './kit.js?v=__BUILD__';

function q(id, en, zh, options, answer) { return { id, en, zh, options, answer }; }
function opt(en, zh) { return { en, zh }; }
function ro(en, zh, value) { return { en, zh, value }; }

const PHASE = {
  solid: ['solid', '固态'],
  melting: ['melting', '熔化'],
  liquid: ['liquid', '液态'],
  warming: ['warming', '升温'],
};

export const meltSim = {
  id: 'melting',
  timed: true,
  tMax(p) {
    const d = melting(p, 0);
    const extra = p.m * p.cL * 20;
    return Math.min(400, (d.Q2 + extra) / Math.max(p.P, 1));
  },
  authority: 'Constant power P. A crystal uses Q = m c ΔT off the plateau and Q = m Lf on it, so temperature stays at the melting point while heat is still absorbed. With the crystal switch off there is no latent-heat plateau.',
  params: { m: 0.1, P: 200, cS: 2100, cL: 4200, Lf: 3.34e5, T0: -20, Tm: 0, crystal: true },
  schema: [
    tog('crystal', 'Crystal', '晶体'),
    num('P', 'Heating power', '加热功率', 'W', 20, 800, 10),
    num('m', 'Mass', '质量', 'kg', 0.02, 0.5, 0.01),
    num('T0', 'Start temperature', '初温', '°C', -40, 0, 1),
    num('Tm', 'Melting point', '熔点', '°C', -10, 20, 1),
  ],
  compute: (p, t) => melting(p, t),
  readouts: (d) => [
    ro('T', 'T', `${fmt(d.T, 2)} °C`),
    ro('Phase', '阶段', { en: PHASE[d.phase][0], zh: PHASE[d.phase][1] }),
    ro('Q', 'Q', `${fmt(d.Q, 0)} J`),
    ro('Melted', '已熔化', fmt(d.fraction, 2)),
  ],
  checks: (d) => [
    q('T', 'The temperature now is', '现在的温度是', [
      opt(`${fmt(d.T, 2)} °C`, `${fmt(d.T, 2)} °C`),
      opt(`${fmt(Math.abs(d.T - d.T0) > 0.2 ? d.T0 : d.T + 8, 2)} °C`, `${fmt(Math.abs(d.T - d.T0) > 0.2 ? d.T0 : d.T + 8, 2)} °C`),
    ], 0),
    q('plat', 'On a crystal’s plateau', '晶体的平台段上', [
      opt(d.phase === 'melting' ? 'heat is absorbed and T stays at the melting point (this is that interval)' : 'heat is absorbed and T stays at the melting point', d.phase === 'melting' ? '吸热，温度停在熔点（现在就是）' : '吸热，温度停在熔点'),
      opt('temperature keeps rising at the same rate', '温度仍按原来的速率上升'),
    ], 0),
  ],
  debug: {
    en: 'Spending the latent heat on a temperature rise removes the plateau.',
    zh: '把熔化热也拿去升温，平台就消失了。',
    toggleEn: 'Turn latent heat into a temperature rise',
    toggleZh: '把熔化热也算成升温',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    // Wide: T–t left / Lf panel right. Narrow (≤360): stack.
    const narrow = w <= 360;
    const schX = narrow ? w * 0.06 : w * 0.04;
    const schY = narrow ? h * 0.06 : h * 0.1;
    const schW = narrow ? w * 0.88 : w * 0.52;
    const schH = narrow ? h * 0.48 : h * 0.8;
    const gx = schX + schW * 0.1;
    const gy = schY + schH * 0.82;
    const gw = schW * 0.8;
    const gh = schH * 0.58;
    const tEnd = meltSim.tMax(p);
    line(ctx, gx, gy, gx + gw, gy, INK, 1.2);
    line(ctx, gx, gy, gx, gy - gh, INK, 1.2);
    const temps = [];
    for (let i = 0; i <= 60; i += 1) temps.push(melting(p, (tEnd * i) / 60).T);
    const tMin = Math.min(d.T0, ...temps) - 5;
    const tMax = Math.max(d.Tm + 15, ...temps);
    const X = (t) => gx + (t / tEnd) * gw;
    const Y = (T) => gy - ((T - tMin) / (tMax - tMin)) * gh;
    if (d.crystal && Number.isFinite(d.t1)) {
      ctx.fillStyle = 'rgba(196,73,29,0.2)';
      ctx.fillRect(X(d.t1), Y(d.Tm + 4), Math.max(0, X(d.t2) - X(d.t1)), Y(d.Tm - 4) - Y(d.Tm + 4));
      text(ctx, lab(ui, 'T fixed', 'T 不变'), (X(d.t1) + X(d.t2)) / 2, Y(d.Tm) - 12, RAY, 11, 'center');
    }
    ctx.beginPath();
    for (let i = 0; i <= 60; i += 1) {
      const tt = (tEnd * i) / 60;
      const sample = ui.wrong && d.crystal
        ? d.T0 + (p.P * tt) / (p.m * p.cS)
        : melting(p, tt).T;
      const Xc = X(tt);
      const Yc = Y(sample);
      if (i === 0) ctx.moveTo(Xc, Yc);
      else ctx.lineTo(Xc, Yc);
    }
    ctx.strokeStyle = ui.wrong ? '#a33' : RAY2;
    ctx.lineWidth = 2;
    ctx.stroke();
    const nowT = ui.wrong && d.crystal ? d.T0 + d.Q / (d.m * p.cS) : d.T;
    ctx.fillStyle = RAY;
    ctx.beginPath();
    ctx.arc(X(d.t), Y(nowT), 5, 0, Math.PI * 2);
    ctx.fill();

    const panelX = narrow ? w * 0.06 : w * 0.6;
    const panelY = narrow ? h * 0.58 : h * 0.12;
    const panelW = narrow ? w * 0.88 : w * 0.36;
    const panelH = narrow ? h * 0.38 : h * 0.76;
    teachPanel(ctx, panelX, panelY, panelW, panelH, lab(ui, 'Q = m Lf', 'Q = m Lf'));
    text(ctx, `${fmt(d.T, 1)} °C`, panelX + panelW / 2, panelY + panelH * 0.4, ui.wrong ? '#a33' : RAY, 14, 'center');
    text(ctx, lab(ui, PHASE[d.phase]?.[0] || d.phase, PHASE[d.phase]?.[1] || d.phase), panelX + panelW / 2, panelY + panelH * 0.68, MUTED, 12, 'center');
    ui._geo = { gx, gw, tEnd };
  },
  pointer(ev, _p, _d, ui) {
    const g = ui._geo;
    if (!g) return null;
    if (ev.type === 'down') { ui.drag = 't'; return {}; }
    if (ev.type === 'up') { ui.drag = null; return {}; }
    return { __clock: Math.min(g.tEnd, Math.max(0, ((ev.x - g.gx) / g.gw) * g.tEnd)) };
  },
};

const BOIL_PHASE = {
  liquid: ['liquid', '液态'],
  boiling: ['boiling', '沸腾'],
  vapour: ['vapour', '气态'],
  warming: ['warming', '升温'],
};

export const boilSim = {
  id: 'boiling',
  timed: true,
  tMax(p) {
    const d = boiling(p, 0);
    const extra = p.m * p.cV * 20;
    return Math.min(400, (d.Q2 + extra) / Math.max(p.P, 1));
  },
  authority: 'Constant power P. Temperature climbs until the boiling point Tb, then stays at Tb while the latent heat of vaporisation Lv is absorbed (Q = m Lv). After that the vapour warms again.',
  params: { m: 0.1, P: 400, cL: 4200, cV: 2000, Lv: 2.26e6, T0: 20, Tb: 100 },
  schema: [
    num('P', 'Heating power', '加热功率', 'W', 50, 2000, 10),
    num('m', 'Mass', '质量', 'kg', 0.02, 0.5, 0.01),
    num('T0', 'Start temperature', '初温', '°C', 0, 90, 1),
    num('Tb', 'Boiling point', '沸点', '°C', 80, 120, 1),
  ],
  compute: (p, t) => boiling(p, t),
  readouts: (d) => [
    ro('T', 'T', `${fmt(d.T, 2)} °C`),
    ro('Phase', '阶段', { en: BOIL_PHASE[d.phase][0], zh: BOIL_PHASE[d.phase][1] }),
    ro('Q', 'Q', `${fmt(d.Q, 0)} J`),
    ro('Vaporised', '已汽化', fmt(d.fraction, 2)),
  ],
  checks: (d) => [
    q('T', 'The temperature now is', '现在的温度是', [
      opt(`${fmt(d.T, 2)} °C`, `${fmt(d.T, 2)} °C`),
      opt(`${fmt(d.T === d.Tb ? d.T0 : d.Tb, 2)} °C`, `${fmt(d.T === d.Tb ? d.T0 : d.Tb, 2)} °C`),
    ], 0),
    q('plat', 'On the boiling plateau', '沸腾平台段上', [
      opt(d.phase === 'boiling' ? 'heat is absorbed and T stays at Tb (this is that interval)' : 'heat is absorbed and T stays at Tb', d.phase === 'boiling' ? '吸热，温度停在沸点（现在就是）' : '吸热，温度停在沸点'),
      opt('temperature keeps rising at the same rate', '温度仍按原来的速率上升'),
    ], 0),
  ],
  debug: {
    en: 'Spending Lv on a temperature rise removes the boiling plateau.',
    zh: '把汽化热也拿去升温，平台就消失了。',
    toggleEn: 'Turn Lv into a temperature rise',
    toggleZh: '把汽化热也算成升温',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    // Wide: T–t left / Lv panel right. Narrow (≤360): stack.
    const narrow = w <= 360;
    const schX = narrow ? w * 0.06 : w * 0.04;
    const schY = narrow ? h * 0.06 : h * 0.1;
    const schW = narrow ? w * 0.88 : w * 0.52;
    const schH = narrow ? h * 0.48 : h * 0.8;
    const gx = schX + schW * 0.1;
    const gy = schY + schH * 0.82;
    const gw = schW * 0.8;
    const gh = schH * 0.58;
    const tEnd = boilSim.tMax(p);
    line(ctx, gx, gy, gx + gw, gy, INK, 1.2);
    line(ctx, gx, gy, gx, gy - gh, INK, 1.2);
    const temps = [];
    for (let i = 0; i <= 60; i += 1) temps.push(boiling(p, (tEnd * i) / 60).T);
    const tMin = Math.min(d.T0, ...temps) - 5;
    const tMax = Math.max(d.Tb + 15, ...temps);
    const X = (t) => gx + (t / tEnd) * gw;
    const Y = (T) => gy - ((T - tMin) / (tMax - tMin)) * gh;
    if (Number.isFinite(d.t1)) {
      ctx.fillStyle = 'rgba(196,73,29,0.2)';
      ctx.fillRect(X(d.t1), Y(d.Tb + 4), Math.max(0, X(d.t2) - X(d.t1)), Y(d.Tb - 4) - Y(d.Tb + 4));
      text(ctx, lab(ui, 'T fixed', 'T 不变'), (X(d.t1) + X(d.t2)) / 2, Y(d.Tb) - 12, RAY, 11, 'center');
    }
    ctx.beginPath();
    for (let i = 0; i <= 60; i += 1) {
      const tt = (tEnd * i) / 60;
      const sample = ui.wrong ? d.T0 + (p.P * tt) / (p.m * p.cL) : boiling(p, tt).T;
      const Xc = X(tt);
      const Yc = Y(sample);
      if (i === 0) ctx.moveTo(Xc, Yc);
      else ctx.lineTo(Xc, Yc);
    }
    ctx.strokeStyle = ui.wrong ? '#a33' : RAY2;
    ctx.lineWidth = 2;
    ctx.stroke();
    const nowT = ui.wrong ? d.T0 + d.Q / (d.m * p.cL) : d.T;
    ctx.fillStyle = RAY;
    ctx.beginPath();
    ctx.arc(X(d.t), Y(nowT), 5, 0, Math.PI * 2);
    ctx.fill();

    const panelX = narrow ? w * 0.06 : w * 0.6;
    const panelY = narrow ? h * 0.58 : h * 0.12;
    const panelW = narrow ? w * 0.88 : w * 0.36;
    const panelH = narrow ? h * 0.38 : h * 0.76;
    teachPanel(ctx, panelX, panelY, panelW, panelH, lab(ui, 'Q = m Lv', 'Q = m Lv'));
    text(ctx, `${fmt(d.T, 1)} °C`, panelX + panelW / 2, panelY + panelH * 0.4, ui.wrong ? '#a33' : RAY, 14, 'center');
    text(ctx, lab(ui, BOIL_PHASE[d.phase]?.[0] || d.phase, BOIL_PHASE[d.phase]?.[1] || d.phase), panelX + panelW / 2, panelY + panelH * 0.68, MUTED, 12, 'center');
    ui._geo = { gx, gw, tEnd };
  },
  pointer(ev, _p, _d, ui) {
    const g = ui._geo;
    if (!g) return null;
    if (ev.type === 'down') { ui.drag = 't'; return {}; }
    if (ev.type === 'up') { ui.drag = null; return {}; }
    return { __clock: Math.min(g.tEnd, Math.max(0, ((ev.x - g.gx) / g.gw) * g.tEnd)) };
  },
};

const SUB_PHASE = {
  solid: ['solid', '固态'],
  sublimating: ['sublimating', '升华'],
  gas: ['gas', '气态'],
  warming: ['warming', '升温'],
};

export const sublimeSim = {
  id: 'sublimation',
  timed: true,
  tMax(p) {
    const d = sublimation(p, 0);
    const extra = p.m * p.cG * 20;
    return Math.min(400, (d.Q2 + extra) / Math.max(p.P, 1));
  },
  authority: 'Constant power P. A solid that sublimes stays at Ts while the latent heat of sublimation Ls is absorbed, then becomes gas. There is no liquid interval in this model.',
  params: { m: 0.05, P: 200, cS: 1500, cG: 1000, Ls: 5.9e5, T0: -40, Ts: -20 },
  schema: [
    num('P', 'Heating power', '加热功率', 'W', 20, 800, 10),
    num('m', 'Mass', '质量', 'kg', 0.01, 0.3, 0.01),
    num('T0', 'Start temperature', '初温', '°C', -80, -10, 1),
    num('Ts', 'Sublimation point', '升华点', '°C', -40, 0, 1),
  ],
  compute: (p, t) => sublimation(p, t),
  readouts: (d) => [
    ro('T', 'T', `${fmt(d.T, 2)} °C`),
    ro('Phase', '阶段', { en: SUB_PHASE[d.phase][0], zh: SUB_PHASE[d.phase][1] }),
    ro('Q', 'Q', `${fmt(d.Q, 0)} J`),
    ro('Gone', '已升华', fmt(d.fraction, 2)),
  ],
  checks: (d) => [
    q('T', 'The temperature now is', '现在的温度是', [
      opt(`${fmt(d.T, 2)} °C`, `${fmt(d.T, 2)} °C`),
      opt(`${fmt(d.T === d.Ts ? d.T0 : d.Ts, 2)} °C`, `${fmt(d.T === d.Ts ? d.T0 : d.Ts, 2)} °C`),
    ], 0),
    q('plat', 'On the sublimation plateau', '升华平台段上', [
      opt(d.phase === 'sublimating' ? 'heat is absorbed and T stays at Ts (this is that interval)' : 'heat is absorbed and T stays at Ts', d.phase === 'sublimating' ? '吸热，温度停在升华点（现在就是）' : '吸热，温度停在升华点'),
      opt('a liquid layer appears first', '先出现一层液体'),
    ], 0),
  ],
  debug: {
    en: 'Spending Ls on a temperature rise removes the sublimation plateau.',
    zh: '把升华热也拿去升温，平台就消失了。',
    toggleEn: 'Turn Ls into a temperature rise',
    toggleZh: '把升华热也算成升温',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    const gx = w * 0.12;
    const gy = h * 0.78;
    const gw = w * 0.76;
    const gh = h * 0.55;
    const tEnd = sublimeSim.tMax(p);
    line(ctx, gx, gy, gx + gw, gy, INK, 1.2);
    line(ctx, gx, gy, gx, gy - gh, INK, 1.2);
    const temps = [];
    for (let i = 0; i <= 60; i += 1) temps.push(sublimation(p, (tEnd * i) / 60).T);
    const tMin = Math.min(d.T0, ...temps) - 5;
    const tMax = Math.max(d.Ts + 15, ...temps);
    const X = (t) => gx + (t / tEnd) * gw;
    const Y = (T) => gy - ((T - tMin) / (tMax - tMin)) * gh;
    if (Number.isFinite(d.t1)) {
      ctx.fillStyle = 'rgba(196,73,29,0.2)';
      ctx.fillRect(X(d.t1), Y(d.Ts + 4), Math.max(0, X(d.t2) - X(d.t1)), Y(d.Ts - 4) - Y(d.Ts + 4));
      text(ctx, lab(ui, 'solid → gas', '固→气'), (X(d.t1) + X(d.t2)) / 2, Y(d.Ts) - 14, RAY, 12, 'center');
    }
    ctx.beginPath();
    for (let i = 0; i <= 60; i += 1) {
      const tt = (tEnd * i) / 60;
      const sample = ui.wrong ? d.T0 + (p.P * tt) / (p.m * p.cS) : sublimation(p, tt).T;
      if (i === 0) ctx.moveTo(X(tt), Y(sample));
      else ctx.lineTo(X(tt), Y(sample));
    }
    ctx.strokeStyle = ui.wrong ? '#a33' : RAY2;
    ctx.lineWidth = 2;
    ctx.stroke();
    const nowT = ui.wrong ? d.T0 + d.Q / (d.m * p.cS) : d.T;
    ctx.fillStyle = RAY;
    ctx.beginPath();
    ctx.arc(X(d.t), Y(nowT), 5, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, `${fmt(d.T, 1)} °C`, gx, gy - gh - 6, INK, 13);
    ui._geo = { gx, gw, tEnd };
  },
  pointer(ev, _p, _d, ui) {
    const g = ui._geo;
    if (!g) return null;
    if (ev.type === 'down') { ui.drag = 't'; return {}; }
    if (ev.type === 'up') { ui.drag = null; return {}; }
    return { __clock: Math.min(g.tEnd, Math.max(0, ((ev.x - g.gx) / g.gw) * g.tEnd)) };
  },
};
