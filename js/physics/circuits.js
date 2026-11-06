const PORTS = ['bp', 'bn', 's1', 's2', 'a1', 'a2', 'b1', 'b2', 'h1', 'h2'];

export function parseLinks(links) {
  return String(links || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.split('-'))
    .filter(([a, b]) => PORTS.includes(a) && PORTS.includes(b) && a !== b);
}

export function toggleLink(links, a, b) {
  const rows = parseLinks(links);
  const key = [a, b].sort().join('-');
  const next = [];
  let found = false;
  for (const [u, v] of rows) {
    if ([u, v].sort().join('-') === key) {
      found = true;
      continue;
    }
    next.push(`${u}-${v}`);
  }
  if (!found) next.push(`${a}-${b}`);
  return next.join(',');
}

function solveLinear(A, b) {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < n; c += 1) {
    let piv = c;
    for (let r = c + 1; r < n; r += 1) {
      if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r;
    }
    if (Math.abs(M[c][c]) < 1e-12 && Math.abs(M[piv][c]) < 1e-12) return null;
    [M[c], M[piv]] = [M[piv], M[c]];
    const div = M[c][c];
    for (let j = c; j <= n; j += 1) M[c][j] /= div;
    for (let r = 0; r < n; r += 1) {
      if (r === c) continue;
      const f = M[r][c];
      for (let j = c; j <= n; j += 1) M[r][j] -= f * M[c][j];
    }
  }
  return M.map((row) => row[n]);
}

/** DC circuit. Internal resistance r keeps a short at the finite current E/r. */
export function circuit(p) {
  const E = p.E;
  const r = Math.max(p.r, 1e-6);
  const parts = { R1: Math.max(0, p.R1), R2: Math.max(0, p.R2), Rs: Math.max(0, p.Rs) };
  const ends = { R1: ['a1', 'a2'], R2: ['b1', 'b2'], Rs: ['h1', 'h2'] };
  const parent = Object.fromEntries(PORTS.map((port) => [port, port]));
  const find = (x) => {
    let i = x;
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]];
      i = parent[i];
    }
    return i;
  };
  const unite = (a, b) => {
    const pa = find(a);
    const pb = find(b);
    if (pa !== pb) parent[pa] = pb;
  };
  for (const [a, b] of parseLinks(p.links)) unite(a, b);
  if (p.closed) unite('s1', 's2');
  // R ≈ 0 is an intentional wire (unused branch), not a fault. Only a
  // positive-R part whose terminals are already shorted counts as bypassed.
  const bypassed = [];
  for (const key of Object.keys(parts)) {
    if (parts[key] <= 1e-8) unite(ends[key][0], ends[key][1]);
  }
  for (const key of Object.keys(parts)) {
    if (parts[key] > 1e-8 && find(ends[key][0]) === find(ends[key][1])) bypassed.push(key);
  }
  const ground = find('bn');
  const short = find('bp') === ground;
  const base = { E, r, closed: !!p.closed, R1: parts.R1, R2: parts.R2, Rs: parts.Rs, bypassed };
  if (short) {
    return { ...base, fault: 'short', I: E / r, Uterm: 0, U1: 0, U2: 0, Us: 0, I1: 0, I2: 0, Is: 0 };
  }
  const elements = [['bp', 'bn', r]];
  for (const key of Object.keys(parts)) {
    if (parts[key] > 1e-8) elements.push([ends[key][0], ends[key][1], parts[key]]);
  }
  const adj = new Map();
  const join = (a, b) => {
    if (!adj.has(a)) adj.set(a, []);
    if (!adj.has(b)) adj.set(b, []);
    adj.get(a).push(b);
    adj.get(b).push(a);
  };
  for (const [a, b] of elements) join(find(a), find(b));
  const reach = new Set();
  const stack = [ground];
  while (stack.length) {
    const n = stack.pop();
    if (reach.has(n)) continue;
    reach.add(n);
    for (const next of adj.get(n) || []) stack.push(next);
  }
  const nodes = [];
  const index = {};
  for (const n of reach) {
    if (n === ground || index[n] != null) continue;
    index[n] = nodes.length;
    nodes.push(n);
  }
  const id = (port) => {
    const n = find(port);
    return n === ground || index[n] == null ? -1 : index[n];
  };
  const N = nodes.length;
  const G = Array.from({ length: N }, () => Array(N).fill(0));
  const I = Array(N).fill(0);
  const stampR = (portA, portB, R) => {
    if (!(R > 1e-8)) return;
    const a = id(portA);
    const b = id(portB);
    const g = 1 / R;
    if (a >= 0) G[a][a] += g;
    if (b >= 0) G[b][b] += g;
    if (a >= 0 && b >= 0) {
      G[a][b] -= g;
      G[b][a] -= g;
    }
  };
  stampR('bp', 'bn', r);
  const bp = id('bp');
  if (bp >= 0) I[bp] += E / r;
  for (const key of Object.keys(parts)) stampR(ends[key][0], ends[key][1], parts[key]);
  const volt = Array(N).fill(0);
  if (N > 0) {
    const solved = solveLinear(G, I);
    if (!solved) {
      return { ...base, fault: 'open', I: 0, Uterm: E, U1: 0, U2: 0, Us: 0, I1: 0, I2: 0, Is: 0 };
    }
    for (let i = 0; i < N; i += 1) volt[i] = solved[i];
  }
  const V = (port) => (id(port) < 0 ? 0 : volt[id(port)]);
  const branch = (portA, portB, R) => {
    if (!(R > 1e-8) || find(portA) === find(portB)) return { U: 0, I: 0 };
    const U = V(portA) - V(portB);
    return { U, I: U / R };
  };
  const b1 = branch('a1', 'a2', parts.R1);
  const b2 = branch('b1', 'b2', parts.R2);
  const bs = branch('h1', 'h2', parts.Rs);
  const Uterm = V('bp') - V('bn');
  const Ibat = (E - Uterm) / r;
  let fault = 'ok';
  if (Math.abs(Ibat) < 1e-6) fault = 'open';
  else if (bypassed.length) fault = 'short';
  return { ...base, fault, I: Ibat, Uterm, U1: b1.U, U2: b2.U, Us: bs.U, I1: b1.I, I2: b2.I, Is: bs.I };
}

