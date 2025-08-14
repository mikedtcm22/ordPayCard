# Inscription Testing Guide

This directory contains tools and scripts for testing the recursive inscription functionality of the SatSpray membership card system.

## Overview

The membership card inscription uses recursive endpoints to:
- Fetch its own child inscriptions (receipts)
- Get the current block height
- Calculate balance with decay in real-time
- **NEW**: Deduplicate receipts by transaction ID to prevent double-counting

## Recent Updates (MVP Phase)

- Added transaction deduplication logic to prevent counting same payment multiple times
- Enhanced test harness with duplicate transaction ID testing
- Added documentation clarifying trust model (MVP trusts receipts, Phase 2.2.1c will verify)

## Files

- `test-recursive-endpoints.html` - Browser-based test harness with mock endpoints
- `test-ord-local.sh` - Script to guide testing with local ord server
- `minify-inscription.js` - Script to minify the inscription template
- `membershipCard-recursive.html` - Full recursive inscription template (in client/src/templates/inscription/)
- `membershipCard.min.html` - Minified version for production inscription

## Infrastructure Requirements

### Required Software

#### 1. Bitcoin Core (Required for blockchain testing)
- ord depends on Bitcoin Core for blockchain data
- Download from: https://bitcoin.org/en/download

**macOS Installation:**
```bash
# Using Homebrew
brew install bitcoin

# Or download the .dmg from bitcoin.org
```

**Linux Installation:**
```bash
# Ubuntu/Debian
sudo apt-get install bitcoin-core

# Or download tarball from bitcoin.org
```

#### 2. ord (Required)
- The ordinals protocol implementation
- Provides the server with recursive endpoints
- Download from: https://github.com/ordinals/ord

**Installation Options:**

```bash
# Option 1: Install via script (recommended)
curl --proto '=https' --tlsv1.2 -fsLS https://ordinals.com/install.sh | bash

# Option 2: Build from source (requires Rust)
git clone https://github.com/ordinals/ord.git
cd ord
cargo build --release
sudo cp target/release/ord /usr/local/bin/

# Option 3: Download pre-built binary
# Visit https://github.com/ordinals/ord/releases
```

### Infrastructure Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Bitcoin Core  │────▶│   ord server    │────▶│   Your Browser  │
│   (bitcoind)    │     │  (indexes data) │     │  (views inscr.) │
└─────────────────┘     └─────────────────┘     └─────────────────┘
     Blockchain              Ordinals               Inscription
       Data                 Protocol                 Display
```

## Quick Start

### 1. Browser Testing with Mock Data (No Installation Required)

This is the easiest way to test the inscription logic without any blockchain infrastructure:

```bash
open inscription-testing/test-recursive-endpoints.html
```

This provides:
- Mock recursive endpoints
- Configurable test data
- Real-time logging
- Ability to test the cardStatus() function

### 2. Local ord Server Testing - Regtest Mode

**Step 1: Setup Bitcoin Core for Regtest**
```bash
# Start Bitcoin Core in regtest mode (local blockchain)
bitcoind -regtest -daemon

# Create a wallet (first time only)
bitcoin-cli -regtest createwallet "test"

# Generate some blocks to have coins
bitcoin-cli -regtest generatetoaddress 101 $(bitcoin-cli -regtest getnewaddress)
```

**Step 2: Start ord Server**
```bash
# In a separate terminal, start ord server
ord --regtest server --http-port 8080 --enable-index-runes --enable-json-api

# Verify it's running by visiting: http://localhost:8080
```

**Step 3: Create ord Wallet**
```bash
# Create ord wallet (first time only)
ord --regtest wallet create

# Get a receive address
ord --regtest wallet receive

# Fund the ord wallet from Bitcoin Core
bitcoin-cli -regtest sendtoaddress <ORD_ADDRESS> 1
bitcoin-cli -regtest generatetoaddress 1 $(bitcoin-cli -regtest getnewaddress)
```

**Step 4: Create Parent Inscription**
```bash
# Inscribe the membership card
ord --regtest wallet inscribe --fee-rate 1 --file client/src/templates/inscription/membershipCard.min.html

