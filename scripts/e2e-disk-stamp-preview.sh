#!/usr/bin/env bash
# Prepare a disk-stamped preview tree for hard-boot mismatch e2e (no Playwright route rewrite).
# Copies entry shells into .local-shots/e2e-preview, stamps BUILD_SHA, serves on PORT (default 4175).
#
#   BUILD_SHA=e2e0001 bash scripts/e2e-disk-stamp-preview.sh
#   HARD_BOOT_E2E_DISK_STAMP=1 … (smoke-hard-boot-mismatch.mjs may call this)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${E2E_PREVIEW_DIR:-$ROOT/.local-shots/e2e-preview}"
PORT="${PORT:-4175}"
SHA="$(printf '%s' "${BUILD_SHA:-${GITHUB_SHA:-e2e0001}}" | tr -cd '0-9a-fA-F' | cut -c1-7)"
SHA="${SHA:-e2e0001}"

rm -rf "$OUT"
mkdir -p "$OUT"
# Entry shells + modules hard-boot / app import (keep physics token-free copies as-is).
cp "$ROOT/index.html" "$ROOT/sw.js" "$OUT/"
cp -R "$ROOT/css" "$ROOT/js" "$OUT/"
# Optional chrome assets if present.
if [[ -d "$ROOT/assets" ]]; then cp -R "$ROOT/assets" "$OUT/"; fi

(
  cd "$OUT"
  BUILD_SHA="$SHA" GITHUB_SHA="$SHA" node "$ROOT/scripts/stamp-build.mjs"
)

# Refuse to start if stamp left a literal token in index.
if grep -q '__BUILD__' "$OUT/index.html"; then
  echo "FAIL e2e-disk-stamp: index.html still has __BUILD__ after stamp" >&2
  exit 1
fi
if ! grep -q "var BUILD = '$SHA'" "$OUT/index.html" && ! grep -q "BUILD = \"$SHA\"" "$OUT/index.html"; then
  # stamp uses slice(0,7) of env; accept BUILD = '<sha>'
  if ! grep -qE "var BUILD = '$SHA'" "$OUT/index.html"; then
    echo "FAIL e2e-disk-stamp: expected BUILD=$SHA in index.html" >&2
    grep -n 'var BUILD' "$OUT/index.html" >&2 || true
    exit 1
  fi
fi

echo "e2e-disk-stamp: BUILD=$SHA → $OUT"
echo "e2e-disk-stamp: starting STATIC_ROOT server on :$PORT"
# Foreground when E2E_STAMP_FOREGROUND=1; else background for chaining.
# Redirect server stdio so callers piping this script (tee|tail) are not held open.
log="${E2E_PREVIEW_LOG:-$ROOT/.local-shots/e2e-preview-server.log}"
if [[ "${E2E_STAMP_FOREGROUND:-}" == "1" ]]; then
  STATIC_ROOT="$OUT" PORT="$PORT" node "$ROOT/scripts/dev-server.mjs"
else
  STATIC_ROOT="$OUT" PORT="$PORT" node "$ROOT/scripts/dev-server.mjs" \
    >"$log" 2>&1 &
  disown || true
  # Wait for ready sidecar / HTTP.
  for _ in $(seq 1 40); do
    if curl -sI --max-time 1 "http://127.0.0.1:${PORT}/" | head -n 1 | grep -q '200\|304'; then
      echo "http://127.0.0.1:${PORT}/"
      exit 0
    fi
    sleep 0.15
  done
  echo "FAIL e2e-disk-stamp: preview :$PORT not up (log: $log)" >&2
  exit 1
fi
