#!/bin/bash
# Initialize Bitcoin Core wallet for ord

echo "Creating Bitcoin Core wallet for ord..."
bitcoin-cli -rpcport=38332 -rpcuser=ordtest -rpcpassword=ordtest2024 \
    createwallet "ord-signet" false false "" false true
echo "✅ Wallet created"

# Generate address for funding
echo "Generating initial address..."
ADDRESS=$(bitcoin-cli -rpcport=38332 -rpcuser=ordtest -rpcpassword=ordtest2024 \
    -rpcwallet=ord-signet getnewaddress)
echo "📬 Your Signet address: $ADDRESS"
echo ""
echo "Get free Signet BTC from:"
echo "  • https://signet.bc-2.jp/"
echo "  • https://alt.signetfaucet.com/"
