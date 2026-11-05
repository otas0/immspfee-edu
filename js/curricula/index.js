import { shanghaiJunior } from './shanghai-junior.js';
import { shanghaiSenior } from './shanghai-senior.js';
import { pepJunior } from './pep-junior.js';
import { university } from './university.js';

export const BOOKS = [shanghaiJunior, shanghaiSenior, pepJunior, university];

export const REGIONS = [
  {
    id: 'shanghai',
    zh: '上海',
    en: 'Shanghai',
    books: ['sh-junior', 'sh-senior'],
  },
  {
    id: 'pep',
    zh: '人教版',
    en: 'PEP',
    books: ['pep-junior'],
  },
  {
    id: 'university',
    zh: '大学',
    en: 'University',
    books: ['university'],
  },
];

const byId = new Map(BOOKS.map((b) => [b.id, b]));

export function getBook(id) {
  return byId.get(id) || BOOKS[0];
}

export function flatten(book) {
  const rows = [];
  for (const ch of book.chapters) {
    const volume = book.volumes.find((v) => v.id === ch.volume);
    for (const sec of ch.sections) {
      for (const lesson of sec.lessons) {
        rows.push({ book, volume, chapter: ch, section: sec, lesson });
      }
    }
  }
  return rows;
}

export function findLesson(bookId, lessonId) {
  const book = getBook(bookId);
  return flatten(book).find((row) => row.lesson.id === lessonId) || null;
}
