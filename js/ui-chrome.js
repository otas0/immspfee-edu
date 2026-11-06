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

/**
 * Class name for a readout row (Path warn matches canvas #a33 via CSS).
 * Priority when both flags are set: **warn > hi > plain**.
 */
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

function truncateUnits(line, maxLen, units) {
  if (units.length <= maxLen) return units.join('');
  const cut = units.slice(0, Math.max(0, maxLen - 1));
  // Code-point fallback must not leave a dangling ZWJ before the ellipsis.
  while (cut.length && cut[cut.length - 1] === '\u200D') cut.pop();
  return `${cut.join('')}…`;
}

/**
 * First line of an error for ?dev toasts — keep the stage readable.
 * Prefers grapheme clusters (Intl.Segmenter) so emoji ZWJ sequences stay intact;
 * falls back to Unicode code points (Array.from) when Segmenter is missing.
 */
export function toastErrorDetail(err, maxLen = 120) {
  const raw = String(err?.message || err || '').trim();
  const line = raw.split(/\r?\n/)[0] || raw;
  if (typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function') {
    const segs = [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(line)]
      .map((s) => s.segment);
    return truncateUnits(line, maxLen, segs);
  }
  return truncateUnits(line, maxLen, Array.from(line));
}

/** Shared with app.setParam: clamp a schema field value. */
export function clampSchemaValue(field, value, fallback) {
  if (!field) return value;
  if (field.type === 'number') {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(field.max, Math.max(field.min, n));
  }
  if (field.type === 'toggle') return !!value;
  return value;
}

/**
 * Shared with app.setParam: clamp → onParam merge.
 * Field inputs and canvas tracks must go through this so snap cannot drift.
 */
export function applySchemaParam(sim, params, key, value) {
  const schema = typeof sim?.schema === 'function' ? sim.schema(params) : (sim?.schema || []);
  const field = schema.find((f) => f.key === key);
  const clean = clampSchemaValue(field, value, params[key]);
  const next = { ...params, [key]: clean };
  const extra = (typeof sim?.onParam === 'function' ? sim.onParam(key, clean, next) : null) || {};
  return { params: { ...next, ...extra }, clean, field, extra };
}
