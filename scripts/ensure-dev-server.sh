#!/usr/bin/env bash
# Probe local preview first; only start when the probe fails.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${PORT:-4174}"
URL="http://127.0.0.1:${PORT}/"

if curl -sI --max-time 2 "$URL" | head -n 1 | grep -q '200\|301\|302\|304'; then
  echo "$URL (already up)"
  exit 0
fi

echo "probe failed; starting dev server on $PORT"
cd "$ROOT"
exec node scripts/dev-server.mjs
