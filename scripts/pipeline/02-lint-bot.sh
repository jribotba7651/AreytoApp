#!/usr/bin/env bash
# BOT 2: Lint Bot
# Valida ESLint. Cero errores = pasa. Warnings permitidos.
set -euo pipefail

BOT="[Lint Bot]"
echo "$BOT Corriendo ESLint..."

cd "$(git rev-parse --show-toplevel)"

if ! npx eslint src --ext .ts,.tsx --max-warnings 0 2>&1; then
  echo "$BOT ❌ ESLint falló."
  exit 1
fi

echo "$BOT ✅ ESLint limpio."
