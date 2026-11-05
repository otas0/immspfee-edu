import { BOOKS, REGIONS, findLesson, flatten, getBook } from './curricula/index.js';
import { getSim } from './sims/registry.js';
import { fmt } from './fmt.js';
import { t, tx } from './i18n.js';

const LANG_KEY = 'immspfee-edu-lang';
const CHECK_KEY = 'immspfee-edu-checks';
const ROUTE_KEY = 'immspfee-edu-route';
const PHASES = ['introduce', 'explore', 'check', 'debug'];
const DEFAULT_ROUTE = { bookId: 'sh-junior', lessonId: 'shj-4-4a', phase: 'introduce' };

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');

let lang = localStorage.getItem(LANG_KEY) === 'zh' ? 'zh' : 'en';
let bookId = DEFAULT_ROUTE.bookId;
let lessonId = DEFAULT_ROUTE.lessonId;
let phase = DEFAULT_ROUTE.phase;
let params = {};
let ui = { drag: null, wrong: false };
let clock = 0;
let playing = false;
let picks = {};
let marked = false;
let query = '';
let lastFrame = 0;
let currentSim = null;
let loadToken = 0;

function passedMap() {
  try { return JSON.parse(localStorage.getItem(CHECK_KEY) || '{}'); } catch { return {}; }
}
function savePassed(lesson, ids) {
  const all = passedMap();
  all[lesson] = ids;
  localStorage.setItem(CHECK_KEY, JSON.stringify(all));
}

function row() {
  return findLesson(bookId, lessonId) || flatten(getBook(bookId))[0];
}
function lesson() { return row().lesson; }
function sim() {
  return currentSim;
}
function tMax() {
  const s = sim();
  if (!s) return 4;
  return typeof s.tMax === 'function' ? s.tMax(params) : 4;
}
function derived() {
  const s = sim();
  return s ? s.compute(params, clock) : null;
}

