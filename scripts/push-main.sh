#!/usr/bin/env bash
# Push HEAD to otas0/immspfee-edu main with HTTP/1.1 and backoff, then wait
# for that SHA's Pages run. One push → one watch. Do not start another
# finished-task push until this script exits; Pages cancel-in-progress
# would otherwise drop the prior deploy.
# Environment waiting timeout: PAGES_WAITING_TIMEOUT=900 (seconds, default).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

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
    git fetch "$AUTH_URL" main:refs/remotes/origin/main 2>/dev/null || git fetch origin
    remote_main="$(git rev-parse origin/main 2>/dev/null || true)"
    local_head="$(git rev-parse HEAD)"
    # "Everything up-to-date" can be a false calm if fetch lagged or refs drifted.
    if [[ -z "$remote_main" || "$local_head" != "$remote_main" ]]; then
      echo "push exited 0 but HEAD ($local_head) != origin/main (${remote_main:-missing})" >&2
      if echo "$err_txt" | grep -qi 'Everything up-to-date'; then
        echo "Ignoring false Everything up-to-date; will retry push." >&2
      fi
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
for _ in $(seq 1 40); do
  RID="$(gh run list --repo "$REPO" --workflow=pages.yml --limit 15 --json databaseId,headSha,status,createdAt \
    --jq "[.[] | select(.headSha==\"$SHA\")] | .[0].databaseId // empty" || true)"
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
    RID="$(gh run list --repo "$REPO" --workflow=pages.yml --limit 20 --json databaseId,headSha,createdAt \
      --jq "[.[] | select(.headSha==\"$HEAD_NOW\")] | sort_by(.createdAt) | reverse | .[0].databaseId // empty" || true)"
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
# Capture job may still be running; print short-SHA artifact deep links early.
RUN_URL="https://github.com/${REPO}/actions/runs/${RID}"
echo "capture artifacts (short SHA $SHORT; upload when capture job finishes):"
echo "  run: $RUN_URL"
echo "  PNG:  capture-340px-zh-long-title-$SHORT  → ${RUN_URL}#artifacts"
echo "  fail: capture-last-fail-$SHORT           → ${RUN_URL}#artifacts"
echo "  redir: redirect-fail-headers-$SHORT      → ${RUN_URL}#artifacts"
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
  if [[ -z "$art_lines" ]]; then
    echo "  (no matching capture/redirect artifacts for run $RID)"
  else
    while IFS=$'\t' read -r name aid url; do
      [[ -z "$name" ]] && continue
      if [[ "$prefer_fail" == "1" ]] && [[ "$name" != capture-last-fail-* && "$name" != redirect-fail-headers-* ]]; then
        continue
      fi
      echo "  $name"
      echo "    browse: https://github.com/${REPO}/actions/runs/${RID}/artifacts/${aid}"
      [[ -n "$url" ]] && echo "    api:    $url"
    done <<< "$art_lines"
  fi
  # When prefer_fail=0, also diagnose missing PNG.
  if [[ "$prefer_fail" != "1" ]]; then
    if ! echo "$art_lines" | grep -q "capture-340px-zh-long-title-${SHORT}"; then
      diagnose_missing_capture_png
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

while true; do
  meta="$(gh run view "$RID" --repo "$REPO" --json status,conclusion,url 2>/dev/null || true)"
  status="$(python3 -c 'import json,sys; print(json.loads(sys.argv[1]).get("status",""))' "$meta" 2>/dev/null || true)"
  url="$(python3 -c 'import json,sys; print(json.loads(sys.argv[1]).get("url",""))' "$meta" 2>/dev/null || true)"
  if [[ "$status" == "waiting" ]]; then
    now="$(date +%s)"
    if (( warned_waiting == 0 )); then
      waiting_since="$now"
      echo ""
      echo "Pages is WAITING on the github-pages environment (approval / protection rule)."
      echo "Open and approve: ${url:-https://github.com/$REPO/actions/runs/$RID}"
      echo "This script will keep waiting until the run leaves 'waiting' (timeout ${WAITING_TIMEOUT}s)."
      echo ""
      warned_waiting=1
    elif (( now - waiting_since >= WAITING_TIMEOUT )); then
      echo "environment waiting timed out after ${WAITING_TIMEOUT}s" >&2
      print_env_protection_summary "$url"
      exit 1
    fi
  fi
  if [[ "$status" == "completed" ]]; then
    break
  fi
  # gh run watch blocks until done once the run is in progress / queued.
  if [[ "$status" == "in_progress" || "$status" == "queued" || "$status" == "requested" || "$status" == "pending" ]]; then
    break
  fi
  sleep 5
done

watch_rc=0
gh run watch "$RID" --repo "$REPO" --exit-status || watch_rc=$?
if (( watch_rc != 0 )); then
  echo "Pages watch failed for $SHORT (exit $watch_rc)" >&2
  echo "still listing fail artifacts if any were uploaded:"
  print_run_artifacts 1
  exit "$watch_rc"
fi
echo "Pages ok for $SHORT"
print_run_artifacts 0
