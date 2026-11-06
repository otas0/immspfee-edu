#!/usr/bin/env bash
# Pure helpers for push-main heartbeat / FAIL marking / post-push resume (no network).
# Sourced by push-main.sh; also runnable as fixtures:
#   HEARTBEAT_FIXTURE=1 bash scripts/push-main-heartbeat.sh
#   PUSH_RESUME_FIXTURE=1 bash scripts/push-main-heartbeat.sh
#     → push ok + fetch fail (+ optional PUSH_FETCH_MOCK) + gh ok → resume watch
#   PUSH_WATCH_FLAKE_FIXTURE=1 bash scripts/push-main-heartbeat.sh
#     → jobs API miss after deploy success → soft exit 0
set -euo pipefail

# Canonical mid-FAIL line (console === summary; waiting-segment diff).
# Cap note is fixed when any capture-named job is already red.
MID_FAIL_CAPTURE_NOTE=' (capture already red while run status may still be waiting/in_progress)'
mid_fail_title_line() {
  echo "mid-FAIL title${MID_FAIL_CAPTURE_NOTE}"
}

JOBS_UNAVAILABLE_LINE='(jobs unavailable)'

# True when a jobs heartbeat line shows deploy already completed/success.
last_good_shows_deploy_success() {
  local line="${1:-}"
  echo "$line" | grep -qiE '(^|[· ])deploy[^=]*=completed/success'
}

# Watch exit from run conclusion + last-good jobs line (API flake ≠ content red).
# Args: concl last_good_jobs_line jobs_flake(0|1)  — jobs_flake is informational;
# empty concl + deploy success in last-good soft-oks even when flake bit is 0
# (conclusion poll empty after a green heartbeat).
# Prints: ok | soft_ok_jobs_flake | fail
# Exit 0 for ok/soft_ok; 1 for fail.
watch_exit_decision() {
  local concl="${1:-}" last_good="${2:-}" _jobs_flake="${3:-0}"
  if [[ "$concl" == "success" ]]; then
    echo "ok"
    return 0
  fi
  # Empty / unknown conclusion: soft-ok if last-good already saw deploy success.
  if [[ -z "$concl" || "$concl" == "unknown" ]]; then
    if last_good_shows_deploy_success "$last_good"; then
      echo "soft_ok_jobs_flake"
      return 0
    fi
    echo "fail"
    return 1
  fi
  # Known non-success conclusions stay hard fail.
  echo "fail"
  return 1
}

# Canonical Watch-ok summary line (must appear in push-main-last-summary.md on soft-ok).
watch_ok_summary_line() {
  local kind="${1:-ok}" short="${2:-SHORT}"
  if [[ "$kind" == "soft_ok_jobs_flake" ]]; then
    echo "Pages ok for ${short} (soft_ok_jobs_flake — API flake ≠ cancel)"
  else
    echo "Pages ok for ${short}"
  fi
}

# True when push stderr is a connection/RPC flake (not a clean Everything up-to-date land).
push_stderr_is_connect_flake() {
  local err="${1:-}"
  echo "$err" | grep -qiE 'empty reply|couldn.t connect|connection timed out|CONNECT tunnel|port 443|Failed to connect|Operation timed out|Recv failure|RPC failed|unexpected disconnect|remote end hung up'
}

# Whether a heartbeat jobs line is a transient API miss (do not wipe last-good).
jobs_line_is_unavailable() {
  local line="${1:-}"
  [[ "$line" == "$JOBS_UNAVAILABLE_LINE" ]] || [[ "$line" == *'(jobs unavailable)'* ]]
}

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

# Post-push git fetch (mockable). Real path: AUTH_URL then origin.
#   PUSH_FETCH_MOCK=fail → return 1 (no network)
#   PUSH_FETCH_MOCK=ok   → return 0 (no network)
attempt_git_fetch() {
  case "${PUSH_FETCH_MOCK:-}" in
    fail) return 1 ;;
    ok) return 0 ;;
  esac
  local auth_url="${1:-}"
  if [[ -n "$auth_url" ]]; then
    git fetch "$auth_url" main:refs/remotes/origin/main 2>/dev/null && return 0
  fi
  git fetch origin 2>/dev/null
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
  # mid-FAIL: console and summary must share one identical string; dedupe once.
  canon="$(mid_fail_title_line)"
  if [[ "$canon" != "mid-FAIL title${MID_FAIL_CAPTURE_NOTE}" ]]; then
    echo "FAIL heartbeat fixture: mid_fail_title_line drift" >&2
    exit 1
  fi
  mid_fail_summary_noted=0
  console_n=0
  summary_n=0
  last_console=""
  last_summary=""
  # Simulate two waiting-segment captures (would spam without flag).
  for _ in 1 2; do
    mid_line="$(mid_fail_title_line)"
    if [[ "$mid_fail_summary_noted" -eq 0 ]]; then
      mid_fail_summary_noted=1
      last_console="$mid_line"
      last_summary="$mid_line"
      console_n=$((console_n + 1))
      summary_n=$((summary_n + 1))
    fi
  done
  if [[ "$console_n" -ne 1 || "$summary_n" -ne 1 || "$last_console" != "$last_summary" || "$last_console" != "$canon" ]]; then
    echo "FAIL heartbeat fixture: mid-FAIL dedupe / console≠summary" >&2
    echo "console_n=$console_n summary_n=$summary_n last_c=$last_console last_s=$last_summary" >&2
    exit 1
  fi
  echo "ok heartbeat FAIL fixture (prefix + jobs_have_fail + mid-FAIL dedupe)"
  exit 0