export const CIRCUIT_LINKS = {
  series: 'bp-s1,s2-a1,a2-b1,b2-bn',
  parallel: 'bp-s1,s2-a1,s2-b1,a2-bn,b2-bn',
  ohm: 'bp-s1,s2-h1,h2-a1,a2-bn',
  household: 'bp-s1,s2-a1,a2-bn',
};

/**
 * Electrical work, power, and Joule heat on R1 from the same DC solve.
 * W = U I t, P = U I, Q = I² R t. For a pure resistor Q equals W.
 */
export function electricalEnergy(p) {
  const d = circuit(p);
  const t = Math.max(p.t ?? 0, 0);
  const U = Math.abs(d.U1);
  const I = Math.abs(d.I1);
  const R = d.R1;
  const P = U * I;
  const W = P * t;
  const Q = I * I * R * t;
  return { ...d, t, U, Iload: I, P, W, Q };
}

/** Sinusoidal AC: I_rms = Im/√2, V_rms = Vm/√2, instantaneous i = Im sin(ωt). */
export function acPeakRms(p, t = 0) {
  const Im = Math.max(p.Im, 0);
  const Vm = Math.max(p.Vm, 0);
  const f = Math.max(p.f, 1e-6);
  const time = Math.max(0, t);
  const omega = 2 * Math.PI * f;
  const Irms = Im / Math.SQRT2;
  const Vrms = Vm / Math.SQRT2;
  const i = Im * Math.sin(omega * time);
  const v = Vm * Math.sin(omega * time);
  return { Im, Vm, f, t: time, omega, Irms, Vrms, i, v };
}

/** Ideal transformer: U1/U2 = n1/n2 and I1/I2 = n2/n1 (power conserved). */
export function transformer(p) {
  const n1 = Math.max(p.n1, 1);
  const n2 = Math.max(p.n2, 1);
  const U1 = Math.max(p.U1, 0);
  const U2 = U1 * (n2 / n1);
  const I2 = Math.max(p.I2, 0);
  const I1 = I2 * (n2 / n1);
  const Pin = U1 * I1;
  const Pout = U2 * I2;
  return { n1, n2, U1, U2, I1, I2, Pin, Pout, ratio: n2 / n1 };
}
