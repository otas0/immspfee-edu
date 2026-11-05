import { readFileSync, writeFileSync } from 'node:fs';

const sha = (process.env.GITHUB_SHA || process.env.BUILD_SHA || 'dev').slice(0, 7);
const files = [
  'index.html',
  'js/app.js',
  'js/i18n.js',
  'js/sims/registry.js',
  'css/edu.css',
  'sw.js',
];
for (const file of files) {
  const before = readFileSync(file, 'utf8');
  const after = before.replaceAll('__BUILD__', sha);
  if (before === after) {
    console.warn(`stamp: no __BUILD__ token in ${file}`);
  }
  writeFileSync(file, after);
}
console.log(`stamped __BUILD__ -> ${sha}`);