fi

if [[ "${PUSH_RESUME_FIXTURE:-}" == "1" ]]; then
  # Real git-fetch mock (no network): fail then ok.
  if PUSH_FETCH_MOCK=fail attempt_git_fetch 'https://example.invalid/immspfee-edu.git'; then
    echo "FAIL push-resume fixture: PUSH_FETCH_MOCK=fail must return nonzero" >&2
    exit 1
  fi
  if ! PUSH_FETCH_MOCK=ok attempt_git_fetch 'https://example.invalid/immspfee-edu.git'; then
    echo "FAIL push-resume fixture: PUSH_FETCH_MOCK=ok must return 0" >&2
    exit 1
  fi
  # Wire mock fail → fetch_ok=0 → gh_ok=1 → resume (same path as soft-fetch flake).
  fetch_ok=0
  if ! PUSH_FETCH_MOCK=fail attempt_git_fetch ''; then
    fetch_ok=0
  else
    fetch_ok=1
  fi
  out="$(post_push_confirm 'abc1234deadbeef' '' "$fetch_ok" 1)" || rc=$?
  rc="${rc:-0}"
  if [[ "$rc" -ne 0 || "$out" != "ok_gh_resume" || "$fetch_ok" != "0" ]]; then
    echo "FAIL push-resume fixture: expected ok_gh_resume via fetch mock got rc=$rc out=$out fetch_ok=$fetch_ok" >&2
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
  echo "ok push-resume fixture (push ok + fetch fail + gh ok) + latest-SHA pick + PUSH_FETCH_MOCK"
  exit 0
fi

if [[ "${PUSH_WATCH_FLAKE_FIXTURE:-}" == "1" ]]; then
  last='Optional capture 340px title=completed/success · deploy=completed/success · Redirect retries diag=completed/success'
  # jobs miss / empty concl after success → soft exit 0 (flake bit optional)
  out="$(watch_exit_decision '' "$last" 1)" || rc=$?
  rc="${rc:-0}"
  if [[ "$rc" -ne 0 || "$out" != "soft_ok_jobs_flake" ]]; then
    echo "FAIL watch-flake fixture: expected soft_ok_jobs_flake got rc=$rc out=$out" >&2
    exit 1
  fi
  out0="$(watch_exit_decision '' "$last" 0)" || true
  if [[ "$out0" != "soft_ok_jobs_flake" ]]; then
    echo "FAIL watch-flake fixture: empty concl + last-good must soft-ok without flake bit got $out0" >&2
    exit 1
  fi
  # run conclusion success wins even if jobs flaked
  out2="$(watch_exit_decision 'success' "$JOBS_UNAVAILABLE_LINE" 1)" || true
  if [[ "$out2" != "ok" ]]; then
    echo "FAIL watch-flake fixture: concl success must be ok got $out2" >&2
    exit 1
  fi
  # real failure stays hard
  if watch_exit_decision 'failure' "$last" 0 >/dev/null; then
    echo "FAIL watch-flake fixture: conclusion failure must exit nonzero" >&2
    exit 1
  fi
  # empty concl + flake + no last-good → fail
  if watch_exit_decision '' '' 1 >/dev/null; then
    echo "FAIL watch-flake fixture: empty last-good must not soft-ok" >&2
    exit 1
  fi
  if ! jobs_line_is_unavailable "$JOBS_UNAVAILABLE_LINE"; then
    echo "FAIL watch-flake fixture: jobs_line_is_unavailable" >&2
    exit 1
  fi
  if ! last_good_shows_deploy_success "$last"; then
    echo "FAIL watch-flake fixture: last_good_shows_deploy_success" >&2
    exit 1
  fi
  # Soft-ok summary must carry soft_ok_jobs_flake (simulates push-main-last-summary.md).
  kind="$(watch_exit_decision '' "$last" 1)"
  sum_line="$(watch_ok_summary_line "$kind" 'deadbee')"
  tmp_sum="$(mktemp)"
  {
    echo "# push-main summary"
    echo "## Watch ok"
    echo "$sum_line"
  } >"$tmp_sum"
  if ! grep -q 'soft_ok_jobs_flake' "$tmp_sum"; then
    echo "FAIL watch-flake fixture: summary missing soft_ok_jobs_flake" >&2
    cat "$tmp_sum" >&2
    rm -f "$tmp_sum"
    exit 1
  fi
  rm -f "$tmp_sum"
  if [[ "$sum_line" != *"soft_ok_jobs_flake"* ]]; then
    echo "FAIL watch-flake fixture: watch_ok_summary_line drift: $sum_line" >&2
    exit 1
  fi
  # Everything up-to-date next to RPC noise is a connect flake, not a clean land.
  if ! push_stderr_is_connect_flake $'RPC failed\nEverything up-to-date'; then
    echo "FAIL watch-flake fixture: RPC+up-to-date must count as connect flake" >&2
    exit 1
  fi
  if push_stderr_is_connect_flake 'Everything up-to-date'; then
    echo "FAIL watch-flake fixture: clean Everything up-to-date must not be connect flake" >&2
    exit 1
  fi
  echo "ok push-watch flake fixture (jobs miss after success → soft exit 0)"
  exit 0
fi
