import * as optics from './optics.js';
import * as mech from './mech.js';
import * as fluids from './fluids.js';

const ALL = [
  optics.pinhole, optics.reflection, optics.planeMirror, optics.refraction, optics.convexLens, optics.vision,
  mech.forceSim, mech.springScale, mech.gravitySim, mech.composeSim, mech.balanceSim, mech.frictionSim, mech.inertiaSim,
  fluids.densitySim, fluids.densityLabSim, fluids.solidPressureSim, fluids.liquidPressureSim, fluids.atmosphereSim, fluids.bernoulliSim,
  fluids.buoyOriginSim, fluids.weighSim, fluids.archimedesSim, fluids.floatSim,
];

export const SIMS = Object.fromEntries(ALL.map((sim) => [sim.id, sim]));

export function listSims() {
  return ALL;
}
