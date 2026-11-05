/**
 * Statistical / quantum teaching relations for university entrances.
 * Public classroom forms only — no device or protocol design.
 */

const HBAR = 1.054571817e-34;
const KB = 1.380649e-23;
const C_LIGHT = 2.99792458e8;

/** Seeded LCG for reproducible Metropolis demos. */
function rng(seed) {
  let s = (seed >>> 0) || 1;
  return () => {
    s = (1664525 * s + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/**
 * 2-D Ising Metropolis on an N×N lattice with periodic boundaries.
 * H = −J Σ_<ij> s_i s_j. Temperature is in units of J/k_B (so set J = 1).
 */
export function isingMetropolis(p) {
  const N = Math.max(4, Math.min(24, Math.round(p.N)));
  const T = Math.max(p.T, 1e-6);
  const J = 1;
  const sweeps = Math.max(1, Math.round(p.sweeps ?? 40));
  const seed = Math.round(p.seed ?? 1);
  const rand = rng(seed);
  const spins = new Array(N * N);
  for (let i = 0; i < spins.length; i += 1) spins[i] = rand() < 0.5 ? 1 : -1;
  const at = (x, y) => spins[((y + N) % N) * N + ((x + N) % N)];
  let energy = 0;
  for (let y = 0; y < N; y += 1) {
    for (let x = 0; x < N; x += 1) {
      const s = at(x, y);
      energy -= J * s * (at(x + 1, y) + at(x, y + 1));
    }
  }
  for (let sw = 0; sw < sweeps; sw += 1) {
    for (let n = 0; n < N * N; n += 1) {
      const x = Math.floor(rand() * N);
      const y = Math.floor(rand() * N);
      const s = at(x, y);
      const nn = at(x + 1, y) + at(x - 1, y) + at(x, y + 1) + at(x, y - 1);
      const dE = 2 * J * s * nn;
      if (dE <= 0 || rand() < Math.exp(-dE / T)) {
        spins[y * N + x] = -s;
        energy += dE;
      }
    }
  }
  let mag = 0;
  for (const s of spins) mag += s;
  const M = mag / (N * N);
  // Onsager Tc for the square lattice with J = k_B = 1: Tc = 2 / ln(1+√2).
  const Tc = 2 / Math.log(1 + Math.SQRT2);
  return {
    N, T, J, sweeps, seed, spins, energy, M, absM: Math.abs(M),
    Tc, aboveTc: T > Tc,
  };
}

/**
 * Scan rectangular-barrier T(E) over [Emin, Emax] and mark local maxima
 * above V0 (resonance-like peaks of the sin form).
 */
export function barrierScan(p) {
  const samples = Math.max(40, Math.min(400, Math.round(p.samples ?? 120)));
  const m = Math.max(p.m, 1e-40);
  const a = Math.max(p.a, 1e-15);
  const V0 = Math.max(p.V0, 0);
  const Emin = Math.max(p.Emin ?? Math.min(p.E, V0) * 0.2, 1e-40);
  // Default span covers at least the first k₂ a = π resonance above V0.
  const E1 = V0 + ((Math.PI * HBAR) / a) ** 2 / (2 * m);
  const Emax = Math.max(p.Emax ?? Math.max(V0 * 3, E1 * 1.4), Emin * 1.1);
  const curve = [];
  for (let i = 0; i <= samples; i += 1) {
    const E = Emin + ((Emax - Emin) * i) / samples;
    const d = barrierTunnel({ ...p, E });
    curve.push({ E, T: d.T, regime: d.regime });
  }
  const peaks = [];
  for (let i = 1; i < curve.length - 1; i += 1) {
    if (curve[i].E <= V0) continue;
    if (curve[i].T >= curve[i - 1].T && curve[i].T >= curve[i + 1].T && curve[i].T > 0.5) {
      peaks.push(curve[i]);
    }
  }
  // Exact rectangular-barrier resonances when k₂ a = n π (E > V0): T → 1.
  const resonances = [];
  for (let n = 1; n <= 12; n += 1) {
    const Eres = V0 + ((n * Math.PI * HBAR) / a) ** 2 / (2 * m);
    if (Eres < Emin || Eres > Emax) continue;
    resonances.push({ n, E: Eres, k2a: n * Math.PI });
  }
  const at = barrierTunnel(p);
  let nearest = null;
  for (const rs of resonances) {
    const dE = Math.abs(rs.E - at.E);
    if (!nearest || dE < nearest.dE) nearest = { n: rs.n, E: rs.E, dE };
  }
  const peakDelta = peaks.map((pk) => {
    let best = null;
    for (const rs of resonances) {
      const dE = Math.abs(rs.E - pk.E);
      if (!best || dE < best.dE) best = { n: rs.n, E: rs.E, dE };
    }
    return { E: pk.E, T: pk.T, nearest: best };
  });
  return { ...at, Emin, Emax, samples, curve, peaks, resonances, nearest, peakDelta };
}

const A0 = 5.29177210903e-11;

/**
 * Hydrogen radial wave R_nl and radial probability density r² R_nl².
 * Classroom Bohr radius a0; n = 1..4, l = 0..n−1 (n=4 uses closed classroom forms).
 * Also returns a trapezoid integral of P(r) out to rMax ≈ 20 n² a0 (should ≈ 1).
 */
export function hydrogenRadial(p) {
  const n = Math.max(1, Math.min(4, Math.round(p.n)));
  const l = Math.max(0, Math.min(n - 1, Math.round(p.l)));
  const r = Math.max(p.r, 0);
  const a = A0;
  const rho = r / a;
  const Rof = (nn, ll, rr) => {
    const rh = rr / a;
    if (nn === 1 && ll === 0) return 2 * a ** -1.5 * Math.exp(-rh);
    if (nn === 2 && ll === 0) return (1 / Math.SQRT2) * a ** -1.5 * (1 - rh / 2) * Math.exp(-rh / 2);
    if (nn === 2 && ll === 1) return (1 / Math.sqrt(24)) * a ** -1.5 * rh * Math.exp(-rh / 2);
    if (nn === 3 && ll === 0) {
      return (2 / (3 * Math.sqrt(3))) * a ** -1.5 * (1 - (2 * rh) / 3 + (2 * rh * rh) / 27) * Math.exp(-rh / 3);
    }
    if (nn === 3 && ll === 1) {
      return (8 / (27 * Math.sqrt(6))) * a ** -1.5 * rh * (1 - rh / 6) * Math.exp(-rh / 3);
    }
    if (nn === 3 && ll === 2) {
      return (4 / (81 * Math.sqrt(30))) * a ** -1.5 * (rh * rh) * Math.exp(-rh / 3);
    }
    // n = 4 classroom radial forms (ρ = r/a0)
    if (nn === 4 && ll === 0) {
      return (1 / 4) * a ** -1.5 * (1 - (3 * rh) / 4 + (rh * rh) / 8 - (rh ** 3) / 192) * Math.exp(-rh / 4);
    }
    // Standard table (ρ=r/a0): R₄₁ = [√5/(16√3)] a0^{-3/2} ρ (1 − ρ/4 + ρ²/80) e^{-ρ/4}
    if (nn === 4 && ll === 1) {
      return (Math.sqrt(5) / (16 * Math.sqrt(3))) * a ** -1.5 * rh * (1 - rh / 4 + (rh * rh) / 80) * Math.exp(-rh / 4);
    }
    if (nn === 4 && ll === 2) {
      return (1 / 64) * Math.sqrt(1 / 5) * a ** -1.5 * (rh * rh) * (1 - rh / 12) * Math.exp(-rh / 4);
    }
    // n=4,l=3
    return (1 / 768) * Math.sqrt(1 / 35) * a ** -1.5 * (rh ** 3) * Math.exp(-rh / 4);
  };
  const R = Rof(n, l, r);
  const dens = r * r * R * R;
  const rMax = a * 20 * n * n;
  const N = 240;
  let integ = 0;
  for (let i = 0; i < N; i += 1) {
    const r1 = (rMax * i) / N;
    const r2 = (rMax * (i + 1)) / N;
    const d1 = r1 * r1 * Rof(n, l, r1) ** 2;
    const d2 = r2 * r2 * Rof(n, l, r2) ** 2;
    integ += 0.5 * (d1 + d2) * (r2 - r1);
  }
  return { n, l, r, a, R, dens, rho, integ, rMax };
}

/** |M|(T) Metropolis sweep for Onsager comparison. */
export function isingTempSweep(p) {
  const Tmin = Math.max(p.Tmin ?? 0.5, 0.2);
  const Tmax = Math.max(p.Tmax ?? 4, Tmin + 0.5);
  const steps = Math.max(8, Math.min(40, Math.round(p.steps ?? 24)));
  const Tc = 2 / Math.log(1 + Math.SQRT2);
  const curve = [];
  for (let i = 0; i <= steps; i += 1) {
    const T = Tmin + ((Tmax - Tmin) * i) / steps;
    const d = isingMetropolis({ ...p, T });
    curve.push({ T, absM: d.absM, M: d.M });
  }
  return { Tmin, Tmax, steps, Tc, curve };
}

/**
 * 1-D rectangular barrier transmission. E, V0 in joules; a width; m mass.
 * Exact textbook form with κ / k.
 */
export function barrierTunnel(p) {
  const m = Math.max(p.m, 1e-40);
  const a = Math.max(p.a, 1e-15);
  const V0 = Math.max(p.V0, 0);
  const E = Math.max(p.E, 1e-40);
  let Tcoef;
  let regime;
  if (E < V0 - 1e-40) {
    regime = 'tunnel';
    const kappa = Math.sqrt(2 * m * (V0 - E)) / HBAR;
    const k = Math.sqrt(2 * m * E) / HBAR;
    const sh = Math.sinh(kappa * a);
    Tcoef = 1 / (1 + ((V0 * V0 * sh * sh) / (4 * E * (V0 - E))));
    return { m, a, V0, E, T: Tcoef, regime, kappa, k, hbar: HBAR };
  }
  if (Math.abs(E - V0) < 1e-30) {
    regime = 'edge';
    Tcoef = 1 / (1 + (m * V0 * a * a) / (2 * HBAR * HBAR));
    return { m, a, V0, E, T: Tcoef, regime, hbar: HBAR };
  }
  regime = 'over';
  const k = Math.sqrt(2 * m * E) / HBAR;
  const k2 = Math.sqrt(2 * m * (E - V0)) / HBAR;
  const sn = Math.sin(k2 * a);
  Tcoef = 1 / (1 + ((V0 * V0 * sn * sn) / (4 * E * (E - V0))));
  return { m, a, V0, E, T: Math.min(1, Math.max(0, Tcoef)), regime, k, k2, hbar: HBAR };
}

/**
 * Free Gaussian wave packet: centre x0 + (ℏ k0 / m) t,
 * width σ(t) = σ0 √(1 + (ℏ t / (2 m σ0²))²).
 */
export function gaussianPacket(p, t = 0) {
  const m = Math.max(p.m, 1e-40);
  const sigma0 = Math.max(p.sigma0, 1e-15);
  const k0 = p.k0;
  const x0 = p.x0 ?? 0;
  const time = Math.max(0, t);
  const sigma = sigma0 * Math.sqrt(1 + ((HBAR * time) / (2 * m * sigma0 * sigma0)) ** 2);
  const v = (HBAR * k0) / m;
  const xc = x0 + v * time;
  return { m, sigma0, sigma, k0, x0, t: time, xc, v, hbar: HBAR };
}

/** Probability density sample at x for the free Gaussian packet. */
export function gaussianPacketPsi2(p, t, x) {
  const d = gaussianPacket(p, t);
  const dx = x - d.xc;
  const amp = 1 / (Math.sqrt(Math.PI) * d.sigma);
  const dens = amp * Math.exp(-(dx * dx) / (d.sigma * d.sigma));
  return { ...d, x, dens };
}

/** Maxwell–Boltzmann speed pdf (3-D): f(v) = 4π v² (m/(2πkT))^{3/2} e^{−mv²/(2kT)}. */
export function maxwellSpeed(p) {
  const m = Math.max(p.m, 1e-40);
  const T = Math.max(p.T, 1e-6);
  const v = Math.max(p.v, 0);
  const a = Math.sqrt(KB * T / m);
  const f = Math.sqrt(2 / Math.PI) * (v * v / (a * a * a)) * Math.exp(-(v * v) / (2 * a * a));
  const vmp = Math.sqrt(2 * KB * T / m);
  const vavg = Math.sqrt(8 * KB * T / (Math.PI * m));
  const vrms = Math.sqrt(3 * KB * T / m);
  return { m, T, v, f, vmp, vavg, vrms, kB: KB };
}

/** Histogram of Maxwell pdf over equal bins (teaching plot, not a Monte Carlo sample). */
export function maxwellHistogram(p) {
  const bins = Math.max(8, Math.min(40, Math.round(p.bins ?? 20)));
  const vmax = Math.max(p.vmax ?? 0, maxwellSpeed(p).vrms * 3);
  const width = vmax / bins;
  const heights = [];
  for (let i = 0; i < bins; i += 1) {
    const v = (i + 0.5) * width;
    heights.push(maxwellSpeed({ ...p, v }).f);
  }
  const d = maxwellSpeed({ ...p, v: maxwellSpeed(p).vmp });
  return { ...d, bins, vmax, width, heights };
}

/**
 * Square-wave Fourier partial sum: (4/π) Σ_{k=1,3,..}ⁿ sin(k ω t)/k.
 * nTerms is the number of odd harmonics.
 */
export function fourierSquare(p, t = 0) {
  const nTerms = Math.max(1, Math.round(p.nTerms));
  const f0 = Math.max(p.f0, 1e-6);
  const A = Math.max(p.A, 0);
  const time = Math.max(0, t);
  const omega = 2 * Math.PI * f0;
  let y = 0;
  const harmonics = [];
  for (let i = 0; i < nTerms; i += 1) {
    const k = 2 * i + 1;
    const term = (4 * A) / (Math.PI * k) * Math.sin(k * omega * time);
    harmonics.push({ k, term });
    y += term;
  }
  return { nTerms, f0, A, t: time, omega, y, harmonics };
}

/** Rectangular membrane mode: u = sin(mπx/a) sin(nπy/b), ω = π c √((m/a)²+(n/b)²). */
export function membraneMode(p, t = 0) {
  const m = Math.max(1, Math.round(p.m));
  const n = Math.max(1, Math.round(p.n));
  const a = Math.max(p.a, 1e-6);
  const b = Math.max(p.b, 1e-6);
  const c = Math.max(p.c, 1e-9);
  const time = Math.max(0, t);
  const omega = Math.PI * c * Math.sqrt((m / a) ** 2 + (n / b) ** 2);
  const x = Math.min(a, Math.max(0, p.x ?? a / 2));
  const y = Math.min(b, Math.max(0, p.y ?? b / 2));
  const u = Math.sin((m * Math.PI * x) / a) * Math.sin((n * Math.PI * y) / b) * Math.cos(omega * time);
  return { m, n, a, b, c, t: time, omega, x, y, u };
}

/**
 * Singlet Bell correlation teaching form: ⟨σ_a · σ_b⟩ = −cos θ, θ = α − β.
 * Outcome probabilities for ++ / +- / -+ / -- when axes differ by θ.
 * Not a communication protocol.
 */
export function bellSinglet(p) {
  const alpha = p.alpha;
  const beta = p.beta;
  const theta = ((alpha - beta) * Math.PI) / 180;
  const corr = -Math.cos(theta);
  const pSame = (1 - Math.cos(theta)) / 2;
  const pOpp = (1 + Math.cos(theta)) / 2;
  return {
    alpha, beta, thetaDeg: (alpha - beta), corr,
    pPlusPlus: pSame / 2,
    pMinusMinus: pSame / 2,
    pPlusMinus: pOpp / 2,
    pMinusPlus: pOpp / 2,
    pSame, pOpp,
  };
}

/** Stern–Gerlach spin-1/2: prepared +z, measured at polar angle θ. P(+)=cos²(θ/2). */
export function sternGerlach(p) {
  const theta = p.theta;
  const rad = (theta * Math.PI) / 180;
  const pUp = Math.cos(rad / 2) ** 2;
  const pDown = Math.sin(rad / 2) ** 2;
  return { theta, pUp, pDown };
}

/** Length contraction: ℓ = ℓ0 / γ, γ = 1/√(1−v²/c²). */
export function lengthContraction(p) {
  const L0 = Math.max(p.L0, 0);
  const v = Math.min(Math.max(p.v, 0), C_LIGHT * (1 - 1e-12));
  const beta = v / C_LIGHT;
  const gamma = 1 / Math.sqrt(1 - beta * beta);
  const L = L0 / gamma;
  return { L0, v, beta, gamma, L, c: C_LIGHT };
}

/** Laser cavity mode spacing Δν = c / (2 L). No gain-medium preparation. */
export function laserCavity(p) {
  const L = Math.max(p.L, 1e-9);
  const dnu = C_LIGHT / (2 * L);
  return { L, dnu, c: C_LIGHT };
}
