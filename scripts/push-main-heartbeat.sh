#!/usr/bin/env bash
# Pure helpers for push-main heartbeat / FAIL marking (no network).
# Sourced by push-main.sh; also runnable as a fixture:
#   HEARTBEAT_FIXTURE=1 bash scripts/push-main-heartbeat.sh
#   → asserts fail_n>=1 prefixes **FAIL**; fail_n=0 stays plain.
set -euo pipefail

# Format one Heartbeats bullet. fail_n: count of jobs with failure|cancelled|timed_out.
heartbeat_format_row() {
  local ts="${1:?}" line="${2:?}" fail_n="${3:-0}" prefix=""
  if [[ "$fail_n" =~ ^[1-9][0-9]*$ ]]; then
    prefix="**FAIL** "
  fi
  printf -- '- `%s` %s%s\n' "$ts" "$prefix" "$line"
}

# True if any job conclusion should flip mid-FAIL title (incl. during env waiting).
heartbeat_jobs_have_fail() {
  local fail_n="${1:-0}"
  [[ "$fail_n" =~ ^[1-9][0-9]*$ ]]
}

if [[ "${HEARTBEAT_FIXTURE:-}" == "1" ]]; then
  row_fail="$(heartbeat_format_row '2026-11-06T00:00:00Z' 'deploy=in_progress/- · capture=completed/failure' 1)"
  row_ok="$(heartbeat_format_row '2026-11-06T00:00:01Z' 'deploy=completed/success · capture=completed/success' 0)"
  if [[ "$row_fail" != '- `2026-11-06T00:00:00Z` **FAIL** deploy=in_progress/- · capture=completed/failure' ]]; then
    echo "FAIL heartbeat fixture: expected **FAIL** prefix on failure conclusion" >&2
    echo "got: $row_fail" >&2
    exit 1
  fi
  if [[ "$row_ok" == *'**FAIL**'* ]]; then
    echo "FAIL heartbeat fixture: success path must not mark FAIL" >&2
    echo "got: $row_ok" >&2
    exit 1
  fi
  if ! heartbeat_jobs_have_fail 1 || heartbeat_jobs_have_fail 0; then
    echo "FAIL heartbeat fixture: heartbeat_jobs_have_fail" >&2
    exit 1
  fi
  echo "ok heartbeat FAIL fixture (prefix + jobs_have_fail)"
  exit 0
fi
