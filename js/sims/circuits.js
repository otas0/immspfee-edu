import { fmt } from '../fmt.js';
import { circuit, electricalEnergy, toggleLink, CIRCUIT_LINKS, acPeakRms, transformer } from '../physics/circuits.js';
import { num, sel, tog, clear, line, text, handle, hit, lab, teachPanel, INK, MUTED, RAY, RAY2 } from './kit.js';

function q(id, en, zh, options, answer) { return { id, en, zh, options, answer }; }
function opt(en, zh) { return { en, zh }; }
function ro(en, zh, value, flags) { return { en, zh, value, ...(flags || {}) }; }

const LAYOUTS = [
  { value: 'series', en: 'Series', zh: '串联' },
  { value: 'parallel', en: 'Parallel', zh: '并联' },
  { value: 'ohm', en: 'Rheostat', zh: '变阻器' },
  { value: 'household', en: 'Household', zh: '家庭电路' },
];

/** Schematic ports live in the upper band only; the I–U panel is drawn below. */
function portsOf(w, h) {
  const yTop = h * 0.2;
  const yBot = h * 0.44;
  const yMid = (yTop + yBot) / 2;
  return {
    bp: [w * 0.1, yTop],
    bn: [w * 0.1, yBot],
    s1: [w * 0.24, yTop],
    s2: [w * 0.34, yTop],
    a1: [w * 0.46, yTop],
    a2: [w * 0.58, yTop],
    b1: [w * 0.46, yBot],
    b2: [w * 0.58, yBot],
    h1: [w * 0.7, yMid],
    h2: [w * 0.82, yMid],
  };
}

