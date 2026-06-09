#!/usr/bin/env bash
# init.sh — Environment verification and initialization
#
# Run this script at the START of a session and before marking any task `done`.
# If it fails, the session must not proceed.
#
# Expected output: clear exit codes and blocks marked with [OK]/[FAIL].

set -u
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'

ok()    { printf "${GREEN}[OK]${NC}    %s\n" "$1"; }
warn()  { printf "${YELLOW}[WARN]${NC}  %s\n" "$1"; }
fail()  { printf "${RED}[FAIL]${NC}  %s\n" "$1"; }

EXIT_CODE=0
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "── 1. Checking environment ────────────────────────────"

if ! command -v node >/dev/null 2>&1; then
  fail "node is not installed"
  exit 1
fi
ok "node -> $(node --version)"

if command -v pnpm >/dev/null 2>&1; then
  ok "pnpm -> $(pnpm --version)"
elif command -v npm >/dev/null 2>&1; then
  ok "npm -> $(npm --version)"
else
  warn "Neither pnpm nor npm found — test step may fail"
fi

echo ""
echo "── 2. Checking harness base files ─────────────────────"

for f in AGENTS.md feature_list.json progress/current.md docs/architecture.md docs/conventions.md docs/verification.md CHECKPOINTS.md; do
  if [ ! -f "$f" ]; then
    fail "Missing base file: $f"
    EXIT_CODE=1
  else
    ok "Found $f"
  fi
done

echo ""
echo "── 3. Validating feature_list.json and specs ──────────"

if node "$SCRIPT_DIR/harness/scripts/validate-feature-list.mjs"; then
  :
else
  EXIT_CODE=1
fi

echo ""
echo "── 4. Running tests ───────────────────────────────────"

if [ -f "package.json" ]; then
  if command -v pnpm >/dev/null 2>&1; then
    if pnpm run test 2>&1; then
      ok "Tests pass"
    else
      fail "Tests are failing"
      EXIT_CODE=1
    fi
  elif command -v npm >/dev/null 2>&1; then
    if npm test 2>&1; then
      ok "Tests pass"
    else
      fail "Tests are failing"
      EXIT_CODE=1
    fi
  else
    fail "No package manager found to run tests"
    EXIT_CODE=1
  fi
else
  warn "package.json not found — skipping tests"
fi

echo ""
echo "── 5. Checking TypeScript ─────────────────────────────"

if [ -f "tsconfig.json" ]; then
  if npx tsc --noEmit 2>&1; then
    ok "TypeScript compiles with no errors"
  else
    fail "TypeScript errors"
    EXIT_CODE=1
  fi
else
  warn "tsconfig.json not found — skipping TypeScript check"
fi

echo ""
echo "── 6. Summary ─────────────────────────────────────────"

if [ $EXIT_CODE -eq 0 ]; then
  ok "Environment ready. You may start working."
else
  fail "Environment NOT ready. Fix errors before proceeding."
fi

exit $EXIT_CODE
