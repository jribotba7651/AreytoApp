#!/usr/bin/env bash
# BOT 5: Build Bot
# Verifica que el proyecto compila (Vite + tsc). Sin Tauri completo para ser rápido.
set -euo pipefail

BOT="[Build Bot]"
echo "$BOT Verificando build de frontend (tsc + vite)..."

cd "$(git rev-parse --show-toplevel)"

npm run build 2>&1
STATUS=$?

if [ $STATUS -ne 0 ]; then
  echo "$BOT ❌ Build falló."
  exit 1
fi

echo "$BOT ✅ Build OK."
