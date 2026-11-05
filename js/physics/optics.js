/**
 * Geometric optics used by the Shanghai junior light chapter.
 *
 * Sign convention (school form, real-is-positive):
 *   1/u + 1/v = 1/f
 *   u > 0 real object, f > 0 converging, v > 0 real image on the far side,
 *   v < 0 virtual image on the object side.
 *   Lateral magnification m = −v/u (negative means inverted).
 *
 * Authority: thin-lens equation in the paraxial (Gaussian) form;
 * Snell's law n1 sin θ1 = n2 sin θ2; law of reflection θi = θr from the normal;
 * pinhole image scale from similar triangles.
 * Hecht, Optics; Shanghai junior textbook (沪科五四制 2024, ch. 4).
 * Assumptions live in each sim's `authority` field, not on the stage.
 */

export function clamp(n, a, b) {
  return Math.min(b, Math.max(a, n));
}

export function pinholeImage(p) {
  const u = Math.max(p.u, 1e-6);
  const v = Math.max(p.v, 1e-6);
  const d = Math.max(p.d, 0);
  const H = p.H;
  const hImg = (H * v) / u;
  const spot = (d * (u + v)) / u;
  return {
    u, v, d, H, hImg, spot,
    inverted: true,
    kind: 'real',
  };
}

export function reflectionLaw(p) {
  const theta = clamp(p.theta, 0, 89);
  return {
    theta,
    thetaR: theta,
    fromSurface: 90 - theta,
  };
}

export function planeMirrorImage(p) {
  const d = Math.max(p.d, 0);
  const h = p.h;
  return {
    d,
    h,
    imageD: d,
    imageH: h,
    kind: 'virtual',
    erect: true,
    sameSize: true,
    lateralReverse: true,
  };
}

export function snell(p) {
  const n1 = Math.max(p.n1, 1e-6);
  const n2 = Math.max(p.n2, 1e-6);
  const theta = clamp(p.theta, 0, 89);
  const rad = (theta * Math.PI) / 180;
  const s = (n1 / n2) * Math.sin(rad);
  const thetaC = n1 > n2 ? (Math.asin(n2 / n1) * 180) / Math.PI : null;
  if (s > 1) {
    return { n1, n2, theta, theta2: null, thetaR: theta, tir: true, thetaC };
  }
  return {
    n1, n2, theta,
    theta2: (Math.asin(s) * 180) / Math.PI,
    thetaR: theta,
    tir: false,
    thetaC,
  };
}

export function thinLens(p) {
  const u = Math.max(p.u, 1e-6);
  const f = Math.max(p.f, 1e-6);
  const h = p.h;
  const denom = 1 / f - 1 / u;
  if (Math.abs(denom) < 1e-8) {
    return {
      u, f, h, v: Infinity, m: Infinity, imageH: Infinity,
      kind: 'none', orient: 'none', size: 'none',
    };
  }
  const v = 1 / denom;
  const m = -v / u;
  const kind = v > 0 ? 'real' : 'virtual';
  const orient = m < 0 ? 'inverted' : 'erect';
  const absM = Math.abs(m);
  let size = 'same';
  if (absM > 1.02) size = 'magnified';
  else if (absM < 0.98) size = 'diminished';
  return { u, f, h, v, m, imageH: m * h, kind, orient, size };
}

/** Geometric blur of a real image when the screen is not at v. Aperture is the lens opening (cm). */
export function lensScreen(p, image) {
  if (!(image.v > 0) || !Number.isFinite(image.v)) {
    return { blurCm: null, aligned: false, catchesImage: false };
  }
  const blurCm = (Math.max(p.aperture, 0) * Math.abs(p.screen - image.v)) / image.v;
  const aligned = Math.abs(p.screen - image.v) <= 0.5;
  return { blurCm, aligned, catchesImage: true };
}

