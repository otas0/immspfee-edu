# ADR 001 — When to PRECACHE `ui-chrome` / `uni-fold`

**Status:** Accepted (2026-11)  
**Context:** `js/ui-chrome.js` and `js/uni-fold.js` are imported from `app.js` with `?v=__BUILD__`. They are not in `scripts/stamp-build.mjs` REQUIRED and not in `sw.js` PRECACHE.

**Decision:** Keep them off PRECACHE / REQUIRED. Cache-busting through stamped `app.js` is enough for GitHub Pages today.

**Trigger to revisit (offline-first):** Add both to PRECACHE **and** stamp REQUIRED only if **all** of the following become true:

1. The service worker must boot a usable shell **before** `app.js` is fetched (true offline-first first paint).
2. `ui-chrome` / `uni-fold` grow their own `__BUILD__` tokens or become entry modules outside the `app.js` graph.
3. A failing offline smoke shows a stale chrome/fold module beside a newer `app.js`.

Until then, do not list them in PRECACHE.

## Checklist — stamp REQUIRED + PRECACHE

Use this before editing `scripts/stamp-build.mjs` REQUIRED or `sw.js` PRECACHE for these two modules:

| # | Gate | Pass? |
| --- | --- | --- |
| 1 | Offline-first first paint is a product requirement (shell usable with `app.js` unreachable). | |
| 2 | A smoke or QA case shows chrome/fold UI broken offline while `app.js` is current (or missing). | |
| 3 | Modules need their own `__BUILD__` rewrite **or** are loaded outside the stamped `app.js` import graph. | |
| 4 | `index.html` modulepreload / PRECACHE list and `stamp-build` REQUIRED stay in lockstep after the add. | |
| 5 | `npm test` + a one-shot offline boot check stay green with both files listed. | |

Only when **1–5** are all yes: add `js/ui-chrome.js` and `js/uni-fold.js` to BOTH stamp REQUIRED and `sw.js` PRECACHE in the same commit. Do not add one without the other.

## Env switch sketch (`OFFLINE_FIRST`)

Still **default off**. Do not set in Pages until the gates pass.

| Value | Meaning |
| --- | --- |
| unset / `0` | Today’s path: bust via stamped `app.js` only (current `main`). |
| `1` | Offline-first first paint required → `ui-chrome` + `uni-fold` on stamp REQUIRED **and** `sw.js` PRECACHE. |

Local probe only until product flips:

```bash
OFFLINE_FIRST=0   # default
# OFFLINE_FIRST=1 # future flip PR only
```

## Pseudo-interface: `OFFLINE_FIRST=1` ↔ `stamp-build` (not wired)

Sketch only — do **not** implement until the checklist passes. Shows how a future flip would talk to stamp + PRECACHE without changing today’s path.

```js
// scripts/stamp-build.mjs (future)
const OFFLINE_FIRST = process.env.OFFLINE_FIRST === '1';
const OFFLINE_SHELL = ['js/ui-chrome.js', 'js/uni-fold.js'];

const REQUIRED = [
  'index.html',
  'js/app.js',
  // ...
  'sw.js',
  ...(OFFLINE_FIRST ? OFFLINE_SHELL : []),
];

// sw.js PRECACHE (future, same commit as REQUIRED):
// if (OFFLINE_FIRST) PRECACHE.push(...OFFLINE_SHELL.map(bust));
// else keep busting via app.js ?v=__BUILD__ only.
```

Pages / local default: leave `OFFLINE_FIRST` unset. A flip PR sets it in CI only after ADR gates are checked.

## CI comment template (offline-first switch)

Paste into the PR / issue that flips offline-first. Tick every box before merging the PRECACHE change:

- [ ] Offline-first first paint is a product requirement (shell usable with `app.js` unreachable).
- [ ] Smoke/QA shows chrome or fold UI broken offline while `app.js` is current (or missing).
- [ ] `ui-chrome` / `uni-fold` need their own `__BUILD__` **or** load outside the stamped `app.js` graph.
- [ ] `index.html` modulepreload, `sw.js` PRECACHE, and `stamp-build.mjs` REQUIRED stay in lockstep.
- [ ] `npm test` + one-shot offline boot stay green with both files listed.
- [ ] `OFFLINE_FIRST=1` documented in the flip PR; default remains unset/`0` on `main` until then.
- [ ] **Pages env must not set `OFFLINE_FIRST`** (repo / environment / workflow `env:` stay unset/`0` on `main` until the flip PR).

When all boxes are checked: add `js/ui-chrome.js` and `js/uni-fold.js` to **both** stamp REQUIRED and `sw.js` PRECACHE in the same commit.
