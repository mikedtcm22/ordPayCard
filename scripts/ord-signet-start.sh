#!/bin/bash

# Start ord server with Signet configuration (YAML-driven)

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CONFIG_FILE="$PROJECT_ROOT/configs/ord-signet.yaml"

echo "Starting ord server with Signet configuration..."
echo "Config file: $CONFIG_FILE"

# Determine HTTP port from YAML (fallback to 8080)
ORD_HTTP_PORT=$(grep -E '^\s*server_http_port:' "$CONFIG_FILE" | awk -F': ' '{print $2}' | tr -d '"' | tr -d "'")
if [ -z "$ORD_HTTP_PORT" ] || [ "$ORD_HTTP_PORT" = "null" ]; then
    ORD_HTTP_PORT=8080
fi
ORD_BASE_URL="http://localhost:$ORD_HTTP_PORT"

# Check if ord server is already running on configured port
if curl -s "$ORD_BASE_URL/status" > /dev/null 2>&1 || pgrep -f "ord.*server" > /dev/null; then
    echo "⚠️  ord server appears to be already running on $ORD_BASE_URL. Stop it first with ./ord-signet-stop.sh"
    exit 1
fi

# Check if Bitcoin Core is running
if ! bitcoin-cli -rpcport=38332 -rpcuser=ordtest -rpcpassword=ordtest2024 getblockchaininfo > /dev/null 2>&1; then
    echo "❌ Bitcoin Core is not running. Start it first with ./signet-start.sh"
    exit 1
fi

# Create ord data directory if it doesn't exist (respect YAML path if changed)
ORD_DATA_DIR=$(grep -E '^\s*data_dir:' "$CONFIG_FILE" | awk -F': ' '{print $2}' | tr -d '"' | tr -d "'")
if [ -z "$ORD_DATA_DIR" ] || [ "$ORD_DATA_DIR" = "null" ]; then
    ORD_DATA_DIR="/Users/michaelchristopher/.local/share/ord/signet"
fi
mkdir -p "$ORD_DATA_DIR"

echo "⏳ Starting ord indexing and server..."

# Start ord server in background with YAML config
nohup ord \
    --config "$CONFIG_FILE" \
    server \
    > "$PROJECT_ROOT/logs/ord-signet.log" 2>&1 &

ORD_PID=$!
echo "ord server started with PID: $ORD_PID"

# Save PID for stopping later
echo $ORD_PID > "$PROJECT_ROOT/logs/ord-signet.pid"

echo "⏳ Waiting for ord server to start (this may take a while on first run)..."
sleep 5

# Check if ord server is responding
for i in {1..30}; do
    if curl -s "$ORD_BASE_URL" > /dev/null 2>&1; then
        echo "✅ ord server started successfully!"
        echo ""
        echo "Access ord at: $ORD_BASE_URL"
        echo "Logs are at: $PROJECT_ROOT/logs/ord-signet.log"
        echo ""
        echo "Useful endpoints:"
        echo "  - Inscriptions: $ORD_BASE_URL/inscriptions"
        echo "  - Blocks: $ORD_BASE_URL/blocks"
        echo "  - Status: $ORD_BASE_URL/status"
        exit 0
    fi
    echo -n "."
    sleep 2
done

echo ""
echo "❌ ord server failed to start. Check logs at: $PROJECT_ROOT/logs/ord-signet.log"
tail -20 "$PROJECT_ROOT/logs/ord-signet.log"
exit 1