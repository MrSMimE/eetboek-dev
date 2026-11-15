#!/usr/bin/env bash
# Klikbot-dev — handmatig, ZONDER AI/Mistral-stuff. GEEN automatische/laptop-runner.
# Gebruik (vanuit de repo-root van eetboek-dev): bash versies/tests/draai-klikbot-dev.sh
# De bot start zélf een server op POORT (standaard 8137) — geen apart server.js nodig.
set -u
SCRIPTDIR="$(cd "$(dirname "$0")" && pwd)"
POORT="${POORT:-8137}"

if [ ! -d "$SCRIPTDIR/node_modules/playwright" ]; then
  echo "== Playwright installeren (eerste keer) =="
  (cd "$SCRIPTDIR" && npm init -y >/dev/null 2>&1 && npm i playwright --no-fund --no-audit && npx playwright install chromium)
fi

echo "== Kliktest-dev draaien (app-test/index-zelftest.html) =="
POORT=$POORT node "$SCRIPTDIR/kliktest-dev.js"
exit $?
