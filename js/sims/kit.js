export function num(key, en, zh, unit, min, max, step) {
  return { key, type: 'number', label: { en, zh }, unit, min, max, step };
}

export function sel(key, en, zh, options) {
  return { key, type: 'select', label: { en, zh }, options };
}

export function tog(key, en, zh) {
  return { key, type: 'toggle', label: { en, zh } };
}

export function clear(ctx, w, h) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#f3efe6';
  ctx.fillRect(0, 0, w, h);
}

export function line(ctx, x1, y1, x2, y2, color, width = 1.5, dash) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.setLineDash(dash || []);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

export function arrow(ctx, x1, y1, x2, y2, color, width = 2) {
  line(ctx, x1, y1, x2, y2, color, width);
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const L = 9;
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - L * Math.cos(ang - 0.4), y2 - L * Math.sin(ang - 0.4));
  ctx.lineTo(x2 - L * Math.cos(ang + 0.4), y2 - L * Math.sin(ang + 0.4));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function text(ctx, str, x, y, color = '#1c1c1c', size = 12, align = 'left') {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `${size}px "IBM Plex Sans", "Source Han Sans SC", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
  ctx.restore();
}

export function handle(ctx, x, y, on) {
  ctx.save();
  ctx.fillStyle = on ? '#111' : '#fff';
  ctx.strokeStyle = '#111';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, y, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

export function hit(x, y, px, py, r = 16) {
  return (x - px) ** 2 + (y - py) ** 2 <= r * r;
}

export const INK = '#1c1c1c';
export const MUTED = '#5e584e';
export const RAY = '#c4491d';
export const RAY2 = '#1d4e89';
export const WATER = 'rgba(70, 130, 170, 0.35)';
export const WATER_EDGE = '#2f6f93';