# Note the inscription ID (format: <txid>i<index>)
# Example: 6fb976ab49dcec017f1e201e84395983204ae1a7c2abf7ced0a85d692e442799i0
```

**Step 5: Create Child Receipt Inscriptions**
```bash
# Create a receipt JSON file
cat > receipt1.json << EOF
{
  "schema": "satspray.topup.v1",
  "parent": "YOUR_PARENT_INSCRIPTION_ID",
  "amount": 100000,
  "block": 100,
  "paid_to": "bcrt1q...",
  "txid": "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
}
EOF

# Update the parent ID and treasury address in the file

# Inscribe as child
ord --regtest wallet inscribe --fee-rate 1 --parent YOUR_PARENT_ID --file receipt1.json

# Generate a block to confirm
bitcoin-cli -regtest generatetoaddress 1 $(bitcoin-cli -regtest getnewaddress)
```

**Step 6: View and Test**
```bash
# Open in browser
open http://localhost:8080/inscription/YOUR_PARENT_INSCRIPTION_ID

# Check browser console for logs
# Call window.cardStatus() to test
```

### 3. Signet Testing with Bitcoin Core and ord Client

This approach uses Bitcoin Core on Signet with the ord client for full inscription control and recursive endpoint testing.

**Step 1: Setup Bitcoin Core for Signet**
```bash
# Create Bitcoin config for Signet
mkdir -p ~/.bitcoin
cat > ~/.bitcoin/bitcoin.conf << EOF
signet=1
txindex=1
server=1
rpcuser=orduser
rpcpassword=ordpass
[signet]
rpcport=38332
EOF

# Start Bitcoin Core on Signet
bitcoind -signet -daemon

# Wait for sync (this will take time - check progress)
bitcoin-cli -signet getblockchaininfo

# Create a wallet
bitcoin-cli -signet createwallet "signet_testing"
```

**Step 2: Get Signet Coins**
```bash
# Get a new address
SIGNET_ADDR=$(bitcoin-cli -signet getnewaddress)
echo "Your Signet address: $SIGNET_ADDR"

# Visit faucets to get test coins:
# - https://signet.bc-2.jp/
# - https://alt.signetfaucet.com/
# Send to your $SIGNET_ADDR

# Check balance
bitcoin-cli -signet getbalance
```

**Step 3: Start ord Server on Signet**
```bash
# In a new terminal, start ord server
ord --signet server --http-port 8080 --enable-index-runes --enable-json-api

# Verify it's running
curl http://localhost:8080/status
```

**Step 4: Setup ord Wallet**
```bash
# Create ord wallet for Signet
ord --signet wallet create

# Get ord receive address
ORD_ADDR=$(ord --signet wallet receive)
echo "Ord address: $ORD_ADDR"

# Send coins from Bitcoin Core to ord wallet
bitcoin-cli -signet sendtoaddress $ORD_ADDR 0.001

# Wait for confirmation (check mempool)
bitcoin-cli -signet getmempoolinfo

# Check ord wallet balance
ord --signet wallet balance
```

**Step 5: Inscribe Parent Membership Card**
```bash
# Prepare the inscription file
node inscription-testing/minify-inscription.js

# Update treasury address in the template (replace tb1q... with your treasury)
sed -i '' 's/tb1q\.\.\./YOUR_SIGNET_TREASURY_ADDRESS/g' \
  client/src/templates/inscription/membershipCard.min.html

# Inscribe the membership card
PARENT_OUTPUT=$(ord --signet wallet inscribe \
  --fee-rate 10 \
  --file client/src/templates/inscription/membershipCard.min.html)

# Extract inscription ID
PARENT_ID=$(echo "$PARENT_OUTPUT" | grep -oE '[a-f0-9]{64}i[0-9]+' | head -1)
echo "Parent inscription ID: $PARENT_ID"

