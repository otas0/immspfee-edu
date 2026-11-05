/** Spring: L = T − V, H = T + V. x = A cos(ωt), ω = √(k/m), satisfies ma = −kx. */
export function oscillator(p, t) {
  const m = Math.max(p.m, 1e-6);
  const k = Math.max(p.k, 1e-6);
  const A = p.A;
  const tt = Math.max(0, t);
  const w = Math.sqrt(k / m);
  const x = A * Math.cos(w * tt);
  const v = -A * w * Math.sin(w * tt);
  const T = 0.5 * m * v * v;
  const V = 0.5 * k * x * x;
  const accel = -A * w * w * Math.cos(w * tt);
  return {
    m, k, A, w, t: tt, x, v, T, V, H: T + V, L: T - V,
    H0: 0.5 * k * A * A, residual: m * accel + k * x, momentum: m * v,
  };
}

/** Uniform disk about its centre. τ = R F sinφ, φ from the outward radius. I = ½MR². */
export function rigidDisk(p, t) {
  const M = Math.max(p.M, 1e-6);
  const R = Math.max(p.R, 1e-6);
  const tau = R * p.F * Math.sin((p.phi * Math.PI) / 180);
  const I = 0.5 * M * R * R;
  const alpha = tau / I;
  const tt = Math.max(0, t);
  return { M, R, F: p.F, phi: p.phi, tau, I, alpha, t: tt, omega: alpha * tt, theta: 0.5 * alpha * tt * tt };
}

function rk4Pendulum(th, w, dt, g, L) {
  const deriv = (th1, w1) => [w1, -(g / L) * Math.sin(th1)];
  const k1 = deriv(th, w);
  const k2 = deriv(th + 0.5 * dt * k1[0], w + 0.5 * dt * k1[1]);
  const k3 = deriv(th + 0.5 * dt * k2[0], w + 0.5 * dt * k2[1]);
  const k4 = deriv(th + dt * k3[0], w + dt * k3[1]);
  return [
    th + (dt * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0])) / 6,
    w + (dt * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1])) / 6,
  ];
}

/** θ'' = −(g/L) sin θ. A second pendulum starts δθ away. Energy is per unit mass. */
export function pendulumPair(p, t) {
  const g = p.g;
  const L = Math.max(p.L, 1e-6);
  const tt = Math.max(0, t);
  const run = (theta0) => {
    let th = theta0;
    let w = 0;
    const dt = 0.002;
    const n = Math.min(15000, Math.ceil(tt / dt));
    const step = n > 0 ? tt / n : 0;
    const E0 = g * L * (1 - Math.cos(theta0));
    for (let i = 0; i < n; i += 1) [th, w] = rk4Pendulum(th, w, step, g, L);
    const E = 0.5 * (L * w) ** 2 + g * L * (1 - Math.cos(th));
    return { th, w, E, E0 };
  };
  const a = run(p.theta0);
  const b = run(p.theta0 + p.delta);
  const sep = Math.abs(Math.atan2(Math.sin(a.th - b.th), Math.cos(a.th - b.th)));
  return { g, L, t: tt, theta0: p.theta0, delta: p.delta, theta: a.th, theta2: b.th, sep, E: a.E, E0: a.E0 };
}

/**
 * Two equal pendulums coupled by a weak spring (small-angle teaching form).
 * θ1'' = −ω0² θ1 − κ (θ1 − θ2), θ2'' = −ω0² θ2 − κ (θ2 − θ1),
 * with ω0² = g/L and κ = k/m. Energies per unit mass exchange between the two.
 */
export function coupledPendula(p, t) {
  const g = Math.max(p.g, 1e-6);
  const L = Math.max(p.L, 1e-6);
  const kappa = Math.max(p.kappa, 0);
  const w0 = Math.sqrt(g / L);
  const ws = Math.sqrt(w0 * w0);
  const wa = Math.sqrt(w0 * w0 + 2 * kappa);
  const A1 = p.A1;
  const A2 = p.A2;
  const tt = Math.max(0, t);
  // Symmetric / antisymmetric decomposition of initial (A1, A2) at rest.
  const As = 0.5 * (A1 + A2);
  const Aa = 0.5 * (A1 - A2);
  const th1 = As * Math.cos(ws * tt) + Aa * Math.cos(wa * tt);
  const th2 = As * Math.cos(ws * tt) - Aa * Math.cos(wa * tt);
  const w1 = -As * ws * Math.sin(ws * tt) - Aa * wa * Math.sin(wa * tt);
  const w2 = -As * ws * Math.sin(ws * tt) + Aa * wa * Math.sin(wa * tt);
  const E1 = 0.5 * (L * w1) ** 2 + 0.5 * g * L * th1 * th1;
  const E2 = 0.5 * (L * w2) ** 2 + 0.5 * g * L * th2 * th2;
  const Ecoup = 0.5 * kappa * L * L * (th1 - th2) ** 2;
  const E = E1 + E2 + Ecoup;
  return {
    g, L, kappa, t: tt, w0, ws, wa, th1, th2, w1, w2, E1, E2, Ecoup, E, A1, A2,
  };
}

/** Inverse-square orbit. Launch is perpendicular to the radius. GM is the model parameter. */
export function centralOrbit(p, t) {
  const GM = Math.max(p.GM, 1e-9);
  const r0 = Math.max(p.r, 1e-6);
  const v = Math.max(0, p.v);
  const vCirc = Math.sqrt(GM / r0);
  const vEsc = Math.sqrt((2 * GM) / r0);
  const h = r0 * v;
  const specificE = 0.5 * v * v - GM / r0;
  const e = Math.sqrt(Math.max(0, 1 + (2 * specificE * h * h) / (GM * GM)));
  let kind = 'ellipse';
  if (v <= 1e-8) kind = 'radial';
  else if (specificE > 1e-6) kind = 'hyperbola';
  else if (Math.abs(specificE) <= 1e-6) kind = 'parabola';
  else if (e < 1e-3) kind = 'circle';
  const tt = Math.max(0, t);
  let th = v + 1e-9 >= vCirc ? 0 : Math.PI;
  if (kind !== 'radial' && h > 0 && tt > 0) {
    const steps = Math.min(6000, Math.max(1, Math.ceil(tt / 0.01)));
    const dt = tt / steps;
    for (let i = 0; i < steps; i += 1) {
      const radius = (h * h / GM) / (1 + e * Math.cos(th));
      th += dt * h / (radius * radius);
    }
  }
  const radius = kind === 'radial' ? r0 : (h * h / GM) / (1 + e * Math.cos(th));
  const a = specificE < -1e-8 ? -GM / (2 * specificE) : null;
  return {
    GM, r0, v, h, e, specificE, kind, a, t: tt, theta: th, r: radius,
    x: radius * Math.cos(th), y: radius * Math.sin(th), vCirc, vEsc,
  };
}

/** Two equal masses, three equal springs, walls fixed. */
export function normalModes(p, t) {
  const m = Math.max(p.m, 1e-6);
  const k = Math.max(p.k, 1e-6);
  const tt = Math.max(0, t);
  const w1 = Math.sqrt(k / m);
  const w2 = Math.sqrt((3 * k) / m);
  const s = p.A1 * Math.cos(w1 * tt);
  const a = p.A2 * Math.cos(w2 * tt);
  return { m, k, A1: p.A1, A2: p.A2, w1, w2, t: tt, x1: s + a, x2: s - a };
}
