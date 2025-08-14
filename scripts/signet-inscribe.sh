#!/bin/bash

# Helper script to inscribe on Signet using ord
# Usage: ./signet-inscribe.sh <file> <fee_rate> [destination_address]

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Check arguments
if [ $# -lt 2 ]; then
    echo "Usage: $0 <file> <fee_rate> [destination_address]"
    echo "Example: $0 ../inscription-testing/templates/membershipCard_base.html 1"
    exit 1
fi

FILE="$1"
FEE_RATE="$2"
DESTINATION="${3:-}"

# Check if file exists
if [ ! -f "$FILE" ]; then
    echo "❌ File not found: $FILE"
    exit 1
fi

# Check if Bitcoin Core is running
if ! bitcoin-cli -rpcport=38332 -rpcuser=ordtest -rpcpassword=ordtest2024 getblockchaininfo > /dev/null 2>&1; then
    echo "❌ Bitcoin Core is not running. Start it first with ./signet-start.sh"
    exit 1
fi

echo "📝 Inscribing file: $FILE"
echo "💰 Fee rate: $FEE_RATE sats/vbyte"

# Create inscription command
INSCRIBE_CMD="ord \
    --bitcoin-rpc-url http://127.0.0.1:38332 \
    --bitcoin-rpc-username ordtest \
    --bitcoin-rpc-password ordtest2024 \
    --chain signet \
    wallet inscribe \
    --fee-rate $FEE_RATE \
    --file \"$FILE\""

# Add destination if provided
if [ -n "$DESTINATION" ]; then
    INSCRIBE_CMD="$INSCRIBE_CMD --destination \"$DESTINATION\""
fi

echo "⏳ Creating inscription..."
echo "Command: $INSCRIBE_CMD"

# Execute inscription
eval $INSCRIBE_CMD

echo ""
echo "✅ Inscription created successfully!"
echo ""
echo "Note: The inscription will be pending until confirmed in a block."
echo "Check status at: http://localhost:8080/inscriptions"