#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NEW_API_DIR="${NEW_API_DIR:-$ROOT_DIR/new-api-src}"
PATCH_DIR="$ROOT_DIR/patches/new-api"

if ! git -C "$NEW_API_DIR" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "New API checkout not found at $NEW_API_DIR" >&2
  echo "Clone https://github.com/QuantumNous/new-api.git into new-api-src first." >&2
  exit 1
fi

cd "$NEW_API_DIR"

for patch in "$PATCH_DIR"/*.patch; do
  [[ -e "$patch" ]] || continue
  echo "Applying $(basename "$patch")"
  if git apply --check "$patch" >/dev/null 2>&1; then
    git apply --3way "$patch"
  elif git apply --reverse --check "$patch" >/dev/null 2>&1; then
    echo "Skipping $(basename "$patch"); already applied"
  else
    git apply --3way "$patch"
  fi
done
