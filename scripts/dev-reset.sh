#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/new-api-src/docker-compose.dev.yml"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required." >&2
  exit 1
fi

echo "This will delete local AxiomAPI MySQL and app data volumes."
read -r -p "Continue? [y/N] " answer
case "$answer" in
  y|Y|yes|YES)
    docker compose -f "$COMPOSE_FILE" down -v
    echo "Local development data reset."
    ;;
  *)
    echo "Cancelled."
    ;;
esac
