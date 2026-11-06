#!/usr/bin/env bash
# npm start entry: quiet by default; forwards args (e.g. npm start -- --verbose).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export ENSURE_QUIET="${ENSURE_QUIET:-1}"
exec bash "$ROOT/scripts/ensure-dev-server.sh" "$@"
