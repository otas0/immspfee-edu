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

/** Fold-tools hint must name the same chapter that defaults to open. */
export function foldCurrentHint(label, chapterTitle) {
  return `${label}: ${chapterTitle}`;
}
