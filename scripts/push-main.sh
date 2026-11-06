#!/usr/bin/env bash
# Push HEAD to otas0/immspfee-edu main with HTTP/1.1 and backoff, then wait
# for that SHA's Pages run. One push → one watch. Do not start another
# finished-task push until this script exits; Pages cancel-in-progress
# would otherwise drop the prior deploy.
# Environment waiting timeout: PAGES_WAITING_TIMEOUT=900 (seconds, default).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
# shellcheck source=scripts/push-main-heartbeat.sh
source "$ROOT/scripts/push-main-heartbeat.sh"

REPO="otas0/immspfee-edu"
TOKEN="$(gh auth token)"
AUTH_URL="https://x-access-token:${TOKEN}@github.com/${REPO}.git"
SHA="$(git rev-parse HEAD)"
SHORT="$(git rev-parse --short HEAD)"

echo "precheck: gh API → $REPO"
if ! gh api --method GET "/repos/${REPO}" --jq .full_name >/dev/null; then
  echo "gh API unreachable for $REPO before push" >&2
  echo "If you see CONNECT tunnel / proxy / port 443 errors, try:" >&2
  echo "  unset https_proxy http_proxy HTTPS_PROXY HTTP_PROXY ALL_PROXY all_proxy" >&2
  echo "  then: bash scripts/push-main.sh" >&2
  echo "Or use a network path that can reach api.github.com:443." >&2
  exit 1
fi
echo "precheck ok"

attempts=6
delay=5
i=1
pushed=0
cleared_proxy=0
while (( i <= attempts )); do
  echo "push attempt $i/$attempts (HTTP/1.1)"
  err_log="$(mktemp)"
  if git -c http.version=HTTP/1.1 -c http.postBuffer=524288000 push "$AUTH_URL" HEAD:main 2>"$err_log"; then
    cat "$err_log" >&2 || true
    err_txt="$(cat "$err_log" 2>/dev/null || true)"
    rm -f "$err_log"
    local_head="$(git rev-parse HEAD)"
    # Post-push fetch often flakes (Empty reply / 443). Never treat a landed push as failure —
    # soft-fetch, else confirm SHA via gh API and continue watch with that SHA.
    fetch_ok=0
    if attempt_git_fetch "$AUTH_URL"; then
      fetch_ok=1
    else
      echo "post-push fetch timed out/failed; confirming SHA via gh API (resume watch)" >&2
    fi
    remote_main="$(git rev-parse origin/main 2>/dev/null || true)"
    gh_ok=0
    if gh api "repos/${REPO}/commits/${local_head}" --jq .sha >/dev/null 2>&1 \
      || gh api "repos/${REPO}/git/ref/heads/main" --jq .object.sha 2>/dev/null | grep -qx "$local_head"; then
      gh_ok=1
    fi
    confirm_out="$(post_push_confirm "$local_head" "$remote_main" "$fetch_ok" "$gh_ok" || true)"
    if [[ "$confirm_out" == "ok_fetch" ]]; then
      :
    elif [[ "$confirm_out" == "ok_gh_resume" ]]; then
      echo "gh confirms $local_head on remote; continuing watch without local origin/main update"
      git update-ref refs/remotes/origin/main "$local_head" 2>/dev/null || true
    elif echo "$err_txt" | grep -qi 'Everything up-to-date'; then
      echo "Ignoring false Everything up-to-date; will retry push." >&2
      i=$(( i + 1 ))
      sleep "$delay"
      delay=$(( delay * 2 ))
      if (( delay > 60 )); then delay=60; fi
      continue
    else
      echo "push exited 0 but cannot confirm HEAD ($local_head) on origin/main (${remote_main:-missing})" >&2
      i=$(( i + 1 ))
      sleep "$delay"
      delay=$(( delay * 2 ))
      if (( delay > 60 )); then delay=60; fi
      continue
    fi
    SHA="$local_head"
    SHORT="$(git rev-parse --short HEAD)"
    echo "pushed $SHORT"
    pushed=1
    break
  fi
  cat "$err_log" >&2 || true
  err_txt="$(cat "$err_log" 2>/dev/null || true)"
  rm -f "$err_log"
  # Empty reply / CONNECT / port 443: drop proxy once and retry immediately (no backoff).
  if (( cleared_proxy == 0 )) && echo "$err_txt" | grep -qiE 'empty reply|couldn.t connect|connection timed out|CONNECT tunnel|port 443|Failed to connect'; then
    echo "clearing proxy env (https_proxy/http_proxy/ALL_PROXY); immediate retry"
    unset https_proxy http_proxy HTTPS_PROXY HTTP_PROXY ALL_PROXY all_proxy || true
    cleared_proxy=1
    i=$(( i + 1 ))
    continue
  fi
  echo "push failed; sleeping ${delay}s"
  sleep "$delay"
  delay=$(( delay * 2 ))
  if (( delay > 60 )); then delay=60; fi
  i=$(( i + 1 ))
