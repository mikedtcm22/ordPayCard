#!/bin/bash

# Wallet management for Signet
# Usage: ./signet-wallet.sh [command] [args]

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Common ord parameters for Signet
ORD_PARAMS="--bitcoin-rpc-url http://127.0.0.1:38332 \
    --bitcoin-rpc-username ordtest \
    --bitcoin-rpc-password ordtest2024 \
    --chain signet"

# Bitcoin CLI parameters for Signet  
BTC_PARAMS="-rpcport=38332 -rpcuser=ordtest -rpcpassword=ordtest2024"

# Function to display help
show_help() {
    echo "Signet Wallet Helper Script"
    echo ""
    echo "Usage: $0 [command] [args]"
    echo ""
    echo "Commands:"
    echo "  create              - Create a new ord wallet"
    echo "  receive             - Get a new receive address"
    echo "  balance             - Check wallet balance"
    echo "  send <address> <amount> - Send BTC to an address"
    echo "  faucet              - Get Signet coins from faucet"
    echo "  list-unspent        - List unspent outputs"
    echo "  transactions        - List recent transactions"
    echo "  inscriptions        - List wallet inscriptions"
    echo "  cardinals           - List cardinal UTXOs"
    echo "  help                - Show this help message"
}

# Check if Bitcoin Core is running
check_bitcoin() {
    if ! bitcoin-cli $BTC_PARAMS getblockchaininfo > /dev/null 2>&1; then
        echo "❌ Bitcoin Core is not running. Start it first with ./signet-start.sh"
        exit 1
    fi
}

# Main command logic
case "${1:-help}" in
    create)
        check_bitcoin
        echo "Creating new ord wallet..."
        ord $ORD_PARAMS wallet create
        echo "✅ Wallet created successfully!"
        ;;
        
    receive)
        check_bitcoin
        echo "Getting receive address..."
        ADDRESS=$(ord $ORD_PARAMS wallet receive | grep "address" | cut -d'"' -f4)
        echo "📬 Receive address: $ADDRESS"
        echo ""
        echo "You can get Signet coins from: https://signet.bc-2.jp/"
        ;;
        
    balance)
        check_bitcoin
        echo "Checking wallet balance..."
        ord $ORD_PARAMS wallet balance
        ;;
        
    send)
        check_bitcoin
        if [ $# -lt 3 ]; then
            echo "Usage: $0 send <address> <amount>"
            exit 1
        fi
        ADDRESS="$2"
        AMOUNT="$3"
        echo "Sending $AMOUNT BTC to $ADDRESS..."
        ord $ORD_PARAMS wallet send --fee-rate 1 "$ADDRESS" "$AMOUNT"
        echo "✅ Transaction sent!"
        ;;
        
    faucet)
        check_bitcoin
        echo "Getting receive address for faucet..."
        ADDRESS=$(ord $ORD_PARAMS wallet receive | grep "address" | cut -d'"' -f4)
        echo "📬 Your Signet address: $ADDRESS"
        echo ""
        echo "Visit one of these faucets:"
        echo "  1. https://signet.bc-2.jp/ (Main faucet)"
        echo "  2. https://alt.signetfaucet.com/ (Alternative)"
        echo ""
        echo "Copy your address and request coins from the faucet."
        echo "After receiving, check balance with: $0 balance"
        ;;
        
    list-unspent)
        check_bitcoin
        echo "Listing unspent outputs..."
        ord $ORD_PARAMS wallet outputs
        ;;
        
    transactions)
        check_bitcoin
        echo "Listing recent transactions..."
        ord $ORD_PARAMS wallet transactions
        ;;
        
    inscriptions)
        check_bitcoin
        echo "Listing wallet inscriptions..."
        ord $ORD_PARAMS wallet inscriptions
        ;;
        
    cardinals)
        check_bitcoin
        echo "Listing cardinal UTXOs (safe to spend)..."
        ord $ORD_PARAMS wallet cardinals
        ;;
        
    help|*)
        show_help
        ;;
esac