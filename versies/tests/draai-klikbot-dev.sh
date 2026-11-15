#!/usr/bin/env bash
# Klikbot-dev — de VOLLEDIGE klikbot (211 stappen), ZONDER AI/Mistral-stuff (ronde6/aitest draaien niet mee).
# Gebruik (vanuit de repo-root van eetboek-dev): bash tests/draai-klikbot-dev.sh
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
POORT="${POORT:-8123}"

if [ ! -d "$ROOT/tests/node_modules/playwright" ]; then
  echo "== Playwright installeren (eerste keer +/- 2-3 min) =="
  (cd "$ROOT/tests" && npm init -y >/dev/null 2>&1 && npm i playwright --no-fund --no-audit && npx playwright install chromium)
fi

echo "== Server aan op poort $POORT =="
cd "$ROOT"
POORT=$POORT node tests/server.js &
SRV=$!
sleep 1

echo "== Kliktest draaien (app-test/index-zelftest.html, +/- 15-20 min) =="
node "$ROOT/tests/kliktest.js" "http://localhost:$POORT/app-test/index-zelftest.html"
UIT=$?
kill $SRV 2>/dev/null
exit $UIT
