/**
 * Ruler reading: the true length is an input. The displayed reading rounds
 * to the division, and the estimated digit is the next decimal place that
 * the eye fills in. Junior rule: report one estimated place past the division.
 */

export function rulerReading(p) {
  const division = Math.max(p.division, 1e-6);
  const trueCm = Math.max(p.trueCm, 0);
  const places = Math.max(0, Math.round(-Math.log10(division)));
  const factor = 10 ** places;
  const main = Math.floor(trueCm * factor + 1e-12) / factor;
  const estimate = Math.floor(((trueCm - main) / division) * 10 + 1e-9);
  const reading = main + estimate * (division / 10);
  return {
    trueCm,
    division,
    main,
    estimate: Math.min(9, Math.max(0, estimate)),
    reading,
    places,
  };
}

/**
 * Stopwatch: the hand angle is 2π (t / 60) for a 60 s dial.
 * The reading is taken from that angle, not from a separate canned label.
 */
export function stopwatchReading(p) {
  const t = Math.max(0, Math.min(p.t, 60));
  const angle = (t / 60) * Math.PI * 2;
  const reading = (angle / (Math.PI * 2)) * 60;
  return { t, angle, reading };
}
