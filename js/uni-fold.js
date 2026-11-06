/**
 * University chapter <details> open state.
 * No saved fold map → only the active chapter is open.
 */
export const UNI_FOLD_KEY = 'immspfee-edu-uni-folds';

export function uniChapterOpen(chId, currentChId, foldMap = {}, searching = false) {
  if (searching) return true;
  if (Object.prototype.hasOwnProperty.call(foldMap, chId)) return !!foldMap[chId];
  return chId === currentChId;
}

/** Same open set app assigns to university `<details open>` for a query state. */
export function uniOpenChapterIds(chapters, currentChId, foldMap = {}, searching = false) {
  return (chapters || [])
    .filter((ch) => uniChapterOpen(ch.id, currentChId, foldMap, searching))
    .map((ch) => ch.id);
}

/** Expand-all / collapse-all map written by the university fold tools. */
export function uniAllFoldsMap(chapters, open) {
  const map = {};
  for (const ch of chapters || []) map[ch.id] = !!open;
  return map;
}

export function readUniFoldsFrom(storage) {
  try {
    return JSON.parse(storage.getItem(UNI_FOLD_KEY) || '{}') || {};
  } catch {
    return {};
  }
}

export function writeUniFoldsTo(storage, map) {
  try {
    storage.setItem(UNI_FOLD_KEY, JSON.stringify(map || {}));
  } catch {
    /* quota / private mode */
  }
}

export function pruneUniFoldsMap(map, validIds) {
  // Empty / missing valid set: do not wipe — refuse to prune (safe no-op).
  if (!validIds || typeof validIds.has !== 'function' || validIds.size === 0) {
    return { map: { ...(map || {}) }, changed: false };
  }
  const next = { ...(map || {}) };
  let changed = false;
  for (const id of Object.keys(next)) {
    if (!validIds.has(id)) {
      delete next[id];
      changed = true;
    }
  }
  return { map: next, changed };
}

/**
 * Same sequence as app pruneUniFolds: read → prune → write if changed → return map.
 * Smoke uses a mock storage; app passes localStorage.
 */
export function pruneUniFoldsIn(storage, validIds) {
  const { map, changed } = pruneUniFoldsMap(readUniFoldsFrom(storage), validIds);
  if (changed) writeUniFoldsTo(storage, map);
  return map;
}

/** Fold-tools hint must name the same chapter that defaults to open. */
export function foldCurrentHint(label, chapterTitle) {
  return `${label}: ${chapterTitle}`;
}

/**
 * Searching expands every chapter; hint switches copy but still names the active subject.
 * searching=false → "Current subject: …"; searching=true → "Search — all open · current: …".
 */
export function foldHintText({ searching, currentLabel, searchLabel, chapterTitle }) {
  if (searching) return `${searchLabel}: ${chapterTitle}`;
  return foldCurrentHint(currentLabel, chapterTitle);
}

/** DOM-free fold-hint props (dataset.chapterId / data-searching) for smoke without jsdom. */
export function foldHintDomProps(chapterId, text, searching = false) {
  const dataset = { chapterId: String(chapterId || '') };
  if (searching) dataset.searching = '1';
  return {
    className: 'fold-hint',
    dataset,
    textContent: String(text || ''),
  };
}

/**
 * Same inputs renderTree uses for the university fold hint (search clear ↔ idle).
 */
export function uniFoldHintFromQuery(q, chapter, labels) {
  const searching = !!(q && String(q).trim());
  const chapterTitle = labels?.chapterTitle ?? '';
  return {
    searching,
    chapterId: chapter?.id || '',
    text: foldHintText({
      searching,
      currentLabel: labels?.currentLabel || '',
      searchLabel: labels?.searchLabel || '',
      chapterTitle,
    }),
  };
}

export function applyFoldHintEl(el, chapterId, text, searching = false) {
  const props = foldHintDomProps(chapterId, text, searching);
  el.className = props.className;
  if (!el.dataset) el.dataset = {};
  el.dataset.chapterId = props.dataset.chapterId;
  if (searching) el.dataset.searching = '1';
  else delete el.dataset.searching;
  // Dual-write attributes for E2E that query getAttribute / CSS [data-searching].
  if (typeof el.setAttribute === 'function') {
    el.setAttribute('data-chapter-id', props.dataset.chapterId);
    if (searching) el.setAttribute('data-searching', '1');
    else if (typeof el.removeAttribute === 'function') el.removeAttribute('data-searching');
  }
  el.textContent = props.textContent;
  return el;
}
