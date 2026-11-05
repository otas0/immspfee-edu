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
