#!/usr/bin/env bash
# BOT 4: Rust Test Bot
# Corre cargo test en src-tauri. Todos deben pasar.
set -euo pipefail

BOT="[Rust Test Bot]"
echo "$BOT Corriendo cargo test..."

cd "$(git rev-parse --show-toplevel)/src-tauri"

cargo test 2>&1
STATUS=$?

if [ $STATUS -ne 0 ]; then
  echo "$BOT ❌ Rust tests fallaron."
  exit 1
fi

echo "$BOT ✅ Rust tests pasaron."
