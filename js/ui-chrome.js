/** Shared chrome helpers so smoke can assert without booting the full app DOM. */

/** Drop debug short when leaving household layout. */
export function clearWrongLeavingHousehold(key, layout, ui) {
  if (key === 'layout' && layout !== 'household' && ui) ui.wrong = false;
}

/** Class name for a readout row (Path warn matches canvas #a33 via CSS). */
export function readoutClass(item) {
  if (!item) return 'readout';
  if (item.warn) return 'readout warn';
  if (item.hi) return 'readout hi';
  return 'readout';
}
