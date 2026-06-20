#!/usr/bin/env bash
set -euo pipefail

HOST="${1:-}"

if [ -z "$HOST" ]; then
  echo "Usage: $0 https://api.example.com"
  exit 2
fi

echo "Checking New API status..."
curl -fsS "$HOST/api/status" | grep -q '"success":true'

echo "Checking payment bridge health..."
curl -fsS "$HOST/health/payment" | grep -q '"success":true'

echo "Checking local containers..."
if command -v docker >/dev/null 2>&1 && [ -f deploy/docker-compose.yml ]; then
  (cd deploy && docker compose ps)
fi

echo "MVP smoke checks passed."
