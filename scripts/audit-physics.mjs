#!/usr/bin/env node
/**
 * Full model accuracy audit: every ready sim compute must stay finite and
 * match public teaching relations already covered in test-edu, plus corner
 * presets from curricula. Exit 1 on any miss.
 */
import { SIMS, loadAllSims, getSim } from '../js/sims/registry.js';
import { BOOKS, flatten } from '../js/curricula/index.js';
import * as phys from '../js/physics/index.js';

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error('FAIL', msg);
  }
}
function near(a, b, eps, msg) {
  assert(Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= eps, `${msg}: ${a} vs ${b}`);
}
function finiteDeep(v, path = 'root') {
  if (typeof v === 'number') {
    // Allow ±∞ (e.g. lens v→∞); reject NaN only.
    assert(!Number.isNaN(v), `${path} is NaN`);
    return;
  }
  if (Array.isArray(v)) {
    v.forEach((x, i) => finiteDeep(x, `${path}[${i}]`));
    return;
  }
  if (v && typeof v === 'object') {
    for (const [k, x] of Object.entries(v)) {
      if (typeof x === 'function') continue;
      finiteDeep(x, `${path}.${k}`);
    }
  }
}

await loadAllSims();

// --- Closed-form spot checks beyond the usual test-edu sample -------------
near(phys.thinLens({ u: 30, f: 10 }).v, 15, 1e-9, 'thinLens 1/u+1/v=1/f');
near(phys.snell({ theta: 30, n1: 1, n2: 1.5 }).theta2, (Math.asin(0.5 / 1.5) * 180) / Math.PI, 1e-9, 'Snell');
near(phys.circuit({ layout: 'series', links: 'bp-s1,s2-a1,a2-b1,b2-bn', closed: true, E: 3, r: 0.5, R1: 4, R2: 6, Rs: 0 }).I, 3 / 10.5, 1e-9, 'series I');
near(phys.doubleSlit({ lambda: 5e-7, D: 1, d: 1e-3 }).dy, 5e-4, 1e-15, 'Young Δy');
near(phys.carnotEta({ Th: 400, Tc: 200 }).eta, 0.5, 1e-12, 'Carnot');
near(phys.idealGas({ n: 2, T: 273.15, V: 0.044821 }).p, (2 * 8.314462618 * 273.15) / 0.044821, 1e-3, 'ideal gas p');
near(phys.massEnergy({ m: 1 }).E / (2.99792458e8 ** 2), 1, 1e-12, 'E=mc² ratio');
near(phys.halfLife({ N0: 1024, T: 1, t: 10 }).N, 1, 1e-6, '10 half-lives');
const c = 2.99792458e8;
for (const beta of [0, 0.3, 0.6, 0.9]) {
  const gExpect = 1 / Math.sqrt(1 - beta * beta);
  const dil = phys.timeDilation({ v: beta * c, dtau: 1 });
  near(dil.gamma, gExpect, 1e-9, `γ(β=${beta})`);
  near(dil.dt, gExpect, 1e-9, `Δt(β=${beta}) with dτ=1`);
  near(phys.lengthContraction({ L0: 10, v: beta * c }).L, 10 / gExpect, 1e-9, `L contraction β=${beta}`);
}
near(phys.simultaneity({ L0: c, v: 0.6 * c }).gamma, 1 / Math.sqrt(1 - 0.36), 1e-9, 'simultaneity γ');
near(phys.malus({ I0: 2, theta: 45 }).I, 1, 1e-9, 'Malus 45°');
near(phys.ampereForce({ B: 1, I: 2, L: 0.5 }).F, 1, 1e-12, 'F=BIL');
near(phys.solenoidField({ n: 500, I: 1, turns: 4 }).B, 4e-7 * Math.PI * 500, 1e-12, 'μ0 n I');
near(phys.oscillator({ m: 1, k: 4, A: 0.1 }, 0).x, 0.1, 1e-12, 'SHO x(0)');
near(phys.oscillator({ m: 1, k: 4, A: 0.1 }, Math.PI / 4).x, 0, 1e-9, 'SHO x(T/4)'); // ω=2 → T=π, T/4=π/4
const fw = phys.finiteWell({ m: 9.1e-31, L: 1e-9, V0: 1.6e-18, E: 2e-18 });
assert(fw.E1f != null && fw.E1f < fw.E1inf, 'finite-well E1f < E1∞');
assert(fw.bound.length >= 2, `finite-well ≥2 bound states (got ${fw.bound.length})`);
for (let i = 0; i < fw.bound.length; i += 1) {
  const b = fw.bound[i];
  assert(b.E > 0 && b.E < fw.V0, `bound[${i}] inside well`);
  if (i > 0) assert(b.E > fw.bound[i - 1].E, `bound[${i}] above previous`);
  near(b.integ, 1, 0.08, `bound[${i}] ∫|ψ|²`);
  assert(b.parity === 'even' || b.parity === 'odd', `bound[${i}] parity`);
  assert(b.samples?.length > 8, `bound[${i}] ψ samples`);
}
// Deeper well → at least as many bound states.
const fwDeep = phys.finiteWell({ m: 9.1e-31, L: 1e-9, V0: 4e-18, E: 3e-18 });
assert(fwDeep.bound.length >= fw.bound.length, 'deeper well has ≥ bound states');
const ising = phys.isingMetropolis({ N: 6, T: 0.1, sweeps: 40, seed: 7 });
assert(ising.absM > 0.5, 'Ising low-T ordered');
const packet = phys.gaussianPacket({ m: 9.1e-31, sigma0: 1e-10, k0: 1e10, x0: 0 }, 0);
near(packet.xc, 0, 1e-20, 'packet centre at t=0');

