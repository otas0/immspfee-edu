/**
 * University chapter <details> open state.
 * No saved fold map → only the active chapter is open.
 */
export function uniChapterOpen(chId, currentChId, foldMap = {}, searching = false) {
  if (searching) return true;
  if (Object.prototype.hasOwnProperty.call(foldMap, chId)) return !!foldMap[chId];
  return chId === currentChId;
}
