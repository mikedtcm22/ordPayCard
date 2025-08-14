#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

FILE=/workspace/client/src/templates/inscription/registrationWrapper.html

echo "[regtest] Ensure bitcoind healthy..."
if ! docker compose -f docker-compose.regtest.yml ps | grep -q healthy; then
  ./inscription-testing/regtest-up.sh
fi

echo "[regtest] Start ord server and wait for /blockcount..."
docker compose -f docker-compose.regtest.yml up -d ord
for i in {1..180}; do
  if curl -sSf http://localhost:8080/blockcount >/dev/null 2>&1; then echo " - ord HTTP ready"; break; fi
  sleep 1
  if [ $i -eq 180 ]; then echo "ord HTTP not ready in time" >&2; exit 1; fi
done

echo "[regtest] Create ord wallet & receive address..."
docker compose -f docker-compose.regtest.yml exec -T ord sh -lc "ord --regtest --cookie-file /root/.bitcoin/regtest/.cookie --bitcoin-rpc-url http://bitcoin:18443 wallet create >/dev/null 2>&1 || true"
ADDR=$(docker compose -f docker-compose.regtest.yml exec -T ord sh -lc "ord --regtest --cookie-file /root/.bitcoin/regtest/.cookie --bitcoin-rpc-url http://bitcoin:18443 wallet receive" | tr -d '\r' | tail -n1)
echo " - address: $ADDR"

if [ -z "$ADDR" ]; then echo "Failed to obtain receive address" >&2; exit 1; fi

echo "[regtest] Mining 101 blocks to fund ord wallet..."
docker compose -f docker-compose.regtest.yml exec -T bitcoin bash -lc "bitcoin-cli -regtest -rpccookiefile=/home/bitcoin/.bitcoin/regtest/.cookie generatetoaddress 101 $ADDR >/dev/null"

echo "[regtest] Inscribing parent from $FILE..."
docker compose -f docker-compose.regtest.yml exec -T ord sh -lc "ord --regtest --cookie-file /root/.bitcoin/regtest/.cookie --bitcoin-rpc-url http://bitcoin:18443 wallet inscribe --fee-rate 1 --file $FILE" | tee /tmp/ord_parent.log

ID=$(grep -Eo '[a-f0-9]{64}i[0-9]+' /tmp/ord_parent.log | head -n1 || true)
echo "[regtest] Parent inscription ID: ${ID:-<not found>}"
if [ -z "${ID:-}" ]; then
  echo "Failed to parse inscription ID" >&2
  exit 1
fi

echo "$ID" > inscription-testing/.last_parent
echo "[regtest] View: http://localhost:8080/inscription/$ID"
