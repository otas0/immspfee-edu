#!/usr/bin/env bash
# Push HEAD to otas0/immspfee-edu main with HTTP/1.1 and backoff.
# Pages uses concurrency cancel-in-progress: wait for the watch step
# before starting another finished-task push, or the prior deploy is cancelled.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

REMOTE_URL="https://github.com/otas0/immspfee-edu.git"
TOKEN="$(gh auth token)"
AUTH_URL="https://x-access-token:${TOKEN}@github.com/otas0/immspfee-edu.git"

attempts=6
delay=5
i=1
while (( i <= attempts )); do
  echo "push attempt $i/$attempts (HTTP/1.1)"
  if git -c http.version=HTTP/1.1 -c http.postBuffer=524288000 push "$AUTH_URL" HEAD:main; then
    git fetch "$AUTH_URL" main:refs/remotes/origin/main 2>/dev/null || git fetch origin
    echo "pushed $(git rev-parse --short HEAD)"
    exit 0
  fi
  echo "push failed; sleeping ${delay}s"
  sleep "$delay"
  delay=$(( delay * 2 ))
  if (( delay > 60 )); then delay=60; fi
  i=$(( i + 1 ))
done

echo "push failed after $attempts attempts" >&2
exit 1
