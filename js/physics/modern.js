/**
 * Public teaching relations for modern / energy chapters.
 * Bohr-like hydrogen levels: E_n = −13.6 eV / n² (classroom constant).
 * Internal energy change: ΔU = W + Q (into the system positive).
 * Mass–energy: E = m c² with c the public vacuum speed.
 * Half-life: N = N0 e^{−λ t} with λ = ln 2 / T½.
 * Photoelectric: Kmax = h f − W, cutoff f0 = W / h.
 */

const C_LIGHT = 2.99792458e8;
const H_PLANCK = 6.62607015e-34;
const E_CHARGE = 1.602176634e-19;

export function bohrLevels(p) {
  const n = Math.max(1, Math.round(p.n));
  const n2 = Math.max(1, Math.round(p.n2 || n));
  const E1 = -13.6;
  const E = E1 / (n * n);
  const E2 = E1 / (n2 * n2);
  const photon = E2 - E;
  return { n, n2, E, E2, photon, E1 };
}

/** First-law teaching form: ΔU = W + Q. */
export function internalEnergy(p) {
  const W = p.W;
  const Q = p.Q;
  const dU = W + Q;
  return { W, Q, dU };
}

/**
 * Energy conversion: one store drains into another with the total conserved.
 * E1 + E2 = E0, with E1 = E0 (1 − f) and E2 = E0 f.
 */
export function energyShare(p) {
  const E0 = Math.max(p.E0, 0);
  const f = Math.min(1, Math.max(0, p.f));
  const E1 = E0 * (1 - f);
  const E2 = E0 * f;
  return { E0, f, E1, E2, total: E1 + E2 };
}

/** Efficiency η = E_useful / E_in. */
export function efficiency(p) {
  const Ein = Math.max(p.Ein, 1e-12);
  const Eu = Math.max(0, Math.min(p.Eu, Ein));
  const eta = Eu / Ein;
  const waste = Ein - Eu;
  return { Ein, Eu, eta, waste };
}

/** Orders of magnitude: log10 of a length against fixed public reference lengths. */
export function scaleLength(p) {
  const L = Math.max(p.L, 1e-30);
  const log10 = Math.log10(L);
  const refs = [
    { id: 'nucleus', en: 'nucleus', zh: '原子核', L: 1e-15 },
    { id: 'atom', en: 'atom', zh: '原子', L: 1e-10 },
    { id: 'human', en: 'human', zh: '人', L: 1 },
    { id: 'earth', en: 'Earth', zh: '地球', L: 1.3e7 },
    { id: 'au', en: '1 AU', zh: '1 天文单位', L: 1.5e11 },
  ];
  let nearest = refs[0];
  let best = Infinity;
  for (const r of refs) {
    const gap = Math.abs(Math.log10(r.L) - log10);
    if (gap < best) { best = gap; nearest = r; }
  }
  return { L, log10, nearest, refs };
}

/** Rest energy E = m c². Mass in kg; E in J (and MeV for readout convenience). */
export function massEnergy(p) {
  const m = Math.max(p.m, 0);
  const E = m * C_LIGHT * C_LIGHT;
  const MeV = E / (E_CHARGE * 1e6);
  return { m, E, MeV, c: C_LIGHT };
}

/** Radioactive decay: N = N0 exp(−λ t), λ = ln 2 / T½. */
export function halfLife(p) {
  const N0 = Math.max(p.N0, 0);
  const T = Math.max(p.T, 1e-12);
  const t = Math.max(p.t, 0);
  const lambda = Math.LN2 / T;
  const N = N0 * Math.exp(-lambda * t);
  const remaining = N0 > 0 ? N / N0 : 0;
  return { N0, T, t, lambda, N, remaining };
}

/** Einstein photoelectric relation. W in eV; f in Hz. */
export function photoelectric(p) {
  const W = Math.max(p.W, 0);
  const f = Math.max(p.f, 0);
  const Wj = W * E_CHARGE;
  const f0 = Wj / H_PLANCK;
  const KmaxJ = Math.max(0, H_PLANCK * f - Wj);
  const Kmax = KmaxJ / E_CHARGE;
  const emits = f >= f0;
  return { W, f, f0, Kmax, emits, h: H_PLANCK };
}

/** Capacitance definition C = Q / U. */
export function capacitance(p) {
  const Q = p.Q;
  const U = p.U;
  const C = Math.abs(U) > 1e-12 ? Q / U : 0;
  return { Q, U, C };
}

/** Resistivity law R = ρ L / A. */
export function resistivity(p) {
  const rho = Math.max(p.rho, 0);
  const L = Math.max(p.L, 0);
  const A = Math.max(p.A, 1e-12);
  const R = (rho * L) / A;
  return { rho, L, A, R };
}

/** Time dilation: Δt = γ Δτ with γ = 1/√(1 − β²), β = v/c. */
export function timeDilation(p) {
  const v = Math.min(Math.max(p.v, 0), C_LIGHT * (1 - 1e-12));
  const dtau = Math.max(p.dtau, 0);
  const beta = v / C_LIGHT;
  const gamma = 1 / Math.sqrt(1 - beta * beta);
  const dt = gamma * dtau;
  return { v, dtau, beta, gamma, dt, c: C_LIGHT };
}

/**
 * Relativity of simultaneity teaching ruler.
 * Two ends of a rod of proper length L0 flash at the same time in the rod frame.
 * In a frame where the rod moves at v, the end events differ by Δt = γ v L0 / c².
 */
export function simultaneity(p) {
  const L0 = Math.max(p.L0, 0);
  const v = Math.min(Math.max(p.v, 0), C_LIGHT * (1 - 1e-12));
  const beta = v / C_LIGHT;
  const gamma = 1 / Math.sqrt(1 - beta * beta);
  const dt = (gamma * v * L0) / (C_LIGHT * C_LIGHT);
  const L = L0 / gamma;
  return { L0, v, beta, gamma, dt, L, c: C_LIGHT };
}
