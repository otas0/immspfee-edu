/** Positions in a chosen frame. Ground is the frame in which the stored velocities are measured. */
export function frames(p, t) {
  const tt = Math.max(0, t);
  const xCart = p.xCart0 + p.vCart * tt;
  const xPerson = p.xPerson0 + p.vPerson * tt;
  const frame = p.frame === 'cart' || p.frame === 'person' ? p.frame : 'ground';
  const origin = frame === 'cart' ? xCart : frame === 'person' ? xPerson : 0;
  const vOrigin = frame === 'cart' ? p.vCart : frame === 'person' ? p.vPerson : 0;
  return {
    t: tt, frame, xCart, xPerson,
    vCart: p.vCart, vPerson: p.vPerson,
    xCartView: xCart - origin, xPersonView: xPerson - origin,
    vCartView: p.vCart - vOrigin, vPersonView: p.vPerson - vOrigin,
  };
}

/** Two constant-velocity segments. x is measured from the start. */
export function segmentMotion(p, t) {
  const tt = Math.max(0, t);
  const split = Math.max(0, p.split);
  const v1 = p.v1;
  const v2 = p.v2;
  const x = tt <= split ? v1 * tt : v1 * split + v2 * (tt - split);
  const v = tt <= split ? v1 : v2;
  const vAvg = tt > 1e-9 ? x / tt : v1;
  return { t: tt, x, v, vAvg, v1, v2, split };
}

export function uniformAccel(p, t) {
  const tt = Math.max(0, t);
  const v = p.v0 + p.a * tt;
  const x = p.v0 * tt + 0.5 * p.a * tt * tt;
  return { t: tt, v, x, v0: p.v0, a: p.a };
}

/**
 * Uniform circular motion. v = ω r, a = v² / r = ω² r, T = 2π / ω.
 * Centripetal force for a rope (or rod) is F = m a toward the centre.
 */
export function circularMotion(p, t = 0) {
  const m = Math.max(p.m, 1e-6);
  const r = Math.max(p.r, 1e-6);
  const omega = p.omega;
  const tt = Math.max(0, t);
  const v = omega * r;
  const a = (v * v) / r;
  const T = Math.abs(omega) > 1e-12 ? (2 * Math.PI) / Math.abs(omega) : Infinity;
  const theta = omega * tt;
  const x = r * Math.cos(theta);
  const y = r * Math.sin(theta);
  const F = m * a;
  return { m, r, omega, t: tt, v, a, T, theta, x, y, F };
}

/** Signed area under a straight v–t graph. For constant acceleration it equals Δx. */
export function vtArea(p) {
  const t1 = Math.min(p.t1, p.t2);
  const t2 = Math.max(p.t1, p.t2);
  const v1 = p.v0 + p.a * t1;
  const v2 = p.v0 + p.a * t2;
  const area = ((v1 + v2) / 2) * (t2 - t1);
  const x1 = p.v0 * t1 + 0.5 * p.a * t1 * t1;
  const x2 = p.v0 * t2 + 0.5 * p.a * t2 * t2;
  return { t1, t2, v1, v2, area, displacement: x2 - x1 };
}

/** Horizontal projection. y is the height above the floor. */
export function projectile(p, t) {
  const g = Math.max(p.g, 1e-6);
  const H = Math.max(p.H, 0);
  const v0 = p.v0;
  const tLand = Math.sqrt((2 * H) / g);
  const tt = Math.min(Math.max(0, t), tLand);
  const x = v0 * tt;
  const y = H - 0.5 * g * tt * tt;
  return { t: tt, tLand, x, y, vx: v0, vy: -g * tt, v0, H, g, range: v0 * tLand };
}

/**
 * Released from rest on a rough incline, then onto a horizontal floor.
 * μ = 0 keeps mechanical energy equal to mgH.
 */
export function energyTrack(p, t) {
  const m = Math.max(p.m, 1e-6);
  const g = p.g;
  const H = Math.max(p.H, 0);
  const alpha = (Math.min(80, Math.max(10, p.alpha)) * Math.PI) / 180;
  const mu = Math.max(0, p.mu);
  const sin = Math.sin(alpha);
  const cos = Math.cos(alpha);
  const L = sin > 1e-6 ? H / sin : H;
  const aSlope = g * sin - mu * g * cos;
  const slides = aSlope > 1e-8;
  const tSlope = slides ? Math.sqrt((2 * L) / aSlope) : Infinity;
  const tt = Math.max(0, t);
  let s = 0;
  let v = 0;
  let h = H;
  let onSlope = true;
  if (slides && tt <= tSlope) {
    s = 0.5 * aSlope * tt * tt;
    v = aSlope * tt;
    h = H - s * sin;
  } else if (slides) {
    const vBottom = aSlope * tSlope;
    const ah = -mu * g;
    const th = tt - tSlope;
    if (mu < 1e-8) {
      v = vBottom;
      s = L + vBottom * th;
    } else {
      const tStop = vBottom / (mu * g);
      if (th >= tStop) {
        v = 0;
        s = L + vBottom * tStop + 0.5 * ah * tStop * tStop;
      } else {
        v = vBottom + ah * th;
        s = L + vBottom * th + 0.5 * ah * th * th;
      }
    }
    h = 0;
    onSlope = false;
  }
  const KE = 0.5 * m * v * v;
  const PE = m * g * h;
  return {
    m, g, H, alpha: p.alpha, mu, L, aSlope, slides, tSlope, t: tt, s, v, h,
    KE, PE, E: KE + PE, E0: m * g * H, onSlope,
  };
}

/**
 * Constant heating power. A crystal stays at Tm while the latent heat is absorbed.
 * With crystal off, the same heat raises temperature and there is no plateau.
 */
export function melting(p, t) {
  const m = Math.max(p.m, 1e-6);
  const P = Math.max(0, p.P);
  const cS = Math.max(p.cS, 1e-6);
  const cL = Math.max(p.cL, 1e-6);
  const crystal = !!p.crystal;
  const Lf = crystal ? Math.max(0, p.Lf) : 0;
  const T0 = p.T0;
  const Tm = p.Tm;
  const Q = P * Math.max(0, t);
  const Q1 = m * cS * Math.max(0, Tm - T0);
  const Q2 = Q1 + m * Lf;
  let T;
  let phase;
  let fraction;
  if (!crystal) {
    T = T0 + Q / (m * cS);
    phase = 'warming';
    fraction = 0;
  } else if (Q < Q1) {
    T = T0 + Q / (m * cS);
    phase = 'solid';
    fraction = 0;
  } else if (Q < Q2 - 1e-6) {
    T = Tm;
    phase = 'melting';
    fraction = m * Lf > 0 ? (Q - Q1) / (m * Lf) : 1;
  } else {
    T = Tm + (Q - Q2) / (m * cL);
    phase = 'liquid';
    fraction = 1;
  }
  return {
    Q, Q1, Q2, T, T0, Tm, phase, fraction, crystal, P, m, Lf,
    t: Math.max(0, t),
    t1: P > 0 ? Q1 / P : Infinity,
    t2: P > 0 ? Q2 / P : Infinity,
  };
}
