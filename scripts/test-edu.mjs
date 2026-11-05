import { BOOKS, flatten, getBook } from '../js/curricula/index.js';
import { SIMS, loadAllSims } from '../js/sims/registry.js';
import {
  thinLens, lensScreen, snell, pinholeImage, reflectionLaw, spectacle,
  hooke, twoForce, friction, inertiaCart, weight,
  solidPressure, hydrostatics, torricelli, bernoulliPipe,
  buoyancyOrigin, densityLab, floatState, archimedes, weighingBuoyancy,
  lever, pulley, workPower, circuit, electricalEnergy, CIRCUIT_LINKS,
  frames, segmentMotion, vtArea, projectile, energyTrack, melting,
  oscillator, rigidDisk, pendulumPair, centralOrbit, normalModes,
  specificHeat, ottoCycle, rulerReading, stopwatchReading, balanceReading, tuningFork, emWave,
  barMagnet, solenoidField, ampereForce, inductionRod, circularMotion, collide1d,
  twoCharges, currentFromCharge, thermometerReading,
  boiling, sublimation, soundAbsorb, echoRange,
  bohrLevels, internalEnergy, energyShare, efficiency, scaleLength,
  massEnergy, halfLife, photoelectric, capacitance, resistivity,
  lorentzForce, cyclotronRadius, pointField, fieldPotential,
  vacuumPlaneWave, idealGas, carnotEta, kineticGas, infiniteWell,
  doubleSlit, malus, telescope, acPeakRms, transformer, doppler, beats, dispersion, timeDilation,
  isingMetropolis, barrierTunnel, gaussianPacket, maxwellHistogram, fourierSquare,
  membraneMode, bellSinglet, sternGerlach, lengthContraction, laserCavity, thinFilm,
} from '../js/physics/index.js';

await loadAllSims();

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

const balancedLever = lever({ F1: 4, L1: 0.3, F2: 6, L2: 0.2 });
assert(balancedLever.balanced && Math.abs(balancedLever.tau) < 1e-9, 'lever balances');
const block = pulley({ n: 3, G: 12, Gp: 3, s: 0.6 });
near(block.F, 5, 1e-9, 'pulley force');
near(block.h, 0.2, 1e-9, 'pulley height');
near(block.eta, 0.8, 1e-9, 'pulley efficiency');
near(workPower({ F: 10, s: 2, theta: 60, t: 4 }).W, 10, 1e-9, 'work at 60°');

const series = circuit({ layout: 'series', links: CIRCUIT_LINKS.series, closed: true, E: 3, r: 0.5, R1: 4, R2: 6, Rs: 10 });
near(series.I, 3 / 10.5, 1e-9, 'series current');
near(series.I1, series.I2, 1e-9, 'series currents match');
const opened = circuit({ ...series, links: CIRCUIT_LINKS.series, closed: false, E: 3, r: 0.5, R1: 4, R2: 6, Rs: 10 });
assert(opened.fault === 'open' && Math.abs(opened.I) < 1e-8, 'open switch');
const dead = circuit({ layout: 'series', links: 'bp-bn', closed: true, E: 3, r: 0.5, R1: 4, R2: 6, Rs: 10 });
assert(dead.fault === 'short', 'short across the battery');
near(dead.I, 6, 1e-9, 'short current E/r');
const ohm = circuit({ layout: 'ohm', links: CIRCUIT_LINKS.ohm, closed: true, E: 6, r: 1, R1: 10, R2: 10, Rs: 10 });
near(ohm.U1, ohm.I1 * 10, 1e-9, 'ohm U = IR');
const joule = electricalEnergy({
  layout: 'series', links: CIRCUIT_LINKS.series, closed: true, E: 6, r: 0.5, R1: 6, R2: 0, Rs: 0, t: 10,
});
near(joule.I1, 6 / 6.5, 1e-9, 'joule load current');
near(joule.P, Math.abs(joule.U1 * joule.I1), 1e-9, 'P = UI');
near(joule.W, joule.P * 10, 1e-9, 'W = Pt');
near(joule.Q, joule.I1 * joule.I1 * 6 * 10, 1e-9, 'Q = I²Rt');
near(joule.Q, joule.W, 1e-9, 'pure resistor Q = W');
const house = electricalEnergy({
  layout: 'household', links: CIRCUIT_LINKS.household, closed: true, E: 220, r: 2, R1: 484, R2: 0, Rs: 0, t: 1,
});
near(house.I, 220 / 486, 1e-9, 'household load current');
const houseShort = circuit({ layout: 'household', links: 'bp-bn', closed: true, E: 220, r: 2, R1: 484, R2: 0, Rs: 0 });
near(houseShort.I, 110, 1e-9, 'household short is E/r');

