#!/bin/bash

# Monitor Signet node status and sync progress
# Shows detailed information about the node health

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CONFIG_FILE="$PROJECT_ROOT/configs/bitcoin-signet.conf"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       Signet Node Status Monitor       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Check if bitcoind is running
if ! pgrep -x "bitcoind" > /dev/null; then
    echo -e "${RED}❌ Bitcoin Core is not running${NC}"
    echo "   Start it with: ./scripts/signet-start.sh"
    exit 1
fi

echo -e "${GREEN}✅ Bitcoin Core is running${NC}"
echo ""

# Get blockchain info
echo -e "${YELLOW}Blockchain Information:${NC}"
echo "------------------------"

BLOCKCHAIN_INFO=$(bitcoin-cli -conf="$CONFIG_FILE" getblockchaininfo 2>/dev/null)

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to connect to Bitcoin Core${NC}"
    echo "   Node may still be starting up..."
    exit 1
fi

# Parse blockchain info
CHAIN=$(echo "$BLOCKCHAIN_INFO" | grep -o '"chain":"[^"]*"' | cut -d'"' -f4)
BLOCKS=$(echo "$BLOCKCHAIN_INFO" | grep -o '"blocks":[0-9]*' | cut -d':' -f2)
HEADERS=$(echo "$BLOCKCHAIN_INFO" | grep -o '"headers":[0-9]*' | cut -d':' -f2)
VERIFICATION_PROGRESS=$(echo "$BLOCKCHAIN_INFO" | grep -o '"verificationprogress":[0-9.]*' | cut -d':' -f2)
SIZE_ON_DISK=$(echo "$BLOCKCHAIN_INFO" | grep -o '"size_on_disk":[0-9]*' | cut -d':' -f2)
PRUNED=$(echo "$BLOCKCHAIN_INFO" | grep -o '"pruned":[a-z]*' | cut -d':' -f2)

echo -e "Network:     ${GREEN}$CHAIN${NC}"
echo -e "Blocks:      ${GREEN}$BLOCKS${NC}"
echo -e "Headers:     ${GREEN}$HEADERS${NC}"

# Calculate sync percentage
if [ "$HEADERS" -gt 0 ]; then
    SYNC_PERCENT=$(echo "scale=2; $BLOCKS * 100 / $HEADERS" | bc)
    
    if [ $(echo "$SYNC_PERCENT < 99.9" | bc) -eq 1 ]; then
        echo -e "Sync Status: ${YELLOW}${SYNC_PERCENT}%${NC} (Syncing...)"
        
        # Estimate time remaining
        BLOCKS_BEHIND=$((HEADERS - BLOCKS))
        echo -e "Blocks Behind: ${YELLOW}$BLOCKS_BEHIND${NC}"
    else
        echo -e "Sync Status: ${GREEN}100% (Fully Synced)${NC}"
    fi
else
    echo -e "Sync Status: ${YELLOW}Initializing...${NC}"
fi

# Convert size to human readable
if [ -n "$SIZE_ON_DISK" ]; then
    SIZE_GB=$(echo "scale=2; $SIZE_ON_DISK / 1073741824" | bc)
    echo -e "Size on Disk: ${GREEN}${SIZE_GB} GB${NC}"
fi

echo -e "Pruned:      ${GREEN}$PRUNED${NC}"
echo ""

# Network information
echo -e "${YELLOW}Network Information:${NC}"
echo "--------------------"

NETWORK_INFO=$(bitcoin-cli -conf="$CONFIG_FILE" getnetworkinfo 2>/dev/null)
PEER_INFO=$(bitcoin-cli -conf="$CONFIG_FILE" getpeerinfo 2>/dev/null)

if [ $? -eq 0 ]; then
    VERSION=$(echo "$NETWORK_INFO" | grep -o '"version":[0-9]*' | cut -d':' -f2)
    CONNECTIONS=$(echo "$NETWORK_INFO" | grep -o '"connections":[0-9]*' | cut -d':' -f2)
    CONNECTIONS_IN=$(echo "$NETWORK_INFO" | grep -o '"connections_in":[0-9]*' | cut -d':' -f2)
    CONNECTIONS_OUT=$(echo "$NETWORK_INFO" | grep -o '"connections_out":[0-9]*' | cut -d':' -f2)
    
    echo -e "Version:     ${GREEN}$VERSION${NC}"
    echo -e "Connections: ${GREEN}$CONNECTIONS${NC} (In: $CONNECTIONS_IN, Out: $CONNECTIONS_OUT)"
    
    # Show peer details if requested
    if [ "$1" == "-v" ] || [ "$1" == "--verbose" ]; then
        echo ""
        echo "Connected Peers:"
        echo "$PEER_INFO" | grep -o '"addr":"[^"]*"' | cut -d'"' -f4 | head -5
        PEER_COUNT=$(echo "$PEER_INFO" | grep -c '"addr"')
        if [ $PEER_COUNT -gt 5 ]; then
            echo "... and $((PEER_COUNT - 5)) more"
        fi
    fi
fi
echo ""

# Mempool information
echo -e "${YELLOW}Mempool Information:${NC}"
echo "--------------------"

MEMPOOL_INFO=$(bitcoin-cli -conf="$CONFIG_FILE" getmempoolinfo 2>/dev/null)

