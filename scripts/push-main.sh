#!/usr/bin/env bash
# Push HEAD to otas0/immspfee-edu main with HTTP/1.1 and backoff, then wait
# for that SHA's Pages run. One push → one watch. Do not start another
# finished-task push until this script exits; Pages cancel-in-progress
# would otherwise drop the prior deploy.
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
warned_waiting=0
while true; do
  meta="$(gh run view "$RID" --repo "$REPO" --json status,conclusion,url 2>/dev/null || true)"
  status="$(python3 -c 'import json,sys; print(json.loads(sys.argv[1]).get("status",""))' "$meta" 2>/dev/null || true)"
  url="$(python3 -c 'import json,sys; print(json.loads(sys.argv[1]).get("url",""))' "$meta" 2>/dev/null || true)"
  if [[ "$status" == "waiting" && "$warned_waiting" -eq 0 ]]; then
    echo ""
    echo "Pages is WAITING on the github-pages environment (approval / protection rule)."
    echo "Open and approve: ${url:-https://github.com/$REPO/actions/runs/$RID}"
    echo "This script will keep waiting until the run leaves 'waiting'."
    echo ""
    warned_waiting=1
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

gh run watch "$RID" --repo "$REPO" --exit-status
echo "Pages ok for $SHORT"
