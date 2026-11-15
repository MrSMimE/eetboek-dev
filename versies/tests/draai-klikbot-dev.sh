#!/usr/bin/env bash
# Klikbot-dev — handmatig, ZONDER AI/Mistral-stuff. GEEN automatische/laptop-runner.
# Gebruik (vanuit de repo-root van eetboek-dev): bash tests/draai-klikbot-dev.sh
set -u
cd "$(dirname "$0")/.." || exit 1
POORT="${POORT:-8137}"

if [ ! -d tests/node_modules/playwright ]; then
  echo "== Playwright installeren (eerste keer) =="
  cd tests && npm init -y >/dev/null 2>&1 && npm i playwright --no-fund --no-audit && npx playwright install chromium && cd ..
fi

echo "== Server aan op poort $POORT =="
POORT=$POORT node tests/server.js &
SRV=$!
sleep 1

echo "== Kliktest-dev draaien (nieuwste single in versies/) =="
node tests/kliktest-dev.js
UIT=$?
kill $SRV 2>/dev/null
exit $UIT
