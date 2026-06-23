#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NEW_API_DIR="$ROOT_DIR/new-api-src"
COMPOSE_FILE="$NEW_API_DIR/docker-compose.dev.yml"
BACKEND_URL="${BACKEND_URL:-http://127.0.0.1:3000}"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required. Install and start Docker Desktop first." >&2
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "Docker is not running. Start Docker Desktop first." >&2
  exit 1
fi

if [ ! -f "$COMPOSE_FILE" ]; then
  echo "Missing $COMPOSE_FILE" >&2
  exit 1
fi

echo "Starting AxiomAPI backend, MySQL, and Redis..."
if [ "${REBUILD:-0}" = "1" ]; then
  docker compose -f "$COMPOSE_FILE" up -d --build
else
  docker compose -f "$COMPOSE_FILE" up -d
fi

echo "Waiting for backend at $BACKEND_URL/api/status ..."
for _ in $(seq 1 60); do
  if curl -fsS "$BACKEND_URL/api/status" >/dev/null 2>&1; then
    echo "Backend is ready: $BACKEND_URL"
    echo "Next: ./scripts/dev-web.sh"
    exit 0
  fi
  sleep 1
done

echo "Backend did not become ready within 60 seconds." >&2
echo "Check logs with: docker compose -f $COMPOSE_FILE logs -f new-api" >&2
exit 1
