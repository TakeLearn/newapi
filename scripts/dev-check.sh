#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WEB_DEFAULT_DIR="$ROOT_DIR/new-api-src/web/default"

run_bun() {
  if command -v bun >/dev/null 2>&1; then
    bun "$@"
  elif command -v npm >/dev/null 2>&1; then
    npm exec --yes bun -- "$@"
  else
    echo "Bun or npm is required. Install Bun from https://bun.sh first." >&2
    exit 1
  fi
}

cd "$WEB_DEFAULT_DIR"
run_bun run typecheck
run_bun run build