# Wait for confirmation
sleep 30
```

**Step 6: Create Child Receipt Inscriptions**
```bash
# Get current block height
CURRENT_BLOCK=$(bitcoin-cli -signet getblockcount)

# Create first receipt
cat > receipt1.json << EOF
{
  "schema": "satspray.topup.v1",
  "parent": "$PARENT_ID",
  "amount": 100000,
  "block": $((CURRENT_BLOCK - 100)),
  "paid_to": "YOUR_SIGNET_TREASURY_ADDRESS",
  "txid": "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
}
EOF

# Create second receipt (optionally with same txid for dedup testing)
cat > receipt2.json << EOF
{
  "schema": "satspray.topup.v1",
  "parent": "$PARENT_ID",
  "amount": 50000,
  "block": $((CURRENT_BLOCK - 50)),
  "paid_to": "YOUR_SIGNET_TREASURY_ADDRESS",
  "txid": "fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321"
}
EOF

# Inscribe receipts as children
ord --signet wallet inscribe --fee-rate 10 --parent $PARENT_ID --file receipt1.json
ord --signet wallet inscribe --fee-rate 10 --parent $PARENT_ID --file receipt2.json
```

**Step 7: View and Test with Recursive Endpoints**
```bash
# Open the parent inscription in browser
open http://localhost:8080/inscription/$PARENT_ID

# The inscription should now:
# 1. Fetch its children via /r/children/
# 2. Get current block height via /r/blockheight
# 3. Calculate and display balance with decay
# 4. Deduplicate if receipts share same txid

# Test in browser console:
# - Check window.INSCRIPTION_ID
# - Call window.cardStatus()
# - Look for deduplication logs if testing duplicate txids
```

**Step 8: Monitor and Debug**
```bash
# Check ord server logs for recursive endpoint calls
# Look for requests to:
# - /r/blockheight
# - /r/children/{id}/inscriptions
# - /r/content/{child_id}

# View inscription on mempool.space (Signet)
open "https://mempool.space/signet/tx/${PARENT_ID%i*}"

# List all inscriptions in wallet
ord --signet wallet inscriptions
```

**Step 9: Test Deduplication (Optional)**
```bash
# Create duplicate receipt with same txid as receipt1
cat > receipt3.json << EOF
{
  "schema": "satspray.topup.v1",
  "parent": "$PARENT_ID",
  "amount": 75000,
  "block": $((CURRENT_BLOCK - 25)),
  "paid_to": "YOUR_SIGNET_TREASURY_ADDRESS",
  "txid": "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
}
EOF

# Inscribe it
ord --signet wallet inscribe --fee-rate 10 --parent $PARENT_ID --file receipt3.json