const seen = frames({ frame: 'cart', vCart: 2, vPerson: 0.5, xCart0: 0, xPerson0: 0 }, 2);
near(seen.vPersonView, -1.5, 1e-9, 'person relative to the cart');
near(seen.xPersonView, -3, 1e-9, 'person position in the cart frame');
const piece = segmentMotion({ v1: 0.4, v2: 1.2, split: 3 }, 4);
near(piece.x, 0.4 * 3 + 1.2, 1e-9, 'two-piece position');
const area = vtArea({ v0: 2, a: 1, t1: 1, t2: 3 });
near(area.area, 8, 1e-9, 'v–t area');
near(area.area, area.displacement, 1e-9, 'area equals displacement');
const shot = projectile({ v0: 4, H: 5, g: 10 }, 0.5);
near(shot.x, 2, 1e-9, 'projectile x');
near(shot.y, 3.75, 1e-9, 'projectile y');
const coasting = energyTrack({ m: 1, g: 10, H: 2, alpha: 30, mu: 0 }, 0);
near(coasting.E, coasting.E0, 1e-9, 'energy starts at mgH');
const bottom = energyTrack({ m: 1, g: 10, H: 2, alpha: 30, mu: 0 }, 10);
near(bottom.KE, bottom.E0, 1e-6, 'bottom kinetic energy');
near(bottom.PE, 0, 1e-6, 'floor potential');
const ice = melting({ m: 0.1, P: 200, cS: 2100, cL: 4200, Lf: 3.34e5, T0: -20, Tm: 0, crystal: true }, 100);
assert(ice.phase === 'melting' && ice.T === 0, 'crystal plateau');
const glass = melting({ ...ice, crystal: false, m: 0.1, P: 200, cS: 2100, cL: 4200, Lf: 3.34e5, T0: -20, Tm: 0 }, 100);
assert(glass.phase === 'warming' && glass.T !== 0, 'no plateau without a crystal');

const spring = oscillator({ m: 0.5, k: 8, A: 0.12 }, 0.3);
near(spring.H, spring.H0, 1e-9, 'Hamiltonian conserved');
near(spring.residual, 0, 1e-9, 'Euler–Lagrange residual');
const disk = rigidDisk({ M: 2, R: 0.2, F: 4, phi: 90 }, 1);
near(disk.I, 0.04, 1e-12, 'disk inertia');
near(disk.alpha, 20, 1e-9, 'disk angular acceleration');
const swing = pendulumPair({ g: 9.8, L: 1, theta0: 0.4, delta: 0.01 }, 1);
assert(Math.abs(swing.E - swing.E0) < 1e-3, 'pendulum energy stays put');
const circle = centralOrbit({ GM: 1, r: 1, v: 1 }, Math.PI / 2);
assert(circle.kind === 'circle', 'circular orbit');
near(circle.x, 0, 0.02, 'quarter orbit x');
near(circle.y, 1, 0.02, 'quarter orbit y');
const modes = normalModes({ m: 1, k: 4, A1: 0.4, A2: 0 }, 0);
near(modes.w2, Math.sqrt(12), 1e-9, 'antisymmetric frequency');
near(modes.x1, modes.x2, 1e-9, 'symmetric mode');

const heat = specificHeat({ m1: 0.2, c1: 4200, m2: 0.2, c2: 900, P: 420, T0: 20 }, 10);
near(heat.Q, 4200, 1e-9, 'shared heat');
near(heat.dT1, 5, 1e-9, 'water rise Q/(c m)');
near(heat.dT2, 4200 / 180, 1e-9, 'sand rise');
assert(heat.dT2 > heat.dT1, 'smaller c rises more');

