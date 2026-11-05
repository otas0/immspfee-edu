/**
 * University-entrance teaching relations (public classroom forms only).
 */

const C_LIGHT = 2.99792458e8;
const MU0 = 4e-7 * Math.PI;
const EPS0 = 1 / (MU0 * C_LIGHT * C_LIGHT);
const R_GAS = 8.314462618;
const HBAR = 1.054571817e-34;

/** Vacuum plane wave: c = 1/√(μ0 ε0), E and B in phase, |B| = |E|/c. */
export function vacuumPlaneWave(p, t = 0) {
  const f = Math.max(p.f, 1e-6);
  const E0 = Math.max(p.E0, 0);
  const time = Math.max(0, t);
  const c = C_LIGHT;
  const lambda = c / f;
  const omega = 2 * Math.PI * f;
  const k = omega / c;
  const phase = omega * time;
  const E = E0 * Math.sin(phase);
  const B = (E0 / c) * Math.sin(phase);
  const dEdt = E0 * omega * Math.cos(phase);
  const Jd = EPS0 * dEdt;
  return {
    f, E0, t: time, c, lambda, k, omega, E, B, dEdt, Jd, mu0: MU0, eps0: EPS0,
  };
}

/** Ideal gas law pV = n R T (SI: p in Pa, V in m³, T in K). */
export function idealGas(p) {
  const n = Math.max(p.n, 0);
  const T = Math.max(p.T, 1e-6);
  const V = Math.max(p.V, 1e-12);
  const pressure = (n * R_GAS * T) / V;
  return { n, T, V, p: pressure, R: R_GAS, pV: pressure * V, nRT: n * R_GAS * T };
}

/** Carnot efficiency η = 1 − Tc/Th. */
export function carnotEta(p) {
  const Th = Math.max(p.Th, 1e-6);
  const Tc = Math.min(Math.max(p.Tc, 0), Th);
  const eta = 1 - Tc / Th;
  return { Th, Tc, eta };
}

/** Kinetic theory: p = (1/3) ρ v_rms². */
export function kineticGas(p) {
  const rho = Math.max(p.rho, 0);
  const vrms = Math.max(p.vrms, 0);
  const pressure = (1 / 3) * rho * vrms * vrms;
  return { rho, vrms, p: pressure };
}

/** Infinite square well 0…L: E_n = n² π² ℏ² / (2 m L²), ψ_n = √(2/L) sin(n π x / L). */
export function infiniteWell(p, x = null) {
  const n = Math.max(1, Math.round(p.n));
  const m = Math.max(p.m, 1e-40);
  const L = Math.max(p.L, 1e-15);
  const En = (n * n * Math.PI * Math.PI * HBAR * HBAR) / (2 * m * L * L);
  const xx = x == null ? L / 2 : Math.min(L, Math.max(0, x));
  const psi = Math.sqrt(2 / L) * Math.sin((n * Math.PI * xx) / L);
  return { n, m, L, En, x: xx, psi, hbar: HBAR };
}

/**
 * Finite square well of width L and depth V0 (classroom form).
 * Bound levels from even/odd matching: ξ tan ξ = η (even), −ξ cot ξ = η (odd),
 * with η = √(z0² − ξ²) and z0 = (L/2) √(2 m V0) / ℏ. Continuum probe uses the
 * rectangular-barrier transmission T(E) of height V0 and width L.
 */
