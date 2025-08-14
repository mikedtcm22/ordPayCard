#!/usr/bin/env bash
set -euo pipefail

PARENT_ID_FILE="inscription-testing/.last_parent"
CHILD_ID_FILE="inscription-testing/.last_child"

if [ -f "$PARENT_ID_FILE" ]; then
  PARENT_ID=$(cat "$PARENT_ID_FILE")
  echo "[check] ord /r/content for parent: $PARENT_ID"
  curl -s http://localhost:8080/r/content/$PARENT_ID >/dev/null && echo " - ok"
  echo "[check] ord /r/children for parent:"
  curl -s http://localhost:8080/r/children/$PARENT_ID/inscriptions/0 | jq '. | length' || true
fi

if [ -f "$CHILD_ID_FILE" ]; then
  CHILD_ID=$(cat "$CHILD_ID_FILE")
  echo "[check] ord /r/content for child: $CHILD_ID"
  curl -s http://localhost:8080/r/content/$CHILD_ID >/dev/null && echo " - ok"
fi

echo "[check] Server endpoints (if running):"
curl -s http://localhost:3001/api/registration/status/${PARENT_ID:-dummy} | jq . || true
curl -s -X POST http://localhost:3001/api/registration/create | jq . || true

echo "[check] Done."
