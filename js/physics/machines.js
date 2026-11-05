/** Lever with both forces perpendicular to the bar. Moment arm is the distance from the fulcrum. */
export function lever(p) {
  const F1 = p.F1;
  const F2 = p.F2;
  const L1 = Math.max(0, p.L1);
  const L2 = Math.max(0, p.L2);
  const tau1 = F1 * L1;
  const tau2 = F2 * L2;
  const tau = tau1 - tau2;
  const scale = Math.max(1, Math.abs(tau1), Math.abs(tau2));
  const balanced = Math.abs(tau) <= 0.015 * scale;
  const F1forBalance = L1 > 1e-9 ? (F2 * L2) / L1 : null;
  return { F1, F2, L1, L2, tau1, tau2, tau, balanced, F1forBalance };
}

/** Ideal string. n segments support the load and the movable pulley. F = (G + Gp) / n, s = n h. */
export function pulley(p) {
  const n = Math.max(1, Math.round(p.n));
  const G = Math.max(0, p.G);
  const Gp = Math.max(0, p.Gp);
  const s = Math.max(0, p.s);
  const F = (G + Gp) / n;
  const h = s / n;
  const useful = G * h;
  const total = F * s;
  const extra = total - useful;
  const eta = total > 1e-12 ? useful / total : null;
  return { n, G, Gp, s, F, h, useful, total, extra, eta };
}

/** W = F s cosθ. Average power is P = W/t. */
export function workPower(p) {
  const F = p.F;
  const s = Math.max(0, p.s);
  const theta = p.theta;
  const t = Math.max(p.t, 1e-6);
  const cos = Math.cos((theta * Math.PI) / 180);
  const W = F * s * cos;
  const v = s / t;
  const P = W / t;
  return { F, s, theta, t, cos, W, P, v };
}
