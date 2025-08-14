# Phase 2 Enhanced Validation - Signet Testing Guide

This guide provides specific instructions for testing Phase 2 enhanced validation features on Signet.

## Phase 2 Requirements Overview

From `docs/reg-phases/phase-2-enhanced-validation.md`:
- OP_RETURN-based payment binding to NFT inscription ID
- Parser v1.0 with hex parsing and output validation
- Satpoint-based last-transfer gating
- On-chain API library (Embers Core v1)

## Setup Checklist

```bash
# 1. Start services
./scripts/signet-start.sh
./scripts/ord-signet-start.sh

# 2. Ensure wallet is funded
./scripts/signet-wallet.sh balance
# If needed: ./scripts/signet-wallet.sh faucet
```

## Test Scenarios

### 1. OP_RETURN Payment Validation

Create a registration payment with OP_RETURN data:

```bash
# Example inscription ID and expiry block
INSCRIPTION_ID="abc123def456..." # Replace with actual
EXPIRY_BLOCK=200000 # Future block height

# Create OP_RETURN data format: <inscription_id>|<expiry_block>
OP_RETURN_DATA="${INSCRIPTION_ID}|${EXPIRY_BLOCK}"

# Convert to hex
OP_RETURN_HEX=$(echo -n "$OP_RETURN_DATA" | xxd -p)

# Create transaction with OP_RETURN
bitcoin-cli -rpcport=38332 -rpcuser=ordtest -rpcpassword=ordtest2024 \
  createrawtransaction '[]' \
  "{\"data\":\"$OP_RETURN_HEX\",\"tb1q...\":0.0001}"
```

### 2. Parser Testing Script

Create a test script for parser validation:

```javascript
// test-parser-signet.js
const SIGNET_CONFIG = {
  network: 'signet',
  rpcUrl: 'http://127.0.0.1:38332',
  rpcUser: 'ordtest',
  rpcPassword: 'ordtest2024'
};

async function testParserValidation(txHex, creatorAddr, minFee, nftId) {
  // Parser should extract OP_RETURN
  const opReturnData = parseOpReturn(txHex);
  console.log('OP_RETURN extracted:', opReturnData);
  
  // Verify inscription ID matches
  if (opReturnData.nftId !== nftId) {
    console.log('❌ NFT ID mismatch');
    return 0n;
  }
  
  // Check expiry
  const currentBlock = await getCurrentBlock();
  if (opReturnData.expiryBlock < currentBlock) {
    console.log('❌ Registration expired');
    return 0n;
  }
  
  // Sum payments to creator
  const totalPaid = sumOutputsToAddress(txHex, creatorAddr, 'signet');
  console.log('✅ Total paid:', totalPaid);
  
  return totalPaid >= minFee ? totalPaid : 0n;
}
```

### 3. Satpoint Gating Test

Test last-transfer height validation:

```bash
# Get inscription metadata with satpoint
curl http://localhost:8080/inscription/<inscription_id>

# Extract satpoint (format: txid:vout:offset)
# Extract txid from satpoint
# Get transaction block height
bitcoin-cli -rpcport=38332 -rpcuser=ordtest -rpcpassword=ordtest2024 \
  getrawtransaction <txid> 1 | jq .blockheight

# Registration must have block height >= last transfer height
```

### 4. Parent-Child Inscription Test

Deploy parent template and child registration:

```bash
# Step 1: Prepare parent template with validation logic
cat > test-parent.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
  <script src="/content/<EMBERS_CORE_ID>"></script>
</head>
<body>
  <div id="membership-card">
    <h1>Test Membership</h1>
    <div id="status">Checking...</div>
  </div>
  <script>
    async function validateRegistration() {
      const children = await fetch('/r/children/<THIS_ID>').then(r => r.json());
      for (const child of children) {
        const receipt = await fetch('/content/' + child.id).then(r => r.json());
        const amount = await EmbersCore.verifyPayment(
          receipt.feeTxid,
          'tb1q...', // creator address
          100000n,  // min fee
          '<THIS_ID>',
          { network: 'signet', currentBlock: await getBlockHeight() }
        );
        if (amount > 0n) {
          document.getElementById('status').textContent = 'Active';
          return;
        }
      }
      document.getElementById('status').textContent = 'Inactive';
    }
    validateRegistration();
  </script>
</body>
</html>
EOF

# Step 2: Inscribe parent
PARENT_ID=$(./scripts/signet-inscribe.sh test-parent.html 1 | grep "inscription" | cut -d' ' -f3)
echo "Parent inscription: $PARENT_ID"

# Step 3: Create child registration receipt
cat > test-receipt.json << EOF
{
  "feeTxid": "<payment_txid>",
  "creatorAddress": "tb1q...",
  "amount": 100000,
  "buyerOrdinal": "tb1q...",
  "timestamp": $(date +%s)
}
EOF

# Step 4: Inscribe child with parent reference
ord --chain signet wallet inscribe \
  --parent $PARENT_ID \
  --fee-rate 1 \
  --file test-receipt.json
```

