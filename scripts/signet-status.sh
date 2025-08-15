#!/bin/bash

# Simple Bitcoin Signet sync status checker

echo "Bitcoin Signet Sync Status"
echo "=========================="
bitcoin-cli -rpcuser=ordtest -rpcpassword=ordtest2024 -rpcport=38332 getblockchaininfo | grep -E '"blocks"|"headers"|"verificationprogress"|"size_on_disk"'