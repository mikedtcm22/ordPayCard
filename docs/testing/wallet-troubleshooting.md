# Wallet Troubleshooting Guide

## Overview

This guide helps users register their NFTs when their wallet cannot add OP_RETURN data or when encountering other registration issues. It provides alternative methods and verification steps to ensure successful registration.

## Supported Wallets

### Wallet Capability Matrix

| Wallet | OP_RETURN Support | Manual PSBT | Notes |
|--------|------------------|-------------|-------|
| Sparrow Wallet | ✅ Full | ✅ Yes | Recommended for advanced users |
| Electrum | ✅ Full | ✅ Yes | Custom script support |
| Bitcoin Core | ✅ Full | ✅ Yes | Via bitcoin-cli |
| Xverse | ❌ No | ⚠️ Limited | Use alternative flow |
| Leather (Hiro) | ❌ No | ⚠️ Limited | Use alternative flow |
| UniSat | ⚠️ Partial | ✅ Yes | May require custom scripts |
| OrdinalSafe | ❌ No | ❌ No | Use raw builder flow |
| Phantom | ❌ No | ❌ No | Use raw builder flow |

### Wallet-Specific Notes

- **Sparrow Wallet**: Full OP_RETURN support via Script tab in transaction builder
- **Electrum**: Use console commands or custom output scripts
- **Bitcoin Core**: Full control via bitcoin-cli (see [opreturn-bitcoin-cli-examples.md](./opreturn-bitcoin-cli-examples.md))
- **Browser Wallets**: Most lack OP_RETURN support; use alternatives below

## Alternatives

### Option 1: Command Line Interface

For wallets without OP_RETURN support, use bitcoin-cli directly:

1. Export your private key from your wallet (if possible)
2. Import to Bitcoin Core or use standalone tools
3. Follow the [bitcoin-cli examples guide](./opreturn-bitcoin-cli-examples.md)

### Option 2: PSBT Builder Services

Use online PSBT builders (exercise caution with private keys):
- Sparrow Wallet (desktop application)
- Custom PSBT tools (verify source code first)
- Local bitcoinjs-lib scripts

### Option 3: Manual Registration Flow

For maximum privacy and control:
1. Server provides unsigned PSBT via `/api/manual/psbt`
2. Sign offline with your preferred method
3. Submit signature via `/api/manual/submit`

## Raw Builder Flow

### Step-by-Step Raw Transaction Building

1. **Prepare the OP_RETURN data**:
   ```bash
   # Format: <NFT_ID>|<EXPIRY_BLOCK>
   DATA="your_nft_id_here|855000"
   HEX_DATA=$(echo -n "$DATA" | xxd -p)
   ```

2. **Create the raw transaction**:
   ```bash
   bitcoin-cli createrawtransaction '[
     {"txid":"YOUR_UTXO_TXID", "vout":0}
   ]' '[
     {"data":"'$HEX_DATA'"},
     {"CREATOR_ADDRESS":0.001}
   ]'
   ```

3. **Fund, sign, and broadcast**:
   ```bash
   # Fund the transaction
   FUNDED=$(bitcoin-cli fundrawtransaction $RAW_TX)
   
   # Sign it
   SIGNED=$(bitcoin-cli signrawtransactionwithwallet $FUNDED)
   
   # Send it
   bitcoin-cli sendrawtransaction $SIGNED
   ```

### Using PSBT (Recommended)

```bash
# Create and fund PSBT in one step
PSBT=$(bitcoin-cli walletcreatefundedpsbt '[]' '[
  {"data":"'$HEX_DATA'"},
  {"'$CREATOR_ADDRESS'":0.001}
]' 0 '{"fee_rate":10}')

# Process and finalize
PROCESSED=$(bitcoin-cli walletprocesspsbt $PSBT)
FINAL=$(bitcoin-cli finalizepsbt $PROCESSED)
bitcoin-cli sendrawtransaction $FINAL
```

## Verification

### How to Verify Your Registration Transaction

1. **Check OP_RETURN presence**:
   ```bash
   # Decode your transaction
   bitcoin-cli decoderawtransaction "YOUR_TX_HEX"
   
   # Look for output with "scriptPubKey": {"type": "nulldata"}
   ```

