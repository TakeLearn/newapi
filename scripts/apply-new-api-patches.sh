#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NEW_API_DIR="${NEW_API_DIR:-$ROOT_DIR/new-api-src}"
PATCH_DIR="$ROOT_DIR/patches/new-api"

if [ ! -d "$NEW_API_DIR" ]; then
  echo "New API source not found at $NEW_API_DIR" >&2
  exit 1
fi

if [ ! -d "$PATCH_DIR" ]; then
  echo "No patch directory found at $PATCH_DIR"
  exit 0
fi

for patch in "$PATCH_DIR"/*.patch; do
  [[ -e "$patch" ]] || continue
  echo "Applying $(basename "$patch")"
  if git -C "$ROOT_DIR" apply --check "$patch" >/dev/null 2>&1; then
    git -C "$ROOT_DIR" apply --3way "$patch"
  elif git -C "$ROOT_DIR" apply --reverse --check "$patch" >/dev/null 2>&1; then
    echo "Skipping $(basename "$patch"); already applied"
  else
    git -C "$ROOT_DIR" apply --3way "$patch"
  fi
done
