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

/**
 * Ideal Otto cycle for classroom four-stroke teaching.
 * Compression ratio r = V1/V2. γ = 1.4 for diatomic air.
 * Thermal efficiency η = 1 − 1/r^(γ−1). Net work W = η Qin.
 * The p–V loop area equals W. Stroke order is intake → compression → power → exhaust.
 * This is the public thermodynamic relation, not a device design.
 */
export const STROKES = [
  { id: 'intake', en: 'intake', zh: '吸气' },
  { id: 'compression', en: 'compression', zh: '压缩' },
  { id: 'power', en: 'power', zh: '做功' },
  { id: 'exhaust', en: 'exhaust', zh: '排气' },
];

export function ottoCycle(p, t = 0) {
  const r = Math.max(p.r, 1.01);
  const Qin = Math.max(p.Qin, 0);
  const V2 = Math.max(p.Vmin, 1e-6);
  const V1 = r * V2;
  const gamma = 1.4;
  const eta = 1 - 1 / r ** (gamma - 1);
  const W = eta * Qin;
  const Qout = Qin - W;
  // Isochoric heat addition: Cv ΔT2→3 = Qin, with pV = nRT → p3/p2 = T3/T2.
  // Adiabatic: p V^γ = const. Set p1 = 1 (relative), then close the loop.
  // Relative pressures for the Otto shape; then scale p so the loop area equals W.
  const p1 = 1;
  const p2 = p1 * r ** gamma;
  const p3 = p2 * 1.8;
  const p4 = p3 / r ** gamma;
  const raw = [
    { V: V1, p: p1 },
    { V: V2, p: p2 },
    { V: V2, p: p3 },
    { V: V1, p: p4 },
  ];
  let rawArea = 0;
  for (let i = 0; i < 4; i += 1) {
    const a = raw[i];
    const b = raw[(i + 1) % 4];
    rawArea += a.V * b.p - b.V * a.p;
  }
  rawArea = Math.abs(rawArea) / 2;
  const scale = rawArea > 0 ? W / rawArea : 1;
  const loop = raw.map((pt) => ({ V: pt.V, p: pt.p * scale }));
  const area = W;
  const period = 4;
  const phase = ((Math.max(0, t) % period) + period) % period;
  const strokeIndex = Math.min(3, Math.floor(phase));
  const stroke = STROKES[strokeIndex];
  const u = phase - strokeIndex;
  let V;
  if (strokeIndex === 0) V = V2 + (V1 - V2) * u;
  else if (strokeIndex === 1) V = V1 + (V2 - V1) * u;
  else if (strokeIndex === 2) V = V2 + (V1 - V2) * u;
  else V = V1 + (V2 - V1) * u;
  return {
    r, Qin, Qout, W, eta, gamma, V1, V2, V, loop, area,
    strokeIndex, stroke, phase, t: Math.max(0, t),
  };
}
