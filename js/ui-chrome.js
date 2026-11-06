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

/** Light DOM stand-in for paintReadouts row className (no jsdom required). */
export function applyReadoutRowEl(el, item) {
  el.className = readoutClass(item);
  return el;
}

/** True when an Ising (or similar) canvas buffer error should surface as a toast. */
export function isCanvasBufferError(err) {
  const msg = String(err?.message || err || '');
  return /OffscreenCanvas|document\.createElement/.test(msg);
}

/**
 * First line of an error for ?dev toasts — keep the stage readable.
 * Truncates by Unicode code points (Array.from) so CJK glyphs are not split.
 */
export function toastErrorDetail(err, maxLen = 120) {
  const raw = String(err?.message || err || '').trim();
  const line = raw.split(/\r?\n/)[0] || raw;
  const chars = Array.from(line);
  if (chars.length <= maxLen) return chars.join('');
  return `${chars.slice(0, Math.max(0, maxLen - 1)).join('')}…`;
}

/**
 * Mirror app setParam for a schema number: clamp → onParam merge.
 * Used so Minkowski field input and β track share one snap path in smoke.
 */
export function applySchemaParam(sim, params, key, value) {
  const schema = typeof sim.schema === 'function' ? sim.schema(params) : sim.schema;
  const field = (schema || []).find((f) => f.key === key);
  let clean = value;
  if (field && field.type === 'number') {
    const n = Number(value);
    clean = Number.isFinite(n) ? Math.min(field.max, Math.max(field.min, n)) : params[key];
  }
  const next = { ...params, [key]: clean };
  const extra = sim.onParam?.(key, clean, next) || {};
  return { ...next, ...extra };
}
