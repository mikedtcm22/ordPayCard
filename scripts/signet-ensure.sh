#!/bin/bash

# Ensure Bitcoin Core (Signet) is running; start it if not

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CONFIG_FILE="$PROJECT_ROOT/configs/bitcoin-signet.conf"

if bitcoin-cli -conf="$CONFIG_FILE" getblockchaininfo > /dev/null 2>&1; then
  echo "✅ Bitcoin Core (Signet) already running"
  exit 0
fi

echo "ℹ️  Bitcoin Core (Signet) not running; starting..."
"$SCRIPT_DIR/signet-start.sh"

if bitcoin-cli -conf="$CONFIG_FILE" getblockchaininfo > /dev/null 2>&1; then
  echo "✅ Bitcoin Core (Signet) is running"
  exit 0
fi

echo "❌ Failed to start Bitcoin Core (Signet)"
exit 1