export const circuitSim = {
  id: 'circuit',
  timed: false,
  authority: 'Steady DC. The source is an emf E in series with internal resistance r, so a short across the terminals draws I = E/r. Resistors follow Ohm’s law. On a load, W = U I t, P = U I, and Q = I² R t. Ideal wires have no resistance. The I–U line of a resistor is U = IR.',
  params: {
    layout: 'series',
    links: CIRCUIT_LINKS.series,
    closed: true,
    E: 3,
    r: 0.5,
    R1: 4,
    R2: 6,
    Rs: 10,
    t: 0,
  },
  schema: [
    sel('layout', 'Starter wiring', '初始接法', LAYOUTS),
    tog('closed', 'Switch closed', '开关闭合'),
    num('E', 'Emf E', '电动势 E', 'V', 0.5, 12, 0.1),
    num('r', 'Internal r', '内阻 r', 'Ω', 0.1, 5, 0.1),
    num('R1', 'R1', 'R1', 'Ω', 0, 40, 0.5),
    num('R2', 'R2', 'R2', 'Ω', 0, 40, 0.5),
    num('Rs', 'Rheostat Rs', '变阻器 Rs', 'Ω', 0, 40, 0.5),
    num('t', 'Time t', '时间 t', 's', 0, 60, 0.5),
  ],
  onParam(key, value) {
    if (key === 'layout' && CIRCUIT_LINKS[value]) return { links: CIRCUIT_LINKS[value] };
    return {};
  },
  compute: (p) => ((p.t ?? 0) > 0 || p.layout === 'household' ? electricalEnergy(p) : circuit(p)),
  /** Debug overlay adds bp–bn; recompute so readouts match the stage. */
  computeForUi(p, t, ui) {
    const links = ui?.wrong
      ? (String(p.links || '').includes('bp-bn') ? p.links : `${p.links},bp-bn`)
      : p.links;
    return this.compute({ ...p, links }, t);
  },
  readouts: (d) => {
    const fault = d.batteryShort
      ? { en: 'short', zh: '短路' }
      : d.fault === 'short'
        ? { en: 'load bypassed', zh: '负载被旁路' }
        : d.fault === 'open' ? { en: 'open', zh: '断路' } : { en: 'closed path', zh: '通路' };
    // Match canvas fault ink (#a33) for short / load-bypassed path rows.
    const pathWarn = !!(d.batteryShort || d.fault === 'short');
    const rows = [
      ro('Path', '电路', fault, pathWarn ? { warn: true } : null),
      ro('I', 'I', `${fmt(d.I, 3)} A`),
      ro('U1', 'U1', `${fmt(d.U1, 3)} V`),
      ro('I1', 'I1', `${fmt(d.I1, 3)} A`),
    ];
    if (d.P != null) {
      rows.push(
        ro('P', 'P', `${fmt(d.P, 3)} W`),
        ro('W', 'W', `${fmt(d.W, 3)} J`),
        ro('Q', 'Q', `${fmt(d.Q, 3)} J`),
      );
    } else {
      rows.push(
        ro('U2', 'U2', `${fmt(d.U2, 3)} V`),
        ro('I2', 'I2', `${fmt(d.I2, 3)} A`),
      );
    }
    return rows;
  },
  checks: (d) => {
    const rows = [
      q('I', 'The battery current is', '电源电流是', [
        opt(`${fmt(d.I, 3)} A`, `${fmt(d.I, 3)} A`),
        opt(`${fmt(d.E / Math.max(d.R1, 0.1), 3)} A`, `${fmt(d.E / Math.max(d.R1, 0.1), 3)} A`),
        opt('0, because a wire uses no energy', '0，因为导线不消耗能量'),
      ], 0),
    ];
    if (d.P != null) {
      rows.push(
        q('P', 'The power in R1 is', 'R1 上的电功率是', [
          opt(`${fmt(d.P, 3)} W = U I`, `${fmt(d.P, 3)} W = U I`),
          opt(`${fmt(d.U * d.t, 3)} W`, `${fmt(d.U * d.t, 3)} W`),
          opt('E / r', 'E / r'),
        ], 0),
        q('Q', 'Joule heat in R1 equals', 'R1 上的焦耳热等于', [
          opt(`${fmt(d.Q, 3)} J = I² R t`, `${fmt(d.Q, 3)} J = I² R t`),
          opt(`${fmt(d.Iload * d.t, 3)} J`, `${fmt(d.Iload * d.t, 3)} J`),
          opt('only the battery emf', '只由电动势决定'),
        ], 0),
      );
    } else {
      rows.push(
        q('ohm', 'Across R1, U and I satisfy', '对 R1，U 和 I 满足', [
          opt(d.R1 > 1e-6 ? `U = I × ${fmt(d.R1, 2)} Ω` : 'R1 is a wire', d.R1 > 1e-6 ? `U = I × ${fmt(d.R1, 2)} Ω` : 'R1 是一根导线'),
          opt('U is the same for every resistor no matter how they are wired', '不论怎么接，每个电阻的电压都相同'),
        ], 0),
      );
    }
    return rows;
  },
  debug: {
    en: 'A wire from the positive terminal to the negative terminal bypasses the resistors. The current is then E/r, not the current of the intended loop.',
    zh: '用一根导线把电源正负极直接连上，电阻被旁路。电流变成 E/r，不再是原来回路里的电流。',
    toggleEn: 'Add a wire across the battery',
    toggleZh: '在电源两端加一根导线',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    const ports = portsOf(w, h);
    const household = p.layout === 'household';
    // Status strip (never overlaps the I–U panel).
    // Red「短路」/ E/r only for a battery short (bp–bn), including the debug overlay wire.
    const batteryShort = !!(ui.wrong || d.batteryShort);
    const fault = batteryShort
      ? lab(ui, 'short circuit', '短路')
      : d.fault === 'open'
        ? lab(ui, 'open circuit', '断路')
        : d.fault === 'short'
          ? lab(ui, 'load bypassed', '负载被旁路')
          : lab(ui, 'closed path', '通路');
    text(ctx, fault, w * 0.2, h * 0.07, d.fault === 'ok' && !batteryShort ? INK : '#a33', 15, 'center');
    text(ctx, `I=${fmt(d.I, 2)} A`, w * 0.42, h * 0.07, MUTED, 12, 'center');
    if (batteryShort) text(ctx, `E/r=${fmt(d.E / d.r, 2)} A`, w * 0.62, h * 0.07, '#a33', 12, 'center');
    if (d.P != null) {
      text(ctx, `P=${fmt(d.P, 2)} W`, w * 0.82, h * 0.05, RAY2, 12, 'center');
      text(ctx, `Q=${fmt(d.Q, 2)} J`, w * 0.82, h * 0.1, RAY, 12, 'center');
    }

    const links = String(ui.wrong ? `${p.links},bp-bn` : p.links);
    const shown = links.split(',').map((s) => s.trim()).filter(Boolean);
    for (const row of shown) {
      const [a, b] = row.split('-');
      if (!ports[a] || !ports[b]) continue;
      const shortWire = (a === 'bp' && b === 'bn') || (a === 'bn' && b === 'bp');
      line(ctx, ports[a][0], ports[a][1], ports[b][0], ports[b][1], shortWire || batteryShort ? '#a33' : INK, 2);
    }
    if (p.closed) line(ctx, ports.s1[0], ports.s1[1], ports.s2[0], ports.s2[1], INK, 2);
    line(ctx, ports.bp[0], ports.bp[1], ports.bn[0], ports.bn[1], RAY, 4);
    text(ctx, household ? lab(ui, 'supply', '电源') : 'E', ports.bp[0] - 20, (ports.bp[1] + ports.bn[1]) / 2, RAY, 12);
    if (household) {
      text(ctx, lab(ui, 'live', '火线'), ports.s1[0], ports.s1[1] - 18, RAY, 12, 'center');
      text(ctx, lab(ui, 'neutral', '零线'), ports.bn[0] + 36, ports.bn[1] + 16, MUTED, 12);
      // Earth stays inside the schematic band (above the I–U panel).
      const earthY = Math.min(ports.bn[1] + h * 0.05, h * 0.5);
      line(ctx, ports.bn[0] + 56, ports.bn[1], ports.a2[0], earthY, MUTED, 1.5, [3, 3]);
      text(ctx, lab(ui, 'earth', '地线'), (ports.bn[0] + 56 + ports.a2[0]) / 2, earthY + 12, MUTED, 11, 'center');
      text(ctx, lab(ui, 'appliance R', '用电器 R'), (ports.a1[0] + ports.a2[0]) / 2, ports.a1[1] - 22, INK, 12, 'center');
    }
    text(ctx, lab(ui, 'schematic', '电路图'), w * 0.92, h * 0.14, MUTED, 11, 'right');
    const box = (x, y, name) => {
      ctx.strokeStyle = INK;
      ctx.strokeRect(x - 18, y - 12, 36, 24);
      text(ctx, name, x, y, INK, 12, 'center');
    };
    const loadX = (ports.a1[0] + ports.a2[0]) / 2;
    box(loadX, ports.a1[1], household ? 'R' : 'R1');
    if (d.P != null) {
      const heat = Math.min(1, d.Q / Math.max(d.P * 20, 1));
      ctx.fillStyle = `rgba(196,73,29,${0.15 + 0.55 * heat})`;
      ctx.fillRect(loadX - 18, ports.a1[1] - 12, 36, 24);
      box(loadX, ports.a1[1], household ? 'R' : 'R1');
    }
    if (!household) {
      box((ports.b1[0] + ports.b2[0]) / 2, ports.b1[1], 'R2');
      box((ports.h1[0] + ports.h2[0]) / 2, ports.h1[1], 'Rs');
    }
    text(ctx, p.closed ? lab(ui, 'switch', '开关') : lab(ui, 'open switch', '开关断开'), (ports.s1[0] + ports.s2[0]) / 2, ports.s1[1] - 16, MUTED, 11, 'center');

    // Dedicated I–U teaching panel under the schematic (opaque — no bleed).
    const panelX = w * 0.06;
    const panelY = h * 0.56;
    const panelW = w * 0.88;
    const panelH = h * 0.4;
    teachPanel(ctx, panelX, panelY, panelW, panelH, lab(ui, 'I–U of the load', '负载的 I–U'));
    const gx = panelX + panelW * 0.1;
    const gy = panelY + panelH * 0.82;
    const gw = panelW * 0.7;
    const gh = panelH * 0.55;
    line(ctx, gx, gy, gx + gw, gy, INK, 1);
    line(ctx, gx, gy, gx, gy - gh, INK, 1);
    text(ctx, 'U', gx + gw + 8, gy, MUTED, 11);
    text(ctx, 'I', gx - 12, gy - gh, MUTED, 11);
    if (d.R1 > 1e-6) {
      const uMax = Math.max(d.E, Math.abs(d.U1), 0.5);
      const iMax = Math.max(uMax / d.R1, Math.abs(d.I1), 0.05);
      const x = gx + (Math.abs(d.U1) / uMax) * gw;
      const y = gy - (Math.abs(d.I1) / iMax) * gh;
      line(ctx, gx, gy, gx + gw, gy - (uMax / d.R1 / iMax) * gh, RAY2, 1.5);
      ctx.fillStyle = RAY;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
      text(ctx, `U=${fmt(Math.abs(d.U1), 2)} V`, gx + gw * 0.55, panelY + panelH * 0.28, MUTED, 11);
      text(ctx, `I=${fmt(Math.abs(d.I1), 2)} A`, gx + gw * 0.55, panelY + panelH * 0.4, MUTED, 11);
    } else {
      text(ctx, lab(ui, 'R≈0 (wire)', 'R≈0（导线）'), gx + gw * 0.4, gy - gh * 0.5, MUTED, 12, 'center');
    }

    for (const [name, xy] of Object.entries(ports)) {
      if (household && (name === 'b1' || name === 'b2' || name === 'h1' || name === 'h2')) continue;
      handle(ctx, xy[0], xy[1], ui.drag === name);
    }
    if (ui.drag && ports[ui.drag] && ui._mouse) {
      line(ctx, ports[ui.drag][0], ports[ui.drag][1], ui._mouse[0], ui._mouse[1], RAY, 1.5, [4, 3]);
    }
    if (!household) {
      const rsX = ports.h1[0] + ((ports.h2[0] - ports.h1[0]) * d.Rs) / 40;
      handle(ctx, rsX, ports.h1[1] + 22, ui.drag === 'rs');
    }
    ui._geo = { ports, household };
  },
  pointer(ev, p, _d, ui) {
    const g = ui._geo;
    if (!g) return null;
    ui._mouse = [ev.x, ev.y];
    if (ev.type === 'down') {
      if (!g.household) {
        const rsX = g.ports.h1[0] + ((g.ports.h2[0] - g.ports.h1[0]) * p.Rs) / 40;
        if (hit(ev.x, ev.y, rsX, g.ports.h1[1] + 22)) {
          ui.drag = 'rs';
          return {};
        }
      }
      for (const [name, xy] of Object.entries(g.ports)) {
        if (g.household && (name === 'b1' || name === 'b2' || name === 'h1' || name === 'h2')) continue;
        if (hit(ev.x, ev.y, xy[0], xy[1], 12)) {
          ui.drag = name;
          return {};
        }
      }
      return null;
    }
    if (ev.type === 'move' && ui.drag === 'rs') {
      const span = g.ports.h2[0] - g.ports.h1[0];
      const Rs = Math.min(40, Math.max(0, ((ev.x - g.ports.h1[0]) / span) * 40));
      return { Rs };
    }
    if (ev.type === 'move') return {};
    if (ev.type === 'up') {
      const from = ui.drag;
      ui.drag = null;
      if (!from || from === 'rs') return {};
      for (const [name, xy] of Object.entries(g.ports)) {
        if (name !== from && hit(ev.x, ev.y, xy[0], xy[1], 14)) {
          return { links: toggleLink(p.links, from, name) };
        }
      }
      return {};
    }
    return null;
  },
};