export function finiteWell(p) {
  const m = Math.max(p.m, 1e-40);
  const L = Math.max(p.L, 1e-15);
  const V0 = Math.max(p.V0, 1e-40);
  const Eprobe = Math.max(p.E ?? V0 * 1.2, 1e-40);
  const a = L / 2;
  const z0 = (a * Math.sqrt(2 * m * V0)) / HBAR;
  const levels = [];
  const samples = 400;
  let prevEven = null;
  let prevOdd = null;
  for (let i = 1; i < samples; i += 1) {
    const xi = (z0 * i) / samples;
    if (xi >= z0 - 1e-9) break;
    const eta = Math.sqrt(Math.max(0, z0 * z0 - xi * xi));
    const fe = xi * Math.tan(xi) - eta;
    const fo = -xi / Math.tan(xi) - eta;
    if (prevEven != null && fe * prevEven.f < 0 && Math.abs(Math.tan(xi)) < 50) {
      const xiR = prevEven.xi + ((xi - prevEven.xi) * (-prevEven.f)) / (fe - prevEven.f);
      const E = (HBAR * HBAR * xiR * xiR) / (2 * m * a * a);
      levels.push({ parity: 'even', xi: xiR, E });
    }
    if (prevOdd != null && fo * prevOdd.f < 0 && Math.abs(Math.tan(xi)) > 0.02) {
      const xiR = prevOdd.xi + ((xi - prevOdd.xi) * (-prevOdd.f)) / (fo - prevOdd.f);
      const E = (HBAR * HBAR * xiR * xiR) / (2 * m * a * a);
      if (E < V0) levels.push({ parity: 'odd', xi: xiR, E });
    }
    prevEven = { xi, f: fe };
    prevOdd = { xi, f: fo };
  }
  levels.sort((u, v) => u.E - v.E);
  const bound = levels.slice(0, 4).map((lv) => {
    const k = lv.xi / a;
    const kappa = Math.sqrt(Math.max(0, 2 * m * (V0 - lv.E))) / HBAR;
    const samples = [];
    const xMax = a * 2.4;
    for (let i = 0; i <= 80; i += 1) {
      const x = -xMax + (2 * xMax * i) / 80;
      let psi;
      if (Math.abs(x) <= a) {
        psi = lv.parity === 'even' ? Math.cos(k * x) : Math.sin(k * x);
      } else {
        const edge = lv.parity === 'even' ? Math.cos(k * a) : Math.sin(k * a);
        const sign = lv.parity === 'even' ? 1 : Math.sign(x) || 1;
        psi = sign * edge * Math.exp(-kappa * (Math.abs(x) - a));
      }
      samples.push({ x, psi });
    }
    let maxAbs = 1e-12;
    for (const s of samples) maxAbs = Math.max(maxAbs, Math.abs(s.psi));
    for (const s of samples) s.psi /= maxAbs;
    return { ...lv, k, kappa, samples };
  });
  const Einf = [];
  for (let n = 1; n <= Math.max(1, bound.length); n += 1) {
    Einf.push(infiniteWell({ n, m, L }).En);
  }
  let Tcoef;
  let regime;
  if (Eprobe < V0) {
    regime = 'tunnel';
    const kappa = Math.sqrt(2 * m * (V0 - Eprobe)) / HBAR;
    const sh = Math.sinh(kappa * L);
    Tcoef = 1 / (1 + ((V0 * V0 * sh * sh) / (4 * Eprobe * (V0 - Eprobe))));
  } else {
    regime = 'over';
    const k2 = Math.sqrt(2 * m * (Eprobe - V0)) / HBAR;
    const sn = Math.sin(k2 * L);
    Tcoef = 1 / (1 + ((V0 * V0 * sn * sn) / (4 * Eprobe * (Eprobe - V0))));
    Tcoef = Math.min(1, Math.max(0, Tcoef));
  }
  return {
    m, L, V0, E: Eprobe, z0, a, bound, Einf, T: Tcoef, regime, hbar: HBAR,
    E1f: bound[0]?.E ?? null,
    E1inf: infiniteWell({ n: 1, m, L }).En,
  };
}

/** Ideal TEM transmission line: Z0 = √(L′/C′), v = 1/√(L′ C′). */
export function transmissionLine(p) {
  const Lp = Math.max(p.L, 1e-12);
  const Cp = Math.max(p.C, 1e-15);
  const Z0 = Math.sqrt(Lp / Cp);
  const v = 1 / Math.sqrt(Lp * Cp);
  return { L: Lp, C: Cp, Z0, v };
}

/** Method of images: charge q at height h above a grounded plane. Image −q; force toward plane F = k q² / (2h)². */
export function imageCharge(p) {
  const q = p.q;
  const h = Math.max(p.h, 1e-6);
  const k = 9e9;
  const F = (k * q * q) / ((2 * h) * (2 * h));
  return { q, h, F, k, sense: 'toward' };
}

/** Rectangular waveguide TE10 cutoff: fc = c / (2 a). */
export function waveguideCutoff(p) {
  const a = Math.max(p.a, 1e-6);
  const fc = C_LIGHT / (2 * a);
  const f = Math.max(p.f, 0);
  const propagates = f > fc;
  return { a, fc, f, propagates, c: C_LIGHT };
}

/** Electric dipole far-field pattern factor sin²θ (relative intensity). */
export function dipolePattern(p) {
  const theta = Math.min(180, Math.max(0, p.theta));
  const rad = (theta * Math.PI) / 180;
  const factor = Math.sin(rad) ** 2;
  return { theta, factor };
}