### 5. Embers Core Library Deployment

Deploy the on-chain API library:

```bash
# Build Embers Core bundle
cd client
npm run build:embers-core

# Inscribe library as parent
EMBERS_CORE_ID=$(./scripts/signet-inscribe.sh \
  dist/embers-core.min.js 1 | grep "inscription" | cut -d' ' -f3)

echo "Embers Core Library ID: $EMBERS_CORE_ID"

# Update environment
echo "VITE_EMBERS_CORE_SIGNET_ID=$EMBERS_CORE_ID" >> .env
```

## Automated Test Suite

Create comprehensive test runner:

```bash
#!/bin/bash
# test-phase2-signet.sh

echo "Phase 2 Signet Testing Suite"
echo "============================"

# Test 1: OP_RETURN Validation
echo "Test 1: OP_RETURN Validation"
node test-op-return.js
[ $? -eq 0 ] && echo "✅ PASS" || echo "❌ FAIL"

# Test 2: Parser Output Types
echo "Test 2: Parser Output Types"
for type in P2PKH P2WPKH P2TR; do
  echo "  Testing $type..."
  node test-parser.js --type $type
done

# Test 3: Satpoint Gating
echo "Test 3: Satpoint Gating"
./test-satpoint-gating.sh

# Test 4: Deduplication
echo "Test 4: Deduplication"
node test-dedupe.js

# Test 5: Integration
echo "Test 5: Full Integration"
./test-full-registration.sh

echo ""
echo "Test Summary"
echo "============"
```

## Manual Testing Checklist

### Pre-inscription
- [ ] Bitcoin Core synced on Signet
- [ ] Ord server indexed and running
- [ ] Wallet funded with Signet BTC
- [ ] Test data prepared

### OP_RETURN Testing
- [ ] Create transaction with OP_RETURN
- [ ] Verify OP_RETURN contains inscription ID
- [ ] Verify expiry block is future
- [ ] Test expired registration (past block)
- [ ] Test missing OP_RETURN (should fail)
- [ ] Test mismatched inscription ID (should fail)

### Parser Testing
- [ ] Test P2PKH output parsing
- [ ] Test P2WPKH output parsing
- [ ] Test P2TR output parsing
- [ ] Test mixed output types
- [ ] Test fee summation
- [ ] Test defensive bounds

### Satpoint Gating
- [ ] Get parent last transfer height
- [ ] Create receipt with older block (should fail)
- [ ] Create receipt with newer block (should pass)
- [ ] Test unconfirmed transaction handling

### Integration Testing
- [ ] Deploy parent template
- [ ] Deploy Embers Core library
- [ ] Create child registration
- [ ] Verify activation in browser
- [ ] Test status API endpoint
- [ ] Verify 30s cache behavior

## Expected Results

### Successful Registration
```json
{
  "isRegistered": true,
  "lastRegistration": {
    "txid": "...",
    "amount": 100000,
    "blockHeight": 123456
  },
  "integrity": {
    "opReturnValid": true,
    "notExpired": true,
    "sufficientFee": true,
    "afterLastTransfer": true
  },
  "debug": {
    "lastTransferHeight": 123400
  }
}
```

### Failed Registration
```json
{
  "isRegistered": false,
  "error": "OP_RETURN missing or invalid",
  "integrity": {
    "opReturnValid": false,
    "notExpired": true,
    "sufficientFee": true,
    "afterLastTransfer": true
  }
}
```

## Debugging Commands

```bash
# Check specific transaction
bitcoin-cli -rpcport=38332 -rpcuser=ordtest -rpcpassword=ordtest2024 \
  getrawtransaction <txid> 1

# Decode raw transaction
bitcoin-cli -rpcport=38332 -rpcuser=ordtest -rpcpassword=ordtest2024 \
  decoderawtransaction <hex>

# Get current block height
bitcoin-cli -rpcport=38332 -rpcuser=ordtest -rpcpassword=ordtest2024 \
  getblockcount

# Check inscription content
curl http://localhost:8080/content/<inscription_id>

# Check inscription metadata
curl http://localhost:8080/inscription/<inscription_id>

# List children of parent
curl http://localhost:8080/r/children/<parent_id>
```

## Common Issues

### Issue: OP_RETURN not found in transaction
**Solution**: Ensure OP_RETURN is properly formatted in hex and included in outputs

### Issue: Parser returns 0 despite payment
**Solution**: Check inscription ID matches exactly, verify expiry block is future

### Issue: Satpoint gating always fails
**Solution**: Ensure fee transaction block height >= parent's last transfer height

### Issue: Children not appearing
**Solution**: Wait for confirmation, check parent ID is correct

## Next Steps

After successful Signet testing:
1. Document any issues found
2. Update parser implementation if needed
3. Prepare for mainnet deployment
4. Create user documentation