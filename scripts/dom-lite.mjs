/**
 * Minimal DOM for book-select-grade smoke (createElement / querySelector / dataset).
 * No jsdom dependency — enough for applyFoldHintEl dual-write assertions.
 */

function makeDataset(el) {
  return new Proxy(
    {},
    {
      get(_t, prop) {
        if (prop === 'chapterId') return el.getAttribute('data-chapter-id') || undefined;
        if (prop === 'searching') return el.getAttribute('data-searching') || undefined;
        if (typeof prop === 'symbol') return undefined;
        const attr = `data-${String(prop).replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}`;
        return el.getAttribute(attr) || undefined;
      },
      set(_t, prop, value) {
        if (prop === 'chapterId') {
          el.setAttribute('data-chapter-id', String(value));
          return true;
        }
        if (prop === 'searching') {
          el.setAttribute('data-searching', String(value));
          return true;
        }
        const attr = `data-${String(prop).replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}`;
        el.setAttribute(attr, String(value));
        return true;
      },
      deleteProperty(_t, prop) {
        if (prop === 'chapterId') {
          el.removeAttribute('data-chapter-id');
          return true;
        }
        if (prop === 'searching') {
          el.removeAttribute('data-searching');
          return true;
        }
        const attr = `data-${String(prop).replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}`;
        el.removeAttribute(attr);
        return true;
      },
      has(_t, prop) {
        if (prop === 'chapterId') return el.hasAttribute('data-chapter-id');
        if (prop === 'searching') return el.hasAttribute('data-searching');
        const attr = `data-${String(prop).replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}`;
        return el.hasAttribute(attr);
      },
      ownKeys() {
        const keys = [];
        for (const [k] of el._attrs) {
          if (k === 'data-chapter-id') keys.push('chapterId');
          else if (k === 'data-searching') keys.push('searching');
          else if (k.startsWith('data-')) {
            keys.push(k.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase()));
          }
        }
        return keys;
      },
      getOwnPropertyDescriptor(_t, prop) {
        if (!this.has(_t, prop)) return undefined;
        return { configurable: true, enumerable: true, writable: true, value: this.get(_t, prop) };
      },
    },
  );
}

function createElement(tag) {
  const el = {
    tagName: String(tag).toUpperCase(),
    className: '',
    textContent: '',
    children: [],
    _attrs: new Map(),
    setAttribute(name, value) {
      this._attrs.set(String(name), String(value));
    },
    removeAttribute(name) {
      this._attrs.delete(String(name));
    },
    getAttribute(name) {
      return this._attrs.has(String(name)) ? this._attrs.get(String(name)) : null;
    },
    hasAttribute(name) {
      return this._attrs.has(String(name));
    },
    appendChild(child) {
      this.children.push(child);
      child.parentNode = this;
      return child;
    },
    querySelector(sel) {
      return queryIn(this, sel);
    },
    querySelectorAll(sel) {
      const out = [];
      collect(this, sel, out);
      return out;
    },
  };
  el.dataset = makeDataset(el);
  return el;
}

function hasClass(el, cls) {
  return (` ${el.className || ''} `).includes(` ${cls} `);
}

function matchAttr(el, bracket) {
  const attr = String(bracket || '').match(/^\[([^=\]]+)(?:=["']?([^"'\]]*)["']?)?\]$/);
  if (!attr) return false;
  const name = attr[1];
  const want = attr[2];
  if (!el.hasAttribute(name)) return false;
  if (want == null) return true;
  return el.getAttribute(name) === want;
}

/** Supports tag, .class, [attr], and compounds like span.fold-hint / span.fold-hint[data-searching="1"]. */
function matchSel(el, sel) {
  const s = String(sel || '').trim();
  if (!s) return false;
  const compound = s.match(/^([a-z][\w-]*)?((?:\.[a-z][\w-]*)+)?(\[[^\]]+\])?$/i);
  if (compound && (compound[1] || compound[2] || compound[3])) {
    if (compound[1] && el.tagName !== compound[1].toUpperCase()) return false;
    if (compound[2]) {
      for (const cls of compound[2].slice(1).split('.')) {
        if (!hasClass(el, cls)) return false;
      }
    }
    if (compound[3] && !matchAttr(el, compound[3])) return false;
    return true;
  }
  if (s.startsWith('.')) return hasClass(el, s.slice(1));
  if (s.startsWith('[')) return matchAttr(el, s);
  return el.tagName === s.toUpperCase();
}

function queryIn(root, sel) {
  const raw = String(sel || '').trim();
  if (raw.includes(',')) {
    for (const part of raw.split(',')) {
      const hit = queryIn(root, part.trim());
      if (hit) return hit;
    }
    return null;
  }
  for (const child of root.children || []) {
    if (matchSel(child, raw)) return child;
    const hit = queryIn(child, raw);
    if (hit) return hit;
  }
  return null;
}

function collect(root, sel, out) {
  const raw = String(sel || '').trim();
  if (raw.includes(',')) {
    for (const part of raw.split(',')) collect(root, part.trim(), out);
    return;
  }
  for (const child of root.children || []) {
    if (matchSel(child, raw)) out.push(child);
    collect(child, raw, out);
  }
}

export function createDom() {
  const body = createElement('body');
  const document = {
    body,
    createElement,
    querySelector: (sel) => queryIn(body, sel),
    querySelectorAll: (sel) => {
      const out = [];
      collect(body, sel, out);
      return out;
    },
  };
  return { document, body };
}
