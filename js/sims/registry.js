/** Lazy loaders: only the module for the open lesson is fetched. */
const PATHS = {
  optics: './optics.js',
  mech: './mech.js',
  fluids: './fluids.js',
  machines: './machines.js',
  circuits: './circuits.js',
  motion: './motion.js',
  advance: './advance.js',
  thermal: './thermal.js',
  measure: './measure.js',
  waves: './waves.js',
  em: './em.js',
  collide: './collide.js',
  charge: './charge.js',
  modern: './modern.js',
  uni: './uni.js',
  stat: './stat.js',
};

const MAP = {
  pinhole: ['optics', 'pinhole'],
  reflection: ['optics', 'reflection'],
  'plane-mirror': ['optics', 'planeMirror'],
  refraction: ['optics', 'refraction'],
  'convex-lens': ['optics', 'convexLens'],
  vision: ['optics', 'vision'],
  'double-slit': ['optics', 'doubleSlitSim'],
  malus: ['optics', 'malusSim'],
  telescope: ['optics', 'telescopeSim'],
  'single-slit': ['optics', 'singleSlitSim'],
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
  'ac-rms': ['circuits', 'acSim'],
  transformer: ['circuits', 'transformerSim'],
  frames: ['motion', 'frameSim'],
  'st-graph': ['motion', 'stSim'],
  'vt-area': ['motion', 'vtSim'],
  projectile: ['motion', 'projectileSim'],
  energy: ['motion', 'energySim'],
  melting: ['motion', 'meltSim'],
  boiling: ['motion', 'boilSim'],
  sublimation: ['motion', 'sublimeSim'],
  oscillator: ['advance', 'oscillatorSim'],
  'rigid-disk': ['advance', 'rotorSim'],
  'pendulum-pair': ['advance', 'pendulumSim'],
  'central-orbit': ['advance', 'orbitSim'],
  'normal-modes': ['advance', 'modesSim'],
  'specific-heat': ['thermal', 'heatSim'],
  'heat-engine': ['thermal', 'heatEngineSim'],
  ruler: ['measure', 'rulerSim'],
  stopwatch: ['measure', 'stopwatchSim'],
  balance: ['measure', 'balanceSim'],
  thermometer: ['measure', 'thermometerSim'],
  'sound-wave': ['waves', 'soundSim'],
  'em-wave': ['waves', 'emWaveSim'],
  'sound-absorb': ['waves', 'absorbSim'],
  'echo-range': ['waves', 'echoSim'],
  doppler: ['waves', 'dopplerSim'],
  beats: ['waves', 'beatsSim'],
  dispersion: ['waves', 'dispersionSim'],
  circular: ['motion', 'circularSim'],
  'bar-magnet': ['em', 'magnetSim'],
  solenoid: ['em', 'solenoidSim'],
  'ampere-force': ['em', 'ampereSim'],
  induction: ['em', 'inductionSim'],
  lorentz: ['em', 'lorentzSim'],
  cyclotron: ['em', 'cyclotronSim'],
  collide: ['collide', 'collideSim'],
  charges: ['charge', 'chargeSim'],
  current: ['charge', 'currentSim'],
  'point-field': ['charge', 'fieldSim'],
  'field-potential': ['charge', 'potentialSim'],
  'atom-levels': ['modern', 'atomSim'],
  'internal-energy': ['modern', 'internalSim'],
  'energy-share': ['modern', 'convertSim'],
  efficiency: ['modern', 'efficiencySim'],
  scales: ['modern', 'scalesSim'],
  'mass-energy': ['modern', 'massEnergySim'],
  'half-life': ['modern', 'halfLifeSim'],
  photoelectric: ['modern', 'photoSim'],
  capacitance: ['modern', 'capSim'],
  resistivity: ['modern', 'resistivitySim'],
  'time-dilation': ['modern', 'dilationSim'],
  simultaneity: ['modern', 'simultaneitySim'],
  'maxwell-wave': ['uni', 'maxwellSim'],
  'ideal-gas': ['uni', 'gasSim'],
  carnot: ['uni', 'carnotSim'],
  'kinetic-gas': ['uni', 'kineticSim'],
  'infinite-well': ['uni', 'wellSim'],
  'finite-well': ['uni', 'finiteWellSim'],
  'transmission-line': ['uni', 'lineSim'],
  'image-charge': ['uni', 'imageSim'],
  waveguide: ['uni', 'guideSim'],
  'dipole-radiation': ['uni', 'dipoleSim'],
  ising: ['stat', 'isingSim'],
  'barrier-tunnel': ['stat', 'tunnelSim'],
  'wave-packet': ['stat', 'packetSim'],
  'maxwell-speed': ['stat', 'maxwellHistSim'],
  'fourier-square': ['stat', 'fourierSim'],
  membrane: ['stat', 'membraneSim'],
  'bell-singlet': ['stat', 'bellSim'],
  'stern-gerlach': ['stat', 'sternSim'],
  'length-contraction': ['stat', 'lengthSim'],
  'laser-cavity': ['stat', 'cavitySim'],
  'thin-film': ['stat', 'filmSim'],
  'hydrogen-radial': ['stat', 'hydrogenRadialSim'],
  'coupled-pendula': ['advance', 'coupledPendulaSim'],
};

const cache = new Map();
const groupCache = new Map();

let onImportError = null;

export function setImportErrorHandler(fn) {
  onImportError = typeof fn === 'function' ? fn : null;
}

function reportError(err, detail) {
  if (onImportError) onImportError(err, detail);
  else if (typeof console !== 'undefined') console.error(detail, err);
}

async function loadGroup(name, reload = false) {
  if (!reload && groupCache.has(name)) return groupCache.get(name);
  if (reload) groupCache.delete(name);
  const path = PATHS[name];
  if (!path) throw new Error(`Unknown sim group ${name}`);
  // Nested sims append the stamped build id so disk-cached modules cannot stick.
  const href = reload
    ? `${path}?v=__BUILD__&reload=${Date.now()}`
    : `${path}?v=__BUILD__`;
  let absolute = href;
  try {
    absolute = new URL(href, import.meta.url).href;
  } catch (_) { /* keep relative */ }
  const pending = import(href);
  groupCache.set(name, pending);
  try {
    return await pending;
  } catch (err) {
    groupCache.delete(name);
    err.__immspfeeModuleUrl = absolute;
    throw err;
  }
}

export function listSimIds() {
  return Object.keys(MAP);
}

export function groupForSim(id) {
  return MAP[id]?.[0] || null;
}

export async function getSim(id, opts = {}) {
  if (!id) return null;
  const reload = !!opts.reload;
  if (!reload && cache.has(id)) return cache.get(id);
  const entry = MAP[id];
  if (!entry) return null;
  const [group, exportName] = entry;
  try {
    if (reload) cache.delete(id);
    const mod = await loadGroup(group, reload);
    const sim = mod[exportName];
    if (sim) cache.set(id, sim);
    return sim || null;
  } catch (err) {
    const url = err?.__immspfeeModuleUrl
      || (() => {
        try { return new URL(PATHS[group], import.meta.url).href; } catch (_) { return PATHS[group]; }
      })();
    reportError(err, url);
    if (!reload) return getSim(id, { reload: true });
    return null;
  }
}

/** Prefetch every ready sim id in the given list (idle-friendly). */
export function prefetchSims(ids) {
  const unique = [...new Set((ids || []).filter(Boolean))];
  for (const id of unique) {
    getSim(id).catch(() => {});
  }
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
