#!/usr/bin/env bash
# BOT 6: Cargo Check Bot
# Valida que el código Rust compila (sin correr ni linkear). Rápido.
set -euo pipefail

BOT="[Cargo Check Bot]"
echo "$BOT Corriendo cargo check..."

cd "$(git rev-parse --show-toplevel)/src-tauri"

cargo check 2>&1
STATUS=$?

if [ $STATUS -ne 0 ]; then
  echo "$BOT ❌ cargo check falló."
  exit 1
fi

echo "$BOT ✅ Rust compila limpio."
