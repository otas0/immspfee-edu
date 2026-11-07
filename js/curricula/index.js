import { shanghaiJunior } from './shanghai-junior.js?v=__BUILD__';
import { shanghaiSenior } from './shanghai-senior.js?v=__BUILD__';
import { pepJunior } from './pep-junior.js?v=__BUILD__';
import { university } from './university.js?v=__BUILD__';

export const BOOKS = [shanghaiJunior, shanghaiSenior, pepJunior, university];

// Stage tabs (not publisher). Book titles still name 沪科 / 人教 editions.
export const REGIONS = [
  {
    id: 'junior',
    zh: '初中',
    en: 'Junior',
    books: ['sh-junior', 'pep-junior'],
  },
  {
    id: 'senior',
    zh: '高中',
    en: 'Senior',
    books: ['sh-senior'],
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
