#!/usr/bin/env bash
set -euo pipefail

# Usage: ./inscription-testing/create-registration.sh <PARENT_ID> <PAID_TO_ADDR> <FEE_SATS> [TXID]
# Writes inscription-testing/registration.json

cd "$(dirname "$0")/.."

PARENT_ID=${1:-}
PAID_TO=${2:-}
FEE_SATS=${3:-}
TXID=${4:-}

if [ -z "$PARENT_ID" ] || [ -z "$PAID_TO" ] || [ -z "$FEE_SATS" ]; then
  echo "Usage: $0 <PARENT_ID> <PAID_TO_ADDR> <FEE_SATS> [TXID]" >&2
  exit 2
fi

if [ -z "$TXID" ]; then TXID=$(openssl rand -hex 32); fi

OUT=inscription-testing/registration.json
mkdir -p inscription-testing
cat > "$OUT" << JSON
{
  "schema": "buyer_registration.v1",
  "parent": "$PARENT_ID",
  "paid_to": "$PAID_TO",
  "fee_sats": $FEE_SATS,
  "txid": "$TXID",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
JSON

echo "[create-registration] Wrote $OUT"