export const acSim = {
  id: 'ac-rms',
  timed: true,
  tMax: (p) => Math.max(0.08, 4 / Math.max(p.f, 1)),
  authority: 'Sinusoidal AC: i = Im sin(ωt), and the rms values are I_rms = Im/√2 and V_rms = Vm/√2.',
  params: { Im: 2, Vm: 10, f: 50 },
  schema: [
    num('Im', 'Peak current Im', '峰值电流 Im', 'A', 0.2, 10, 0.1),
    num('Vm', 'Peak voltage Vm', '峰值电压 Vm', 'V', 1, 50, 1),
    num('f', 'Frequency f', '频率 f', 'Hz', 10, 100, 1),
  ],
  compute: (p, t) => acPeakRms(p, t),
  readouts: (d) => [
    ro('Irms', 'Irms', `${fmt(d.Irms, 3)} A`),
    ro('Vrms', 'Vrms', `${fmt(d.Vrms, 3)} V`),
    ro('i', 'i', `${fmt(d.i, 3)} A`),
  ],
  checks: (d) => [
    q('rms', 'The rms current is', '有效值电流是', [
      opt(`${fmt(d.Irms, 3)} A = Im/√2`, `${fmt(d.Irms, 3)} A = Im/√2`),
      opt(`${fmt(d.Im, 3)} A`, `${fmt(d.Im, 3)} A`),
    ], 0),
  ],
  debug: {
    en: 'Using I_rms = Im invents an rms equal to the peak.',
    zh: '写成 I_rms = Im，有效值就等于峰值了。',
    toggleEn: 'Use Irms = Im',
    toggleZh: '改用 Irms = Im',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    const gx = w * 0.1;
    const gy = h * 0.55;
    const gw = w * 0.8;
    const gh = h * 0.3;
    line(ctx, gx, gy, gx + gw, gy, MUTED, 1);
    ctx.beginPath();
    for (let i = 0; i <= 120; i += 1) {
      const tt = (i / 120) * (2 / d.f);
      const ii = d.Im * Math.sin(d.omega * tt);
      const x = gx + (i / 120) * gw;
      const y = gy - (ii / Math.max(d.Im, 1e-6)) * gh;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = RAY;
    ctx.lineWidth = 2;
    ctx.stroke();
    const Ishow = ui.wrong ? d.Im : d.Irms;
    text(ctx, `Irms=${fmt(Ishow, 3)} A`, w * 0.5, h * 0.15, ui.wrong ? '#a33' : INK, 16, 'center');
  },
  pointer() { return null; },
};

export const transformerSim = {
  id: 'transformer',
  timed: false,
  authority: 'Ideal transformer: U1/U2 = n1/n2 and I1/I2 = n2/n1, so input and output power match.',
  params: { n1: 100, n2: 20, U1: 220, I2: 5 },
  schema: [
    num('n1', 'Primary turns n1', '原边匝数 n1', '', 20, 400, 10),
    num('n2', 'Secondary turns n2', '副边匝数 n2', '', 10, 400, 10),
    num('U1', 'Primary U1', '原边电压 U1', 'V', 50, 400, 10),
    num('I2', 'Secondary I2', '副边电流 I2', 'A', 0.5, 20, 0.5),
  ],
  compute: (p) => transformer(p),
  readouts: (d) => [
    ro('U2', 'U2', `${fmt(d.U2, 2)} V`),
    ro('I1', 'I1', `${fmt(d.I1, 3)} A`),
    ro('P', 'P', `${fmt(d.Pin, 1)} W`),
  ],
  checks: (d) => [
    q('U', 'Secondary voltage is', '副边电压是', [
      opt(`${fmt(d.U2, 2)} V = U1 (n2/n1)`, `${fmt(d.U2, 2)} V = U1 (n2/n1)`),
      opt(`${fmt(d.U1 * (d.n1 / d.n2), 2)} V`, `${fmt(d.U1 * (d.n1 / d.n2), 2)} V`),
    ], 0),
  ],
  debug: {
    en: 'Using U2 = U1 (n1/n2) inverts the turns ratio.',
    zh: '写成 U2 = U1 (n1/n2) 会把匝数比颠倒。',
    toggleEn: 'Invert the turns ratio',
    toggleZh: '颠倒匝数比',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    ctx.strokeStyle = INK;
    ctx.strokeRect(w * 0.2, h * 0.3, w * 0.2, h * 0.35);
    ctx.strokeRect(w * 0.6, h * 0.3, w * 0.2, h * 0.35);
    line(ctx, w * 0.4, h * 0.35, w * 0.6, h * 0.35, MUTED, 2);
    line(ctx, w * 0.4, h * 0.6, w * 0.6, h * 0.6, MUTED, 2);
    const U2 = ui.wrong ? d.U1 * (d.n1 / d.n2) : d.U2;
    text(ctx, `U1=${fmt(d.U1, 0)} V`, w * 0.3, h * 0.22, MUTED, 12, 'center');
    text(ctx, `U2=${fmt(U2, 1)} V`, w * 0.7, h * 0.22, ui.wrong ? '#a33' : INK, 12, 'center');
    text(ctx, `n1:${fmt(d.n1, 0)}  n2:${fmt(d.n2, 0)}`, w * 0.5, h * 0.8, MUTED, 12, 'center');
  },
  pointer() { return null; },
};
