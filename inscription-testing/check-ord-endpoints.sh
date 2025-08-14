#!/usr/bin/env bash
set -euo pipefail

# check-ord-endpoints.sh — Verify ord recursive endpoints for a given parent and optional child
# Usage: ./inscription-testing/check-ord-endpoints.sh <PARENT_ID> [CHILD_ID]

if [ $# -lt 1 ]; then
  echo "Usage: $0 <PARENT_ID> [CHILD_ID]" >&2
  exit 2
fi

PARENT="$1"
CHILD="${2:-}"

echo "[ord] /r/blockheight = $(curl -sSf http://localhost:8080/r/blockheight || echo failed)"

echo "[ord] /r/children/$PARENT (ids):"
curl -sS http://localhost:8080/r/children/$PARENT | cat
echo

echo "[ord] /r/content/$PARENT (first 120B):"
curl -sS http://localhost:8080/r/content/$PARENT | head -c 120 | sed 's/.*/[truncated]/'
echo

if [ -n "$CHILD" ]; then
  echo "[ord] /r/content/$CHILD (first 120B):"
  curl -sS http://localhost:8080/r/content/$CHILD | head -c 120 | sed 's/.*/[truncated]/'
  echo
fi

echo "[ord] done"