// --- Every ready lesson: compute + checks + readouts finite --------------
const ready = [];
for (const book of BOOKS) {
  for (const row of flatten(book)) {
    if (row.lesson.status === 'ready' && row.lesson.sim) ready.push(row);
  }
}
assert(ready.length >= 100, `ready lessons sparse (${ready.length})`);

const seenSim = new Set();
for (const row of ready) {
  const sim = await getSim(row.lesson.sim);
  assert(sim, `missing ${row.lesson.sim}`);
  const preset = { ...sim.params, ...row.lesson.preset };
  let d;
  try {
    d = sim.compute(preset, 0.25);
  } catch (e) {
    assert(false, `${row.lesson.id} compute threw: ${e.message}`);
    continue;
  }
  finiteDeep(d, row.lesson.id);
  const ros = sim.readouts(d, preset);
  assert(ros?.length >= 1, `${row.lesson.id} empty readouts`);
  for (const r of ros) {
    if (typeof r.value === 'number') assert(Number.isFinite(r.value), `${row.lesson.id} readout ${r.en}`);
  }
  const qs = sim.checks(d, preset);
  assert(qs?.length >= 1, `${row.lesson.id} empty checks`);
  for (const q of qs) {
    assert(q.answer >= 0 && q.answer < q.options.length, `${row.lesson.id} bad answer idx`);
  }
  seenSim.add(sim.id);
}

for (const id of Object.keys(SIMS)) {
  assert(seenSim.has(id), `sim ${id} never mounted on a ready lesson`);
}

// Corner: schema extremes for each sim (min/max of first numeric field)
for (const id of Object.keys(SIMS)) {
  const sim = await getSim(id);
  const schema = typeof sim.schema === 'function' ? sim.schema(sim.params) : sim.schema;
  const nums = (schema || []).filter((f) => f.type === 'number' || (f.min != null && f.max != null && f.key));
  if (!nums.length) continue;
  const field = nums[0];
  for (const edge of [field.min, field.max]) {
    if (edge == null || !Number.isFinite(edge)) continue;
    const p = { ...sim.params, [field.key]: edge };
    try {
      const d = sim.compute(p, 0);
      finiteDeep(d, `${id}@${field.key}=${edge}`);
    } catch (e) {
      // Ising N≥12 without canvas is expected only in draw — compute should not throw.
      assert(false, `${id} corner compute ${field.key}=${edge}: ${e.message}`);
    }
  }
}

if (failed) {
  console.error(`${failed} physics audit failure(s)`);
  process.exit(1);
}
console.log(`ok audit-physics: ${ready.length} ready lessons, ${Object.keys(SIMS).length} sims, closed-form spot checks`);
