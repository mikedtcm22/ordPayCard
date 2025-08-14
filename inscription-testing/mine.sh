#!/usr/bin/env bash
set -euo pipefail

# mine.sh — Mine N regtest blocks to a given address via JSON-RPC curl.
# Usage: ./inscription-testing/mine.sh <ADDRESS> [BLOCKS]
# Defaults: BLOCKS=1

cd "$(dirname "$0")/.."

COMPOSE_FILE="docker-compose.regtest.yml"
RPC_HOST="127.0.0.1"
RPC_PORT="18443"

if [ $# -lt 1 ]; then
  echo "Usage: $0 <ADDRESS> [BLOCKS]" >&2
  exit 2
fi

ADDRESS="$1"
BLOCKS="${2:-1}"

if ! docker compose -f "$COMPOSE_FILE" ps | grep -q bitcoin; then
  echo "[mine] bitcoin service not running" >&2
  exit 3
fi

COOKIE=$(docker compose -f "$COMPOSE_FILE" exec -T bitcoin \
  sh -lc "cat /home/bitcoin/.bitcoin/regtest/.cookie" | tr -d '\r')

if [ -z "$COOKIE" ]; then
  echo "[mine] failed to read RPC cookie" >&2
  exit 4
fi

echo "[mine] Mining $BLOCKS block(s) to $ADDRESS ..."
RESP=$(curl -sS --user "$COOKIE" \
  --data-binary '{"jsonrpc":"1.0","id":"mine","method":"generatetoaddress","params":['"$BLOCKS"',"'"$ADDRESS"'"]}' \
  -H 'content-type:text/plain;' http://$RPC_HOST:$RPC_PORT/)

echo "$RESP" | grep -q '"error":null' || {
  echo "[mine] RPC error:" >&2
  echo "$RESP" >&2
  exit 5
}

COUNT=$(curl -sS --user "$COOKIE" \
  --data-binary '{"jsonrpc":"1.0","id":"count","method":"getblockcount","params":[]}' \
  -H 'content-type:text/plain;' http://$RPC_HOST:$RPC_PORT/ | sed -n 's/.*"result":\s*\([0-9][0-9]*\).*/\1/p')

echo "[mine] Done. Blockcount=${COUNT:-unknown}"

