#!/usr/bin/env bash
# Stage only allowlisted paths (never blind `git add -A`).
# Usage:
#   bash scripts/git-stage-allow.sh path1 path2 ...
#   bash scripts/git-stage-allow.sh --from-list scripts/stage-allow.list
# Rejects paths outside the repo and refuses to stage secrets-ish names.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

paths=()
if [[ "${1:-}" == "--from-list" ]]; then
  list="${2:?--from-list needs a file}"
  while IFS= read -r line || [[ -n "$line" ]]; do
    [[ -z "$line" || "$line" == \#* ]] && continue
    paths+=("$line")
  done < "$list"
  shift 2 || true
  paths+=("$@")
else
  paths=("$@")
fi

if [[ ${#paths[@]} -eq 0 ]]; then
  echo "usage: $0 path [path ...] | $0 --from-list FILE [extra paths...]" >&2
  exit 2
fi

deny_re='(^|/)\.env($|\.)|(^|/)credentials\.json$|(^|/)id_rsa|(^|/)\.npmrc$'
staged=0
for p in "${paths[@]}"; do
  # Normalize; reject absolute escapes and .. components.
  case "$p" in
    /*|*".."*)
      echo "refuse path outside allowlist norms: $p" >&2
      exit 1
      ;;
  esac
  if [[ "$p" =~ $deny_re ]]; then
    echo "refuse secret-like path: $p" >&2
    exit 1
  fi
  if [[ ! -e "$p" && ! -d "$p" ]]; then
    # Allow staging deletions of tracked files.
    if ! git ls-files --error-unmatch -- "$p" >/dev/null 2>&1; then
      echo "skip missing untracked path: $p" >&2
      continue
    fi
  fi
  git add -- "$p"
  staged=$((staged + 1))
done

echo "staged $staged allowlisted path(s)"
git status --short --untracked-files=normal
