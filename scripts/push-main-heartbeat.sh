#!/usr/bin/env bash
# Pure helpers for push-main heartbeat / FAIL marking / post-push resume (no network).
# Sourced by push-main.sh; also runnable as fixtures:
#   HEARTBEAT_FIXTURE=1 bash scripts/push-main-heartbeat.sh
#   PUSH_RESUME_FIXTURE=1 bash scripts/push-main-heartbeat.sh
#     → push ok + fetch fail + gh ok → resume watch
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

# After a successful push: decide whether to continue watch.
# Args: local_head remote_main fetch_ok(0|1) gh_ok(0|1)
# Prints: ok_fetch | ok_gh_resume | retry
# Exit 0 for continue watch; 1 for retry push loop.
post_push_confirm() {
  local local_head="${1:?}" remote_main="${2:-}" fetch_ok="${3:-0}" gh_ok="${4:-0}"
  if [[ "$fetch_ok" == "1" && -n "$remote_main" && "$local_head" == "$remote_main" ]]; then
    echo "ok_fetch"
    return 0
  fi
  if [[ "$gh_ok" == "1" ]]; then
    echo "ok_gh_resume"
    return 0
  fi
  echo "retry"
  return 1
}

# Pick newest Pages run id for a headSha from gh run list JSON (array).
# Prefers sort_by createdAt reverse — cancel-in-progress races need the latest SHA run.
pick_latest_run_id_for_sha() {
  local json="${1:-[]}" sha="${2:?}"
  python3 -c '
import json,sys
sha=sys.argv[1]
try:
  rows=json.loads(sys.argv[2] or "[]")
except Exception:
  rows=[]
hits=[r for r in rows if r.get("headSha")==sha]
hits.sort(key=lambda r: r.get("createdAt") or "", reverse=True)
print(hits[0]["databaseId"] if hits else "")
' "$sha" "$json"
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

if [[ "${PUSH_RESUME_FIXTURE:-}" == "1" ]]; then
  # push ok + fetch fail + gh ok → resume watch (do not treat as total failure).
  out="$(post_push_confirm 'abc1234deadbeef' '' 0 1)" || rc=$?
  rc="${rc:-0}"
  if [[ "$rc" -ne 0 || "$out" != "ok_gh_resume" ]]; then
    echo "FAIL push-resume fixture: expected ok_gh_resume got rc=$rc out=$out" >&2
    exit 1
  fi
  out2="$(post_push_confirm 'abc1234deadbeef' 'abc1234deadbeef' 1 0)" || true
  if [[ "$out2" != "ok_fetch" ]]; then
    echo "FAIL push-resume fixture: expected ok_fetch got $out2" >&2
    exit 1
  fi
  if post_push_confirm 'aaa' 'bbb' 0 0 >/dev/null; then
    echo "FAIL push-resume fixture: fetch+gh both fail must retry" >&2
    exit 1
  fi
  # cancel race: two runs same SHA → newest createdAt wins
  sample='[{"databaseId":1,"headSha":"deadbeef","createdAt":"2026-11-06T01:00:00Z"},{"databaseId":99,"headSha":"deadbeef","createdAt":"2026-11-06T02:00:00Z"},{"databaseId":3,"headSha":"other","createdAt":"2026-11-06T03:00:00Z"}]'
  picked="$(pick_latest_run_id_for_sha "$sample" "deadbeef")"
  if [[ "$picked" != "99" ]]; then
    echo "FAIL pick_latest_run_id_for_sha expected 99 got $picked" >&2
    exit 1
  fi
  echo "ok push-resume fixture (push ok + fetch fail + gh ok) + latest-SHA pick"
  exit 0
fi
