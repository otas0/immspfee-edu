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
