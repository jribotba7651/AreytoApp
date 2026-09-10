#!/usr/bin/env bash
# BOT 1: TypeCheck Bot
# Valida que TypeScript compile limpio. Cero errores = pasa.
set -euo pipefail

BOT="[TypeCheck Bot]"
echo "$BOT Corriendo tsc --noEmit..."

cd "$(git rev-parse --show-toplevel)"

npx tsc --noEmit
echo "$BOT ✅ TypeScript limpio."