const otto = ottoCycle({ r: 8, Qin: 1000, Vmin: 0.0002 }, 0.5);
near(otto.eta, 1 - 1 / 8 ** 0.4, 1e-9, 'Otto η');
near(otto.W, otto.eta * 1000, 1e-9, 'W = η Qin');
near(otto.area, otto.W, 1e-6, 'p–V area equals W');
assert(otto.stroke.id === 'intake', 'first stroke is intake');
const power = ottoCycle({ r: 8, Qin: 1000, Vmin: 0.0002 }, 2.2);
assert(power.stroke.id === 'power', 'third stroke is power');
assert(flatten(getBook('sh-junior')).some((row) => row.lesson.sim === 'heat-engine'), 'heat-engine mounted');

const magnet = barMagnet({ strength: 0.7, flip: false });
assert(magnet.north === 'right' && magnet.south === 'left', 'bar magnet poles');
const sole = solenoidField({ n: 1000, I: 2, turns: 8 });
near(sole.B, 4e-7 * Math.PI * 1000 * 2, 1e-12, 'solenoid B = μ0 n I');
assert(sole.north === 'right', 'solenoid north with +I');
const amp = ampereForce({ B: 0.4, I: 3, L: 0.2 });
near(amp.F, 0.24, 1e-9, 'F = BIL');
const rod = inductionRod({ B: 0.5, ell: 0.2, x: 0.25, v: 1.5, R: 2 });
near(rod.flux, 0.025, 1e-9, 'Φ = Bℓx');
near(rod.emf, 0.15, 1e-9, 'ε = Bℓv');
near(rod.I, 0.075, 1e-9, 'I = ε/R');

const ruler = rulerReading({ trueCm: 3.64, division: 0.1 });
near(ruler.main, 3.6, 1e-9, 'ruler main mark');
assert(ruler.estimate === 4, 'ruler estimate digit');
near(ruler.reading, 3.64, 1e-9, 'ruler reading');
const watch = stopwatchReading({ t: 15 });
near(watch.reading, 15, 1e-9, 'stopwatch from angle');
near(watch.angle, Math.PI / 2, 1e-9, 'quarter turn is 15 s');
const scale = balanceReading({ object: 52.4, weights: 50, rider: 2.4 });
assert(scale.balanced, 'balance when weights + rider match');
near(scale.reading, 52.4, 1e-9, 'balance reading');
const fork = tuningFork({ f: 10, A: 2 }, 0.025);
near(fork.y, 2, 1e-9, 'fork at quarter period of 10 Hz');
const wave = emWave({ f: 1e8, A: 1 }, 0);
near(wave.lambda, 2.99792458, 1e-6, 'λ = c/f at 100 MHz');
near(wave.E, 0, 1e-9, 'E starts at 0');
const circ = circularMotion({ m: 0.5, r: 0.4, omega: 4 }, 0);
near(circ.v, 1.6, 1e-9, 'v = ωr');
near(circ.a, 6.4, 1e-9, 'a = ω²r');
near(circ.F, 3.2, 1e-9, 'F = ma');
const hit = collide1d({ m1: 2, m2: 1, u1: 3, u2: 0, kind: 'elastic' });
near(hit.p1, hit.p0, 1e-9, 'elastic momentum');
near(hit.ke1, hit.ke0, 1e-9, 'elastic KE');
const sticky = collide1d({ m1: 2, m2: 2, u1: 4, u2: -1, kind: 'inelastic' });
near(sticky.v1, sticky.v2, 1e-9, 'inelastic common speed');
near(sticky.p1, sticky.p0, 1e-9, 'inelastic momentum');
assert(sticky.ke1 < sticky.ke0 - 1e-9, 'inelastic loses KE');
const coulomb = twoCharges({ q1: 2e-6, q2: -3e-6, r: 0.2 });
assert(coulomb.sense === 'attract', 'unlike charges attract');
near(coulomb.F, (9e9 * 6e-12) / (0.2 * 0.2), 1e-6, 'Coulomb F');
const amps = currentFromCharge({ Q: 12, t: 4 });
near(amps.I, 3, 1e-9, 'I = Q/t');
const thermo = thermometerReading({ T: 40, Tmin: -20, Tmax: 100 });
near(thermo.frac, 0.5, 1e-9, 'thermometer mid-scale');

