/**
 * University chapter <details> open state.
 * No saved fold map → only the active chapter is open.
 */
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
