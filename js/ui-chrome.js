/** Shared chrome helpers so smoke can assert without booting the full app DOM. */

/** Drop debug short when leaving household layout. */
export function clearWrongLeavingHousehold(key, layout, ui) {
  if (key === 'layout' && layout !== 'household' && ui) ui.wrong = false;
}

/**
 * Leaving the Debug phase turns off the mistake overlay.
 * Re-entering household Debug forces bp–bn again in debugBlock.
 */
export function clearWrongLeavingDebug(prevPhase, nextPhase, ui) {
  if (prevPhase === 'debug' && nextPhase !== 'debug' && ui) ui.wrong = false;
}

/** Class name for a readout row (Path warn matches canvas #a33 via CSS). */
export function readoutClass(item) {
  if (!item) return 'readout';
  if (item.warn) return 'readout warn';
  if (item.hi) return 'readout hi';
  return 'readout';
}

/** True when an Ising (or similar) canvas buffer error should surface as a toast. */
export function isCanvasBufferError(err) {
  const msg = String(err?.message || err || '');
  return /OffscreenCanvas|document\.createElement/.test(msg);
}

/** First line of an error for ?dev toasts — keep the stage readable. */
export function toastErrorDetail(err, maxLen = 120) {
  const raw = String(err?.message || err || '').trim();
  const line = raw.split(/\r?\n/)[0] || raw;
  if (line.length <= maxLen) return line;
  return `${line.slice(0, Math.max(0, maxLen - 1))}…`;
}
