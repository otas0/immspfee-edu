# Education edition

This repository is IMMSPFEE Education. Do not point it at the standard lab remote (`otas0/immspfee`).

- English is the source language for README, docs, UI chrome defaults, and new comments. Lesson titles exist in English and Chinese because the textbooks are Chinese.
- Every readout, check, and drawing for a ready lesson comes from the equations in `js/physics/`. Do not add decorative traces or canned answers.
- Do not paint assumption banners, fidelity badges, or “not for engineering use” strips on the stage, the chapter list, or the readout strip. Keep `authority` on the simulation object.
- A queued section stays empty. Do not ship a placeholder animation.
- Nuclear and modern items stay on public teaching relations (half-life, energy levels, mass–energy). Do not add device, yield, or production steps.
- `npm test` must stay green. Offline / flaky GitHub: use `npm run test:offline` (skips `check-rename-redirect.sh`).
- Local preview is `http://127.0.0.1:4174/`. Probe with `curl -sI` (or `npm run preview` / `.dev-server-4174.ready`) before starting another server; only launch when the probe fails. Prefer `npm start` (`scripts/npm-start.sh` → `ENSURE_QUIET=1`, quiet on reuse; `npm start -- --verbose` restores banners) or `nohup node scripts/dev-server.mjs` — a second start exits 0 and reuses the listener without the bilingual banner when quiet.
- Checklist before claiming local preview / university nav is healthy: (1) `.dev-server-4174.ready` JSON parses and its `pid` is alive (`kill -0`), else clear stale sidecars and start via `scripts/ensure-dev-server.sh` (`--no-exec` / `ENSURE_NO_EXEC=1` when chaining; `--quiet` / `ENSURE_QUIET=1` for reuse-only tips; `npm start -- --verbose` or `ENSURE_QUIET=0` restores banners); (2) university chapter `details` default to current-subject-only open (no saved fold map → only the active chapter is `open`); (3) rename redirect via `bash scripts/check-rename-redirect.sh` (soft-skips offline in local `npm test`; Pages CI sets `REQUIRE_REDIRECT_CHECK=1`).
- Narrow projectile layout uses canvas `w <= 360` (stacked teachPanel). Book-select clipping for PEP/沪科 titles is CSS `@media (max-width: 320px)` with `text-overflow: clip`. Keep both breakpoints; do not collapse them without checking 321–360px.
- At **321–360px**: projectile already stacks (`w <= 360`); the book-select may still use the base `text-overflow: ellipsis` until 320px. Capture reference: `.local-shots/340px-projectile-ellipsis.png` (see `.local-shots/README.md`; PNGs are gitignored). Do not assume clip applies in this band.
- Leaving Debug clears `ui.wrong` (`clearWrongLeavingDebug`); phase **上一步** from Debug uses the same helper via `goPhase`. Household Debug still forces bp–bn on enter. Leaving household layout also clears wrong.
- **Reset vs 上一步 (product):** Introduce keeps a single **Reset** (reload lesson + params). Other phases use **上一步** (previous phase). Do not split Explore into a second “reset parameters” ghost — schema fields already edit params. **Explore one-click preset restore: explicitly not shipping** until product asks; then add a dedicated control + smoke.
- University fold hint: idle → `foldCurrent` + chapter title; while searching → `foldSearchOpen` + same chapter title (`data-searching="1"`). Clearing search restores `foldCurrent` and drops `data-searching`. `data-chapter-id` must match the active chapter.
- `ui-chrome.js` / `uni-fold.js` are not in `stamp-build` REQUIRED or `sw.js` PRECACHE; cache-bust via `app.js`’s `?v=__BUILD__` imports. **Re-eval (2026-11):** still off PRECACHE — triggers to add them are in `docs/adr/001-ui-chrome-precache.md`.
- Minkowski sticky readout hi: **β only** while/after track drag (`_betaHi`). γ / Δt stay plain until product asks to widen the sticky set.

## Release

When a task is finished and `npm test` is green, commit and push `main` immediately so GitHub Pages deploys. Do not batch finished tasks. Do not wait to be asked again.

If the test fails, fix it before pushing. Never deploy a red tree.

Before pushing, check the remote. Push to `otas0/immspfee-edu` if the repo has been renamed; otherwise `otas0/immspfee-education`. Prefer `bash scripts/push-main.sh` (HTTP/1.1 + exponential backoff). Otherwise use `git -c credential.helper='!gh auth git-credential'` / a token HTTPS URL. Do not change git config. Do not touch `otas0/immspfee`.

Pages uses `concurrency.cancel-in-progress: true` so the latest main wins. Keep that default. Only consider `cancel-in-progress: false` if a release explicitly needs every intermediate SHA’s live smoke to finish; that is a deliberate trade-off, not the day-to-day path. Do not fire a second finished-task push while a prior Pages run is still queued or in progress—`scripts/push-main.sh` waits for watch before exiting. A cancelled run on an intermediate SHA is that race, not a content failure.

After each push, watch the Pages workflow until it succeeds (`push-main.sh` does this), or report the failure. If the run stays in `waiting`, the github-pages environment needs approval—`push-main.sh` prints the Actions URL and keeps waiting.

`scripts/stamp-build.mjs` rewrites only files that opt in with a `__BUILD__` token (plus a small required entry list). Never stamp `scripts/` (especially `test-edu.mjs` asserts). Physics modules stay token-free; `js/sims/*.js` import `kit.js` / `physics/*` / `fmt.js` with `?v=__BUILD__`. Keep `sw.js` PRECACHE aligned with `index.html` modulepreload and that required stamp set.

Pages runners are pinned to `ubuntu-24.04` (not the floating `ubuntu-latest` label). When GitHub moves the default image toward Ubuntu 26, re-run a green Pages deploy on a dry branch first so Node 24 and the Pages actions stay green.

Lesson commits contain equations, simulations, curricula, and tests only. Logo commits contain only the logo asset, header CSS, and README URL lines. Never mix them.

Confirm that `https://github.com/otas0/immspfee-education` redirects to the renamed repo (`otas0/immspfee-edu`) with `bash scripts/check-rename-redirect.sh` (or `npm run test:redirect`). Do not rename the repo if that work is already in progress; just check. This is checklist item (3) under local preview / university nav.