if [ $? -eq 0 ]; then
    MEMPOOL_SIZE=$(echo "$MEMPOOL_INFO" | grep -o '"size":[0-9]*' | cut -d':' -f2)
    MEMPOOL_BYTES=$(echo "$MEMPOOL_INFO" | grep -o '"bytes":[0-9]*' | cut -d':' -f2)
    MEMPOOL_USAGE=$(echo "$MEMPOOL_INFO" | grep -o '"usage":[0-9]*' | cut -d':' -f2)
    MIN_FEE=$(echo "$MEMPOOL_INFO" | grep -o '"mempoolminfee":[0-9.]*' | cut -d':' -f2)
    
    echo -e "Transactions: ${GREEN}$MEMPOOL_SIZE${NC}"
    
    if [ -n "$MEMPOOL_BYTES" ]; then
        MEMPOOL_MB=$(echo "scale=2; $MEMPOOL_BYTES / 1048576" | bc)
        echo -e "Size:        ${GREEN}${MEMPOOL_MB} MB${NC}"
    fi
    
    if [ -n "$MEMPOOL_USAGE" ]; then
        USAGE_MB=$(echo "scale=2; $MEMPOOL_USAGE / 1048576" | bc)
        echo -e "Memory:      ${GREEN}${USAGE_MB} MB${NC}"
    fi
    
    echo -e "Min Fee:     ${GREEN}$MIN_FEE BTC/kB${NC}"
fi
echo ""

# Wallet information (if available)
if bitcoin-cli -conf="$CONFIG_FILE" -rpcwallet=ord-signet getwalletinfo > /dev/null 2>&1; then
    echo -e "${YELLOW}Wallet Information:${NC}"
    echo "-------------------"
    
    WALLET_INFO=$(bitcoin-cli -conf="$CONFIG_FILE" -rpcwallet=ord-signet getwalletinfo)
    BALANCE=$(echo "$WALLET_INFO" | grep -o '"balance":[0-9.]*' | cut -d':' -f2)
    TX_COUNT=$(echo "$WALLET_INFO" | grep -o '"txcount":[0-9]*' | cut -d':' -f2)
    
    echo -e "Balance:     ${GREEN}$BALANCE BTC${NC}"
    echo -e "Transactions: ${GREEN}$TX_COUNT${NC}"
    echo ""
fi

# Ord server status
echo -e "${YELLOW}Ord Server Status:${NC}"
echo "------------------"

if pgrep -f "ord.*server" > /dev/null; then
    echo -e "${GREEN}✅ Ord server is running${NC}"
    
    # Check if ord API is responding
    if curl -s http://localhost:8080/status > /dev/null 2>&1; then
        echo -e "API Status:  ${GREEN}Responding${NC}"
        
        # Get inscription count if available
        INSCRIPTIONS=$(curl -s http://localhost:8080/status | grep -o '"inscriptions":[0-9]*' | cut -d':' -f2)
        if [ -n "$INSCRIPTIONS" ]; then
            echo -e "Inscriptions: ${GREEN}$INSCRIPTIONS${NC}"
        fi
    else
        echo -e "API Status:  ${YELLOW}Starting up...${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Ord server is not running${NC}"
    echo "   Start it with: ./scripts/ord-signet-start.sh"
fi
echo ""

# System resources
echo -e "${YELLOW}System Resources:${NC}"
echo "-----------------"

# Get Bitcoin Core process info
if [ "$(uname)" == "Darwin" ]; then
    # macOS
    BITCOIN_MEM=$(ps aux | grep "[b]itcoind" | awk '{print $4}')
    BITCOIN_CPU=$(ps aux | grep "[b]itcoind" | awk '{print $3}')
else
    # Linux
    BITCOIN_MEM=$(ps aux | grep "[b]itcoind" | awk '{print $4}')
    BITCOIN_CPU=$(ps aux | grep "[b]itcoind" | awk '{print $3}')
fi

if [ -n "$BITCOIN_MEM" ]; then
    echo -e "Bitcoin Core:"
    echo -e "  CPU:  ${GREEN}${BITCOIN_CPU}%${NC}"
    echo -e "  Mem:  ${GREEN}${BITCOIN_MEM}%${NC}"
fi

# Get ord process info if running
if pgrep -f "ord.*server" > /dev/null; then
    if [ "$(uname)" == "Darwin" ]; then
        ORD_MEM=$(ps aux | grep "[o]rd.*server" | awk '{print $4}')
        ORD_CPU=$(ps aux | grep "[o]rd.*server" | awk '{print $3}')
    else
        ORD_MEM=$(ps aux | grep "[o]rd.*server" | awk '{print $4}')
        ORD_CPU=$(ps aux | grep "[o]rd.*server" | awk '{print $3}')
    fi
    
    if [ -n "$ORD_MEM" ]; then
        echo -e "Ord Server:"
        echo -e "  CPU:  ${GREEN}${ORD_CPU}%${NC}"
        echo -e "  Mem:  ${GREEN}${ORD_MEM}%${NC}"
    fi
fi
echo ""

# Quick actions
echo -e "${BLUE}Quick Actions:${NC}"
echo "--------------"
echo "• View logs:        tail -f ~/.bitcoin/signet/debug.log"
echo "• Get new address:  ./scripts/signet-wallet.sh receive"
echo "• Check balance:    ./scripts/signet-wallet.sh balance"
echo "• Verbose mode:     $0 -v"

# Check for updates or issues
if [ "$BLOCKS" -lt "$HEADERS" ] && [ "$HEADERS" -gt 0 ]; then
    echo ""
    echo -e "${YELLOW}⚠️  Node is still syncing. This is normal for initial setup.${NC}"
    echo "   Full sync typically takes 30-60 minutes."
fi