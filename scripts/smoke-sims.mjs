import { getSim, listSimIds } from '../js/sims/registry.js';

const need = ['circuit', 'bar-magnet', 'ruler', 'balance', 'charges', 'current', 'thermometer'];
let failed = 0;
for (const id of need) {
  const sim = await getSim(id);
  if (!sim) {
    failed += 1;
    console.error('FAIL smoke missing', id);
    continue;
  }
  console.log('ok', id, '->', sim.id);
}
for (const id of need) {
  if (!listSimIds().includes(id)) {
    failed += 1;
    console.error('FAIL registry missing', id);
  }
}
if (failed) process.exit(1);
console.log(`ok smoke ${need.join(', ')}`);
