import { BOOKS, flatten, getBook } from '../js/curricula/index.js';
import { SIMS } from '../js/sims/registry.js';
import {
  thinLens, lensScreen, snell, pinholeImage, reflectionLaw, spectacle,
  hooke, twoForce, friction, inertiaCart, weight,
  solidPressure, hydrostatics, torricelli, bernoulliPipe,
  buoyancyOrigin, densityLab, floatState, archimedes, weighingBuoyancy,
} from '../js/physics/index.js';

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error('FAIL', msg);
  }
}
function near(a, b, eps, msg) {
  assert(Math.abs(a - b) <= eps, `${msg}: ${a} vs ${b}`);
}

const lens = thinLens({ u: 30, f: 10, h: 6 });
near(lens.v, 15, 1e-9, 'lens v');
near(lens.m, -0.5, 1e-9, 'lens m');
assert(lens.kind === 'real' && lens.orient === 'inverted' && lens.size === 'diminished', 'lens nature');
const screen = lensScreen({ aperture: 2, screen: 15 }, lens);
assert(screen.aligned && screen.catchesImage, 'screen on v is sharp');
const inside = thinLens({ u: 8, f: 10, h: 4 });
assert(inside.kind === 'virtual' && inside.orient === 'erect' && inside.v < 0, 'inside focus');
assert(lensScreen({ aperture: 2, screen: 20 }, inside).catchesImage === false, 'no real image inside f');

const ray = snell({ theta: 30, n1: 1, n2: 1.5 });
near(ray.theta2, (Math.asin(0.5 / 1.5) * 180) / Math.PI, 1e-9, 'snell');
assert(snell({ theta: 50, n1: 1.5, n2: 1 }).tir === true, 'TIR');
const pin = pinholeImage({ H: 8, u: 20, v: 10, d: 0.2 });
near(pin.hImg, 4, 1e-9, 'pinhole height');
near(pin.spot, 0.2 * 30 / 20, 1e-9, 'pinhole spot');
assert(reflectionLaw({ theta: 35 }).thetaR === 35, 'reflection');

const eye = spectacle({ mode: 'myopia', farCm: 50, objectCm: 800, readingCm: 25, nearCm: 100 });
near(eye.power, -2, 1e-9, 'myopia -2 D');
const far = spectacle({ mode: 'hyperopia', farCm: 50, objectCm: 800, readingCm: 25, nearCm: 100 });
near(far.power, 3, 1e-6, 'hyperopia +3 D');

assert(hooke({ k: 200, x: 0.04, xMax: 0.1 }).F === 8, 'hooke');
assert(hooke({ k: 200, x: 0.12, xMax: 0.1 }).F === null, 'hooke limit');
const bal = twoForce({ F1: 6, F2: -6, m: 2, sameBody: true, collinear: true }, 1);
assert(bal.balanced && bal.a === 0, 'equilibrium');
const pair = twoForce({ F1: 6, F2: -6, m: 2, sameBody: false, collinear: true }, 1);
assert(!pair.balanced && pair.reason === 'two-bodies', 'third law is not equilibrium');
near(weight({ m: 2, g: 9.8 }).G, 19.6, 1e-9, 'weight');

const still = friction({ F: 4, m: 2, g: 9.8, muS: 0.4, muK: 0.3, area: 0.01 }, 1);
const wide = friction({ F: 4, m: 2, g: 9.8, muS: 0.4, muK: 0.3, area: 0.1 }, 1);
assert(still.regime === 'static' && still.friction === wide.friction, 'area does not enter friction');
const slide = friction({ F: 12, m: 2, g: 9.8, muS: 0.4, muK: 0.3 }, 0);
assert(slide.regime === 'kinetic', 'kinetic when F exceeds μs N');
const coast = inertiaCart({ v0: 1.2, mu: 0, g: 9.8, xStop: 1 }, 2);
near(coast.vBlock, 1.2, 1e-9, 'μ = 0 keeps v0');
assert(coast.xBlock > coast.xCart, 'block continues');

near(solidPressure({ F: 20, A: 0.01 }).p, 2000, 1e-9, 'pressure');
const hydro = hydrostatics({ rho: 1000, g: 9.8, h: 0.2, A1: 0.02, A2: 0.008, h1: 0.12, rho2: 800 });
near(hydro.pGauge, 1960, 1e-9, 'ρgh');
near(hydro.h2, 0.15, 1e-9, 'u-tube');
assert(hydro.Fwide > hydro.Fnarrow && hydro.pGauge === hydro.Fwide / hydro.A1, 'same p, different F');
near(torricelli({ P: 1.013e5, g: 9.8, r: 0.1 }).h, 0.76, 0.002, 'torricelli');
const pipe = bernoulliPipe({ A1: 0.02, A2: 0.01, v1: 2, rho: 1000, P1: 120000 });
near(pipe.v2, 4, 1e-9, 'continuity');
assert(pipe.P2 < pipe.P1, 'faster means lower pressure');

