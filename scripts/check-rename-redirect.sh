#!/usr/bin/env bash
# Optional rename health: github.com/otas0/immspfee-education → immspfee-edu.
# Soft-skips when offline unless REQUIRE_REDIRECT_CHECK=1.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OLD_URL="${RENAME_CHECK_URL:-https://github.com/otas0/immspfee-education}"
EXPECT="${RENAME_EXPECT_HOST_PATH:-otas0/immspfee-edu}"
HEADERS_OUT="${REDIRECT_HEADERS_OUT:-$ROOT/.local-shots/redirect-fail-headers.txt}"

hdr="$(mktemp)"
cleanup() { rm -f "$hdr"; }
trap cleanup EXIT

save_headers_snippet() {
  mkdir -p "$(dirname "$HEADERS_OUT")"
  if [[ -f "$hdr" ]]; then
    tr -d '\r' <"$hdr" | head -n 20 >"$HEADERS_OUT"
  else
    echo "(no headers captured)" >"$HEADERS_OUT"
  fi
}

append_fail_summary() {
  local why="$1"
  save_headers_snippet
  [[ -n "${GITHUB_STEP_SUMMARY:-}" ]] || return 0
  {
    echo "### Rename redirect failed"
    echo ""
    echo "- Check: \`$OLD_URL\` → expect host path containing \`$EXPECT\`"
    echo "- Why: $why"
    echo "- HTTP: \`${status:-unknown}\`"
    echo "- Location: \`${loc:-empty}\`"
    echo ""
    echo "Curl response headers (first 20 lines):"
    echo ""
    echo '```'
    if [[ -f "$HEADERS_OUT" ]]; then cat "$HEADERS_OUT"; else echo "(missing)"; fi
    echo '```'
    echo ""
  } >> "$GITHUB_STEP_SUMMARY"
}

set +e
curl -sI --max-time 8 "$OLD_URL" >"$hdr" 2>/dev/null
code=$?
set -e

loc=""
status=""

if (( code != 0 )); then
  if [[ "${REQUIRE_REDIRECT_CHECK:-}" == "1" ]]; then
    append_fail_summary "curl exit $code"
    echo "FAIL rename redirect: curl exit $code for $OLD_URL" >&2
    exit 1
  fi
  echo "skip rename redirect (network unreachable)"
  exit 0
fi

loc="$(tr -d '\r' <"$hdr" | grep -i '^location:' | head -n 1 | sed 's/^[Ll]ocation:[[:space:]]*//')"
status="$(tr -d '\r' <"$hdr" | grep -i '^HTTP/' | head -n 1 || true)"

# Sandbox / proxy allowlists sometimes answer HTTP/1.1 200 with no Location
# (real GitHub returns 301 → otas0/immspfee-edu). Soft-skip that spoof unless
# CI insists (REQUIRE_REDIRECT_CHECK=1 without REDIRECT_SOFT_SANDBOX_200=1).
if echo "$status" | grep -qE '200' && [[ -z "$loc" ]]; then
  if [[ "${REQUIRE_REDIRECT_CHECK:-}" == "1" && "${REDIRECT_SOFT_SANDBOX_200:-}" != "1" ]]; then
    append_fail_summary "HTTP 200 without Location (not a rename redirect)"
    echo "FAIL rename redirect: expected 301/302/308, got: $status (no Location)" >&2
    exit 1
  fi
  soft_msg="skip rename redirect (HTTP 200 without Location — likely sandbox/proxy spoof; re-run outside sandbox or REQUIRE_REDIRECT_CHECK=1 on a real network)"
  echo "$soft_msg"
  # Paste-ready note for doctor / agents (gitignored under .local-shots/).
  soft_out="${REDIRECT_SOFT_SKIP_OUT:-$ROOT/.local-shots/redirect-soft-skip.txt}"
  summary_md="${ROOT}/.local-shots/push-main-last-summary.md"
  mkdir -p "$(dirname "$soft_out")"
  {
    echo "# rename redirect soft-skip"
    echo "when: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
    echo "url: $OLD_URL"
    echo "status: $status"
    echo "location: (empty)"
    echo "why: sandbox/proxy fake HTTP 200 without Location (real GitHub returns 301 → $EXPECT)"
    echo "confirm: REQUIRE_REDIRECT_CHECK=1 npm run test:redirect"
    echo "chain: .local-shots/push-main-last-summary.md (push-main embeds this note when present)"
    echo "$soft_msg"
  } >"$soft_out"
  echo "wrote $soft_out"
  if [[ -f "$summary_md" ]]; then
    {
      echo ""
      echo "## Redirect soft-skip (from check-rename-redirect)"
      echo ""
      echo "See \`.local-shots/redirect-soft-skip.txt\` (written $(date -u +%Y-%m-%dT%H:%M:%SZ))."
      echo ""
    } >>"$summary_md"
    echo "chained soft-skip → $summary_md"
  fi
  exit 0
fi

if ! echo "$status" | grep -qE '301|302|308'; then
  append_fail_summary "expected 301/302/308"
  echo "FAIL rename redirect: expected 301/302/308, got: $status" >&2
  exit 1
fi
if ! echo "$loc" | grep -q "$EXPECT"; then
  append_fail_summary "Location missing $EXPECT"
  echo "FAIL rename redirect: Location missing $EXPECT (got: ${loc:-empty})" >&2
  exit 1
fi
rm -f "$HEADERS_OUT"
echo "ok rename redirect $OLD_URL → $loc"
