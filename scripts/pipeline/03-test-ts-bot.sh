#!/usr/bin/env bash
# BOT 3: TS Test Bot
# Corre todos los tests de Vitest. Todos deben pasar.
set -euo pipefail

BOT="[TS Test Bot]"
echo "$BOT Corriendo Vitest..."

cd "$(git rev-parse --show-toplevel)"

npx vitest run --reporter=verbose 2>&1
STATUS=$?

if [ $STATUS -ne 0 ]; then
  echo "$BOT ❌ Tests fallaron."
  exit 1
fi

echo "$BOT ✅ Todos los tests pasaron."
