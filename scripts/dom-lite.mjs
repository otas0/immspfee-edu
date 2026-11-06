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

function siblingIndex(el) {
  const parent = el.parentNode;
  if (!parent || !parent.children) return -1;
  return parent.children.indexOf(el);
}

function matchPseudo(el, name) {
  if (name === 'first-child') return siblingIndex(el) === 0;
  if (name === 'last-child') {
    const parent = el.parentNode;
    if (!parent || !parent.children?.length) return false;
    return siblingIndex(el) === parent.children.length - 1;
  }
  return false;
}

/**
 * Supports tag, .class, [attr], compounds, and :first-child / :last-child
 * (e.g. span.fold-hint:first-child).
 */
function matchSel(el, sel) {
  let s = String(sel || '').trim();
  if (!s) return false;
  let pseudo = null;
  const pseudoM = s.match(/^(.*?):(first-child|last-child)$/i);
  if (pseudoM) {
    s = pseudoM[1].trim();
    pseudo = pseudoM[2].toLowerCase();
    if (!s) {
      // Bare :first-child / :last-child
      return matchPseudo(el, pseudo);
    }
  }
  const compound = s.match(/^([a-z][\w-]*)?((?:\.[a-z][\w-]*)+)?(\[[^\]]+\])?$/i);
  if (compound && (compound[1] || compound[2] || compound[3])) {
    if (compound[1] && el.tagName !== compound[1].toUpperCase()) return false;
    if (compound[2]) {
      for (const cls of compound[2].slice(1).split('.')) {
        if (!hasClass(el, cls)) return false;
      }
    }
    if (compound[3] && !matchAttr(el, compound[3])) return false;
    if (pseudo && !matchPseudo(el, pseudo)) return false;
    return true;
  }
  if (s.startsWith('.')) {
    if (!hasClass(el, s.slice(1))) return false;
    if (pseudo && !matchPseudo(el, pseudo)) return false;
    return true;
  }
  if (s.startsWith('[')) {
    if (!matchAttr(el, s)) return false;
    if (pseudo && !matchPseudo(el, pseudo)) return false;
    return true;
  }
  if (el.tagName !== s.toUpperCase()) return false;
  if (pseudo && !matchPseudo(el, pseudo)) return false;
  return true;
}

/** Collect every descendant (not only children) matching a simple/compound sel. */
function collectDeep(root, sel, out) {
  for (const child of root.children || []) {
    if (matchSel(child, sel)) out.push(child);
    collectDeep(child, sel, out);
  }
}

function queryDescendantChain(root, parts) {
  if (!parts.length) return null;
  const [head, ...rest] = parts;
  const matches = [];
  collectDeep(root, head, matches);
  for (const el of matches) {
    if (!rest.length) return el;
    const hit = queryDescendantChain(el, rest);
    if (hit) return hit;
  }
  return null;
}

/** Direct-child chain for `div > span.fold-hint` (no mixed descendant segments). */
function queryChildChain(root, parts) {
  if (!parts.length) return null;
  const [head, ...rest] = parts;
  for (const child of root.children || []) {
    if (!matchSel(child, head)) continue;
    if (!rest.length) return child;
    const hit = queryChildChain(child, rest);
    if (hit) return hit;
  }
  // Also search deeper hosts so `document.querySelector('div > span')` finds nested hosts.
  for (const child of root.children || []) {
    const hit = queryChildChain(child, parts);
    if (hit) return hit;
  }
  return null;
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
  // Child combinator before descendant: "div > span.fold-hint".
  if (raw.includes('>')) {
    const parts = raw.split(/\s*>\s*/).map((p) => p.trim()).filter(Boolean);
    if (parts.length > 1) return queryChildChain(root, parts);
  }
  // Descendant combinator: "div span.fold-hint" (spaces).
  const parts = raw.split(/\s+/).filter(Boolean);
  if (parts.length > 1) return queryDescendantChain(root, parts);
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
  if (raw.includes('>')) {
    const parts = raw.split(/\s*>\s*/).map((p) => p.trim()).filter(Boolean);
    if (parts.length > 1) {
      const hit = queryChildChain(root, parts);
      if (hit && !out.includes(hit)) out.push(hit);
      return;
    }
  }
  const parts = raw.split(/\s+/).filter(Boolean);
  if (parts.length > 1) {
    const hit = queryDescendantChain(root, parts);
    if (hit) out.push(hit);
    const [head, ...rest] = parts;
    const matches = [];
    collectDeep(root, head, matches);
    for (const el of matches) {
      if (!rest.length) {
        if (!out.includes(el)) out.push(el);
      } else {
        collect(el, rest.join(' '), out);
      }
    }
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
