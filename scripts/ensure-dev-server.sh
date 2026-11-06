#!/usr/bin/env bash
# Probe local preview first; only start when the probe fails.
# Prefer .ready JSON: reuse only when its pid is still alive and HTTP answers.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${PORT:-4174}"
URL="http://127.0.0.1:${PORT}/"
READY_FILE="$ROOT/.dev-server-${PORT}.ready"
PID_FILE="$ROOT/.dev-server-${PORT}.pid"

probe_ok() {
  curl -sI --max-time 2 "$URL" | head -n 1 | grep -q '200\|301\|302\|304'
}

pid_alive() {
  local pid="$1"
  [[ -n "$pid" && "$pid" =~ ^[0-9]+$ ]] || return 1
  kill -0 "$pid" 2>/dev/null
}

ready_pid() {
  if [[ ! -f "$READY_FILE" ]]; then
    return 1
  fi
  python3 -c 'import json,sys
try:
  print(json.load(open(sys.argv[1])).get("pid") or "")
except Exception:
  print("")
' "$READY_FILE" 2>/dev/null
}

if [[ -f "$READY_FILE" ]]; then
  PID="$(ready_pid || true)"
  if pid_alive "$PID"; then
    if probe_ok; then
      echo "$URL (already up, pid $PID)"
      exit 0
    fi
    echo "ready pid $PID alive but probe failed; starting fresh"
  else
    echo "stale .ready (pid ${PID:-?} not alive); clearing sidecars"
    rm -f "$READY_FILE" "$PID_FILE"
  fi
elif probe_ok; then
  echo "$URL (already up)"
  exit 0
fi

echo "probe failed; starting dev server on $PORT"
cd "$ROOT"
exec node scripts/dev-server.mjs