done

if (( pushed == 0 )); then
  echo "push failed after $attempts attempts" >&2
  if (( cleared_proxy )); then
    echo "proxy was cleared once; remaining env:" >&2
    for v in https_proxy http_proxy HTTPS_PROXY HTTP_PROXY ALL_PROXY all_proxy; do
      if [[ -n "${!v+x}" ]]; then
        # Set (possibly to empty string) vs truly unset.
        # printf %q is portable on bash 3.2 (macOS); ${var@Q} needs bash 4.4+.
        echo "  $v is set (value=$(printf %q "${!v}"))" >&2
      else
        echo "  $v is unset" >&2
      fi
    done
  fi
  echo "If you see CONNECT tunnel / proxy / port 443 errors, try:" >&2
  echo "  unset https_proxy http_proxy HTTPS_PROXY HTTP_PROXY ALL_PROXY all_proxy" >&2
  echo "  then: bash scripts/push-main.sh" >&2
  echo "Or use a network path that can reach github.com:443." >&2
  exit 1
fi

echo "waiting for Pages run on $SHORT"
RID=""
# Prefer newest run for this SHA (cancel-in-progress can leave older cancelled + newer queued).
for _ in $(seq 1 40); do
  runs_json="$(gh run list --repo "$REPO" --workflow=pages.yml --limit 20 --json databaseId,headSha,status,createdAt 2>/dev/null || echo '[]')"
  RID="$(pick_latest_run_id_for_sha "$runs_json" "$SHA")"
  if [[ -n "$RID" ]]; then
    break
  fi
  sleep 3
done

# Push succeeded but the SHA run never listed (cancel-in-progress race / API lag):
# watch the newest run whose headSha equals current HEAD.
if [[ -z "$RID" ]]; then
  HEAD_NOW="$(git rev-parse HEAD)"
  SHORT="$(git rev-parse --short HEAD)"
  echo "no Pages run listed for $SHA yet; fallback watch latest headSha==HEAD ($SHORT)"
  for _ in $(seq 1 20); do
    runs_json="$(gh run list --repo "$REPO" --workflow=pages.yml --limit 20 --json databaseId,headSha,createdAt 2>/dev/null || echo '[]')"
    RID="$(pick_latest_run_id_for_sha "$runs_json" "$HEAD_NOW")"
    if [[ -n "$RID" ]]; then
      SHA="$HEAD_NOW"
      break
    fi
    sleep 3
  done
fi

if [[ -z "$RID" ]]; then
  echo "no Pages run found for HEAD $(git rev-parse HEAD)" >&2
  exit 1
fi

