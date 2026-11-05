/**
 * Density, pressure, and buoyancy for Shanghai junior ch. 6–7.
 *
 * Authority:
 * - ρ = m/V
 * - Solid pressure p = F/A
 * - Hydrostatic gauge pressure p = ρgh (Pascal). Atmospheric contributions
 *   on both faces of a submerged body cancel in the gauge difference.
 * - Torricelli: P = ρ_Hg g h, with ρ_Hg = 13.6×10³ kg/m³
 * - Continuity for incompressible flow A1 v1 = A2 v2
 * - Bernoulli along a streamline, steady, inviscid, incompressible:
 *   P + ½ρv² + ρgh = constant
 * - Buoyancy from the pressure difference on a cube, which equals ρgV_disp
 *   (Archimedes). Float / suspend / sink from comparing weight and that force.
 *
 * Textbook densities below are the rounded values used in junior tables
 * (water 1.0×10³, alcohol 0.8×10³, aluminium 2.7×10³, iron 7.9×10³,
 * copper 8.9×10³, ice 0.9×10³ kg/m³).
 */

export const RHO_HG = 13.6e3;
export const P_ATM = 1.013e5;

export const DENSITIES = {
  water: 1000,
  alcohol: 800,
  ice: 900,
  aluminium: 2700,
  iron: 7900,
  copper: 8900,
};

export function densityOf(p) {
  const V = Math.max(p.V, 1e-12);
  const rho = Math.max(p.rho, 0);
  return { V, rho, m: rho * V };
}

export function densityLab(p) {
  const rho = Math.max(p.rho, 0);
  const V = Math.max(p.V, 0); // cm³
  const V1 = Math.max(p.V1, 0);
  const m = (rho * V) / 1000; // g, from kg/m³ and cm³
  const V2 = V1 + V;
  const rhoMeas = V > 0 ? (m / V) * 1000 : null; // back to kg/m³; equals rho
  const rhoIfForgot = V2 > 0 ? (m / V2) * 1000 : null;
  return { rho, V, V1, V2, m, rhoMeas, rhoIfForgot };
}

export function solidPressure(p) {
  const F = Math.max(p.F, 0);
  const A = Math.max(p.A, 1e-12);
  return { F, A, p: F / A };
}

export function hydrostatics(p) {
  const rho = Math.max(p.rho, 0);
  const g = p.g;
  const h = Math.max(p.h, 0);
  const pGauge = rho * g * h;
  const A1 = Math.max(p.A1, 1e-12);
  const A2 = Math.max(p.A2, 1e-12);
  const h1 = Math.max(p.h1, 0);
  const rho2 = Math.max(p.rho2, 1e-9);
  const h2 = (rho * h1) / rho2;
  return {
    rho, g, h, pGauge,
    Fwide: pGauge * A1,
    Fnarrow: pGauge * A2,
    A1, A2,
    h1, h2, rho2,
  };
}

export function torricelli(p) {
  const P = Math.max(p.P, 0);
  const g = p.g;
  const rho = RHO_HG;
  const h = P / (rho * g);
  const r = Math.max(p.r, 0);
  const area = Math.PI * r * r;
  const F = P * area;
  return { P, g, rho, h, r, area, F };
}

export function bernoulliPipe(p) {
  const A1 = Math.max(p.A1, 1e-9);
  const A2 = Math.max(p.A2, 1e-9);
  const v1 = Math.max(p.v1, 0);
  const rho = Math.max(p.rho, 0);
  const P1 = p.P1;
  const v2 = (v1 * A1) / A2;
  const P2 = P1 + 0.5 * rho * (v1 * v1 - v2 * v2);
  return { A1, A2, v1, v2, rho, P1, P2, valid: P2 >= 0 };
}

export function wingLift(p) {
  const rho = Math.max(p.rho, 0);
  const vTop = Math.max(p.vTop, 0);
  const vBottom = Math.max(p.vBottom, 0);
  const area = Math.max(p.area, 0);
  const dP = 0.5 * rho * (vTop * vTop - vBottom * vBottom);
  return { rho, vTop, vBottom, area, dP, lift: dP * area };
}

