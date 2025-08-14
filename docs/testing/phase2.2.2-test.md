# Phase 2.2.2: PSBT Generation Testing Guide

**Phase:** 2.2.2 - PSBT Generation for Inscriptions  
**Test Type:** Integration Testing  
**Network:** Bitcoin Signet  
**Last Updated:** August 1, 2025

---

## Prerequisites

### 1. Environment Setup
```bash
# Install dependencies
cd /Users/michaelchristopher/repos/ordPayCard
npm run install:all

# Copy and configure environment
cd server
cp .env.example .env
```

### 2. Configure .env
```env
# Bitcoin Network Configuration
BITCOIN_NETWORK=signet
TREASURY_ADDRESS=tb1pjqfzx3qye9hhgf0h7w9d5vhxfgjv7hgw56yp6xttz7t6h3kc8h3s0x49wn

# API Configuration
ORDINALS_API_URL=https://api.hiro.so
CLIENT_URL=http://localhost:3000

# Security
JWT_SECRET=your-secure-secret-here
JWT_EXPIRES_IN=24h
```

### 3. Wallet Requirements
- **Unisat Wallet** with Signet sats (recommended)
- OR **Sparrow Wallet** connected to Signet
- Minimum balance: 50,000 sats for testing

---

## Testing Steps

### Step 1: Start the Application
```bash
# From project root
npm run dev

# Server runs on: http://localhost:3001
# Client runs on: http://localhost:3000
```

### Step 2: Obtain Authentication Token
1. Navigate to `http://localhost:3000/auth`
2. Connect your wallet
3. Sign the authentication message
4. Save the JWT token from localStorage or network response

### Step 3: Test Fee Estimation

#### Via API:
```bash
curl -X GET "http://localhost:3001/api/inscriptions/estimate?feeRate=10&initialTopUp=50000"
```

#### Expected Response:
```json
{
  "success": true,
  "estimate": {
    "inscriptionSize": 420,
    "commitFee": 2200,
    "revealFee": 4620,
    "topUpAmount": 50000,
    "totalCost": 57366,
    "breakdown": [
      "Inscription size: 420 vbytes",
      "Commit transaction: 2200 sats",
      "Reveal transaction: 4620 sats",
      "Inscription output: 546 sats (dust limit)",
      "Initial top-up: 50000 sats",
      "Total cost: 57366 sats"
    ],
    "templateSize": 8417,
    "feeRate": 10
  }
}
```

### Step 4: Create Test PSBTs

#### Via PSBT Debug Interface:
1. Navigate to `http://localhost:3000/psbt-debug`
2. Configure test parameters:
   - **UTXOs**: Use dummy values for testing
   - **Recipient Address**: Your Signet address
   - **Change Address**: Your Signet address
   - **Initial Top-up**: 50000 sats (optional)
   - **Fee Rate**: 10 sats/vByte
3. Click "Create Test PSBT"

#### Via API:
```bash
curl -X POST http://localhost:3001/api/inscriptions/create-psbt \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "utxos": [{
      "txid": "YOUR_UTXO_TXID",
      "vout": 0,
      "value": 100000,
      "scriptPubKey": "YOUR_SCRIPT_PUBKEY"
    }],
    "recipientAddress": "tb1p_your_address",
    "changeAddress": "tb1p_your_change_address",
    "initialTopUp": 50000,
    "feeRate": 10
  }'
```

#### Expected Response:
```json
{
  "success": true,
  "commitPsbt": "cHNidP8BAH...",
  "revealPsbt": "cHNidP8BAH...",
  "fees": {
    "commit": 2200,
    "reveal": 4620,
    "total": 6820
  },
  "inscriptionAddress": "tb1p...",
  "contentHash": "abc123...",
  "contentSize": 8417,
  "instructions": [
    "1. Import and sign the COMMIT PSBT in your wallet",
    "2. Broadcast the signed commit transaction",
    "3. Wait for the commit tx to appear in mempool",
    "4. Note the commit transaction ID",
    "5. Update the reveal PSBT with the commit txid",
    "6. Import and sign the REVEAL PSBT in your wallet",
    "7. Broadcast the signed reveal transaction",
    "8. Your inscription will be created once confirmed",
    "9. Initial top-up of 50000 sats will be sent to treasury"
  ]
}
```

