#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WEB_DIR="$ROOT_DIR/new-api-src/web"
DEFAULT_WEB_DIR="$WEB_DIR/default"
FRONTEND_HOST="${FRONTEND_HOST:-127.0.0.1}"
FRONTEND_PORT="${FRONTEND_PORT:-4177}"
BACKEND_URL="${BACKEND_URL:-http://127.0.0.1:3000}"

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

if [ ! -f "$WEB_DIR/package.json" ] || [ ! -f "$DEFAULT_WEB_DIR/package.json" ]; then
  echo "Missing web workspace under $WEB_DIR" >&2
  exit 1
fi

if [ ! -d "$WEB_DIR/node_modules" ]; then
  echo "Installing frontend dependencies..."
  (cd "$WEB_DIR" && run_bun install)
fi

echo "Starting frontend at http://$FRONTEND_HOST:$FRONTEND_PORT"
echo "Proxying API requests to $BACKEND_URL"
cd "$DEFAULT_WEB_DIR"
VITE_REACT_APP_SERVER_URL="$BACKEND_URL" run_bun run dev --host "$FRONTEND_HOST" --port "$FRONTEND_PORT"
