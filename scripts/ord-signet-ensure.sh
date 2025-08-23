#!/bin/bash

# Ensure ord server (Signet) is running; start it if not

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CONFIG_FILE="$PROJECT_ROOT/configs/ord-signet.yaml"

# Read HTTP port from YAML (fallback to 8080)
ORD_HTTP_PORT=$(grep -E '^\s*server_http_port:' "$CONFIG_FILE" | awk -F': ' '{print $2}' | tr -d '"' | tr -d "'")
if [ -z "$ORD_HTTP_PORT" ] || [ "$ORD_HTTP_PORT" = "null" ]; then
  ORD_HTTP_PORT=8080
fi
ORD_BASE_URL="http://localhost:$ORD_HTTP_PORT"

if curl -s "$ORD_BASE_URL/status" > /dev/null 2>&1; then
  echo "✅ ord server already running on $ORD_BASE_URL"
  exit 0
fi

echo "ℹ️  ord server not running; ensuring Bitcoin Core (Signet) and starting ord..."
"$SCRIPT_DIR/signet-ensure.sh"
"$SCRIPT_DIR/ord-signet-start.sh"

if curl -s "$ORD_BASE_URL/status" > /dev/null 2>&1; then
  echo "✅ ord server is running on $ORD_BASE_URL"
  exit 0
fi

echo "❌ Failed to start ord server"
exit 1


