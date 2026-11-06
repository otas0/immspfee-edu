#!/usr/bin/env bash
# Local preview / university nav health checklist (AGENTS.md).
#   npm run doctor
# (1) .dev-server-4174.ready JSON + pid alive (auto-clear stale sidecars)
# (2) university chapter details default = current-subject-only
# (3) rename redirect check
# Not run on Pages — local only. Fold default is also covered by smoke-layout.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
PORT="${PORT:-4174}"
READY_FILE="$ROOT/.dev-server-${PORT}.ready"
PID_FILE="$ROOT/.dev-server-${PORT}.pid"
URL="http://127.0.0.1:${PORT}/"
fail=0

clear_stale_sidecars() {
  local why="$1"
  echo "clearing stale sidecars ($why): $READY_FILE $PID_FILE"
  rm -f "$READY_FILE" "$PID_FILE"
  echo "tip: restart with \`bash scripts/ensure-dev-server.sh\` (or \`npm start\` / \`npm run preview\`)"
}

echo "### doctor — local preview / university nav"
echo ""

# --- (1) ready sidecar ---
echo "## 1. .dev-server-${PORT}.ready"
if [[ ! -f "$READY_FILE" ]]; then
  echo "FAIL: missing $READY_FILE — run npm start / npm run preview first"
  echo "tip: \`bash scripts/ensure-dev-server.sh\`"
  fail=$((fail + 1))
else
  PID="$(python3 -c 'import json,sys
try:
  print(json.load(open(sys.argv[1])).get("pid") or "")
except Exception as e:
  print("")
  sys.stderr.write("parse error: %s\n" % e)
' "$READY_FILE" 2>/dev/null || true)"
  if [[ -z "$PID" || ! "$PID" =~ ^[0-9]+$ ]]; then
    echo "FAIL: $READY_FILE did not parse a numeric pid"
    clear_stale_sidecars "unparseable ready JSON"
    fail=$((fail + 1))
  elif ! kill -0 "$PID" 2>/dev/null; then
    echo "FAIL: ready pid $PID not alive"
    clear_stale_sidecars "dead pid $PID"
    fail=$((fail + 1))
  else
    if curl -sI --max-time 2 "$URL" | head -n 1 | grep -q '200\|301\|302\|304'; then
      echo "ok ready pid=$PID probe $URL"
    else
      echo "FAIL: pid $PID alive but HTTP probe of $URL failed"
      echo "tip: \`bash scripts/ensure-dev-server.sh --quiet\` (or restart after clearing)"
      fail=$((fail + 1))
    fi
  fi
fi
echo ""

# --- (2) university fold default ---
echo "## 2. university fold default (current-subject-only)"
if node --input-type=module <<'EOF'
import { getBook } from './js/curricula/index.js';
import { uniChapterOpen, uniOpenChapterIds } from './js/uni-fold.js';

const book = getBook('university') || getBook('uni');
if (!book?.chapters?.length) {
  console.error('FAIL: university book missing');
  process.exit(1);
}
const current = book.chapters[0];
const open = uniOpenChapterIds(book.chapters, current.id, {}, false);
const ok = open.length === 1 && open[0] === current.id
  && book.chapters.every((ch) => uniChapterOpen(ch.id, current.id, {}, false) === (ch.id === current.id));
if (!ok) {
  console.error('FAIL: no saved fold map must open only current chapter', { open, current: current.id });
  process.exit(1);
}
console.log('ok fold default current-only', current.id);
EOF
then
  :
else
  fail=$((fail + 1))
fi
echo ""

# --- (3) rename redirect ---
echo "## 3. rename redirect (immspfee-education → immspfee-edu)"
if REQUIRE_REDIRECT_CHECK=1 bash scripts/check-rename-redirect.sh; then
  :
else
  echo "FAIL: redirect check"
  fail=$((fail + 1))
fi
echo ""

if (( fail )); then
  echo "doctor: $fail check group(s) failed"
  exit 1
fi
echo "doctor: all checks ok"
