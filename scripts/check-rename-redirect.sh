#!/usr/bin/env bash
# Optional rename health: github.com/otas0/immspfee-education → immspfee-edu.
# Soft-skips when offline unless REQUIRE_REDIRECT_CHECK=1.
set -euo pipefail

OLD_URL="${RENAME_CHECK_URL:-https://github.com/otas0/immspfee-education}"
EXPECT="${RENAME_EXPECT_HOST_PATH:-otas0/immspfee-edu}"

hdr="$(mktemp)"
cleanup() { rm -f "$hdr"; }
trap cleanup EXIT

append_fail_summary() {
  local why="$1"
  [[ -n "${GITHUB_STEP_SUMMARY:-}" ]] || return 0
  {
    echo "### Rename redirect failed"
    echo ""
    echo "- Check: \`$OLD_URL\` → expect host path containing \`$EXPECT\`"
    echo "- Why: $why"
    echo "- HTTP: \`${status:-unknown}\`"
    echo "- Location: \`${loc:-empty}\`"
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
echo "ok rename redirect $OLD_URL → $loc"