/**
 * Spectacle correction.
 * Myopia: a distant object is imaged at the far point (virtual), so f = −D_far.
 * Hyperopia: an object at the standard 25 cm reading distance is imaged at the
 * patient's near point (virtual): 1/u + 1/(−N) = 1/f.
 * Power in diopters uses f in metres: P = 100 / f_cm.
 */
export function spectacle(p) {
  if (p.mode === 'myopia') {
    const far = Math.max(p.farCm, 1);
    const u = Math.max(p.objectCm, 1);
    const inv = u >= 500 ? 1 / -far : 1 / u + 1 / -far;
    const fCm = 1 / inv;
    return { fCm, power: 100 / fCm, kind: 'diverging', farCm: far, objectCm: u };
  }
  const u = Math.max(p.readingCm, 1);
  const near = Math.max(p.nearCm, u + 1);
  const inv = 1 / u + 1 / -near;
  const fCm = 1 / inv;
  return { fCm, power: 100 / fCm, kind: 'converging', nearCm: near, readingCm: u };
}

/** Young double-slit fringe spacing: Δy = λ D / d. */
export function doubleSlit(p) {
  const lambda = Math.max(p.lambda, 1e-12);
  const D = Math.max(p.D, 1e-6);
  const d = Math.max(p.d, 1e-9);
  const dy = (lambda * D) / d;
  return { lambda, D, d, dy };
}

/** Malus’s law: I = I0 cos²θ. θ in degrees between polariser axes. */
export function malus(p) {
  const I0 = Math.max(p.I0, 0);
  const theta = p.theta;
  const rad = (theta * Math.PI) / 180;
  const I = I0 * Math.cos(rad) ** 2;
  return { I0, theta, I };
}

/**
 * Astronomical telescope (afocal): angular magnification M ≈ −f_obj / f_eye
 * for an object at infinity with the eyepiece at the rear focal plane of the objective.
 */
export function telescope(p) {
  const fObj = Math.max(p.fObj, 1e-6);
  const fEye = Math.max(p.fEye, 1e-6);
  const M = -fObj / fEye;
  const tube = fObj + fEye;
  return { fObj, fEye, M, tube };
}

/** Single-slit diffraction minima: a sin θ = m λ, small-angle y ≈ m λ L / a. */
export function singleSlit(p) {
  const a = Math.max(p.a, 1e-9);
  const lambda = Math.max(p.lambda, 1e-12);
  const L = Math.max(p.L, 1e-6);
  const m = Math.max(1, Math.round(p.m));
  const y = (m * lambda * L) / a;
  return { a, lambda, L, m, y };
}

/**
 * Thin-film bright condition.
 * mode 'reflect' (net π phase flip): constructive when 2 n t = (m + ½) λ.
 * mode 'transmit' (no net flip): constructive when 2 n t = m λ.
 */
export function thinFilm(p) {
  const n = Math.max(p.n, 1e-6);
  const thickness = Math.max(p.t, 0);
  const lambda = Math.max(p.lambda, 1e-12);
  const m = Math.max(0, Math.round(p.m ?? 0));
  const mode = p.mode === 'transmit' ? 'transmit' : 'reflect';
  const lhs = 2 * n * thickness;
  const half = mode === 'reflect';
  const condition = (m + (half ? 0.5 : 0)) * lambda;
  const denom = m + (half ? 0.5 : 0);
  const lambdaBright = denom > 0 ? lhs / denom : Infinity;
  const match = Math.abs(lhs - condition) / Math.max(condition, 1e-15);
  return { n, t: thickness, lambda, m, mode, lhs, condition, lambdaBright, match, half };
}

/**
 * Young double-slit intensity on the screen (far field):
 * I(y) = I0 cos²(π d y / (λ D)), with fringe spacing Δy = λ D / d.
 */
export function doubleSlitIntensity(p) {
  const base = doubleSlit(p);
  const y = p.y ?? 0;
  const I0 = Math.max(p.I0 ?? 1, 0);
  const phase = (Math.PI * base.d * y) / (base.lambda * base.D);
  const I = I0 * Math.cos(phase) ** 2;
  return { ...base, y, I0, I, phase };
}
