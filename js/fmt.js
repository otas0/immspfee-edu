export function fmt(n, digits = 3) {
  if (n == null || typeof n !== 'number' || !Number.isFinite(n)) return '—';
  const a = Math.abs(n);
  if (a !== 0 && (a < 0.001 || a >= 1e5)) return n.toExponential(2);
  const s = n.toFixed(digits);
  return s.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
}
