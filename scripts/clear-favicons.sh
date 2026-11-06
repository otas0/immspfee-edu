#!/usr/bin/env bash
# Purge local Safari/Chrome favicon rows for otas0.github.io/immspfee-edu.
# Must run in Terminal.app (or iTerm) with Full Disk Access — Cursor cannot write these paths.
set -euo pipefail

echo "== Quit Safari / Chrome =="
osascript -e 'tell application "Safari" to quit' >/dev/null 2>&1 || true
osascript -e 'tell application "Google Chrome" to quit' >/dev/null 2>&1 || true
sleep 2

echo "== Safari favicon + touch-icon caches =="
rm -rf \
  "${HOME}/Library/Safari/Favicon Cache" \
  "${HOME}/Library/Safari/Touch Icons Cache" \
  "${HOME}/Library/Caches/com.apple.Safari/Favicon Cache" \
  "${HOME}/Library/Caches/com.apple.Safari/WebKitCache" \
  2>/dev/null || true
mkdir -p \
  "${HOME}/Library/Safari/Favicon Cache" \
  "${HOME}/Library/Safari/Touch Icons Cache"

# Safari 17+ may keep WebsiteIcons under Containers
find "${HOME}/Library/Containers/com.apple.Safari" \
  \( -iname '*Favicon*' -o -iname '*TouchIcon*' -o -iname '*WebsiteIcon*' \) \
  2>/dev/null | while read -r p; do
  echo "rm $p"
  rm -rf "$p" 2>/dev/null || true
done

purge_chrome_db() {
  local DB="$1"
  [[ -f "$DB" ]] || return 0
  echo "purge $DB"
  sqlite3 "$DB" <<'SQL'
DELETE FROM icon_mapping
 WHERE page_url LIKE '%otas0.github.io%'
    OR page_url LIKE '%immspfee%';
DELETE FROM favicon_bitmaps
 WHERE icon_id IN (
   SELECT id FROM favicons
    WHERE url LIKE '%otas0%'
       OR url LIKE '%immspfee%'
       OR url LIKE '%blank-tab%'
       OR url LIKE '%edu-mono%'
       OR url LIKE '%favicon.ico%'
 );
DELETE FROM favicons
 WHERE url LIKE '%otas0%'
    OR url LIKE '%immspfee%'
    OR url LIKE '%blank-tab%'
    OR url LIKE '%edu-mono%'
    OR url LIKE '%favicon.ico%';
SQL
}

echo "== Chrome / Chromium Favicons DBs =="
purge_chrome_db "${HOME}/Library/Application Support/Google/Chrome/Default/Favicons"
purge_chrome_db "${HOME}/Library/Application Support/Codex/Default/Favicons"
purge_chrome_db "${HOME}/Library/Application Support/Codex/codex-browser-app/Favicons"
find "${HOME}/Library/Application Support/Cursor" -name Favicons 2>/dev/null | while read -r DB; do
  purge_chrome_db "$DB" || true
done

echo ""
echo "DONE. Re-open Safari to https://otas0.github.io/immspfee-edu/"
echo "If the old mark remains: Safari → Settings → Privacy → Manage Website Data → search otas0 → Remove."
