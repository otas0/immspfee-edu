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
