import { fmt } from '../fmt.js?v=__BUILD__';
import { lengthContraction } from '../physics/stat.js?v=__BUILD__';
import { num, clear, line, text, INK, MUTED, RAY, RAY2 } from './kit.js?v=__BUILD__';

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
    const Lshow = ui.wrong ? d.L0 * d.gamma : d.L;
    line(ctx, w * 0.15, h * 0.35, w * 0.15 + d.L0 * w * 0.12, h * 0.35, RAY, 10);
    line(ctx, w * 0.15, h * 0.6, w * 0.15 + Lshow * w * 0.12, h * 0.6, RAY2, 10);
    text(ctx, `ℓ0=${fmt(d.L0, 2)}`, w * 0.5, h * 0.28, MUTED, 12, 'center');
    text(ctx, `ℓ=${fmt(Lshow, 2)}`, w * 0.5, h * 0.72, ui.wrong ? '#a33' : INK, 12, 'center');
  },
  pointer() { return null; },
};
