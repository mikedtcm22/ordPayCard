#!/bin/bash

# Start Bitcoin Core with Signet configuration
# This script starts bitcoind with the Signet configuration

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CONFIG_FILE="$PROJECT_ROOT/configs/bitcoin-signet.conf"

echo "Starting Bitcoin Core with Signet configuration..."
echo "Config file: $CONFIG_FILE"

# Check if bitcoind is already running
if pgrep -x "bitcoind" > /dev/null; then
    echo "⚠️  bitcoind is already running. Stop it first with ./signet-stop.sh"
    exit 1
fi

# Start bitcoind with signet config
bitcoind -conf="$CONFIG_FILE" -daemon

echo "⏳ Waiting for Bitcoin Core to start..."
sleep 3

# Check if running
if bitcoin-cli -conf="$CONFIG_FILE" getblockchaininfo > /dev/null 2>&1; then
    echo "✅ Bitcoin Core started successfully on Signet!"
    echo ""
    echo "Chain info:"
    bitcoin-cli -conf="$CONFIG_FILE" getblockchaininfo | grep -E '"chain"|"blocks"|"headers"'
else
    echo "❌ Failed to start Bitcoin Core"
    exit 1
fi