/**
 * Two point charges on a line. Coulomb force magnitude F = k |q1 q2| / r².
 * Like signs repel; unlike signs attract. k is the public Coulomb constant.
 */

export const K_COULOMB = 9e9;

export function twoCharges(p) {
  const q1 = p.q1;
  const q2 = p.q2;
  const r = Math.max(p.r, 1e-6);
  const F = (K_COULOMB * Math.abs(q1) * Math.abs(q2)) / (r * r);
  let sense = 'none';
  if (Math.abs(q1) > 1e-18 && Math.abs(q2) > 1e-18) {
    sense = q1 * q2 > 0 ? 'repel' : 'attract';
  }
  return { q1, q2, r, F, k: K_COULOMB, sense };
}

/** Steady current: I = Q / t. */
export function currentFromCharge(p) {
  const Q = p.Q;
  const t = Math.max(p.t, 1e-9);
  const I = Q / t;
  return { Q, t, I };
}
