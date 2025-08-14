#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

PARENT_ID=$(cat inscription-testing/.last_parent)
TMP=inscription-testing/registration.json

if [ -z "$PARENT_ID" ]; then
  echo "Missing parent ID. Run regtest-inscribe-parent.sh first." >&2
  exit 1
fi

echo "[regtest] Creating child registration JSON..."
cat > $TMP << JSON
{
  "schema": "buyer_registration.v1",
  "parent": "$PARENT_ID",
  "paid_to": "$(grep CREATOR_WALLET server/.env 2>/dev/null | cut -d '=' -f2 || echo tb1qexample)",
  "fee_sats": 50000,
  "txid": "$(openssl rand -hex 32)",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
JSON

echo "[regtest] Inscribing child..."
docker compose -f docker-compose.regtest.yml exec -T ord sh -lc \
  "ord --regtest --cookie-file /root/.bitcoin/regtest/.cookie --bitcoin-rpc-url http://bitcoin:18443 \
   wallet inscribe --fee-rate 1 --parent $PARENT_ID --file /workspace/$TMP" | tee /tmp/ord_child.log

CID=$(grep -Eo '[a-f0-9]{64}i[0-9]+' /tmp/ord_child.log | head -n1 || true)
echo "[regtest] Child inscription ID: ${CID:-<not found>}"
if [ -z "${CID:-}" ]; then
  echo "Failed to parse child inscription ID" >&2
  exit 1
fi

echo "$CID" > inscription-testing/.last_child
echo "[regtest] View child: http://localhost:8080/inscription/$CID"