const boil = boiling({ m: 0.1, P: 400, cL: 4200, cV: 2000, Lv: 2.26e6, T0: 20, Tb: 100 }, 100);
assert(boil.phase === 'boiling' && boil.T === 100, 'boiling plateau');
const subl = sublimation({ m: 0.05, P: 200, cS: 1500, cG: 1000, Ls: 5.9e5, T0: -40, Ts: -20 }, 10);
assert(subl.phase === 'sublimating' && subl.T === -20, 'sublimation plateau');
const absorb = soundAbsorb({ I0: 1, R: 0.3, alpha: 2, d: 0.4 });
near(absorb.I, 0.7 * Math.exp(-0.8), 1e-9, 'sound absorb');
near(echoRange({ t: 0.02, v: 340 }).s, 3.4, 1e-9, 'echo range');
near(bohrLevels({ n: 2, n2: 1 }).E, -3.4, 1e-9, 'Bohr n=2');
near(internalEnergy({ W: 40, Q: -15 }).dU, 25, 1e-9, 'ΔU = W+Q');
near(energyShare({ E0: 100, f: 0.4 }).total, 100, 1e-9, 'energy share conserved');
near(efficiency({ Ein: 100, Eu: 35 }).eta, 0.35, 1e-9, 'efficiency');
assert(scaleLength({ L: 1e-10 }).nearest.id === 'atom', 'scale nearest atom');
near(massEnergy({ m: 1e-9 }).E, 1e-9 * 2.99792458e8 ** 2, 1e3, 'E=mc²');
near(halfLife({ N0: 1000, T: 10, t: 10 }).N, 500, 1e-6, 'one half-life');
assert(photoelectric({ W: 2.3, f: 1e14 }).emits === false, 'below cutoff');
near(capacitance({ Q: 2e-6, U: 5 }).C, 4e-7, 1e-15, 'C=Q/U');
near(resistivity({ rho: 1.7e-8, L: 2, A: 1e-6 }).R, 0.034, 1e-12, 'R=ρL/A');
near(lorentzForce({ q: 1.6e-19, v: 2e6, B: 0.05 }).F, 1.6e-19 * 2e6 * 0.05, 1e-30, 'F=qvB');
near(cyclotronRadius({ m: 9.1e-31, q: -1.6e-19, v: 2e6, B: 0.05 }).r, (9.1e-31 * 2e6) / (1.6e-19 * 0.05), 1e-12, 'cyclotron r');
near(pointField({ q: 2e-6, r: 0.2 }).E, (9e9 * 2e-6) / 0.04, 1e-6, 'point field');
near(fieldPotential({ E: 200, d: 0.05, q: 2e-6 }).U, 10, 1e-9, 'U=Ed');

const maxwell = vacuumPlaneWave({ f: 1e8, E0: 1 }, 0);
near(maxwell.lambda, 2.99792458, 1e-6, 'maxwell λ');
near(maxwell.Jd, maxwell.eps0 * maxwell.dEdt, 1e-12, 'Jd=ε0 dE/dt');
near(idealGas({ n: 1, T: 300, V: 0.024 }).pV, 1 * 8.314462618 * 300, 1e-6, 'pV=nRT');
near(carnotEta({ Th: 600, Tc: 300 }).eta, 0.5, 1e-9, 'Carnot η');
near(kineticGas({ rho: 1.2, vrms: 500 }).p, 1e5, 1e-6, 'kinetic p');
assert(infiniteWell({ n: 1, m: 9.1e-31, L: 1e-9 }).En > 0, 'well energy');
near(doubleSlit({ lambda: 6e-7, D: 1.2, d: 2e-4 }).dy, (6e-7 * 1.2) / 2e-4, 1e-15, 'Δy');
near(malus({ I0: 1, theta: 60 }).I, 0.25, 1e-9, 'Malus');
near(telescope({ fObj: 50, fEye: 5 }).M, -10, 1e-9, 'telescope M');
near(acPeakRms({ Im: 2, Vm: 10, f: 50 }, 0).Irms, 2 / Math.SQRT2, 1e-9, 'Irms');
near(transformer({ n1: 100, n2: 20, U1: 220, I2: 5 }).U2, 44, 1e-9, 'transformer U2');
near(doppler({ f: 440, v: 340, vo: 0, vs: 20, observerToward: true, sourceToward: true }).fp, 440 * 340 / 320, 1e-9, 'doppler');
near(beats({ f1: 256, f2: 260, A: 1 }, 0).df, 4, 1e-9, 'beats');
near(dispersion({ omega0: 0, c: 2, k: 1 }).vg, 2, 1e-9, 'vg=c when ω0=0');
assert(timeDilation({ v: 0, dtau: 1 }).dt === 1, 'no dilation at rest');
assert(timeDilation({ v: 1.5e8, dtau: 1 }).gamma > 1, 'gamma>1');

