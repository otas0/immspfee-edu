/** Lazy loaders: only the module for the open lesson is fetched. */
const LOADERS = {
  optics: () => import('./optics.js'),
  mech: () => import('./mech.js'),
  fluids: () => import('./fluids.js'),
  machines: () => import('./machines.js'),
  circuits: () => import('./circuits.js'),
  motion: () => import('./motion.js'),
  advance: () => import('./advance.js'),
  thermal: () => import('./thermal.js'),
  measure: () => import('./measure.js'),
  waves: () => import('./waves.js'),
  em: () => import('./em.js'),
};

const MAP = {
  pinhole: ['optics', 'pinhole'],
  reflection: ['optics', 'reflection'],
  'plane-mirror': ['optics', 'planeMirror'],
  refraction: ['optics', 'refraction'],
  'convex-lens': ['optics', 'convexLens'],
  vision: ['optics', 'vision'],
  'force-elements': ['mech', 'forceSim'],
  'spring-scale': ['mech', 'springScale'],
  gravity: ['mech', 'gravitySim'],
  'force-compose': ['mech', 'composeSim'],
  'two-force': ['mech', 'balanceSim'],
  friction: ['mech', 'frictionSim'],
  inertia: ['mech', 'inertiaSim'],
  density: ['fluids', 'densitySim'],
  'density-lab': ['fluids', 'densityLabSim'],
  'solid-pressure': ['fluids', 'solidPressureSim'],
  'liquid-pressure': ['fluids', 'liquidPressureSim'],
  atmosphere: ['fluids', 'atmosphereSim'],
  bernoulli: ['fluids', 'bernoulliSim'],
  'buoyancy-origin': ['fluids', 'buoyOriginSim'],
  'buoyancy-weigh': ['fluids', 'weighSim'],
  archimedes: ['fluids', 'archimedesSim'],
  'float-sink': ['fluids', 'floatSim'],
  lever: ['machines', 'leverSim'],
  pulley: ['machines', 'pulleySim'],
  work: ['machines', 'workSim'],
  circuit: ['circuits', 'circuitSim'],
  frames: ['motion', 'frameSim'],
  'st-graph': ['motion', 'stSim'],
  'vt-area': ['motion', 'vtSim'],
  projectile: ['motion', 'projectileSim'],
  energy: ['motion', 'energySim'],
  melting: ['motion', 'meltSim'],
  oscillator: ['advance', 'oscillatorSim'],
  'rigid-disk': ['advance', 'rotorSim'],
  'pendulum-pair': ['advance', 'pendulumSim'],
  'central-orbit': ['advance', 'orbitSim'],
  'normal-modes': ['advance', 'modesSim'],
  'specific-heat': ['thermal', 'heatSim'],
  'heat-engine': ['thermal', 'heatEngineSim'],
  ruler: ['measure', 'rulerSim'],
  stopwatch: ['measure', 'stopwatchSim'],
  'sound-wave': ['waves', 'soundSim'],
  'bar-magnet': ['em', 'magnetSim'],
  solenoid: ['em', 'solenoidSim'],
  'ampere-force': ['em', 'ampereSim'],
  induction: ['em', 'inductionSim'],
};

const cache = new Map();
const groupCache = new Map();

async function loadGroup(name) {
  if (!groupCache.has(name)) groupCache.set(name, LOADERS[name]());
  return groupCache.get(name);
}

export function listSimIds() {
  return Object.keys(MAP);
}

export async function getSim(id) {
  if (!id) return null;
  if (cache.has(id)) return cache.get(id);
  const entry = MAP[id];
  if (!entry) return null;
  const [group, exportName] = entry;
  const mod = await loadGroup(group);
  const sim = mod[exportName];
  if (sim) cache.set(id, sim);
  return sim || null;
}

/** Sync map for tests after loadAllSims(). */
export const SIMS = new Proxy({}, {
  get(_t, prop) {
    if (typeof prop !== 'string') return undefined;
    return cache.get(prop);
  },
  ownKeys() { return [...cache.keys()]; },
  getOwnPropertyDescriptor(_t, prop) {
    if (!cache.has(prop)) return undefined;
    return { configurable: true, enumerable: true, value: cache.get(prop) };
  },
});

export async function loadAllSims() {
  await Promise.all(listSimIds().map((id) => getSim(id)));
  return Object.fromEntries([...cache.entries()]);
}

export function listSims() {
  return listSimIds().map((id) => cache.get(id)).filter(Boolean);
}