2. **Verify payment amount**:
   - Ensure payment to creator address meets minimum fee
   - Check all outputs are included in the transaction

3. **Validate inscription binding**:
   - OP_RETURN data must contain exact NFT inscription ID
   - Expiry block must be in the future

4. **Use Status API for confirmation**:
   ```bash
   # Check registration status
   curl https://api.example.com/api/registration/YOUR_NFT_ID
   
   # Examine debug fields
   # Response includes: isRegistered, lastRegistration, integrity, debug
   ```

### Debug Using Status API

The registration status API provides debug information:

```json
GET /api/registration/{nftId}

Response:
{
  "isRegistered": true,
  "lastRegistration": {...},
  "integrity": {...},
  "debug": {
    "H_parent": 850000,
    "H_child": 850000,
    "feeHeight": 849999,
    "K": 1
  }
}
```

Debug fields help identify issues:
- `H_parent` / `H_child` mismatch: Provenance validation failed
- `feeHeight` too old: Transaction expired
- Missing fields: Transaction structure issues

## Common Errors and Solutions

### Error: "Missing OP_RETURN in transaction"

**Problem**: Transaction doesn't include OP_RETURN output

**Solution**: 
- Verify hex encoding is correct
- Ensure "data" field is in outputs array
- Check wallet supports OP_RETURN

### Error: "Invalid inscription ID format"

**Problem**: NFT ID in OP_RETURN doesn't match expected format

**Solution**:
- Format: `<txid>i<vout>` (66 characters + 'i' + number)
- No spaces or extra characters
- Case-sensitive (usually lowercase)

### Error: "Payment amount insufficient"

**Problem**: Payment to creator address below minimum

**Solution**:
- Check minimum fee requirement
- Ensure all payment outputs go to correct address
- Account for network fees separately

### Error: "Transaction rejected by network"

**Problem**: Bitcoin network rejected the transaction

**Solution**:
- Check if inputs are already spent
- Verify transaction is properly signed
- Ensure fee rate is adequate
- Use `testmempoolaccept` to validate before sending

### Error: "Expiry block already passed"

**Problem**: The expiry block in OP_RETURN is in the past

**Solution**:
- Use current block height + 144 (approximately 24 hours)
- Query current block height: `bitcoin-cli getblockcount`
- Update and recreate transaction

## FAQ

### Q: My wallet doesn't support OP_RETURN. What are my options?

You have three alternatives:
1. Use bitcoin-cli directly (most control)
2. Switch to a compatible wallet like Sparrow
3. Use the manual registration flow with PSBTs

### Q: How do I know if my registration succeeded?

Check the status API endpoint `/api/registration/{your-nft-id}`. The `isRegistered` field will be `true` if successful.

### Q: Can I register without revealing my wallet?

Yes, use the manual flow:
1. Request unsigned PSBT from server
2. Sign offline
3. Submit only the signature

### Q: What if my transaction is stuck?

If your transaction has RBF enabled:
```bash
bitcoin-cli bumpfee "TXID"
```

Otherwise, wait for it to drop from mempool or use CPFP (Child Pays For Parent).

### Q: How long is my registration valid?

Registrations are valid until the NFT is transferred to a new owner. The provenance system requires `H_child == H_parent` for validity.

### Q: Can I automate the registration process?

Yes, see the [bitcoin-cli examples](./opreturn-bitcoin-cli-examples.md) for scriptable commands. You can also use bitcoinjs-lib or similar libraries.

### Q: What's the maximum OP_RETURN size?

Standard OP_RETURN is limited to 80 bytes. The inscription ID and expiry block typically use ~75 bytes, leaving margin for the pipe separator.

## Additional Resources

- [Bitcoin-cli OP_RETURN Examples](./opreturn-bitcoin-cli-examples.md)
- [Registration Parser Documentation](../../server/src/services/registration/parser/)
- [Status API Documentation](../../server/src/routes/registration.ts)
- [Manual Registration Flow Guide](../phases-card/phase-2.2/)

## Network-Specific Setup

### Regtest
- Default for development
- Instant block generation
- Full control over blockchain state

### Signet
- Public test network
- Predictable block times
- Faucets available for testing

### Testnet
- Older test network
- Variable block times
- May experience reorgs

### Mainnet
- Production network
- Real value at stake
- Always test thoroughly first