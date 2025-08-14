#!/bin/bash

# Health check script for Signet node
# Returns 0 if healthy, 1 if unhealthy
# Can be used for monitoring and automation

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CONFIG_FILE="$PROJECT_ROOT/configs/bitcoin-signet.conf"

# Health check configuration
MAX_BLOCKS_BEHIND=10
MIN_PEERS=3
MAX_MEMPOOL_MB=100
REQUIRED_DISK_GB=5

# Exit codes
EXIT_SUCCESS=0
EXIT_WARNING=1
EXIT_CRITICAL=2

# Track health status
HEALTH_STATUS=$EXIT_SUCCESS
HEALTH_MESSAGES=()

# Function to add health message
add_health_message() {
    local level=$1
    local message=$2
    HEALTH_MESSAGES+=("[$level] $message")
    
    if [ "$level" == "CRITICAL" ] && [ $HEALTH_STATUS -lt $EXIT_CRITICAL ]; then
        HEALTH_STATUS=$EXIT_CRITICAL
    elif [ "$level" == "WARNING" ] && [ $HEALTH_STATUS -lt $EXIT_WARNING ]; then
        HEALTH_STATUS=$EXIT_WARNING
    fi
}

# Check if bitcoind is running
if ! pgrep -x "bitcoind" > /dev/null; then
    add_health_message "CRITICAL" "Bitcoin Core is not running"
    echo "CRITICAL: Bitcoin Core is not running"
    exit $EXIT_CRITICAL
fi

# Get blockchain info
BLOCKCHAIN_INFO=$(bitcoin-cli -conf="$CONFIG_FILE" getblockchaininfo 2>/dev/null)
if [ $? -ne 0 ]; then
    add_health_message "CRITICAL" "Cannot connect to Bitcoin Core RPC"
else
    # Check sync status
    BLOCKS=$(echo "$BLOCKCHAIN_INFO" | grep -o '"blocks":[0-9]*' | cut -d':' -f2)
    HEADERS=$(echo "$BLOCKCHAIN_INFO" | grep -o '"headers":[0-9]*' | cut -d':' -f2)
    
    if [ -n "$BLOCKS" ] && [ -n "$HEADERS" ]; then
        BLOCKS_BEHIND=$((HEADERS - BLOCKS))
        if [ $BLOCKS_BEHIND -gt $MAX_BLOCKS_BEHIND ]; then
            add_health_message "WARNING" "Node is $BLOCKS_BEHIND blocks behind"
        fi
    fi
    
    # Check if chain is correct
    CHAIN=$(echo "$BLOCKCHAIN_INFO" | grep -o '"chain":"[^"]*"' | cut -d'"' -f4)
    if [ "$CHAIN" != "signet" ]; then
        add_health_message "CRITICAL" "Wrong chain: $CHAIN (expected signet)"
    fi
fi

# Check network connectivity
NETWORK_INFO=$(bitcoin-cli -conf="$CONFIG_FILE" getnetworkinfo 2>/dev/null)
if [ $? -eq 0 ]; then
    CONNECTIONS=$(echo "$NETWORK_INFO" | grep -o '"connections":[0-9]*' | cut -d':' -f2)
    if [ -n "$CONNECTIONS" ] && [ $CONNECTIONS -lt $MIN_PEERS ]; then
        add_health_message "WARNING" "Low peer count: $CONNECTIONS (minimum: $MIN_PEERS)"
    fi
fi

# Check mempool size
MEMPOOL_INFO=$(bitcoin-cli -conf="$CONFIG_FILE" getmempoolinfo 2>/dev/null)
if [ $? -eq 0 ]; then
    MEMPOOL_BYTES=$(echo "$MEMPOOL_INFO" | grep -o '"bytes":[0-9]*' | cut -d':' -f2)
    if [ -n "$MEMPOOL_BYTES" ]; then
        MEMPOOL_MB=$((MEMPOOL_BYTES / 1048576))
        if [ $MEMPOOL_MB -gt $MAX_MEMPOOL_MB ]; then
            add_health_message "WARNING" "Large mempool: ${MEMPOOL_MB}MB (max: ${MAX_MEMPOOL_MB}MB)"
        fi
    fi
fi

# Check disk space
SIGNET_DATA_DIR="$HOME/.bitcoin/signet"
if [ -d "$SIGNET_DATA_DIR" ]; then
    if [ "$(uname)" == "Darwin" ]; then
        # macOS
        AVAILABLE_GB=$(df -g "$SIGNET_DATA_DIR" | tail -1 | awk '{print $4}')
    else
        # Linux
        AVAILABLE_GB=$(df -BG "$SIGNET_DATA_DIR" | tail -1 | awk '{print $4}' | sed 's/G//')
    fi
    
    if [ -n "$AVAILABLE_GB" ] && [ $(echo "$AVAILABLE_GB < $REQUIRED_DISK_GB" | bc) -eq 1 ]; then
        add_health_message "WARNING" "Low disk space: ${AVAILABLE_GB}GB (minimum: ${REQUIRED_DISK_GB}GB)"
    fi
fi

# Check ord server (if expected to be running)
if [ -f "$PROJECT_ROOT/logs/ord-signet.pid" ]; then
    PID=$(cat "$PROJECT_ROOT/logs/ord-signet.pid")
    if ! kill -0 $PID 2>/dev/null; then
        add_health_message "WARNING" "Ord server PID file exists but process not running"
    else
        # Check if ord API is responding
        if ! curl -s -f -m 5 http://localhost:8080/status > /dev/null 2>&1; then
            add_health_message "WARNING" "Ord server running but API not responding"
        fi
    fi
fi

# Check Bitcoin Core response time
START_TIME=$(date +%s%N)
bitcoin-cli -conf="$CONFIG_FILE" getblockcount > /dev/null 2>&1
END_TIME=$(date +%s%N)
RESPONSE_TIME_MS=$(((END_TIME - START_TIME) / 1000000))

if [ $RESPONSE_TIME_MS -gt 1000 ]; then
    add_health_message "WARNING" "Slow RPC response: ${RESPONSE_TIME_MS}ms"
fi

# Output results
if [ ${#HEALTH_MESSAGES[@]} -eq 0 ]; then
    echo "OK: All health checks passed"
else
    for message in "${HEALTH_MESSAGES[@]}"; do
        echo "$message"
    done
fi

# Exit with appropriate code
exit $HEALTH_STATUS