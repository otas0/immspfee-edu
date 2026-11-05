/**
 * Tuning fork: displacement y = A sin(2π f t).
 * Frequency sets pitch; amplitude sets loudness. The waveform is that equation.
 */

export function tuningFork(p, t = 0) {
  const f = Math.max(p.f, 1e-6);
  const A = Math.max(p.A, 0);
  const time = Math.max(0, t);
  const omega = 2 * Math.PI * f;
  const y = A * Math.sin(omega * time);
  const v = A * omega * Math.cos(omega * time);
  return { f, A, t: time, omega, y, v, period: 1 / f };
}

const C_LIGHT = 2.99792458e8;
const V_SOUND = 340;

/**
 * Teaching Beer–Lambert form for a barrier: I = I0 (1 − R) e^{−α d}.
 * R is the reflected fraction at the face; α is the absorption coefficient.
 * No invented decibel curve — intensity follows this product.
 */
export function soundAbsorb(p) {
  const I0 = Math.max(p.I0, 0);
  const R = Math.min(1, Math.max(0, p.R));
  const alpha = Math.max(p.alpha, 0);
  const d = Math.max(p.d, 0);
  const transmitted = I0 * (1 - R) * Math.exp(-alpha * d);
  const absorbed = I0 * (1 - R) - transmitted;
  const reflected = I0 * R;
  return { I0, R, alpha, d, I: transmitted, absorbed, reflected };
}

/** Echo ranging: round-trip time gives distance s = v t / 2 with v = 340 m/s in air. */
export function echoRange(p) {
  const v = Math.max(p.v ?? V_SOUND, 1e-6);
  const t = Math.max(p.t, 0);
  const s = (v * t) / 2;
  return { v, t, s };
}

/**
 * Doppler for sound: f' = f (v ± vo) / (v ± vs).
 * Signs: toward the other is +, away is − (classroom convention with separate toggles).
 */
export function doppler(p) {
  const f = Math.max(p.f, 1e-6);
  const v = Math.max(p.v, 1e-6);
  const vo = Math.max(0, p.vo);
  const vs = Math.max(0, p.vs);
  const observerToward = !!p.observerToward;
  const sourceToward = !!p.sourceToward;
  const num = v + (observerToward ? vo : -vo);
  const den = v + (sourceToward ? -vs : vs);
  const fp = f * (num / Math.max(den, 1e-9));
  return { f, v, vo, vs, observerToward, sourceToward, fp };
}

/** Beats: Δf = |f1 − f2|, y = 2 A cos(π Δf t) sin(2π f_avg t). */
export function beats(p, t = 0) {
  const f1 = Math.max(p.f1, 1e-6);
  const f2 = Math.max(p.f2, 1e-6);
  const A = Math.max(p.A, 0);
  const time = Math.max(0, t);
  const df = Math.abs(f1 - f2);
  const favg = 0.5 * (f1 + f2);
  const env = 2 * A * Math.cos(Math.PI * df * time);
  const y = env * Math.sin(2 * Math.PI * favg * time);
  return { f1, f2, A, t: time, df, favg, env, y };
}

/** Weak dispersion ω² = ω0² + c² k²: vp = ω/k, vg = c² k / ω. */
export function dispersion(p) {
  const omega0 = Math.max(p.omega0, 0);
  const c = Math.max(p.c, 1e-9);
  const k = Math.max(p.k, 1e-9);
  const omega = Math.sqrt(omega0 * omega0 + c * c * k * k);
  const vp = omega / k;
  const vg = (c * c * k) / omega;
  return { omega0, c, k, omega, vp, vg };
}

/**
 * Electromagnetic plane wave in vacuum: c = f λ.
 * At a fixed time the E and B envelopes share the same phase and stay perpendicular.
 */
export function emWave(p, t = 0) {
  const f = Math.max(p.f, 1e-6);
  const A = Math.max(p.A, 0);
  const time = Math.max(0, t);
  const lambda = C_LIGHT / f;
  const k = (2 * Math.PI) / lambda;
  const omega = 2 * Math.PI * f;
  const phase = omega * time;
  const E = A * Math.sin(phase);
  const B = (A / C_LIGHT) * Math.sin(phase);
  return {
    f, A, t: time, c: C_LIGHT, lambda, k, omega, E, B, period: 1 / f,
  };
}
