# IMMSPFEE Education

Classroom edition of IMMSPFEE. Lessons follow a textbook, one section at a time. The standard lab stays in its own repository ([otas0/immspfee](https://github.com/otas0/immspfee)) and is not this site.

**Contributing:** [CONTRIBUTING.md](CONTRIBUTING.md) (stage allowlist, doctor, Minkowski sticky #1, offline-first ADR).

| | |
| --- | --- |
| [中文说明](#中文说明镜像) | [Run](#run) |
| [Contributing](CONTRIBUTING.md) | [Local shots / CI artifacts](.local-shots/README.md) |

This edition: [github.com/otas0/immspfee-edu](https://github.com/otas0/immspfee-edu) · live Pages [otas0.github.io/immspfee-edu](https://otas0.github.io/immspfee-edu/) (GitHub Pages from `main`). The older path `github.com/otas0/immspfee-education` should redirect to the renamed repo.

Every mapped lesson in Shanghai junior, Shanghai senior, PEP junior grade 8, and University physics draws readouts, checks, and the mistake overlay from the governing equations in `js/physics/`. The chapter tree shows only lesson titles—no Ready, Exam, or N/N chips. A section that is only queued stays empty on the stage; this tree currently has no queued secondary lessons. Textbook edition notes live under About in the teach column, not in the header.

## 中文说明（镜像）

IMMSPFEE 教育版：按教材一节一节上课。标准实验室在独立仓库 [otas0/immspfee](https://github.com/otas0/immspfee)，不是本站。

本版地址：[github.com/otas0/immspfee-edu](https://github.com/otas0/immspfee-edu) · 线上 Pages [otas0.github.io/immspfee-edu](https://otas0.github.io/immspfee-edu/)（`main` 自动发布）。旧名 `immspfee-education` 应重定向到本仓。

沪科初中、沪科高中、人教八年级，以及「大学物理」（地区标签「大学」）里已映射的节，读数、判定和排故叠层都来自 `js/physics/` 中的方程。章节树只显示节名；大学目录按学科折叠。仅排队的节舞台保持空白；当前树无排队的中学节。教材版次说明在授课栏的 About，不在顶栏。界面默认英文，可切中文。

深链用**课** id，不是节 id。`live()` 生成的课会在节号后加 `a`，例如沪科高中「曲线运动」是 `#/sh-senior/shs-5-1a/introduce`，不要写成 `shs-5-1`。本地预览：`npm run preview` 或 `bash scripts/ensure-dev-server.sh --no-exec`。Safari 旧标签图标可用 `bash scripts/clear-favicons.sh`（需在终端完整磁盘访问权限下运行）或双击 `scripts/clear-favicons.command`。

相位控件：引入步只有「复位」（重载本节）；其他步是「上一步」。探究栏用参数表改数，**不做**「一键恢复预设」第二按钮。大学目录 hint：平时「当前学科：…」；搜索时「搜索中·全部展开 · 当前：…」（`data-searching="1"`），清空搜索后回到「当前学科」。

本地检查清单：

```bash
npm test                 # 含 layout + book-select CSSOM（末尾 redirect 无网软跳过）
npm run test:offline     # 无网：跳过 rename redirect
npm run smoke:layout     # 仅教学双栏 / 指针烟雾
npm run smoke:book       # 仅 320px 人教书名 / clip 断言
npm run preview          # 探测 4174，失败才启动
npm start -- --verbose   # 复用 4174 时恢复双语横幅（默认 quiet）
npm run capture:340-title  # 340px 长书名 ellipsis 截帧（探测失败则 --no-exec 再拍）
CAPTURE_FORCE_FAIL=1 npm run capture:340-title  # 故意失败，检查 overflow/topH 摘要模板
npm run pw:pin-dry-run     # Playwright pin → issue 逻辑 dry-run（不建 issue；见 package.json scripts）
```

无 `pretest` 钩子。用 `npm test`（含 rename redirect；GitHub 不可达时软跳过）或 `npm run test:offline`（完全跳过 redirect）。本地：`npm run doctor`（清 sidecar 后默认 `DOCTOR_AUTO_ENSURE=1` 调 ensure-dev-server；不进 Pages）· hooksPath → [docs/hooks/stage-allow.md](docs/hooks/stage-allow.md) / [CONTRIBUTING.md](CONTRIBUTING.md)。`npm run offline-first:dry-run`（`OFFLINE_FIRST_FIXTURE=1` / `OFFLINE_FIRST_REALTREE=1` 绿路径；main 勿设 OFFLINE_FIRST）。CI：`CAPTURE_FORCE_FAIL` + `CAPTURE_FORCE_COLS_FAIL`（**verify only**，绿跑不上传 `capture-cols-fail`；真失败走 `capture-last-fail`）+ `redir-retries-diag`。提交用 `bash scripts/git-stage-allow.sh --default`。

CI artifact 命名（短 SHA）：`capture-340px-zh-long-title-<sha>`、`capture-last-fail-<sha>`、`redirect-fail-headers-<sha>`（详见 [`.local-shots/README.md`](.local-shots/README.md)）。

## Run

```bash
npm test
npm start
```

There is **no** `pretest` hook. Use `npm test` (includes rename redirect; soft-skips when GitHub is unreachable) or `npm run test:offline` when you want to skip redirect entirely.

CI artifact names (short SHA, 7-day): `capture-340px-zh-long-title-<sha>`, `capture-1280-desktop-<sha>`, `capture-1280-diff-<sha>` (optional), `capture-last-fail-<sha>` (fail-only), `live-getsim-fail-<sha>` (fail-only), `redirect-fail-headers-<sha>` — see [`.local-shots/README.md`](.local-shots/README.md). `CAPTURE_FORCE_COLS_FAIL` verifies in-job only (no green `capture-cols-fail` upload). PNGs stay in Actions artifacts / `.local-shots/` (gitignored); do not commit large shots.

`npm start` runs `scripts/npm-start.sh` → `ensure-dev-server.sh` with `ENSURE_QUIET=1` by default: reuses an already-listening process on port 4174 (`.dev-server-4174.pid` + `.ready`) and exits 0 with a one-line URL tip (no bilingual banner). Prefer probing first:

```bash
npm run preview          # curl -sI …/4174/ ; start only on failure
# or:
curl -sI http://127.0.0.1:4174/ || npm start
# Quiet escape hatch (restore banners):
npm start -- --verbose
#   or: ENSURE_QUIET=0 npm start
```

`push-main` waits on the github-pages environment; default `PAGES_WAITING_TIMEOUT=900` (seconds) — override if approval is slow.

For a session that should outlive the terminal:

```bash
nohup node scripts/dev-server.mjs >/tmp/immspfee-edu-4174.log 2>&1 &
```

Open http://127.0.0.1:4174/ . Deep link: `#/sh-junior/shj-4-4a/explore`.

Hash routes use the **lesson** id, not the section id. `live()` lessons append `a` (e.g. Shanghai senior curved motion is `#/sh-senior/shs-5-1a/introduce`, not `shs-5-1`). Unknown ids fall back to the default junior lesson.

For chained scripts that must keep running after preview starts:

```bash
bash scripts/ensure-dev-server.sh --no-exec   # or ENSURE_NO_EXEC=1
bash scripts/ensure-dev-server.sh --quiet     # reuse tip only; no banner noise
bash scripts/ensure-dev-server.sh --verbose   # undo quiet / ENSURE_QUIET for this run
curl -sI http://127.0.0.1:4174/
```

Safari still shows an old tab icon after a favicon rotate: quit browsers and run `bash scripts/clear-favicons.sh` from Terminal.app (needs Full Disk Access), or double-click `scripts/clear-favicons.command`.

Hard-boot is keyed by the stamped `__BUILD__`: when the build id changes, the tab clears this site’s Cache Storage once and reopens with a fresh query so a stale module cannot sit next to a newer curriculum. Same build skips the wipe for the rest of the tab session. If the first screen fails to load a simulation after a deploy, click the bilingual “Site updated / Reload” bar (or hard-refresh once), then open the lesson again—do not keep retrying on a stale module graph. When a new service worker is waiting, that bar appears instead of auto-reloading. About (textbook edition notes, the separate standard-lab link, and the lab repository path as plain text) sits at the bottom of the teach column, not under the header. Add `?dev` to surface module import failures as a toast. Opening a lesson also prefetches the other simulations in that volume (university is split into subject volumes) so Explore does not flash an empty stage.

Switch the textbook in the header (narrow screens use a one-line book dropdown). Shanghai junior and PEP junior share one simulation pool; only the chapter order changes. Language is English by default, with 中文 for the same chrome.

## A lesson

Each lesson with a simulation has four steps:

1. Introduce — what the section is asking
2. Explore — parameters and dragging
3. Check — questions whose correct option is computed from the current state
4. Debug — a common mistake drawn next to the equation, not instead of it

## Layout

| Path | Role |
|---|---|
| `js/curricula/` | Region → book → chapter → section → lesson |
| `js/physics/` | Equations used by the checks and the pictures |
| `js/sims/` | Canvas, parameters, checks, mistake overlay |
| `js/app.js` | Shell, hash route, phase machine |

Authorities for the equations are on each simulation (`authority`). They are not printed as banners on the stage.

## Books in this edition

- Shanghai junior, 沪科版五四制 (2024), Shanghai Science and Technology Publishers. Contents titles for the 17 chapters match the published books. Rectilinear propagation is a chapter opening before §4.1, because the 2024 contents page titles that section “光的反射”.
- Shanghai senior, 沪科版 (2021). Compulsory 1–3 and elective 2 follow the published contents; elective 1 and 3 stay a chapter map. Mapped sections mount equation-backed simulations.
- PEP junior grade 8 (2024 contents). Cross-subject practicals stay on the tree with equation-backed sims where the relation is public.
- University physics (region label 大学; not a fourth textbook volume). Classical mechanics, electromagnetism, thermal/statistical physics, quantum physics, waves, optics, and relativity each mount public teaching relations (plane wave and displacement current, ideal gas and Carnot, infinite well and tunneling, Ising Metropolis with Onsager Tc, Maxwell speeds, Fourier square wave, membrane modes, Malus, thin film phase switch, laser cavity spacing, hydrogen radial density, coupled pendula, simultaneity ruler, Bell singlet correlation, Stern–Gerlach probabilities, and related forms).
