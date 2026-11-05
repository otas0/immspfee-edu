import { getSim, listSimIds } from '../js/sims/registry.js';

/** Core junior / shared teaching sims used on the chapter tree. */
const core = [
  'circuit', 'bar-magnet', 'ruler', 'balance', 'charges', 'current', 'thermometer',
  'boiling', 'atom-levels', 'lorentz',
  'double-slit', 'transformer', 'time-dilation',
  'convex-lens',
];

/** University entrances — keep on a separate list so failures point at that track. */
const university = [
  'ising', 'barrier-tunnel', 'wave-packet',
  'hydrogen-radial', 'coupled-pendula', 'simultaneity', 'finite-well',
  'infinite-well', 'maxwell-wave', 'ideal-gas',
];

async function smoke(label, ids) {
  let failed = 0;
  for (const id of ids) {
    const sim = await getSim(id);
    if (!sim) {
      failed += 1;
      console.error(`FAIL ${label} missing`, id);
      continue;
    }
    console.log('ok', label, id, '->', sim.id);
  }
  for (const id of ids) {
    if (!listSimIds().includes(id)) {
      failed += 1;
      console.error(`FAIL ${label} registry missing`, id);
    }
  }
  return failed;
}

let failed = 0;
failed += await smoke('core', core);
failed += await smoke('university', university);
if (failed) process.exit(1);
console.log(`ok smoke core=[${core.join(', ')}] university=[${university.join(', ')}]`);