### Step 5: Sign and Broadcast Commit Transaction

#### Using Unisat:
1. Copy the `commitPsbt` value
2. Open Unisat wallet
3. Go to Settings → Advanced → PSBT
4. Paste the PSBT and click "Sign"
5. Broadcast the signed transaction
6. Note the transaction ID

#### Using Sparrow:
1. File → Load Transaction → From Text
2. Paste the commit PSBT
3. Sign with your wallet
4. Broadcast transaction
5. Note the transaction ID

### Step 6: Update Reveal PSBT
```bash
curl -X POST http://localhost:3001/api/inscriptions/update-reveal \
  -H "Content-Type: application/json" \
  -d '{
    "revealPsbt": "YOUR_REVEAL_PSBT_FROM_STEP_4",
    "commitTxid": "YOUR_COMMIT_TXID_FROM_STEP_5"
  }'
```

### Step 7: Sign and Broadcast Reveal Transaction
1. Use the updated reveal PSBT from Step 6
2. Sign and broadcast using same method as Step 5
3. Note the inscription ID (format: `{txid}i0`)

### Step 8: Verify Inscription
```bash
# Check inscription status
curl http://localhost:3001/api/inscriptions/status/{inscriptionId}

# View on explorer
# https://mempool.space/signet/tx/{revealTxid}
```

---

## Test Scenarios

### Scenario 1: Basic Inscription (No Top-up)
```json
{
  "utxos": [...],
  "recipientAddress": "tb1p...",
  "changeAddress": "tb1p...",
  "feeRate": 10
}
```

### Scenario 2: With Initial Top-up
```json
{
  "utxos": [...],
  "recipientAddress": "tb1p...",
  "changeAddress": "tb1p...",
  "initialTopUp": 50000,
  "feeRate": 10
}
```

### Scenario 3: High Fee Rate
```json
{
  "utxos": [...],
  "recipientAddress": "tb1p...",
  "changeAddress": "tb1p...",
  "feeRate": 50
}
```

---

## Debugging Tips

### Common Issues:

1. **"Insufficient funds" error**
   - Ensure UTXOs have enough value for fees + outputs
   - Minimum needed: ~10,000 sats without top-up

2. **"Invalid PSBT format" error**
   - Check that you're using the correct base64 encoded PSBT
   - Ensure no extra whitespace or characters

3. **Reveal transaction fails**
   - Make sure commit tx is confirmed or in mempool
   - Verify you updated reveal PSBT with correct commit txid

4. **Inscription not appearing**
   - Wait for confirmation (can take 10-30 minutes on Signet)
   - Check correct inscription ID format: `{txid}i0`

### Using PSBT Debug Tool:
1. Paste any PSBT to decode and inspect
2. View inputs, outputs, and fees
3. Verify transaction structure before signing

### Checking Treasury Balance:
```bash
# View treasury address
curl http://localhost:3001/api/inscriptions/treasury

# Check balance on explorer
# https://mempool.space/signet/address/{treasuryAddress}
```

---

## Expected Results

### Successful Inscription:
- Commit transaction broadcasts successfully
- Reveal transaction creates inscription
- Inscription ID follows format: `{revealTxid}i0`
- Content viewable at ordinals explorer
- Initial top-up (if included) sent to treasury

### Template Rendering:
- Inscription shows "EXPIRED" state initially (0 balance)
- Red gradient background with broken circuit pattern
- Balance displays as "0 sats"
- Decay rate shows "100 sats/block"

---

## Cleanup

After testing:
1. Note all inscription IDs for reference
2. Clear test data from PSBT debug tool
3. Logout to clear JWT token if needed

---

## Additional Resources

- [Ordinals Documentation](https://docs.ordinals.com)
- [Bitcoin Signet Faucet](https://signet.bc-2.jp/)
- [Mempool.space Signet Explorer](https://mempool.space/signet)
- [Unisat Wallet](https://unisat.io)
- [Sparrow Wallet](https://sparrowwallet.com)

---

*Note: This testing guide assumes you have already completed Phase 2.2.1 and have a working inscription template.*