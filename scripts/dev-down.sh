#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/new-api-src/docker-compose.dev.yml"
FRONTEND_PORT="${FRONTEND_PORT:-4177}"

if [ -f "$COMPOSE_FILE" ] && command -v docker >/dev/null 2>&1; then
  docker compose -f "$COMPOSE_FILE" down
fi

if command -v lsof >/dev/null 2>&1; then
  PIDS="$(lsof -tiTCP:"$FRONTEND_PORT" -sTCP:LISTEN 2>/dev/null || true)"
  if [ -n "$PIDS" ]; then
    echo "Stopping frontend process on port $FRONTEND_PORT: $PIDS"
    kill $PIDS 2>/dev/null || true
  fi
fi

echo "Local development services stopped."
