# ADR 001 — When to PRECACHE `ui-chrome` / `uni-fold`

**Status:** Accepted (2026-11)  
**Context:** `js/ui-chrome.js` and `js/uni-fold.js` are imported from `app.js` with `?v=__BUILD__`. They are not in `scripts/stamp-build.mjs` REQUIRED and not in `sw.js` PRECACHE.

**Decision:** Keep them off PRECACHE / REQUIRED. Cache-busting through stamped `app.js` is enough for GitHub Pages today.

**Trigger to revisit (offline-first):** Add both to PRECACHE **and** stamp REQUIRED only if **all** of the following become true:

1. The service worker must boot a usable shell **before** `app.js` is fetched (true offline-first first paint).
2. `ui-chrome` / `uni-fold` grow their own `__BUILD__` tokens or become entry modules outside the `app.js` graph.
3. A failing offline smoke shows a stale chrome/fold module beside a newer `app.js`.

Until then, do not list them in PRECACHE.
