/**
 * Junior electricity and magnetism teaching relations.
 * Bar-magnet lines go N→S outside. A long solenoid has B = μ0 n I along its axis.
 * A straight wire in a uniform field feels F = B I L when B ⟂ I.
 * A rod sliding on rails has Φ = B ℓ x and ε = B ℓ v.
 */

const MU0 = 4e-7 * Math.PI;

/** Bar magnet: pole strength sets how tightly the outside lines pack. */
export function barMagnet(p) {
  const strength = Math.max(p.strength, 0);
  const flip = !!p.flip;
  return {
    strength,
    flip,
    north: flip ? 'left' : 'right',
    south: flip ? 'right' : 'left',
    lineCount: Math.max(2, Math.round(2 + strength * 6)),
  };
}

/** Long solenoid on its axis: B = μ0 n I. Right-hand rule: fingers curl with I, thumb is B. */
export function solenoidField(p) {
  const n = Math.max(p.n, 0);
  const I = p.I;
  const turns = Math.max(1, Math.round(p.turns ?? 8));
  const B = MU0 * n * I;
  const direction = I >= 0 ? 'right' : 'left';
  return { n, I, turns, B, mu0: MU0, direction, north: direction === 'right' ? 'right' : 'left' };
}

/** Ampere force on a straight wire: F = B I L when the field is perpendicular to the current. */
export function ampereForce(p) {
  const B = Math.max(p.B, 0);
  const I = p.I;
  const L = Math.max(p.L, 0);
  const F = B * Math.abs(I) * L;
  // Right-hand rule: B into page (+), I to the right → F up when I > 0.
  const sense = I >= 0 ? 1 : -1;
  return { B, I, L, F, sense, intoPage: true };
}

/** Sliding rod on rails: Φ = B ℓ x, ε = B ℓ v. Closed loop current I = ε / R. */
export function inductionRod(p) {
  const B = Math.max(p.B, 0);
  const ell = Math.max(p.ell, 1e-6);
  const x = Math.max(p.x, 0);
  const v = p.v;
  const R = Math.max(p.R, 1e-6);
  const flux = B * ell * x;
  const emf = B * ell * v;
  const I = emf / R;
  return { B, ell, x, v, R, flux, emf, I };
}
