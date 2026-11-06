#!/usr/bin/env bash
# Local-only OFFLINE_FIRST=1 side-branch dry-run (never pushes; does not touch origin/main).
# Creates a disposable worktree, lists ui-chrome + uni-fold on stamp REQUIRED + sw PRECACHE,
# runs the lockstep dry-run with OFFLINE_FIRST=1, then removes the worktree + branch.
#
#   bash scripts/offline-first-sidebranch-dry-run.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
BRANCH="dry/offline-first-local-$$"
# Keep worktree under the repo so sandbox / CI can write (avoid /tmp).
WT_PARENT="$ROOT/.tmp-offline-sidebranch"
mkdir -p "$WT_PARENT"
WT="$WT_PARENT/wt-$$"
cleanup() {
  git -C "$ROOT" worktree remove --force "$WT" 2>/dev/null || true
  git -C "$ROOT" branch -D "$BRANCH" 2>/dev/null || true
  rm -rf "$WT" 2>/dev/null || true
  rmdir "$WT_PARENT" 2>/dev/null || true
}
trap cleanup EXIT

git worktree add -b "$BRANCH" "$WT" HEAD >/dev/null
# Inject shell modules into stamp REQUIRED + sw PRECACHE + index modulepreload
# (ADR 001 flip template lockstep; worktree only — never pushed).
python3 - <<'PY' "$WT"
import pathlib, re, sys
wt = pathlib.Path(sys.argv[1])
stamp = wt / "scripts/stamp-build.mjs"
sw = wt / "sw.js"
index = wt / "index.html"
st = stamp.read_text()
if "js/ui-chrome.js" not in st:
    st = st.replace(
        "const REQUIRED = [",
        "const REQUIRED = [\n  'js/ui-chrome.js',\n  'js/uni-fold.js',",
        1,
    )
    stamp.write_text(st)
sw_t = sw.read_text()
if "ui-chrome.js" not in sw_t:
    sw_t = re.sub(
        r"(const PRECACHE = \[\n)",
        r"\1  './js/ui-chrome.js',\n  './js/uni-fold.js',\n",
        sw_t,
        count=1,
    )
    sw.write_text(sw_t)
ix = index.read_text()
for rel in ("js/ui-chrome.js", "js/uni-fold.js"):
    needle = f'href="./{rel}?v=__BUILD__"'
    if needle not in ix:
        ix = ix.replace(
            '<link rel="modulepreload" href="./js/app.js?v=__BUILD__">',
            f'<link rel="modulepreload" href="./js/app.js?v=__BUILD__">\n  <link rel="modulepreload" href="./{rel}?v=__BUILD__">',
            1,
        )
index.write_text(ix)
PY

(
  cd "$WT"
  # Require modulepreload lockstep on this sidebranch (flip template alignment).
  if ! OFFLINE_FIRST=1 OFFLINE_FIRST_REQUIRE_MP=1 node scripts/offline-first-lockstep-dry-run.mjs; then
    echo "FAIL offline-first sidebranch dry-run" >&2
    exit 1
  fi
)
echo "ok offline-first sidebranch dry-run (local worktree $BRANCH; not pushed)"