function parseHash() {
  let raw = location.hash.replace(/^#\/?/, '');
  if (!raw) {
    const saved = localStorage.getItem(ROUTE_KEY) || '';
    raw = saved.replace(/^#\/?/, '');
    if (raw) history.replaceState(null, '', `#/${raw}`);
  }
  const parts = raw.split('/').filter(Boolean);
  if (parts[0] && BOOKS.some((b) => b.id === parts[0])) bookId = parts[0];
  if (parts[1] && findLesson(bookId, parts[1])) lessonId = parts[1];
  if (parts[2] && PHASES.includes(parts[2])) phase = parts[2];
}

function writeHash() {
  const next = `#/${bookId}/${lessonId}/${phase}`;
  if (location.hash !== next) history.replaceState(null, '', next);
  localStorage.setItem(ROUTE_KEY, next);
  const brand = document.querySelector('.brand');
  if (brand) brand.setAttribute('href', next);
}

async function loadLesson(nextId, nextPhase) {
  const token = ++loadToken;
  lessonId = nextId;
  phase = nextPhase || 'introduce';
  const wanted = lesson().sim;
  currentSim = null;
  ui = { drag: null, wrong: false };
  clock = 0;
  playing = false;
  picks = {};
  marked = false;
  writeHash();
  render();
  if (!wanted) {
    params = {};
    if (token === loadToken) draw();
    return;
  }
  const s = await getSim(wanted);
  if (token !== loadToken) return;
  currentSim = s;
  const preset = lesson().preset || {};
  params = s ? { ...s.params, ...preset } : {};
  render();
}

function clampField(field, value) {
  if (field.type === 'number') {
    const n = Number(value);
    if (!Number.isFinite(n)) return params[field.key];
    return Math.min(field.max, Math.max(field.min, n));
  }
  if (field.type === 'toggle') return !!value;
  return value;
}

function applyPointer(patch) {
  if (!patch) return;
  if (Object.prototype.hasOwnProperty.call(patch, '__clock')) {
    playing = false;
    clock = Math.min(tMax(), Math.max(0, Number(patch.__clock) || 0));
    const range = document.querySelector('.transport input[type=range]');
    const label = document.querySelector('.transport span');
    if (range) range.value = String(clock);
    if (label) label.textContent = `${t(lang, 'time')} ${fmt(clock, 2)} s`;
  }
  const rest = { ...patch };
  delete rest.__clock;
  if (Object.keys(rest).length) {
    params = { ...params, ...rest };
    marked = false;
    syncBench();
  }
  draw();
}

function setParam(key, value) {
  const s = sim();
  if (!s) return;
  const field = s.schema.find((f) => f.key === key);
  const clean = field ? clampField(field, value) : value;
  let next = { ...params, [key]: clean };
  const extra = s.onParam?.(key, clean, next) || {};
  params = { ...next, ...extra };
  marked = false;
  if (field && field.type !== 'number') renderTeach();
  else syncBench();
  draw();
}

function cssSize() {
  const rect = canvas.getBoundingClientRect();
  return { w: rect.width, h: rect.height };
}

function draw() {
  const { w, h } = cssSize();
  const s = sim();
  ctx.clearRect(0, 0, w, h);
  if (!s || w < 2 || h < 2) {
    ctx.fillStyle = '#f3efe6';
    ctx.fillRect(0, 0, w, h);
    paintReadouts(null);
    return;
  }
  const d = s.compute(params, clock);
  ui.lang = lang;
  s.draw(ctx, w, h, params, d, ui);
  paintReadouts(d);
}

function paintReadouts(d) {
  const host = document.getElementById('readouts');
  host.replaceChildren();
  const s = sim();
  if (!s || !d) return;
  const title = document.createElement('p');
  title.className = 'readout-kicker';
  title.textContent = t(lang, 'readouts');
  host.appendChild(title);
  for (const item of s.readouts(d, params)) {
    const rowEl = document.createElement('div');
    rowEl.className = 'readout';
    const k = document.createElement('span');
    k.textContent = tx(lang, item);
    const v = document.createElement('strong');
    v.textContent = typeof item.value === 'string' ? item.value : tx(lang, item.value);
    rowEl.append(k, v);
    host.appendChild(rowEl);
  }
}

function resize() {
  const { w, h } = cssSize();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(2, Math.floor(w * dpr));
  canvas.height = Math.max(2, Math.floor(h * dpr));
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  draw();
}

function render() {
  document.documentElement.lang = lang === 'zh' ? 'zh-Hans' : 'en';
  renderChrome();
  renderTree();
  renderTeach();
  resize();
}

function renderChrome() {
  document.getElementById('lang-en').setAttribute('aria-pressed', lang === 'en' ? 'true' : 'false');
  document.getElementById('lang-zh').setAttribute('aria-pressed', lang === 'zh' ? 'true' : 'false');
  const regionHost = document.getElementById('regions');
  regionHost.replaceChildren();
  for (const region of REGIONS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = tx(lang, region);
    const book = getBook(bookId);
    btn.className = region.books.includes(book.id) && book.region === region.id ? 'on' : '';
    btn.addEventListener('click', () => {
      const next = getBook(region.books[0]);
      bookId = next.id;
      const first = flatten(next).find((r) => r.lesson.status === 'ready') || flatten(next)[0];
      loadLesson(first.lesson.id, 'introduce');
    });
    regionHost.appendChild(btn);
  }
  const bookHost = document.getElementById('books');
  bookHost.replaceChildren();
  const region = REGIONS.find((r) => r.books.includes(bookId));
  for (const id of region.books) {
    const book = getBook(id);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = tx(lang, book.title);
    btn.className = id === bookId ? 'on' : '';
    btn.addEventListener('click', () => {
      bookId = id;
      const first = flatten(book).find((r) => r.lesson.status === 'ready') || flatten(book)[0];
      loadLesson(first.lesson.id, 'introduce');
    });
    bookHost.appendChild(btn);
  }
  const rows = flatten(getBook(bookId));
  const readyCount = rows.filter((r) => r.lesson.status === 'ready').length;
  document.getElementById('edition').textContent = `${tx(lang, getBook(bookId).edition)} · ${readyCount}/${rows.length}`;
  document.getElementById('search').placeholder = t(lang, 'search');
}

function renderTree() {
  const host = document.getElementById('tree');
  host.replaceChildren();
  const book = getBook(bookId);
  const q = query.trim().toLowerCase();
  let shown = 0;
  for (const volume of book.volumes) {
    const chapters = book.chapters.filter((ch) => ch.volume === volume.id);
    const vol = document.createElement('section');
    const h = document.createElement('h2');
    h.textContent = tx(lang, volume);
    vol.appendChild(h);
    let volCount = 0;
    for (const ch of chapters) {
      const block = document.createElement('div');
      block.className = 'chapter';
      const chTitle = document.createElement('h3');
      chTitle.textContent = tx(lang, ch.title);
      if (ch.priority) {
        const tag = document.createElement('span');
        tag.className = 'tag exam';
        tag.textContent = t(lang, 'exam');
        chTitle.append(' ', tag);
      }
      block.appendChild(chTitle);
      let chCount = 0;
      for (const sec of ch.sections) {
        const lessons = sec.lessons.filter((ls) => {
          if (!q) return true;
          return `${ls.title.zh} ${ls.title.en} ${sec.title.zh} ${sec.title.en}`.toLowerCase().includes(q);
        });
        if (!lessons.length) continue;
        const secEl = document.createElement('div');
        secEl.className = 'section';
        const sh = document.createElement('p');
        sh.textContent = tx(lang, sec.title);
        secEl.appendChild(sh);
        for (const ls of lessons) {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = `lesson${ls.id === lessonId ? ' on' : ''}`;
          const name = document.createElement('span');
          name.textContent = tx(lang, ls.title);
          const state = document.createElement('small');
          state.textContent = ls.status === 'ready' ? t(lang, 'ready') : t(lang, 'queued');
          if (ls.exam && ls.status === 'ready') {
            const tag = document.createElement('em');
            tag.textContent = t(lang, 'exam');
            btn.append(name, tag, state);
          } else btn.append(name, state);
          btn.addEventListener('click', () => loadLesson(ls.id, 'introduce'));
          secEl.appendChild(btn);
          chCount += 1;
          shown += 1;
        }
        block.appendChild(secEl);
      }
      if (chCount) {
        vol.appendChild(block);
        volCount += 1;
      }
    }
    if (volCount) host.appendChild(vol);
  }
  if (!shown) {
    const empty = document.createElement('p');
    empty.className = 'empty';
    empty.textContent = t(lang, 'empty');
    host.appendChild(empty);
  }
}

function renderTeach() {
  const host = document.getElementById('teach');
  host.replaceChildren();
  const current = row();
  const s = sim();
  const head = document.createElement('header');
  const crumb = document.createElement('p');
  crumb.className = 'crumb';
  crumb.textContent = `${tx(lang, current.volume)} · ${tx(lang, current.chapter.title)}`;
  const h = document.createElement('h2');
  h.textContent = tx(lang, current.lesson.title);
  head.append(crumb, h);
  host.appendChild(head);

  if (!s) {
    const box = document.createElement('div');
    box.className = 'queued';
    const ht = document.createElement('h3');
    const p = document.createElement('p');
    if (current.lesson.status === 'ready' && current.lesson.sim) {
      ht.textContent = lang === 'zh' ? '模拟还在加载' : 'Simulation still loading';
      p.textContent = lang === 'zh'
        ? '这一课已经挂上模拟，但模块还没到。硬刷新一次（或清掉本站缓存）后再打开。'
        : 'This lesson names a simulation, but the module has not arrived. Hard-refresh (or clear this site’s cache) and open it again.';
      box.append(ht, p);
    } else {
      ht.textContent = t(lang, 'queuedTitle');
      p.textContent = t(lang, 'queuedBody');
      const intent = document.createElement('p');
      intent.textContent = tx(lang, current.lesson.intent);
      box.append(ht, p, intent);
    }
    host.appendChild(box);
    return;
  }

  const phases = document.createElement('div');
  phases.className = 'phases';
  phases.setAttribute('role', 'tablist');
  PHASES.forEach((id, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', phase === id ? 'true' : 'false');
    btn.textContent = `${i + 1} ${t(lang, id)}`;
    if (phase === id) btn.className = 'on';
    btn.addEventListener('click', () => { phase = id; writeHash(); renderTeach(); draw(); });
    phases.appendChild(btn);
  });
  host.appendChild(phases);

  const body = document.createElement('div');
  body.className = 'phase-body';
  if (phase === 'introduce') body.append(paragraph(tx(lang, current.lesson.intro)), primary(t(lang, 'toExplore'), () => { phase = 'explore'; writeHash(); renderTeach(); }));
  if (phase === 'explore') {
    body.append(bench(s), transport(s), primary(t(lang, 'toCheck'), () => { phase = 'check'; writeHash(); renderTeach(); }));
  }
  if (phase === 'check') body.append(paragraph(lang === 'zh' ? '下面的问题按画面上这一组参数计算。要换一组数，先回到探究。' : 'These questions are computed from the setup on the stage. Go back to Explore to change it.'), checkBlock(s), primary(t(lang, 'toDebug'), () => { phase = 'debug'; writeHash(); renderTeach(); draw(); }));
  if (phase === 'debug') body.append(debugBlock(s), transport(s));
  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'ghost';
  back.textContent = t(lang, 'reset');
  back.addEventListener('click', () => loadLesson(lessonId, phase));
  body.appendChild(back);
  host.appendChild(body);
}

function paragraph(text) {
  const p = document.createElement('p');
  p.className = 'intro';
  p.textContent = text;
  return p;
}
function primary(label, fn) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'primary';
  btn.textContent = label;
  btn.addEventListener('click', fn);
  return btn;
}

function bench(s) {
  const wrap = document.createElement('div');
  wrap.className = 'bench';
  wrap.id = 'bench';
  const h = document.createElement('h3');
  h.textContent = t(lang, 'params');
  wrap.appendChild(h);
  for (const field of s.schema) {
    wrap.appendChild(fieldRow(field));
  }
  return wrap;
}

function fieldRow(field) {
  const rowEl = document.createElement('label');
  rowEl.className = 'field';
  const name = document.createElement('span');
  name.textContent = `${tx(lang, field.label)}${field.unit ? ` (${field.unit})` : ''}`;
  rowEl.appendChild(name);
  if (field.type === 'select') {
    const sel = document.createElement('select');
    for (const op of field.options) {
      const o = document.createElement('option');
      o.value = op.value;
      o.textContent = tx(lang, op);
      if (params[field.key] === op.value) o.selected = true;
      sel.appendChild(o);
    }
    sel.addEventListener('change', () => setParam(field.key, sel.value));
    rowEl.appendChild(sel);
  } else if (field.type === 'toggle') {
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = !!params[field.key];
    input.addEventListener('change', () => setParam(field.key, input.checked));
    rowEl.appendChild(input);
  } else {
    const line = document.createElement('span');
    line.className = 'slider';
    const range = document.createElement('input');
    range.type = 'range';
    range.min = String(field.min);
    range.max = String(field.max);
    range.step = String(field.step);
    range.value = String(params[field.key]);
    range.dataset.key = field.key;
    const num = document.createElement('input');
    num.type = 'number';
    num.min = String(field.min);
    num.max = String(field.max);
    num.step = String(field.step);
    num.value = String(params[field.key]);
    num.dataset.key = field.key;
    const push = (raw) => setParam(field.key, raw);
    range.addEventListener('input', () => { num.value = range.value; push(range.value); });
    num.addEventListener('change', () => { range.value = num.value; push(num.value); });
    line.append(range, num);
    rowEl.appendChild(line);
  }
  return rowEl;
}

function syncBench() {
  const benchEl = document.getElementById('bench');
  if (!benchEl) return;
  benchEl.querySelectorAll('input[data-key]').forEach((input) => {
    const key = input.dataset.key;
    if (document.activeElement === input) return;
    input.value = String(params[key]);
  });
}

function transport(s) {
  const wrap = document.createElement('div');
  if (!s.timed) return wrap;
  wrap.className = 'transport';
  const play = document.createElement('button');
  play.type = 'button';
  play.textContent = playing ? t(lang, 'pause') : t(lang, 'play');
  play.addEventListener('click', () => {
    playing = !playing;
    if (clock >= tMax()) clock = 0;
    renderTeach();
  });
  const label = document.createElement('span');
  label.textContent = `${t(lang, 'time')} ${fmt(clock, 2)} s`;
  const range = document.createElement('input');
  range.type = 'range';
  range.min = '0';
  range.max = String(tMax());
  range.step = '0.01';
  range.value = String(clock);
  range.addEventListener('input', () => {
    playing = false;
    clock = Number(range.value);
    draw();
    label.textContent = `${t(lang, 'time')} ${fmt(clock, 2)} s`;
  });
  wrap.append(play, range, label);
  return wrap;
}

function checkBlock(s) {
  const d = s.compute(params, clock);
  const questions = s.checks(d, params);
  const wrap = document.createElement('form');
  wrap.className = 'checks';
  wrap.addEventListener('submit', (ev) => {
    ev.preventDefault();
    marked = true;
    const good = [];
    questions.forEach((question) => {
      if (picks[question.id] === question.answer) good.push(question.id);
    });
    if (good.length === questions.length) savePassed(lessonId, good);
    renderTeach();
  });
  questions.forEach((question, qi) => {
    const field = document.createElement('fieldset');
    const legend = document.createElement('legend');
    legend.textContent = `${qi + 1}. ${tx(lang, question)}`;
    field.appendChild(legend);
    question.options.forEach((op, i) => {
      const lab = document.createElement('label');
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = question.id;
      input.value = String(i);
      input.checked = picks[question.id] === i;
      input.addEventListener('change', () => { picks[question.id] = i; marked = false; });
      lab.append(input, document.createTextNode(tx(lang, op)));
      if (marked && picks[question.id] === i) lab.className = i === question.answer ? 'hit' : 'miss';
      field.appendChild(lab);
    });
    wrap.appendChild(field);
  });
  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'primary';
  submit.textContent = t(lang, 'submit');
  wrap.appendChild(submit);
  if (marked) {
    const note = document.createElement('p');
    const all = questions.every((question) => picks[question.id] === question.answer);
    note.textContent = all ? t(lang, 'passed') : t(lang, 'missed');
    wrap.appendChild(note);
  }
  return wrap;
}

function debugBlock(s) {
  const wrap = document.createElement('div');
  wrap.className = 'debug';
  const p = document.createElement('p');
  p.className = 'intro';
  p.textContent = tx(lang, s.debug);
  const lab = document.createElement('label');
  lab.className = 'mistake';
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = !!ui.wrong;
  input.addEventListener('change', () => { ui.wrong = input.checked; draw(); });
  lab.append(input, document.createTextNode(` ${lang === 'zh' ? s.debug.toggleZh : s.debug.toggleEn}`));
  wrap.append(p, lab);
  return wrap;
}

function pointerEvent(ev) {
  const rect = canvas.getBoundingClientRect();
  return { type: ev.type === 'pointerdown' ? 'down' : ev.type === 'pointerup' ? 'up' : 'move', x: ev.clientX - rect.left, y: ev.clientY - rect.top };
}

canvas.addEventListener('pointerdown', (ev) => {
  if (phase === 'check') return;
  const s = sim();
  if (!s?.pointer) return;
  canvas.setPointerCapture(ev.pointerId);
  const patch = s.pointer(pointerEvent(ev), params, derived(), ui);
  if (patch) applyPointer(patch);
});
canvas.addEventListener('pointermove', (ev) => {
  if (!ui.drag) return;
  const s = sim();
  const patch = s?.pointer?.(pointerEvent(ev), params, derived(), ui);
  if (patch) applyPointer(patch);
});
canvas.addEventListener('pointerup', (ev) => {
  const s = sim();
  const patch = s?.pointer?.(pointerEvent(ev), params, derived(), ui);
  ui.drag = null;
  if (patch) applyPointer(patch);
  else draw();
});

document.getElementById('lang-en').addEventListener('click', () => { lang = 'en'; localStorage.setItem(LANG_KEY, lang); render(); });
document.getElementById('lang-zh').addEventListener('click', () => { lang = 'zh'; localStorage.setItem(LANG_KEY, lang); render(); });
document.getElementById('search').addEventListener('input', (ev) => { query = ev.target.value; renderTree(); });
window.addEventListener('resize', resize);
new ResizeObserver(() => resize()).observe(document.querySelector('.stage-wrap'));
window.addEventListener('hashchange', () => { parseHash(); loadLesson(lessonId, phase); });

function tick(now) {
  if (playing) {
    const dt = Math.min(0.05, (now - lastFrame) / 1000 || 0);
    clock = Math.min(tMax(), clock + dt);
    if (clock >= tMax()) playing = false;
    draw();
    const label = document.querySelector('.transport span');
    const range = document.querySelector('.transport input');
    if (label) label.textContent = `${t(lang, 'time')} ${fmt(clock, 2)} s`;
    if (range && document.activeElement !== range) range.value = String(clock);
    if (!playing) renderTeach();
  }
  lastFrame = now;
  requestAnimationFrame(tick);
}

parseHash();
if (!findLesson(bookId, lessonId)) {
  bookId = DEFAULT_ROUTE.bookId;
  lessonId = DEFAULT_ROUTE.lessonId;
  phase = DEFAULT_ROUTE.phase;
}
loadLesson(lessonId, phase);
requestAnimationFrame(tick);

if ('serviceWorker' in navigator) {
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    location.reload();
  });
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js?v=4').catch(() => {});
  });
}
