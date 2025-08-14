#!/bin/bash

# Stop Bitcoin Core running on Signet

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CONFIG_FILE="$PROJECT_ROOT/configs/bitcoin-signet.conf"

echo "Stopping Bitcoin Core (Signet)..."

if bitcoin-cli -conf="$CONFIG_FILE" stop > /dev/null 2>&1; then
    echo "✅ Bitcoin Core stopped successfully"
else
    echo "⚠️  Bitcoin Core may not be running or failed to stop"
    
    # Try to kill the process if it's still running
    if pgrep -x "bitcoind" > /dev/null; then
        echo "Forcefully stopping bitcoind..."
        pkill -9 bitcoind
        echo "✅ bitcoind process terminated"
    fi
fi