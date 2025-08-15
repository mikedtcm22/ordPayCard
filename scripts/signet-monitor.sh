#!/bin/bash

# Monitor Bitcoin Signet sync progress
# Press Ctrl+C to stop

while true; do
    clear
    echo "Bitcoin Signet Sync Progress - $(date)"
    echo "====================================="
    bitcoin-cli -rpcuser=ordtest -rpcpassword=ordtest2024 -rpcport=38332 getblockchaininfo | grep -E '"blocks"|"headers"|"verificationprogress"|"size_on_disk"'
    echo ""
    echo "Press Ctrl+C to stop monitoring"
    sleep 5
done