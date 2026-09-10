#!/usr/bin/env bash
# Pipeline completo local — corre todos los bots en orden.
# Uso: ./scripts/pipeline/run-all.sh
# Con flag --fast: salta build y rust tests (solo typecheck + lint + ts tests)
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
SCRIPTS="$ROOT/scripts/pipeline"
FAST=${1:-""}

PASS=0
FAIL=0
FAILURES=()

run_bot() {
  local name=$1
  local script=$2
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  if bash "$script"; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    FAILURES+=("$name")
  fi
}

echo "🤖 AreytoApp Pipeline — $(date '+%Y-%m-%d %H:%M:%S')"
echo "Modo: ${FAST:---fast}"

run_bot "TypeCheck" "$SCRIPTS/01-typecheck-bot.sh"
run_bot "Lint"      "$SCRIPTS/02-lint-bot.sh"
run_bot "TS Tests"  "$SCRIPTS/03-test-ts-bot.sh"

if [ "$FAST" != "--fast" ]; then
  run_bot "Cargo Check" "$SCRIPTS/06-cargo-check-bot.sh"
  run_bot "Rust Tests"  "$SCRIPTS/04-test-rust-bot.sh"
  run_bot "Build"       "$SCRIPTS/05-build-bot.sh"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Pipeline resultado: ✅ $PASS OK  ❌ $FAIL FAIL"

if [ ${#FAILURES[@]} -gt 0 ]; then
  echo "Bots que fallaron: ${FAILURES[*]}"
  exit 1
fi

echo "🎉 Pipeline completo — todo limpio."
