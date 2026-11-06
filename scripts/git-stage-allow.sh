#!/usr/bin/env bash
# Stage only allowlisted paths (never blind git add -A / --all / .).
# Usage:
#   bash scripts/git-stage-allow.sh path1 path2 ...
#   bash scripts/git-stage-allow.sh --from-list scripts/stage-allow.list
#   bash scripts/git-stage-allow.sh --default
#     → intersect dirty paths with scripts/stage-allow.default.list
# Rejects paths outside the repo and refuses to stage secrets-ish names.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

DEFAULT_LIST="$ROOT/scripts/stage-allow.default.list"

paths=()
mode=""

load_list() {
  local list="$1" line
  while IFS= read -r line || [[ -n "$line" ]]; do
    [[ -z "$line" || "$line" == \#* ]] && continue
    paths+=("$line")
  done < "$list"
}

path_allowed() {
  local p="$1" rule
  for rule in "${allow_rules[@]}"; do
    if [[ "$rule" == */ ]]; then
      [[ "$p" == "$rule"* ]] && return 0
    else
      [[ "$p" == "$rule" || "$p" == "$rule"/* ]] && return 0
    fi
  done
  return 1
}

if [[ "${1:-}" == "--from-list" ]]; then
  list="${2:?--from-list needs a file}"
  load_list "$list"
  shift 2 || true
  paths+=("$@")
elif [[ "${1:-}" == "--default" ]]; then
  mode="default"
  shift || true
  if [[ ! -f "$DEFAULT_LIST" ]]; then
    echo "missing default list: $DEFAULT_LIST" >&2
    exit 1
  fi
  allow_rules=()
  while IFS= read -r line || [[ -n "$line" ]]; do
    [[ -z "$line" || "$line" == \#* ]] && continue
    allow_rules+=("$line")
  done < "$DEFAULT_LIST"
  # Intersect porcelain dirty/untracked with allowlist roots.
  while IFS= read -r entry || [[ -n "$entry" ]]; do
    [[ -z "$entry" ]] && continue
    # porcelain v1: XY PATH or XY ORIG -> PATH
    local_path="${entry:3}"
    if [[ "$local_path" == *" -> "* ]]; then
      local_path="${local_path##* -> }"
    fi
    local_path="${local_path#\"}"
    local_path="${local_path%\"}"
    if path_allowed "$local_path"; then
      paths+=("$local_path")
    else
      echo "skip (outside default allowlist): $local_path" >&2
    fi
  done < <(git status --porcelain)
else
  paths=("$@")
fi

if [[ ${#paths[@]} -eq 0 ]]; then
  echo "usage: $0 path [path ...] | $0 --from-list FILE | $0 --default" >&2
  echo "no paths to stage" >&2
  exit 2
fi

deny_re='(^|/)\.env($|\.)|(^|/)credentials\.json$|(^|/)id_rsa|(^|/)\.npmrc$'
staged=0
seen=$'\n'
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
  case "$seen" in
    *$'\n'"$p"$'\n'*) continue ;;
  esac
  seen="${seen}${p}"$'\n'
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

echo "staged $staged allowlisted path(s)${mode:+ ($mode)}"
git status --short --untracked-files=normal
