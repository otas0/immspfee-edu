#!/usr/bin/env bash
# Probe whether GitHub-hosted ubuntu-latest has moved toward Ubuntu 26.
# Does not change pages.yml (pinned ubuntu-24.04). Run periodically:
#   bash scripts/pages-ubuntu26-probe.sh
# Dry-run a Pages workflow on a disposable branch when the probe warns:
#   (manual) push a throwaway branch with runs-on: ubuntu-latest and watch Node 24 + deploy-pages.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "### ubuntu-latest → 26 probe"
echo ""
echo "pages.yml pins: ubuntu-24.04 (see AGENTS.md / CONTRIBUTING.md)."
echo "When GitHub’s default image drifts to Ubuntu 26, re-run a green Pages deploy on a dry branch first."
echo ""

# Public Actions runner image announcements are HTML; curl the status/blog lightly.
set +e
hdr="$(mktemp)"
curl -sI --max-time 8 'https://github.com/actions/runner-images' >"$hdr" 2>/dev/null
code=$?
set -e
if (( code != 0 )); then
  echo "skip: runner-images unreachable (curl exit $code)"
  rm -f "$hdr"
  exit 0
fi
status="$(tr -d '\r' <"$hdr" | grep -i '^HTTP/' | head -n 1 || true)"
rm -f "$hdr"
echo "ok probe contact runner-images ($status)"
echo ""
echo "Manual checklist:"
echo "  1. Read https://github.com/actions/runner-images#available-images for ubuntu-26 / ubuntu-latest notes."
echo "  2. If ubuntu-latest ≡ 26 (or 24 is retiring), open a dry branch:"
echo "       - temporarily set jobs.*.runs-on: ubuntu-latest (or ubuntu-26)"
echo "       - push branch; watch Pages workflow Node 24 + deploy-pages@v5"
echo "       - only then consider moving main’s pin."
echo "  3. Keep deploy-pages DEP0040 bump track separate (still v5.0.1 / #433 open as of 2026-11-07 PM)."
echo "  4. Dry branch: temporarily set jobs.*.runs-on: ubuntu-latest (or ubuntu-26), push, watch Node 24 + deploy-pages@v5."
echo ""
note_dir="$ROOT/.local-shots"
mkdir -p "$note_dir"
note="$note_dir/ubuntu26-probe-last.txt"
{
  echo "when: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "pin: ubuntu-24.04"
  echo "deploy-pages: hold v5.0.1 until #433 merges; then scan DEP0040"
  echo "next: dry-branch Pages on ubuntu-latest before moving main"
} >"$note"
echo "wrote $note"
echo "Last probe note: $(date -u +%Y-%m-%dT%H:%M:%SZ) — pin remains ubuntu-24.04 until a dry-branch Pages run is green on 26."
echo "ok pages-ubuntu26-probe (informational; no workflow edit)"