const ising = isingMetropolis({ N: 8, T: 0.5, sweeps: 30, seed: 2 });
assert(ising.spins.length === 64 && ising.absM >= 0, 'ising lattice');
const tun = barrierTunnel({ m: 9.1e-31, a: 1e-10, V0: 1.6e-18, E: 8e-19 });
assert(tun.regime === 'tunnel' && tun.T > 0 && tun.T < 1, 'tunnel T');
const pkt = gaussianPacket({ m: 9.1e-31, sigma0: 2e-10, k0: 0, x0: 0 }, 1e-14);
assert(pkt.sigma > pkt.sigma0, 'packet spreads');
const hist = maxwellHistogram({ m: 4.65e-26, T: 300, bins: 12, vmax: 1500 });
assert(hist.vmp < hist.vavg && hist.vavg < hist.vrms, 'maxwell speed order');
near(fourierSquare({ nTerms: 1, f0: 1, A: 1 }, 0.25).y, 4 / Math.PI, 1e-9, 'fourier first peak');
near(membraneMode({ m: 1, n: 1, a: 1, b: 1, c: 1 }, 0).omega, Math.PI * Math.SQRT2, 1e-9, 'membrane ω11');
near(bellSinglet({ alpha: 0, beta: 0 }).corr, -1, 1e-9, 'bell parallel');
near(sternGerlach({ theta: 0 }).pUp, 1, 1e-9, 'SG aligned');
near(lengthContraction({ L0: 2, v: 0 }).L, 2, 1e-9, 'no contraction at rest');
near(laserCavity({ L: 0.5 }).dnu, 2.99792458e8, 1e-3, 'cavity Δν');
near(thinFilm({ n: 1.33, t: 1e-7, lambda: 5.32e-7, m: 0 }).lhs, 2.66e-7, 1e-15, '2nt');

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
const mounted = new Set();
for (const book of BOOKS) {
  for (const row of flatten(book)) {
    if (row.lesson.sim) mounted.add(row.lesson.sim);
  }
}
for (const id of Object.keys(SIMS)) {
  assert(mounted.has(id), `sim ${id} is mounted`);
}
const senior = getBook('sh-senior');
assert(senior.tocConfidence === 'compulsory-1-3-and-elective-2-2021', 'senior contents note');
assert(flatten(senior).some((row) => row.lesson.sim === 'vt-area'), 'v–t lesson');
assert(flatten(senior).some((row) => row.lesson.id === 'shs-2-2a' && row.lesson.sim === 'vt-area'), 'free-fall on v–t');
assert(flatten(senior).some((row) => row.lesson.preset?.v0 === 0 && row.lesson.preset?.a === 10), 'free-fall preset');
assert(flatten(senior).some((row) => row.lesson.sim === 'projectile'), 'projectile lesson');
assert(flatten(senior).some((row) => row.section.title.zh === '平抛运动'), 'published projectile section');
const freeFall = vtArea({ v0: 0, a: 10, t1: 0, t2: 1.5 });
near(freeFall.area, 0.5 * 10 * 1.5 * 1.5, 1e-9, 'free-fall triangle area');
const pep = getBook('pep-junior');
assert(pep.tocConfidence === 'grade8-2024', 'pep 2024 tree');
assert(!pep.edition.zh.includes('2011'), 'pep edition no longer says 2011');
assert(flatten(pep).some((row) => row.section.title.zh.includes('机械效率')), 'pep efficiency section');
assert(flatten(pep).some((row) => row.section.title.zh.includes('同一直线上二力的合成')), 'pep collinear section');
const uni = flatten(getBook('university')).filter((row) => row.chapter.id === 'uni-cm');
assert(uni.length >= 5 && uni.every((row) => row.lesson.status === 'ready'), 'classical mechanics entrance');

const pepLens = flatten(getBook('pep-junior')).find((r) => r.lesson.sim === 'convex-lens');
const shLens = flatten(junior).find((r) => r.lesson.sim === 'convex-lens');
assert(pepLens && shLens && pepLens.lesson.sim === shLens.lesson.sim, 'one lens engine, two books');

if (failed) {
  console.error(`${failed} failed`);
  process.exit(1);
}
console.log(`ok ${ids.size} lessons, ${Object.keys(SIMS).length} simulations`);