echo "watching Pages run $RID"
SUMMARY_MD="${ROOT}/.local-shots/push-main-last-summary.md"
ISSUE_TITLE="[pages] push-main ${SHORT} — run ${RID}"
mkdir -p "${ROOT}/.local-shots"
{
  echo "# push-main summary"
  echo ""
  echo "> **Copy to issue title:** \`$ISSUE_TITLE\`"
  echo ">"
  echo "> Paste this whole file into the issue body."
  echo ""
  echo "- short SHA: \`$SHORT\`"
  echo "- full SHA: \`$SHA\`"
  echo "- run: $RID"
  echo "- run URL: https://github.com/${REPO}/actions/runs/${RID}"
  echo ""
  echo "## Heartbeats"
  echo ""
  echo "<!-- HEARTBEATS_END -->"
  echo ""
} > "$SUMMARY_MD"
summary_append() {
  {
    echo ""
    echo "## $1"
    echo ""
    shift
    printf '%s\n' "$@"
  } >> "$SUMMARY_MD"
}
summary_heartbeat() {
  local ts line tmp row fail_n
  ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  line="$(gh api "repos/${REPO}/actions/runs/${RID}/jobs" --jq '
    [.jobs[] | "\(.name)=\(.status)/\(.conclusion // "-")"] | join(" · ")
  ' 2>/dev/null || echo "(jobs unavailable)")"
  fail_n="$(gh api "repos/${REPO}/actions/runs/${RID}/jobs" --jq '
    [.jobs[] | select(.conclusion == "failure" or .conclusion == "cancelled" or .conclusion == "timed_out")]
    | length
  ' 2>/dev/null || echo 0)"
  row="$(heartbeat_format_row "$ts" "$line" "$fail_n")"
  echo "heartbeat ${row#- }"
  # Insert inside ## Heartbeats (before marker), not after later summary sections.
  tmp="$(mktemp)"
  awk -v row="$row" '
    /<!-- HEARTBEATS_END -->/ { print row; print; next }
    { print }
  ' "$SUMMARY_MD" > "$tmp" && mv "$tmp" "$SUMMARY_MD"
}
set_issue_title() {
  local concl="${1:-}" h1
  # conclusion=failure → FAIL prefix on issue-title template (also cancelled/timed_out).
  if [[ "$concl" == "failure" || "$concl" == "cancelled" || "$concl" == "timed_out" ]]; then
    ISSUE_TITLE="FAIL [pages] push-main ${SHORT} — run ${RID}"
    h1="# FAIL push-main summary"
  else
    ISSUE_TITLE="[pages] push-main ${SHORT} — run ${RID}"
    h1="# push-main summary"
  fi
  # Refresh H1 + copy-to-issue line at the top of the summary.
  if [[ -f "$SUMMARY_MD" ]]; then
    local tmp
    tmp="$(mktemp)"
    awk -v t="$ISSUE_TITLE" -v h="$h1" '
      /^# (FAIL )?push-main summary$/ { print h; next }
      /^\> \*\*Copy to issue title:\*\*/ {
        print "> **Copy to issue title:** `" t "`"
        next
      }
      { print }
    ' "$SUMMARY_MD" > "$tmp" && mv "$tmp" "$SUMMARY_MD"
  fi
  echo "issue title: $ISSUE_TITLE"
}
echo "local summary: $SUMMARY_MD (paste into issues)"
echo "issue title: $ISSUE_TITLE"
# Capture job may still be running; print short-SHA artifact deep links early.
RUN_URL="https://github.com/${REPO}/actions/runs/${RID}"
echo "capture artifacts (short SHA $SHORT; upload when capture job finishes):"
echo "  run: $RUN_URL"
echo "  PNG:  capture-340px-zh-long-title-$SHORT  → ${RUN_URL}#artifacts"
echo "  fail: capture-last-fail-$SHORT           → ${RUN_URL}#artifacts"
echo "  redir: redirect-fail-headers-$SHORT      → ${RUN_URL}#artifacts"
summary_append "Expected artifacts" \
  "- PNG: \`capture-340px-zh-long-title-$SHORT\`" \
  "- fail: \`capture-last-fail-$SHORT\`" \
  "- redir: \`redirect-fail-headers-$SHORT\`" \
  "- run: $RUN_URL"
