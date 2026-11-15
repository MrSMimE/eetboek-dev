#!/usr/bin/env bash
# Klikbot-dev — de VOLLEDIGE klikbot (211 stappen), ZONDER AI/Mistral-stuff (ronde6/aitest draaien niet mee).
# Werkt overal: in eetboek-dev na de sync (versies/tests/) én in de privé-repo (tests/ of versies/tests/).
# Doel: versies/opdeling-test/index-zelftest.html (de losse opdeling-testbuild).
set -u
TESTS="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$TESTS/../.." && pwd)"
POORT="${POORT:-8123}"

if [ ! -d "$TESTS/node_modules/playwright" ]; then
  echo "== Playwright installeren (eerste keer +/- 2-3 min) =="
  (cd "$TESTS" && npm init -y >/dev/null 2>&1 && npm i playwright --no-fund --no-audit && npx playwright install chromium)
fi

echo "== Server aan op poort $POORT =="
cd "$ROOT"
POORT=$POORT node "$TESTS/server.js" &
SRV=$!
sleep 1

echo "== Kliktest draaien (versies/opdeling-test/index-zelftest.html, +/- 15-20 min) =="
node "$TESTS/kliktest.js" "http://localhost:$POORT/versies/opdeling-test/index-zelftest.html"
UIT=$?
kill $SRV 2>/dev/null
exit $UIT
