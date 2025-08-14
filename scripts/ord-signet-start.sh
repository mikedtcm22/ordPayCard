#!/bin/bash

# Start ord server with Signet configuration

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CONFIG_FILE="$PROJECT_ROOT/configs/ord-signet.yaml"

echo "Starting ord server with Signet configuration..."
echo "Config file: $CONFIG_FILE"

# Check if ord server is already running
if pgrep -f "ord.*server" > /dev/null; then
    echo "⚠️  ord server is already running. Stop it first with ./ord-signet-stop.sh"
    exit 1
fi

# Check if Bitcoin Core is running
if ! bitcoin-cli -rpcport=38332 -rpcuser=ordtest -rpcpassword=ordtest2024 getblockchaininfo > /dev/null 2>&1; then
    echo "❌ Bitcoin Core is not running. Start it first with ./signet-start.sh"
    exit 1
fi

# Create ord data directory if it doesn't exist
ORD_DATA_DIR="/Users/michaelchristopher/.local/share/ord/signet"
mkdir -p "$ORD_DATA_DIR"

echo "⏳ Starting ord indexing and server..."

# Start ord server in background with signet
nohup ord \
    --bitcoin-rpc-url http://127.0.0.1:38332 \
    --bitcoin-rpc-username ordtest \
    --bitcoin-rpc-password ordtest2024 \
    --chain signet \
    --data-dir "$ORD_DATA_DIR" \
    --enable-json-api \
    --index-runes \
    --index-sats \
    server \
    --http-port 8080 \
    > "$PROJECT_ROOT/logs/ord-signet.log" 2>&1 &

ORD_PID=$!
echo "ord server started with PID: $ORD_PID"

# Save PID for stopping later
echo $ORD_PID > "$PROJECT_ROOT/logs/ord-signet.pid"

echo "⏳ Waiting for ord server to start (this may take a while on first run)..."
sleep 5

# Check if ord server is responding
for i in {1..30}; do
    if curl -s http://localhost:8080 > /dev/null 2>&1; then
        echo "✅ ord server started successfully!"
        echo ""
        echo "Access ord at: http://localhost:8080"
        echo "Logs are at: $PROJECT_ROOT/logs/ord-signet.log"
        echo ""
        echo "Useful endpoints:"
        echo "  - Inscriptions: http://localhost:8080/inscriptions"
        echo "  - Blocks: http://localhost:8080/blocks"
        echo "  - Status: http://localhost:8080/status"
        exit 0
    fi
    echo -n "."
    sleep 2
done

echo ""
echo "❌ ord server failed to start. Check logs at: $PROJECT_ROOT/logs/ord-signet.log"
tail -20 "$PROJECT_ROOT/logs/ord-signet.log"
exit 1