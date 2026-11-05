import { fmt } from '../fmt.js';
import { circuit, toggleLink, CIRCUIT_LINKS } from '../physics/circuits.js';
import { num, sel, tog, clear, line, text, handle, hit, lab, INK, MUTED, RAY, RAY2 } from './kit.js';

function q(id, en, zh, options, answer) { return { id, en, zh, options, answer }; }
function opt(en, zh) { return { en, zh }; }
function ro(en, zh, value) { return { en, zh, value }; }

const LAYOUTS = [
  { value: 'series', en: 'Series', zh: '串联' },
  { value: 'parallel', en: 'Parallel', zh: '并联' },
  { value: 'ohm', en: 'Rheostat', zh: '变阻器' },
];

function portsOf(w, h) {
  return {
    bp: [w * 0.1, h * 0.28],
    bn: [w * 0.1, h * 0.72],
    s1: [w * 0.24, h * 0.28],
    s2: [w * 0.34, h * 0.28],
    a1: [w * 0.46, h * 0.28],
    a2: [w * 0.58, h * 0.28],
    b1: [w * 0.46, h * 0.72],
    b2: [w * 0.58, h * 0.72],
    h1: [w * 0.7, h * 0.48],
    h2: [w * 0.82, h * 0.48],
  };
}

export const circuitSim = {
  id: 'circuit',
  timed: false,
  authority: 'Steady DC. The source is an emf E in series with internal resistance r, so a short across the terminals draws I = E/r. Resistors follow Ohm’s law. Ideal wires have no resistance. The I–U line of a resistor is U = IR.',
  params: {
    layout: 'series',
    links: CIRCUIT_LINKS.series,
    closed: true,
    E: 3,
    r: 0.5,
    R1: 4,
    R2: 6,
    Rs: 10,
  },
  schema: [
    sel('layout', 'Starter wiring', '初始接法', LAYOUTS),
    tog('closed', 'Switch closed', '开关闭合'),
    num('E', 'Emf E', '电动势 E', 'V', 0.5, 12, 0.1),
    num('r', 'Internal r', '内阻 r', 'Ω', 0.1, 5, 0.1),
    num('R1', 'R1', 'R1', 'Ω', 0, 40, 0.5),
    num('R2', 'R2', 'R2', 'Ω', 0, 40, 0.5),
    num('Rs', 'Rheostat Rs', '变阻器 Rs', 'Ω', 0, 40, 0.5),
  ],
  onParam(key, value) {
    if (key === 'layout' && CIRCUIT_LINKS[value]) return { links: CIRCUIT_LINKS[value] };
    return {};
  },
  compute: (p) => circuit(p),
  readouts: (d) => {
    const fault = d.fault === 'short'
      ? { en: 'short', zh: '短路' }
      : d.fault === 'open' ? { en: 'open', zh: '断路' } : { en: 'closed path', zh: '通路' };
    return [
      ro('Path', '电路', fault),
      ro('I', 'I', `${fmt(d.I, 3)} A`),
      ro('U1', 'U1', `${fmt(d.U1, 3)} V`),
      ro('I1', 'I1', `${fmt(d.I1, 3)} A`),
      ro('U2', 'U2', `${fmt(d.U2, 3)} V`),
      ro('I2', 'I2', `${fmt(d.I2, 3)} A`),
    ];
  },
  checks: (d) => [
    q('I', 'The battery current is', '电源电流是', [
      opt(`${fmt(d.I, 3)} A`, `${fmt(d.I, 3)} A`),
      opt(`${fmt(d.E / Math.max(d.R1, 0.1), 3)} A`, `${fmt(d.E / Math.max(d.R1, 0.1), 3)} A`),
      opt('0, because a wire uses no energy', '0，因为导线不消耗能量'),
    ], 0),
    q('ohm', 'Across R1, U and I satisfy', '对 R1，U 和 I 满足', [
      opt(d.R1 > 1e-6 ? `U = I × ${fmt(d.R1, 2)} Ω` : 'R1 is a wire', d.R1 > 1e-6 ? `U = I × ${fmt(d.R1, 2)} Ω` : 'R1 是一根导线'),
      opt('U is the same for every resistor no matter how they are wired', '不论怎么接，每个电阻的电压都相同'),
    ], 0),
  ],
  debug: {
    en: 'A wire from the positive terminal to the negative terminal bypasses the resistors. The current is then E/r, not the current of the intended loop.',
    zh: '用一根导线把电源正负极直接连上，电阻被旁路。电流变成 E/r，不再是原来回路里的电流。',
    toggleEn: 'Add a wire across the battery',
    toggleZh: '在电源两端加一根导线',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    const ports = portsOf(w, h);
    const links = String(ui.wrong ? `${p.links},bp-bn` : p.links);
    const shown = links.split(',').map((s) => s.trim()).filter(Boolean);
    for (const row of shown) {
      const [a, b] = row.split('-');
      if (!ports[a] || !ports[b]) continue;
      const shortWire = (a === 'bp' && b === 'bn') || (a === 'bn' && b === 'bp');
      line(ctx, ports[a][0], ports[a][1], ports[b][0], ports[b][1], shortWire || d.fault === 'short' ? '#a33' : INK, 2);
    }
    if (p.closed) line(ctx, ports.s1[0], ports.s1[1], ports.s2[0], ports.s2[1], INK, 2);
    line(ctx, ports.bp[0], ports.bp[1], ports.bn[0], ports.bn[1], RAY, 4);
    text(ctx, 'E', ports.bp[0] - 16, (ports.bp[1] + ports.bn[1]) / 2, RAY, 13);
    const box = (id, x, y, name) => {
      ctx.strokeStyle = INK;
      ctx.strokeRect(x - 18, y - 12, 36, 24);
      text(ctx, name, x, y, INK, 12, 'center');
    };
    box('R1', (ports.a1[0] + ports.a2[0]) / 2, ports.a1[1], 'R1');
    box('R2', (ports.b1[0] + ports.b2[0]) / 2, ports.b1[1], 'R2');
    box('Rs', (ports.h1[0] + ports.h2[0]) / 2, ports.h1[1], 'Rs');
    text(ctx, p.closed ? lab(ui, 'switch', '开关') : lab(ui, 'open switch', '开关断开'), (ports.s1[0] + ports.s2[0]) / 2, ports.s1[1] - 18, MUTED, 11, 'center');
    const fault = d.fault === 'short' ? lab(ui, 'short circuit', '短路') : d.fault === 'open' ? lab(ui, 'open circuit', '断路') : lab(ui, 'closed path', '通路');
    text(ctx, fault, w * 0.22, h * 0.1, d.fault === 'ok' ? INK : '#a33', 16);
    text(ctx, `I=${fmt(d.I, 2)} A`, w * 0.22, h * 0.16, MUTED, 12);
    if (ui.wrong) text(ctx, `E/r=${fmt(d.E / d.r, 2)} A`, w * 0.42, h * 0.16, '#a33', 12);

    const gx = w * 0.08;
    const gy = h * 0.84;
    const gw = w * 0.5;
    line(ctx, gx, gy, gx + gw, gy, INK, 1);
    line(ctx, gx, gy, gx, gy - h * 0.22, INK, 1);
    text(ctx, 'U', gx + gw + 8, gy, MUTED, 11);
    text(ctx, 'I', gx - 12, gy - h * 0.22, MUTED, 11);
    if (d.R1 > 1e-6) {
      const uMax = Math.max(d.E, Math.abs(d.U1), 0.5);
      const iMax = Math.max(uMax / d.R1, Math.abs(d.I1), 0.05);
      const x = gx + (Math.abs(d.U1) / uMax) * gw;
      const y = gy - (Math.abs(d.I1) / iMax) * h * 0.2;
      line(ctx, gx, gy, gx + gw, gy - (uMax / d.R1 / iMax) * h * 0.2, RAY2, 1.5);
      ctx.fillStyle = RAY;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const [name, xy] of Object.entries(ports)) {
      handle(ctx, xy[0], xy[1], ui.drag === name);
    }
    if (ui.drag && ports[ui.drag] && ui._mouse) {
      line(ctx, ports[ui.drag][0], ports[ui.drag][1], ui._mouse[0], ui._mouse[1], RAY, 1.5, [4, 3]);
    }
    const rsX = ports.h1[0] + ((ports.h2[0] - ports.h1[0]) * d.Rs) / 40;
    handle(ctx, rsX, ports.h1[1] + 28, ui.drag === 'rs');
    ui._geo = { ports };
  },
  pointer(ev, p, _d, ui) {
    const g = ui._geo;
    if (!g) return null;
    ui._mouse = [ev.x, ev.y];
    if (ev.type === 'down') {
      const rsX = g.ports.h1[0] + ((g.ports.h2[0] - g.ports.h1[0]) * p.Rs) / 40;
      if (hit(ev.x, ev.y, rsX, g.ports.h1[1] + 28)) {
        ui.drag = 'rs';
        return {};
      }
      for (const [name, xy] of Object.entries(g.ports)) {
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

