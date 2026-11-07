import { fmt } from '../fmt.js?v=__BUILD__';
import { lengthContraction } from '../physics/stat.js?v=__BUILD__';
import { num, clear, line, text, lab, teachPanel, INK, MUTED, RAY, RAY2 } from './kit.js?v=__BUILD__';

function q(id, en, zh, options, answer) { return { id, en, zh, options, answer }; }
function opt(en, zh) { return { en, zh }; }
function ro(en, zh, value) { return { en, zh, value }; }

export const lengthSim = {
  id: 'length-contraction',
  timed: false,
  authority: 'Length contraction: ℓ = ℓ0 / γ with γ = 1/√(1 − v²/c²). Teaching relation only.',
  params: { L0: 1, v: 1.5e8 },
  schema: [
    num('L0', 'Proper length ℓ0', '固有长度 ℓ0', 'm', 0.2, 5, 0.1),
    num('v', 'Speed v', '速率 v', 'm/s', 1e7, 2.9e8, 1e7),
  ],
  compute: (p) => lengthContraction(p),
  readouts: (d) => [
    ro('γ', 'γ', fmt(d.gamma, 4)),
    ro('ℓ', 'ℓ', `${fmt(d.L, 3)} m`),
  ],
  checks: (d) => [
    q('L', 'Contracted length is', '收缩后长度是', [
      opt(`${fmt(d.L, 3)} m = ℓ0 / γ`, `${fmt(d.L, 3)} m = ℓ0 / γ`),
      opt(`${fmt(d.L0 * d.gamma, 3)} m`, `${fmt(d.L0 * d.gamma, 3)} m`),
    ], 0),
  ],
  debug: {
    en: 'Using ℓ = ℓ0 γ lengthens the rod instead of contracting it.',
    zh: '写成 ℓ = ℓ0 γ 会把杆拉长而不是缩短。',
    toggleEn: 'Use ℓ = ℓ0 γ',
    toggleZh: '改用 ℓ = ℓ0 γ',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    // Wide: rods left / ℓ=ℓ0/γ panel right. Narrow (≤360): stack.
    const narrow = w <= 360;
    const Lshow = ui.wrong ? d.L0 * d.gamma : d.L;
    const schX = narrow ? w * 0.06 : w * 0.04;
    const schY = narrow ? h * 0.08 : h * 0.12;
    const schW = narrow ? w * 0.88 : w * 0.5;
    const schH = narrow ? h * 0.4 : h * 0.76;
    const rodScale = Math.min(schW * 0.7, 180) / Math.max(d.L0, 0.2);
    const y0 = schY + schH * 0.32;
    const y1 = schY + schH * 0.68;
    const x0 = schX + schW * 0.12;
    line(ctx, x0, y0, x0 + d.L0 * rodScale, y0, RAY, 10);
    line(ctx, x0, y1, x0 + Lshow * rodScale, y1, RAY2, 10);
    text(ctx, `ℓ0=${fmt(d.L0, 2)}`, schX + schW / 2, y0 - 16, MUTED, 12, 'center');
    text(ctx, `ℓ=${fmt(Lshow, 2)}`, schX + schW / 2, y1 + 20, ui.wrong ? '#a33' : INK, 12, 'center');

    const panelX = narrow ? w * 0.06 : w * 0.58;
    const panelY = narrow ? h * 0.52 : h * 0.12;
    const panelW = narrow ? w * 0.88 : w * 0.38;
    const panelH = narrow ? h * 0.44 : h * 0.76;
    teachPanel(ctx, panelX, panelY, panelW, panelH, lab(ui, 'ℓ = ℓ0 / γ', 'ℓ = ℓ0 / γ'));
    text(ctx, `γ=${fmt(d.gamma, 3)}`, panelX + panelW / 2, panelY + panelH * 0.4, MUTED, 14, 'center');
    text(ctx, ui.wrong ? 'ℓ = ℓ0 γ' : `ℓ=${fmt(Lshow, 3)} m`, panelX + panelW / 2, panelY + panelH * 0.65, ui.wrong ? '#a33' : RAY, 14, 'center');
  },
  pointer() { return null; },
};
