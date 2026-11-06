# Local viewport captures

**Single source for capture / CI artifact naming.** Root `README.md` (EN/ZH) only links here — do not duplicate the artifact name table elsewhere.

PNGs here are **not** committed (see `.gitignore`). Regenerate after chrome or projectile layout changes.

Local `push-main` writes a paste-ready run summary to `push-main-last-summary.md` in this folder (gitignored). The file opens with a **Copy to issue title** line and appends job-status heartbeats while the Pages run is watched.

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
| `320px-projectile-stack.png` | 320×720 | Strobe path above stacked x–t · y–t panel. |

Suggested capture:

```bash
npm run capture:340-title   # probes :4174; on failure runs ensure-dev --no-exec, then shoots
# → .local-shots/340px-zh-long-title-ellipsis.png (also asserts .top ≤100px at 340)
# Short-title stack band (manual): width 340 → #/sh-senior/shs-5-1a/introduce
```

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
