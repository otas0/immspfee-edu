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
/**
 * @param {unknown} err
 * @param {number} [maxLen]
 * @param {{ forceCodePoints?: boolean }} [opts] forceCodePoints → skip Segmenter (ZWJ strip tests)
 */
export function toastErrorDetail(err, maxLen = 120, opts = {}) {
  const raw = String(err?.message || err || '').trim();
  const line = raw.split(/\r?\n/)[0] || raw;
  if (!opts.forceCodePoints && typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function') {
    const segs = [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(line)]
      .map((s) => s.segment);
    return truncateUnits(line, maxLen, segs);
  }
  return truncateUnits(line, maxLen, Array.from(line));
}

/**
 * Schema key → ui sticky-hi flag. Double-slit width bar uses `_slitWidthHi`;
 * other sims can register here without new setParam branches.
 *
 * Minkowski product lock: **β only** (`beta → _betaHi`). γ / Δt stay plain.
 * Product has **not** asked to widen sticky to γ/Δt — do not paint those hi
 * until otas0/immspfee-edu#1 is checked. When confirmed: (1) map + ui flags here,
 * (2) smoke-layout, (3) then readouts hi.
 */
export const STICKY_READOUT_HI_BY_SCHEMA = Object.freeze({
  a: '_slitWidthHi',
  beta: '_betaHi',
  // Product gate (unset): gamma / dt — wait for explicit product ask.
});

/** Clear sticky readout hi when a mapped schema key is edited (mirrors off-control pointer down). */
export function clearStickyReadoutHiOnSchema(key, ui) {
  if (!ui || key == null) return;
  const prop = STICKY_READOUT_HI_BY_SCHEMA[key];
  if (prop) ui[prop] = false;
}

/** @deprecated Use clearStickyReadoutHiOnSchema */
export function clearSlitWidthHiOnSchemaA(key, ui) {
  clearStickyReadoutHiOnSchema(key, ui);
}

/**
 * Shared with app.setParam: clamp a schema field value.
 * Number fields with `step` also snap onto the step grid (min as origin) so
 * `clean` already matches Minkowski-style onParam snap — no clean≠snapped drift.
 */
export function clampSchemaValue(field, value, fallback) {
  if (!field) return value;
  if (field.type === 'number') {
    let n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    n = Math.min(field.max, Math.max(field.min, n));
    const step = Number(field.step);
    if (Number.isFinite(step) && step > 0) {
      const base = Number(field.min);
      n = Math.round((n - base) / step) * step + base;
      n = Math.min(field.max, Math.max(field.min, n));
      const decimals = (() => {
        const s = String(step);
        const i = s.indexOf('.');
        return i >= 0 ? s.length - i - 1 : 0;
      })();
      if (decimals > 0) n = Number(n.toFixed(decimals));
    }
    return n;
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
