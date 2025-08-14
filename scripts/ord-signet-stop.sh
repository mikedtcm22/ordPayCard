#!/bin/bash

# Stop ord server running on Signet

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
PID_FILE="$PROJECT_ROOT/logs/ord-signet.pid"

echo "Stopping ord server..."

# Try to stop using saved PID
if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if kill -0 $PID 2>/dev/null; then
        kill $PID
        echo "✅ ord server (PID: $PID) stopped"
        rm "$PID_FILE"
    else
        echo "⚠️  ord server with PID $PID not running"
        rm "$PID_FILE"
    fi
else
    echo "⚠️  No PID file found"
fi

# Also try to kill any remaining ord server processes
if pgrep -f "ord.*server" > /dev/null; then
    echo "Stopping remaining ord server processes..."
    pkill -f "ord.*server"
    echo "✅ All ord server processes stopped"
fi