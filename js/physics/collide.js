/**
 * One-dimensional two-body collision along a line.
 * Momentum p = m v is conserved when no external impulse acts.
 * Elastic: also KE conserved. Perfectly inelastic: common final speed.
 */

export function collide1d(p) {
  const m1 = Math.max(p.m1, 1e-6);
  const m2 = Math.max(p.m2, 1e-6);
  const u1 = p.u1;
  const u2 = p.u2;
  const kind = p.kind === 'inelastic' ? 'inelastic' : 'elastic';
  const p0 = m1 * u1 + m2 * u2;
  const ke0 = 0.5 * m1 * u1 * u1 + 0.5 * m2 * u2 * u2;
  let v1;
  let v2;
  if (kind === 'inelastic') {
    const v = p0 / (m1 + m2);
    v1 = v;
    v2 = v;
  } else {
    v1 = ((m1 - m2) / (m1 + m2)) * u1 + ((2 * m2) / (m1 + m2)) * u2;
    v2 = ((2 * m1) / (m1 + m2)) * u1 + ((m2 - m1) / (m1 + m2)) * u2;
  }
  const p1 = m1 * v1 + m2 * v2;
  const ke1 = 0.5 * m1 * v1 * v1 + 0.5 * m2 * v2 * v2;
  return {
    m1, m2, u1, u2, v1, v2, kind,
    p0, p1, ke0, ke1,
    impulse: m1 * (v1 - u1),
  };
}