warned_waiting=0
waiting_since=0
# Seconds to stay in environment "waiting" before printing reviewers and exiting.
WAITING_TIMEOUT="${PAGES_WAITING_TIMEOUT:-900}"
print_env_protection_summary() {
  echo ""
  echo "=== github-pages environment protection summary ==="
  gh api "/repos/${REPO}/environments/github-pages" --jq '
    "name: \(.name // "github-pages")",
    "wait_timer: \(.wait_timer // 0)s",
    (.protection_rules // [] | .[] |
      if .type == "required_reviewers" then
        "required_reviewers: " + (([.reviewers[]? | (.reviewer.login // .reviewer.slug // .reviewer.name // "?")] | join(", ")) // "(none listed)")
      elif .type == "wait_timer" then
        "wait_timer_rule: \(.wait_timer // 0)s"
      elif .type == "branch_policy" then
        "branch_policy: present"
      else
        "rule: \(.type // "unknown")"
      end
    ),
    (if (.deployment_branch_policy.protected_branches == true) then "deployment_branch_policy: protected_branches" else empty end),
    (if (.deployment_branch_policy.custom_branch_policies == true) then "deployment_branch_policy: custom" else empty end)
  ' 2>/dev/null || echo "(could not fetch /repos/${REPO}/environments/github-pages — check gh auth scope)"
  echo "Approve: https://github.com/${REPO}/settings/environments"
  echo "Run: ${1:-https://github.com/$REPO/actions/runs/$RID}"
  echo "==================================================="
  echo ""
}

print_run_artifacts() {
  local prefer_fail="${1:-0}"
  echo "artifact download URLs (short SHA $SHORT):"
  local art_lines
  art_lines="$(gh api "repos/${REPO}/actions/runs/${RID}/artifacts" --paginate \
    --jq '.artifacts[] | select(.name | test("^(capture-340px-zh-long-title-|capture-last-fail-|redirect-fail-headers-)")) | "\(.name)\t\(.id)\t\(.archive_download_url)"' 2>/dev/null || true)"
  local listed=""
  if [[ -z "$art_lines" ]]; then
    echo "  (no matching capture/redirect artifacts for run $RID)"
    listed="(none)"
  else
    while IFS=$'\t' read -r name aid url; do
      [[ -z "$name" ]] && continue
      if [[ "$prefer_fail" == "1" ]] && [[ "$name" != capture-last-fail-* && "$name" != redirect-fail-headers-* ]]; then
        continue
      fi
      echo "  $name"
      echo "    browse: https://github.com/${REPO}/actions/runs/${RID}/artifacts/${aid}"
      [[ -n "$url" ]] && echo "    api:    $url"
      listed="${listed}- ${name}"$'\n'"  browse: https://github.com/${REPO}/actions/runs/${RID}/artifacts/${aid}"$'\n'
    done <<< "$art_lines"
  fi
  if [[ -n "${SUMMARY_MD:-}" ]]; then
    if [[ "$prefer_fail" == "1" ]]; then
      summary_append "Fail artifacts (watch failed)" "${listed:-(none)}"
    fi
  fi
  # When prefer_fail=0, also diagnose missing PNG.
  if [[ "$prefer_fail" != "1" ]]; then
    if ! echo "$art_lines" | grep -q "capture-340px-zh-long-title-${SHORT}"; then
      diagnose_missing_capture_png | tee /tmp/push-main-diag.txt
      if [[ -n "${SUMMARY_MD:-}" && -f /tmp/push-main-diag.txt ]]; then
        summary_append "Missing PNG diagnosis" "$(cat /tmp/push-main-diag.txt)"
      fi
    else
      if [[ -n "${SUMMARY_MD:-}" ]]; then
        summary_append "Artifacts" "$(echo "$art_lines" | awk -F'\t' '{print "- "$1}')"
      fi
    fi
  fi
}

diagnose_missing_capture_png() {
  echo "PNG artifact capture-340px-zh-long-title-$SHORT missing — diagnosing:"
  local jobs_json step_info
  jobs_json="$(gh api "repos/${REPO}/actions/runs/${RID}/jobs" 2>/dev/null || true)"
  if [[ -z "$jobs_json" ]]; then
    echo "  (could not fetch jobs for run $RID)"
    return
  fi
  step_info="$(printf '%s' "$jobs_json" | python3 -c '
import json, sys
data = json.load(sys.stdin)
jobs = data.get("jobs") or []
cap = None
for j in jobs:
    n = (j.get("name") or "")
    if "capture" in n.lower() or "340" in n.lower():
        cap = j
        break
if not cap:
    print("no-capture-job")
    sys.exit(0)
concl = cap.get("conclusion") or ""
status = cap.get("status") or ""
steps = { (s.get("name") or ""): (s.get("conclusion") or s.get("status") or "") for s in (cap.get("steps") or []) }
def find(substr):
    for k, v in steps.items():
        if substr.lower() in k.lower():
            return v or "missing"
    return "missing"
pw_c = find("Install Playwright")
ff_c = find("Force-fail")
cap_c = find("Run capture")
up_c = find("Upload 340px")
print("job:%s:%s" % (status, concl))
print("pw:%s" % pw_c)
print("force_fail:%s" % ff_c)
print("capture:%s" % cap_c)
print("upload:%s" % up_c)
' 2>/dev/null || echo "parse-failed")"
  case "$step_info" in
    no-capture-job)
      echo "  capture job skipped or not scheduled for this run"
      ;;
    parse-failed)
      echo "  (could not parse capture job steps)"
      ;;
    *)
      job_line="$(echo "$step_info" | head -n 1)"
      pw_c="$(echo "$step_info" | sed -n 's/^pw://p')"
      ff_c="$(echo "$step_info" | sed -n 's/^force_fail://p')"
      cap_c="$(echo "$step_info" | sed -n 's/^capture://p')"
      up_c="$(echo "$step_info" | sed -n 's/^upload://p')"
      echo "  capture job: $job_line"
      echo "  steps: pw=$pw_c force_fail=$ff_c capture=$cap_c upload=$up_c"
      if [[ "$pw_c" == "skipped" || "$pw_c" == "missing" ]] \
        || [[ "$cap_c" == "skipped" || "$cap_c" == "missing" ]] \
        || [[ "$ff_c" == "skipped" && "$cap_c" == "skipped" ]]; then
        echo "  → job skipped path (Playwright unavailable or capture steps skipped)"
      elif [[ "$cap_c" == "failure" || "$cap_c" == "cancelled" ]]; then
        echo "  → capture step failed — check capture-last-fail-$SHORT if uploaded"
      elif [[ "$up_c" == "failure" ]]; then
        echo "  → PNG upload failed"
      elif [[ "$cap_c" == "success" || "$up_c" == "success" || "$up_c" == "skipped" ]]; then
        echo "  → upload miss (capture ran but PNG artifact not present — file missing or if-no-files-found)"
      else
        echo "  → unclear; inspect $RUN_URL"
      fi
      ;;
  esac
}

# Mid-run (incl. env waiting): if any job already failed (e.g. capture red while deploy waits), flip ISSUE_TITLE.
# Dedupe: console + summary share one identical string; noted at most once per watch.
mid_fail_summary_noted=0
maybe_mid_fail_title() {
  local mid cap_note="" run_status="${1:-}" mid_line=""
  mid="$(gh api "repos/${REPO}/actions/runs/${RID}/jobs" --jq '
    [.jobs[] | select(.conclusion == "failure" or .conclusion == "cancelled" or .conclusion == "timed_out")]
    | length
  ' 2>/dev/null || echo 0)"
  if heartbeat_jobs_have_fail "$mid"; then
    set_issue_title failure
    cap_hit="$(gh api "repos/${REPO}/actions/runs/${RID}/jobs" --jq '
      [.jobs[] | select((.name | test("capture"; "i")) and .conclusion == "failure") | .name]
      | length
    ' 2>/dev/null || echo 0)"
    if [[ "$cap_hit" =~ ^[1-9][0-9]*$ ]]; then
      # Canonical string from heartbeat lib (console === summary).
      mid_line="$(mid_fail_title_line)"
      if [[ "$mid_fail_summary_noted" -eq 0 ]]; then
        mid_fail_summary_noted=1
        echo "$mid_line"
        if [[ "$run_status" == "waiting" && -n "${SUMMARY_MD:-}" ]]; then
          summary_append "Mid-FAIL (waiting)" \
            "$mid_line" \
            "Run was still \`waiting\` on github-pages while capture (or another job) already failed."
        elif [[ -n "${SUMMARY_MD:-}" ]]; then
          summary_append "Mid-FAIL" "$mid_line"
        fi
      fi
    fi
  fi
}

# Poll until the run leaves "waiting" (env approval), appending heartbeats.
while true; do
  meta="$(gh run view "$RID" --repo "$REPO" --json status,conclusion,url 2>/dev/null || true)"
  status="$(python3 -c 'import json,sys; print(json.loads(sys.argv[1]).get("status",""))' "$meta" 2>/dev/null || true)"
  url="$(python3 -c 'import json,sys; print(json.loads(sys.argv[1]).get("url",""))' "$meta" 2>/dev/null || true)"
  # Title first so Heartbeats FAIL mark and ISSUE_TITLE stay aligned during waiting.
  maybe_mid_fail_title "$status"
  summary_heartbeat
  if [[ "$status" == "waiting" ]]; then
    now="$(date +%s)"
    if (( warned_waiting == 0 )); then
      waiting_since="$now"
      echo ""
      echo "Pages is WAITING on the github-pages environment (approval / protection rule)."
      echo "Open and approve: ${url:-https://github.com/$REPO/actions/runs/$RID}"
      echo "This script will keep waiting until the run leaves 'waiting' (timeout ${WAITING_TIMEOUT}s)."
      echo "Sibling jobs (e.g. capture) can still finish red — mid-FAIL title + Heartbeats **FAIL** apply during waiting."
      echo ""
      warned_waiting=1
    elif (( now - waiting_since >= WAITING_TIMEOUT )); then
      echo "environment waiting timed out after ${WAITING_TIMEOUT}s" >&2
      print_env_protection_summary "$url"
      exit 1
    fi
    sleep 5
    continue
  fi
  if [[ "$status" == "completed" ]]; then
    break
  fi
  # in_progress / queued: keep polling with heartbeats (replaces blocking gh run watch).
  if [[ "$status" == "in_progress" || "$status" == "queued" || "$status" == "requested" || "$status" == "pending" ]]; then
    sleep 8
    continue
  fi
  sleep 5
done

# Final heartbeat + exit status from conclusion (no separate gh run watch).
summary_heartbeat
watch_rc=0
concl="$(gh run view "$RID" --repo "$REPO" --json conclusion --jq '.conclusion // empty' 2>/dev/null || true)"
set_issue_title "$concl"
if [[ "$concl" != "success" ]]; then
  watch_rc=1
fi
print_deploy_conclusion() {
  local line
  line="$(gh api "repos/${REPO}/actions/runs/${RID}/jobs" --jq '
    [.jobs[] | select((.name | ascii_downcase | contains("deploy")) or (.name == "deploy"))]
    | .[0]
    | if . == null then "deploy job: (not found)"
      else "deploy job: \(.name) status=\(.status) conclusion=\(.conclusion // "-")"
      end
  ' 2>/dev/null || echo "deploy job: (could not fetch)")"
  echo "$line"
  if [[ -n "${SUMMARY_MD:-}" ]]; then
    summary_append "Deploy job" "$line"
  fi
}

if (( watch_rc != 0 )); then
  echo "Pages watch failed for $SHORT (exit $watch_rc)" >&2
  echo "still listing fail artifacts if any were uploaded:"
  print_run_artifacts 1
  print_deploy_conclusion
  if [[ -n "${SUMMARY_MD:-}" ]]; then
    summary_append "Watch failed" "exit $watch_rc" "Paste this file into the issue: \`$SUMMARY_MD\`"
    echo "summary written: $SUMMARY_MD" >&2
  fi
  exit "$watch_rc"
fi
echo "Pages ok for $SHORT"
print_run_artifacts 0
print_deploy_conclusion
if [[ -n "${SUMMARY_MD:-}" ]]; then
  summary_append "Watch ok" "Pages ok for $SHORT"
  echo "summary written: $SUMMARY_MD"
fi
