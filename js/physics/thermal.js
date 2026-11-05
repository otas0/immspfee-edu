/**
 * Two samples receive the same heat Q = P t.
 * Each temperature rise is ΔT = Q / (c m).
 * c is specific heat capacity in J/(kg·°C). The junior table values
 * (water about 4200, dry sand about 900) are inputs, not a second formula.
 */

export function specificHeat(p, t = 0) {
  const m1 = Math.max(p.m1, 1e-9);
  const m2 = Math.max(p.m2, 1e-9);
  const c1 = Math.max(p.c1, 1e-9);
  const c2 = Math.max(p.c2, 1e-9);
  const P = Math.max(p.P, 0);
  const time = Math.max(0, t);
  const Q = P * time;
  const dT1 = Q / (c1 * m1);
  const dT2 = Q / (c2 * m2);
  const T0 = p.T0;
  return {
    m1, m2, c1, c2, P, T0, t: time, Q, dT1, dT2,
    T1: T0 + dT1,
    T2: T0 + dT2,
  };
}
