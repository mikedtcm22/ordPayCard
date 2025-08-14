#!/usr/bin/env bash
set -euo pipefail

# sanity.sh — Verify regtest environment is ready for automated tests.
# Checks:
# - docker compose services exist
# - bitcoin is healthy and RPC cookie readable
# - ord is serving HTTP
# - ord CLI can list wallets and receive an address

cd "$(dirname "$0")/.."

COMPOSE_FILE="docker-compose.regtest.yml"
ORD_URL="http://localhost:8080"

echo "[sanity] Checking docker compose services..."
docker compose -f "$COMPOSE_FILE" ps | cat

echo "[sanity] Checking bitcoin health..."
CID=$(docker compose -f "$COMPOSE_FILE" ps -q bitcoin || true)
if [ -z "$CID" ]; then echo "[sanity] bitcoin service not found" >&2; exit 2; fi
HS=$(docker inspect -f '{{.State.Health.Status}}' "$CID" 2>/dev/null || echo starting)
if [ "$HS" != "healthy" ]; then echo "[sanity] bitcoin not healthy: $HS" >&2; exit 3; fi

echo "[sanity] Reading RPC cookie..."
COOKIE=$(docker compose -f "$COMPOSE_FILE" exec -T bitcoin \
  sh -lc "cat /home/bitcoin/.bitcoin/regtest/.cookie" | tr -d '\r')
if [ -z "$COOKIE" ]; then echo "[sanity] cannot read cookie" >&2; exit 4; fi

echo "[sanity] Bitcoin RPC getblockcount..."
COUNT=$(curl -sS --user "$COOKIE" \
  --data-binary '{"jsonrpc":"1.0","id":"count","method":"getblockcount","params":[]}' \
  -H 'content-type:text/plain;' http://127.0.0.1:18443/ | sed -n 's/.*"result":\s*\([0-9][0-9]*\).*/\1/p')
echo " - blockcount=${COUNT:-unknown}"

echo "[sanity] Checking ord HTTP..."
if curl -sf "$ORD_URL/r/blockheight" >/dev/null || curl -sf "$ORD_URL/blockcount" >/dev/null; then
  echo " - ord HTTP OK"
else
  echo "[sanity] ord HTTP not responding" >&2; exit 5
fi

echo "[sanity] ord version and wallet receive..."
docker compose -f "$COMPOSE_FILE" exec -T ord sh -lc "ord --version && ord --regtest --cookie-file /root/.bitcoin/regtest/.cookie --bitcoin-rpc-url http://bitcoin:18443 wallet receive" | cat

echo "[sanity] All checks passed."

