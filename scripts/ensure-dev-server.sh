#!/usr/bin/env bash
# Probe local preview first; only start when the probe fails.
# Prefer .ready JSON: reuse only when its pid is still alive and HTTP answers.
#
# Default replaces this shell with the server (exec). For chained scripts use:
#   bash scripts/ensure-dev-server.sh --no-exec
# or ENSURE_NO_EXEC=1 so the server is backgrounded and this script returns.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${PORT:-4174}"
URL="http://127.0.0.1:${PORT}/"
READY_FILE="$ROOT/.dev-server-${PORT}.ready"
PID_FILE="$ROOT/.dev-server-${PORT}.pid"

NO_EXEC=0
if [[ "${ENSURE_NO_EXEC:-}" == "1" ]]; then NO_EXEC=1; fi
for arg in "$@"; do
  case "$arg" in
    --no-exec) NO_EXEC=1 ;;
  esac
done

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

LOG_FILE="/tmp/immspfee-edu-${PORT}.log"

tail_dev_log() {
  local why="$1"
  echo "$why" >&2
  if [[ -f "$LOG_FILE" ]]; then
    echo "---- tail $LOG_FILE ----" >&2
    tail -n 40 "$LOG_FILE" >&2 || true
    echo "---- end log ----" >&2
  else
    echo "(no log at $LOG_FILE)" >&2
  fi
}

if (( NO_EXEC )); then
  node scripts/dev-server.mjs >"$LOG_FILE" 2>&1 &
  START_PID=$!
  for _ in $(seq 1 50); do
    if probe_ok; then
      echo "$URL (started pid ${START_PID}, --no-exec)"
      exit 0
    fi
    if ! kill -0 "$START_PID" 2>/dev/null; then
      tail_dev_log "dev server exited early (pid $START_PID)"
      exit 1
    fi
    sleep 0.1
  done
  tail_dev_log "dev server did not answer within 5s (pid $START_PID)"
  exit 1
fi

exec node scripts/dev-server.mjs
