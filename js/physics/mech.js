/**
 * Junior mechanics used by Shanghai ch. 5 and the density-lab mass step.
 *
 * Authority:
 * - Moment of a force about a point, τ = r × F (junior: effect depends on
 *   magnitude, direction, and point of application).
 * - Hooke's law F = kx inside the stated elastic range.
 * - Weight G = mg. Surface g values are the conventional teaching figures
 *   (Earth 9.80, Moon 1.62, Mars 3.71 m/s²), not a site survey.
 * - Collinear resultant F = F1 + F2 (signed).
 * - Two-force equilibrium: equal magnitude, opposite direction, collinear,
 *   same body. Newton's second law a = Fnet/m when they are not balanced.
 * - Amontons–Coulomb: fs ≤ μs N, fk = μk N, N = mg on a horizontal surface.
 *   Contact area is not a variable of this model.
 * - Newton's first law: after the cart is stopped by the block, the wood
 *   block continues with a = −μg.
 */

export const G_EARTH = 9.8;
export const G_MOON = 1.62;
export const G_MARS = 3.71;

export function forceElements(p) {
  const F = Math.max(p.F, 0);
  const theta = p.theta;
  const rad = (theta * Math.PI) / 180;
  const s = p.s;
  const tau = s * F * Math.sin(rad);
  return {
    F,
    theta,
    s,
    tau,
    Fx: F * Math.cos(rad),
    Fy: F * Math.sin(rad),
  };
}

export function hooke(p) {
  const k = Math.max(p.k, 0);
  const x = Math.max(p.x, 0);
  const xMax = Math.max(p.xMax, 0);
  if (x > xMax) return { k, x, xMax, F: null, inRange: false };
  return { k, x, xMax, F: k * x, inRange: true };
}

export function weight(p) {
  const m = Math.max(p.m, 0);
  const g = p.g;
  return { m, g, G: m * g };
}

export function collinearResultant(p) {
  const F1 = p.F1;
  const F2 = p.F2;
  return { F1, F2, Fnet: F1 + F2 };
}

export function twoForce(p, t = 0) {
  const F1 = p.F1;
  const F2 = p.F2;
  const m = Math.max(p.m, 1e-6);
  const sameBody = !!p.sameBody;
  const collinear = !!p.collinear;
  const opposite = F1 * F2 < 0;
  const equal = Math.abs(Math.abs(F1) - Math.abs(F2)) < 1e-6;
  const balanced = sameBody && collinear && opposite && equal;
  if (!sameBody || !collinear) {
    return {
      F1, F2, m, sameBody, collinear, opposite, equal, balanced,
      Fnet: null, a: null, x: 0, v: 0,
      reason: !sameBody ? 'two-bodies' : 'not-collinear',
    };
  }
  const Fnet = F1 + F2;
  const a = Fnet / m;
  const time = Math.max(t, 0);
  return {
    F1, F2, m, sameBody, collinear, opposite, equal, balanced,
    Fnet, a, v: a * time, x: 0.5 * a * time * time,
    reason: balanced ? 'equilibrium' : 'unbalanced',
  };
}

export function friction(p, t = 0) {
  const m = Math.max(p.m, 1e-6);
  const g = p.g;
  const N = m * g;
  const F = p.F;
  const muS = Math.max(p.muS, 0);
  const muK = Math.max(p.muK, 0);
  const fsMax = muS * N;
  const time = Math.max(t, 0);
  if (Math.abs(F) <= fsMax + 1e-9) {
    return {
      m, g, N, F, muS, muK, fsMax,
      friction: -F, a: 0, v: 0, x: 0, regime: 'static', time,
    };
  }
  const a = (F - Math.sign(F) * muK * N) / m;
  return {
    m, g, N, F, muS, muK, fsMax,
    friction: -Math.sign(F) * muK * N,
    a,
    v: a * time,
    x: 0.5 * a * time * time,
    regime: 'kinetic',
    time,
  };
}

/**
 * Cart moves at constant v0 until a stopper at xStop sets the cart velocity
 * to 0. The block then slides with a = −μ g (kinetic friction with the cart).
 * μ = 0 leaves the block at constant velocity (first-law limit of this model).
 */
export function inertiaCart(p, t = 0) {
  const v0 = Math.max(p.v0, 0);
  const mu = Math.max(p.mu, 0);
  const g = p.g;
  const xStop = Math.max(p.xStop, 0);
  const time = Math.max(t, 0);
  if (v0 === 0) {
    return { xCart: 0, xBlock: 0, vCart: 0, vBlock: 0, phase: 'rest', tHit: Infinity };
  }
  const tHit = xStop / v0;
  if (time <= tHit) {
    const x = v0 * time;
    return { xCart: x, xBlock: x, vCart: v0, vBlock: v0, phase: 'together', tHit };
  }
  const tau = time - tHit;
  if (mu === 0) {
    return {
      xCart: xStop,
      xBlock: xStop + v0 * tau,
      vCart: 0,
      vBlock: v0,
      phase: 'sliding',
      tHit,
    };
  }
  const tauEnd = v0 / (mu * g);
  const tauUse = Math.min(tau, tauEnd);
  const vBlock = Math.max(0, v0 - mu * g * tau);
  const xBlock = xStop + v0 * tauUse - 0.5 * mu * g * tauUse * tauUse;
  return {
    xCart: xStop,
    xBlock,
    vCart: 0,
    vBlock,
    phase: vBlock > 0 ? 'sliding' : 'stopped',
    tHit,
  };
}
