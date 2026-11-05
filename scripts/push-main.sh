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

attempts=6
delay=5
i=1
pushed=0
while (( i <= attempts )); do
  echo "push attempt $i/$attempts (HTTP/1.1)"
  if git -c http.version=HTTP/1.1 -c http.postBuffer=524288000 push "$AUTH_URL" HEAD:main; then
    git fetch "$AUTH_URL" main:refs/remotes/origin/main 2>/dev/null || git fetch origin
    echo "pushed $SHORT"
    pushed=1
    break
  fi
  echo "push failed; sleeping ${delay}s"
  sleep "$delay"
  delay=$(( delay * 2 ))
  if (( delay > 60 )); then delay=60; fi
  i=$(( i + 1 ))
done

if (( pushed == 0 )); then
  echo "push failed after $attempts attempts" >&2
  exit 1
fi

echo "waiting for Pages run on $SHORT"
RID=""
for _ in $(seq 1 40); do
  RID="$(gh run list --repo "$REPO" --workflow=pages.yml --limit 5 --json databaseId,headSha,status \
    --jq ".[] | select(.headSha==\"$SHA\") | .databaseId" | head -n 1 || true)"
  if [[ -n "$RID" ]]; then
    break
  fi
  sleep 3
done

if [[ -z "$RID" ]]; then
  echo "no Pages run found for $SHA" >&2
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
