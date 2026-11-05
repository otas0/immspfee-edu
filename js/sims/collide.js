import { fmt } from '../fmt.js';
import { collide1d } from '../physics/collide.js';
import { num, sel, clear, line, text, lab, INK, MUTED, RAY, RAY2 } from './kit.js';

function q(id, en, zh, options, answer) { return { id, en, zh, options, answer }; }
function opt(en, zh) { return { en, zh }; }
function ro(en, zh, value) { return { en, zh, value }; }

const KINDS = [
  { value: 'elastic', en: 'Elastic', zh: '弹性' },
  { value: 'inelastic', en: 'Perfectly inelastic', zh: '完全非弹性' },
];

export const collideSim = {
  id: 'collide',
  timed: false,
  authority: 'One-dimensional collision. Total momentum m1 u1 + m2 u2 is conserved when no external impulse acts. Elastic also keeps kinetic energy; perfectly inelastic shares one final speed.',
  params: { m1: 2, m2: 1, u1: 3, u2: 0, kind: 'elastic' },
  schema: [
    sel('kind', 'Collision', '碰撞类型', KINDS),
    num('m1', 'Mass m1', '质量 m1', 'kg', 0.2, 5, 0.1),
    num('m2', 'Mass m2', '质量 m2', 'kg', 0.2, 5, 0.1),
    num('u1', 'u1 before', '碰前 u1', 'm/s', -4, 6, 0.1),
    num('u2', 'u2 before', '碰前 u2', 'm/s', -4, 6, 0.1),
  ],
  compute: (p) => collide1d(p),
  readouts: (d) => [
    ro('p before', '碰前动量', `${fmt(d.p0, 3)} kg·m/s`),
    ro('p after', '碰后动量', `${fmt(d.p1, 3)} kg·m/s`),
    ro('v1', 'v1', `${fmt(d.v1, 3)} m/s`),
    ro('v2', 'v2', `${fmt(d.v2, 3)} m/s`),
    ro('KE', '动能', `${fmt(d.ke0, 2)} → ${fmt(d.ke1, 2)} J`),
  ],
  checks: (d) => [
    q('p', 'After the collision the total momentum is', '碰撞后总动量是', [
      opt(`${fmt(d.p1, 3)} kg·m/s`, `${fmt(d.p1, 3)} kg·m/s`),
      opt(`${fmt(d.m1 * d.u1, 3)} kg·m/s`, `${fmt(d.m1 * d.u1, 3)} kg·m/s`),
      opt('zero because the bodies stop', '为零，因为物体停住了'),
    ], 0),
    q('ke', 'Kinetic energy after the collision', '碰撞后的动能', [
      opt(
        d.kind === 'elastic' ? 'equals the kinetic energy before' : 'is less than before',
        d.kind === 'elastic' ? '等于碰前动能' : '小于碰前动能',
      ),
      opt(
        d.kind === 'elastic' ? 'is less than before' : 'equals the kinetic energy before',
        d.kind === 'elastic' ? '小于碰前动能' : '等于碰前动能',
      ),
    ], 0),
  ],
  debug: {
    en: 'Sharing the initial momentum of m1 alone as if m2 were absent breaks momentum conservation.',
    zh: '只按 m1 的初动量来分，等于丢掉了 m2，动量就不守恒了。',
    toggleEn: 'Ignore m2 in the total momentum',
    toggleZh: '总动量里丢掉 m2',
  },
  draw(ctx, w, h, p, d, ui) {
    clear(ctx, w, h);
    const y = h * 0.55;
    line(ctx, w * 0.08, y, w * 0.92, y, MUTED, 2);
    const x1 = w * 0.32;
    const x2 = w * 0.68;
    const drawBlock = (x, m, v, label, color) => {
      const half = 14 + m * 6;
      ctx.fillStyle = color;
      ctx.fillRect(x - half, y - half * 1.2, half * 2, half * 1.2);
      text(ctx, label, x, y - half * 1.2 - 14, INK, 13, 'center');
      text(ctx, `${fmt(v, 2)} m/s`, x, y + 22, MUTED, 12, 'center');
      if (Math.abs(v) > 1e-6) {
        const dir = v > 0 ? 1 : -1;
        line(ctx, x, y - half * 0.6, x + dir * (20 + Math.abs(v) * 8), y - half * 0.6, color, 2);
      }
    };
    drawBlock(x1, d.m1, ui.wrong ? d.u1 : d.v1, 'm1', RAY);
    drawBlock(x2, d.m2, ui.wrong ? 0 : d.v2, 'm2', RAY2);
    const pShow = ui.wrong ? d.m1 * d.u1 : d.p1;
    text(ctx, lab(ui, 'after', '碰后'), w * 0.5, h * 0.16, INK, 14, 'center');
    text(ctx, `p=${fmt(pShow, 3)} kg·m/s`, w * 0.5, h * 0.24, ui.wrong ? '#a33' : INK, 14, 'center');
    text(ctx, `KE ${fmt(d.ke0, 2)} → ${fmt(ui.wrong ? 0.5 * d.m1 * d.u1 * d.u1 : d.ke1, 2)} J`, w * 0.5, h * 0.86, MUTED, 12, 'center');
    if (ui.wrong) text(ctx, lab(ui, 'm2 dropped from p', '总动量丢掉了 m2'), w * 0.5, h * 0.94, '#a33', 12, 'center');
  },
  pointer() { return null; },
};