/** Fully or partly submerged cube. Gauge pressure; atmosphere cancels. */
export function buoyancyOrigin(p) {
  const a = Math.max(p.a, 1e-6);
  const rho = Math.max(p.rho, 0);
  const g = p.g;
  const hTop = p.hTop;
  const hBottom = hTop + a;
  const sub = Math.max(0, hBottom - Math.max(hTop, 0));
  const A = a * a;
  const V = a * a * a;
  const Vsub = A * sub;
  const Ptop = hTop > 0 ? rho * g * hTop : 0;
  const Pbot = hBottom > 0 ? rho * g * hBottom : 0;
  const Fdown = hTop > 0 ? Ptop * A : 0;
  const Fup = Pbot * A;
  const Fb = Fup - Fdown;
  return { a, rho, g, hTop, hBottom, sub, A, V, Vsub, Ptop, Pbot, Fdown, Fup, Fb };
}

export function weighingBuoyancy(p) {
  const V = Math.max(p.V, 0);
  const g = p.g;
  const rhoL = Math.max(p.rhoL, 0);
  const rhoO = Math.max(p.rhoO, 0);
  const G = rhoO * V * g;
  const FbFull = rhoL * g * V;
  if (G < FbFull) {
    const Vdisp = rhoL > 0 ? G / (rhoL * g) : 0;
    return { V, g, rhoL, rhoO, G, Fb: G, T: 0, Vdisp, heldUnder: false };
  }
  return { V, g, rhoL, rhoO, G, Fb: FbFull, T: G - FbFull, Vdisp: V, heldUnder: true };
}

export function archimedes(p) {
  const V = Math.max(p.V, 0);
  const g = p.g;
  const rho = Math.max(p.rho, 0);
  const frac = Math.min(1, Math.max(0, p.frac));
  const Vdisp = frac * V;
  const Fb = rho * g * Vdisp;
  return { V, g, rho, frac, Vdisp, Fb };
}

export function floatState(p) {
  const g = p.g;
  const rhoL = Math.max(p.rhoL, 1e-9);
  if (p.mode === 'solid') {
    const V = Math.max(p.V, 1e-12);
    const rhoO = Math.max(p.rhoO, 0);
    const G = rhoO * V * g;
    if (rhoO > rhoL) {
      const Fb = rhoL * g * V;
      return { mode: 'solid', state: 'sunk', V, Vdisp: V, Fb, G, N: G - Fb, fraction: 1, rhoAvg: rhoO };
    }
    if (Math.abs(rhoO - rhoL) / rhoL < 1e-4) {
      const Fb = rhoL * g * V;
      return { mode: 'solid', state: 'suspended', V, Vdisp: V, Fb, G, N: 0, fraction: 1, rhoAvg: rhoO };
    }
    const fraction = rhoO / rhoL;
    const Vdisp = fraction * V;
    return { mode: 'solid', state: 'floating', V, Vdisp, Fb: rhoL * g * Vdisp, G, N: 0, fraction, rhoAvg: rhoO };
  }
  const hull = Math.max(p.V, 1e-12);
  const m = Math.max(p.mass, 0) + (p.mode === 'submarine' ? Math.max(p.ballast, 0) : 0);
  const G = m * g;
  const rhoAvg = m / hull;
  if (m > rhoL * hull) {
    const Fb = rhoL * g * hull;
    return { mode: p.mode, state: 'sunk', V: hull, Vdisp: hull, Fb, G, N: G - Fb, fraction: 1, rhoAvg };
  }
  if (Math.abs(m - rhoL * hull) / (rhoL * hull) < 1e-4) {
    return { mode: p.mode, state: 'suspended', V: hull, Vdisp: hull, Fb: G, G, N: 0, fraction: 1, rhoAvg };
  }
  const Vdisp = m / rhoL;
  return { mode: p.mode, state: 'floating', V: hull, Vdisp, Fb: G, G, N: 0, fraction: Vdisp / hull, rhoAvg };
}