const cube = buoyancyOrigin({ a: 0.1, rho: 1000, g: 9.8, hTop: 0.05 });
near(cube.Fb, cube.rho * cube.g * cube.Vsub, 1e-9, 'pressure difference is Archimedes');
near(cube.Fb, 9.8, 1e-9, 'fully submerged cube');
const lab = densityLab({ rho: 2700, V: 20, V1: 40 });
near(lab.m, 54, 1e-9, 'lab mass');
near(lab.rhoMeas, 2700, 1e-6, 'lab recovers ρ');
assert(lab.rhoIfForgot !== lab.rhoMeas, 'forgetting V1 changes ρ');
const wood = floatState({ mode: 'solid', rhoO: 600, rhoL: 1000, V: 0.002, g: 9.8, mass: 0, ballast: 0 });
assert(wood.state === 'floating' && Math.abs(wood.fraction - 0.6) < 1e-9, 'wood floats');
const ship = floatState({ mode: 'ship', rhoL: 1000, V: 1.2, g: 9.8, mass: 800, ballast: 0, rhoO: 0 });
assert(ship.state === 'floating', 'ship floats');
const sub = floatState({ mode: 'submarine', rhoL: 1000, V: 1.2, g: 9.8, mass: 900, ballast: 500, rhoO: 0 });
assert(sub.state === 'sunk', 'ballast sinks the submarine');
near(archimedes({ V: 0.0003, frac: 0.5, rho: 1000, g: 9.8 }).Fb, 1000 * 9.8 * 0.00015, 1e-9, 'archimedes');
const hang = weighingBuoyancy({ V: 0.0002, g: 9.8, rhoL: 1000, rhoO: 2700 });
near(hang.T, hang.G - hang.Fb, 1e-9, 'weighing');

const junior = getBook('sh-junior');
for (const id of ['shj-4', 'shj-5', 'shj-6', 'shj-7']) {
  const ch = junior.chapters.find((c) => c.id === id);
  assert(ch, `chapter ${id}`);
  for (const sec of ch.sections) {
    assert(sec.lessons.some((ls) => ls.status === 'ready' && SIMS[ls.sim]), `${sec.id} has a ready sim`);
  }
}

const ids = new Set();
for (const book of BOOKS) {
  for (const ch of book.chapters) {
    assert(book.volumes.some((v) => v.id === ch.volume), `${ch.id} volume`);
  }
  for (const row of flatten(book)) {
    assert(!ids.has(row.lesson.id), `duplicate ${row.lesson.id}`);
    ids.add(row.lesson.id);
    if (row.lesson.status === 'ready') {
      const sim = SIMS[row.lesson.sim];
      assert(sim, `missing sim ${row.lesson.sim}`);
      const preset = { ...sim.params, ...row.lesson.preset };
      for (const key of Object.keys(row.lesson.preset || {})) {
        assert(key in sim.params, `${row.lesson.id} preset ${key}`);
      }
      const d = sim.compute(preset, 0.4);
      const questions = sim.checks(d, preset);
      assert(questions.length >= 1, `${row.lesson.id} checks`);
      for (const question of questions) {
        assert(question.answer >= 0 && question.answer < question.options.length, `${row.lesson.id} answer`);
        assert(question.en && question.zh, `${row.lesson.id} prompt`);
      }
      assert(sim.readouts(d, preset).length >= 1, `${row.lesson.id} readouts`);
      assert(sim.authority && sim.debug?.en && sim.debug?.zh, `${row.lesson.id} authority`);
    } else {
      assert(row.lesson.sim == null, `${row.lesson.id} queued has no sim`);
      assert(row.lesson.intent?.en && row.lesson.intent?.zh, `${row.lesson.id} intent`);
    }
  }
}
for (const id of Object.keys(SIMS)) {
  assert([...ids].some((lesson) => flatten(getBook('sh-junior')).concat(flatten(getBook('pep-junior'))).some((r) => r.lesson.sim === id)), `sim ${id} is mounted`);
}

const pepLens = flatten(getBook('pep-junior')).find((r) => r.lesson.sim === 'convex-lens');
const shLens = flatten(junior).find((r) => r.lesson.sim === 'convex-lens');
assert(pepLens && shLens && pepLens.lesson.sim === shLens.lesson.sim, 'one lens engine, two books');

if (failed) {
  console.error(`${failed} failed`);
  process.exit(1);
}
console.log(`ok ${ids.size} lessons, ${Object.keys(SIMS).length} simulations`);
