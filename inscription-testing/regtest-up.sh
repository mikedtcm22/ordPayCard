#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "[regtest] Bringing up bitcoind..."
docker compose -f docker-compose.regtest.yml up -d --build bitcoin

echo "[regtest] Waiting for bitcoind to be healthy..."
for i in {1..300}; do
  CID=$(docker compose -f docker-compose.regtest.yml ps -q bitcoin || true)
  if [ -n "$CID" ]; then
    HS=$(docker inspect -f '{{.State.Health.Status}}' "$CID" 2>/dev/null || echo starting)
    if [ "$HS" = "healthy" ]; then echo " - bitcoind healthy"; break; fi
  fi
  sleep 1
  if [ $i -eq 300 ]; then echo "bitcoind did not become healthy in time" >&2; exit 1; fi
done

echo "[regtest] bitcoin RPC: 18443"
