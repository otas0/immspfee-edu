# Local viewport captures

**Single source for capture / CI artifact naming.** Root `README.md` (EN/ZH) only links here — do not duplicate the artifact name table elsewhere.

PNGs here are **not** committed (see `.gitignore`). Regenerate after chrome or projectile layout changes.

Local `push-main` writes a paste-ready run summary to `push-main-last-summary.md` in this folder (gitignored). The file opens with a **Copy to issue title** line and appends job-status heartbeats while the Pages run is watched.

Soft-ok jobs-miss demo (no network): `PUSH_WATCH_FLAKE_FIXTURE=1 bash scripts/push-main-heartbeat.sh` writes `push-main-soft-ok-demo.md` here; it must contain the string `soft_ok_jobs_flake`.

## Book title strategy (321–360 vs ≤320)

| Viewport band | Projectile (`w`) | Book-select `text-overflow` | Notes |
| --- | --- | --- | --- |
| **321–360px** | Stacked teachPanel (`w <= 360`) | Base **`ellipsis`** (clip media not active) | Capture: `340px-projectile-ellipsis.png`, `340px-zh-long-title-ellipsis.png` |
| **≤320px** | Still stacked | **`clip`** via `@media (max-width: 320px)` on `.book-select-wrap select` | Capture: `320px-pep-zh-book.png` — short PEP/沪科 titles stay fully visible |

Do not collapse these breakpoints: 340px is intentionally “stack + ellipsis”.

## Capture files

| File | Viewport | Expect |
| --- | --- | --- |
| `340px-projectile-ellipsis.png` | **340×720** (321–360 band) | Projectile **stacked** teachPanel (`w <= 360`); book-select still **`text-overflow: ellipsis`**. |
| `340px-zh-long-title-ellipsis.png` | **340×720**, `lang=zh` | Force a long selected label. Expect **`ellipsis`** and canvas `measureText` width + padding **>** select `clientWidth`. Also asserts `.top` ≤100px. |
| `320px-pep-zh-book.png` | 320×720, `lang=zh` | 「人教版初中物理」 fully visible; computed `text-overflow: clip`. |
| `320px-top-remeasure.json` | 320×720 | `.top` height, book-select `min-height` (≥28), overflow — `npm run capture:320-remeasure` or CDP. **2026-11-07:** topH **91.5** (pre-tweak), book/lang/region **≥28**, overflow **clip**, 「人教版初中物理」 fully readable. CSS then tightened brand/padding toward ~75–85 without dropping taps below 28. Safari 真机 still authoritative for subpixel. |
| `320px-projectile-stack.png` | 320×720 | Strobe path above stacked x–t · y–t panel. |
| `live-getsim-fail.md` / `live-getsim-diag/` | CI fail-only | Uploaded as `live-getsim-fail-<sha>` when post-deploy getSim smoke fails. |
| `1280-desktop-diff.md` | optional | Byte-level drift vs prior `capture-1280-desktop-*` (`CAPTURE_1280_DIFF=1`). |
| `poster-a4-reference.png` | A4 210×297mm | Education promo baseline (`npm run capture:poster`). Inner 10mm safe pad; square frames. |
| `poster-340px-screen.png` | **340×720** screen | One column; hero line-height ≤1.25em; no horizontal overflow. |
| `poster-speaker-zh.png` | A4 speaker `?speaker=1&lang=zh` | Larger projection QR; site-style lang pills. |
| `poster-a4.pdf` / `poster-a4-fit.json` | A4 | `npm run poster:pdf` / capture fit assert (1 page, no clip). |

Suggested capture:

```bash
npm run capture:340-title   # probes :4174; on failure runs ensure-dev --no-exec, then shoots
# → .local-shots/340px-zh-long-title-ellipsis.png (also asserts .top ≤100px at 340)
# Short-title stack band (manual): width 340 → #/sh-senior/shs-5-1a/introduce

npm run capture:poster      # A4 + 340 + speaker-zh + 1-page fit
npm run poster:pdf          # .local-shots/poster-a4.pdf (Pages does not host docs/promo)
npm run sync:poster-books   # docs/promo/poster-books.json ← curricula
npm run lint:poster         # ban lab fonts + books sync
```

## Poster baseline 对照 (local only)

After any edit to `docs/promo/poster.html` (or logo/QR):

1. `npm start` (or ensure `:4174` is up).
2. `npm run capture:poster` → overwrites `poster-a4-reference.png` + `poster-340px-screen.png`.
3. Open both PNGs next to the previous copies (or Quick Look) — check brand ≤300px, A4 crop, and 340px one-column with no horizontal overflow.
4. Optional: `npm run poster:pdf` for print proof.

Do **not** commit the PNGs/PDF. Pages does not host `docs/promo/`.


CI: optional `capture-340-title` job installs Playwright when available, otherwise skips. A `CAPTURE_FORCE_FAIL=1` step (continue-on-error) checks the overflow/topH summary template; verification failure marks the step summary red, pastes `capture-last-fail.md`, and links the run artifacts. Then the real capture runs (also non-blocking). Artifact names (short SHA, **7-day** retention): `capture-340px-zh-long-title-<sha>`, `capture-1280-desktop-<sha>`, `capture-last-fail-<sha>` (**fail-only** upload), `redirect-fail-headers-<sha>`. **`CAPTURE_FORCE_COLS_FAIL=1` is in-job verify only** (same idea as force_fail template) — it does **not** upload `capture-cols-fail-<sha>` on green runs; real three-column / capture failures still go through `capture-last-fail-<sha>`. Local: `CAPTURE_FORCE_FAIL=1 npm run capture:340-title` · `CAPTURE_FORCE_COLS_FAIL=1 npm run capture:1280`.

## Playwright pin

Version is pinned in `scripts/playwright-version.txt` (CI reads it). **When bumping the pin, reinstall `/tmp/pw-shot` to the same version** so local `NODE_PATH` captures match CI. Local capture:

```bash
PW_VER=$(tr -d ' \n\r' < scripts/playwright-version.txt)
mkdir -p /tmp/pw-shot && cd /tmp/pw-shot
npm init -y
npm install "playwright@${PW_VER}"
npx playwright install chromium
cd -   # back to repo
NODE_PATH=/tmp/pw-shot/node_modules npm run capture:340-title
```

Policy is also noted in `AGENTS.md` (321–360px bullet).
