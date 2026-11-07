#!/usr/bin/env node
/**
 * Derive docs/promo/poster-books.json from js/curricula/* so the poster
 * coverage line tracks book add/remove.
 *
 *   node scripts/sync-poster-books.mjs
 *   node scripts/sync-poster-books.mjs --check   # exit 1 if stale
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'docs/promo/poster-books.json');

const sj = await import(pathToFileURL(path.join(root, 'js/curricula/shanghai-junior.js')).href);
const ss = await import(pathToFileURL(path.join(root, 'js/curricula/shanghai-senior.js')).href);
const pep = await import(pathToFileURL(path.join(root, 'js/curricula/pep-junior.js')).href);
const uni = await import(pathToFileURL(path.join(root, 'js/curricula/university.js')).href);

const BOOKS = [sj.shanghaiJunior, ss.shanghaiSenior, pep.pepJunior, uni.university];
const REGIONS = [
  { id: 'shanghai', zh: '上海', en: 'Shanghai', books: ['sh-junior', 'sh-senior'] },
  { id: 'pep', zh: '人教版', en: 'PEP', books: ['pep-junior'] },
  { id: 'university', zh: '大学', en: 'University', books: ['university'] },
];

function shortZh(book) {
  if (book.id.startsWith('sh-')) return '沪科';
  if (book.id.startsWith('pep')) return '人教';
  if (book.id === 'university') return '大学';
  return book.title.zh;
}

function shortEn(book) {
  if (book.id.startsWith('sh-')) return 'Shanghai';
  if (book.id.startsWith('pep')) return 'PEP';
  if (book.id === 'university') return 'University';
  return book.title.en;
}

const uniq = (arr) => [...new Set(arr)];
const payload = {
  generated: 'scripts/sync-poster-books.mjs',
  books: BOOKS.map((b) => ({ id: b.id, zh: b.title.zh, en: b.title.en })),
  regions: REGIONS.map((r) => ({ id: r.id, zh: r.zh, en: r.en, books: r.books })),
  line: {
    labelZh: '教材覆盖',
    labelEn: 'Coverage',
    shortZh: uniq(BOOKS.map(shortZh)).join(' / '),
    shortEn: uniq(BOOKS.map(shortEn)).join(' · '),
  },
};

const text = `${JSON.stringify(payload, null, 2)}\n`;
const check = process.argv.includes('--check');
if (check) {
  if (!fs.existsSync(out)) {
    console.error('FAIL missing', path.relative(root, out), '— run: node scripts/sync-poster-books.mjs');
    process.exit(1);
  }
  const cur = fs.readFileSync(out, 'utf8');
  if (cur !== text) {
    console.error('FAIL poster-books.json stale vs curricula — run: node scripts/sync-poster-books.mjs');
    process.exit(1);
  }
  console.log('ok poster-books.json in sync with curricula');
  process.exit(0);
}

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, text);
console.log('wrote', path.relative(root, out), '→', payload.line.shortZh, '·', payload.line.shortEn);
