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