# Refresh inscription page - should see deduplication log
# Only one payment per txid should count toward balance
```

### Storage Requirements

- **Regtest**: ~100MB (minimal, local only)
- **Signet**: ~10-20GB (test network)
- **Mainnet**: ~500GB+ (full blockchain - not recommended for testing)

## Manual Testing Checklist

### Phase 1: Mock Testing (No Blockchain Required)
- [ ] Open test-recursive-endpoints.html in browser
- [ ] Configure mock inscription ID and treasury address
- [ ] Add test receipts with different amounts and blocks
- [ ] Click "Reload Inscription" to test
- [ ] Verify balance calculation is correct
- [ ] Test cardStatus() function in console
- [ ] Check that card shows Active/Expired correctly
- [ ] **NEW**: Test duplicate transaction IDs
  - [ ] Check "Use same txid as Receipt 2" checkbox
  - [ ] Verify deduplication log appears in console
  - [ ] Confirm only one instance counts toward balance

### Phase 2: Local Blockchain Testing (Regtest)
- [ ] Install Bitcoin Core and ord
- [ ] Start bitcoind in regtest mode
- [ ] Start ord server with recursive endpoints enabled
- [ ] Create and fund ord wallet
- [ ] Inscribe parent membership card
- [ ] Create child receipt inscriptions
- [ ] View parent inscription in browser
- [ ] Verify recursive endpoints work:
  - [ ] Check console for `/r/blockheight` calls
  - [ ] Check console for `/r/children/{id}/inscriptions` calls
  - [ ] Check console for `/r/content/{id}` calls
- [ ] Verify balance updates based on children

### Phase 3: Signet Testing with Bitcoin Core + ord
- [ ] Configure Bitcoin Core for Signet network
- [ ] Sync blockchain (may take 30-60 minutes)
- [ ] Get signet coins from faucet
- [ ] Start ord server with recursive endpoints enabled
- [ ] Create and fund ord wallet on Signet
- [ ] Update treasury address in minified template
- [ ] Inscribe parent membership card
- [ ] Create child receipt inscriptions with test data
- [ ] View inscription at http://localhost:8080/inscription/{ID}
- [ ] Verify recursive endpoints are working:
  - [ ] Check for `/r/blockheight` calls in console
  - [ ] Check for `/r/children/` calls
  - [ ] Check for `/r/content/` calls for each child
- [ ] Test deduplication with duplicate txid receipts
- [ ] Verify balance calculation with decay

### Technical Verification
- [ ] Inscription identifies itself correctly from URL
- [ ] Fetches current block height via `/r/blockheight`
- [ ] Fetches children via `/r/children/{id}/inscriptions`
- [ ] Parses receipt JSON from child content
- [ ] Validates receipt schema and parent relationship
- [ ] Calculates balance with proper decay
- [ ] Updates UI to show active/expired status
- [ ] Handles errors gracefully
- [ ] cardStatus() function returns correct data
- [ ] Template size under 15KB when minified

## Receipt Format

Child inscriptions must contain JSON in this format:

```json
{
  "schema": "satspray.topup.v1",
  "parent": "parent_inscription_id",
  "amount": 100000,
  "block": 849900,
  "paid_to": "tb1q...",
  "txid": "transaction_id"
}
```

**MVP Note**: In the current phase, receipts are trusted without blockchain verification. The inscription validates the receipt structure and deduplicates by transaction ID, but doesn't verify the actual Bitcoin transaction. Phase 2.2.1c will add a parser library that validates payments using OP_RETURN data.

## Debugging

1. Open browser console when viewing inscription
2. Check for fetch requests to `/r/` endpoints
3. Look for console.log output showing receipt processing
4. Call `window.cardStatus()` to test the API
5. Check `window.INSCRIPTION_ID` to verify ID detection

## Common Issues

### CORS Errors
- Ensure you're accessing through ord server, not file://
- Use http://localhost:8080/inscription/ID format

### Children Not Found
- Verify parent-child relationship with `--parent` flag
- Check that child inscriptions are confirmed
- Use ord API to verify: `/r/children/PARENT_ID`
- In regtest, remember to mine a block after inscribing

### Invalid Receipt Format
- Ensure child content is valid JSON
- Check all required fields are present
- Verify parent ID matches exactly

### Bitcoin Core Connection Issues
- Check bitcoind is running: `bitcoin-cli -regtest getblockchaininfo`
- Ensure correct network flag (regtest/signet) matches between bitcoind and ord
- Default RPC port for regtest: 18443, signet: 38332

### Insufficient Funds
- For regtest: Generate more blocks to your address
- For signet: Use faucets listed above
- Check wallet balance: `ord --regtest wallet balance`

## Next Steps

After successful testing:
1. Deploy to Bitcoin Signet for real blockchain testing
2. Create multiple test receipts with different amounts/blocks
3. Test with 10+ receipts to verify performance
4. Monitor inscription via ordinals explorer

## Size Optimization

Current sizes (with deduplication and documentation):
- Full template: ~23KB
- Minified: ~3.8KB (well under 15KB limit)

To further reduce size if needed:
- Remove console.log statements
- Shorten variable names
- Optimize SVG assets
- Remove error messages

## Support

For issues or questions:
- Check browser console for errors
- Verify ord server is running with correct flags
- Ensure recursive endpoints are enabled
- Test with mock data first before real inscriptions