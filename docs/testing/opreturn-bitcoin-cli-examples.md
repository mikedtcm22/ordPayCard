# Bitcoin-cli OP_RETURN Examples for Registration

## Overview

This guide provides canonical bitcoin-cli command examples for creating registration fee transactions with embedded OP_RETURN data. The OP_RETURN output contains the inscription ID and expiry block in the format `<NFT_ID>|<EXPIRY_BLOCK>` to bind the payment to a specific NFT registration.

## Prerequisites

- Bitcoin Core node running (regtest, signet, testnet, or mainnet)
- `bitcoin-cli` configured with appropriate network and credentials
- Wallet with sufficient funds for the registration fee plus network fees
- Hex encoding tool or knowledge of manual hex conversion

## Regtest Example

### Step 1: Prepare the OP_RETURN Data

The OP_RETURN data format is: `<NFT_ID>|<EXPIRY_BLOCK>`

Example values:
- NFT_ID: `abc123def456789012345678901234567890123456789012345678901234567i0`
- EXPIRY_BLOCK: `850000`

Combined string: `abc123def456789012345678901234567890123456789012345678901234567i0|850000`

Convert to hex:
```bash
echo -n "abc123def456789012345678901234567890123456789012345678901234567i0|850000" | xxd -p
# Output: 6162633132336465663435363738393031323334353637383930313233343536373839303132333435363738393031323334353637383930313233343536376930377c383530303030
```

### Step 2: Create Raw Transaction with OP_RETURN

Using `createrawtransaction`:
```bash
# Get unspent outputs
bitcoin-cli listunspent

# Create transaction with OP_RETURN and payment output
bitcoin-cli createrawtransaction '[
  {
    "txid": "YOUR_UTXO_TXID",
    "vout": 0
  }
]' '[
  {
    "data": "6162633132336465663435363738393031323334353637383930313233343536373839303132333435363738393031323334353637383930313233343536376930377c383530303030"
  },
  {
    "CREATOR_ADDRESS": 0.001
  }
]'
```

### Step 3: Fund and Sign Transaction

Using `fundrawtransaction` for automatic input selection:
```bash
# Fund the transaction
bitcoin-cli fundrawtransaction "RAW_TX_HEX"

# Sign the funded transaction
bitcoin-cli signrawtransactionwithwallet "FUNDED_TX_HEX"

# Send the transaction
bitcoin-cli sendrawtransaction "SIGNED_TX_HEX"
```

### Alternative: Using PSBT (Recommended)

```bash
# Create PSBT with OP_RETURN
bitcoin-cli walletcreatefundedpsbt '[]' '[
  {
    "data": "6162633132336465663435363738393031323334353637383930313233343536373839303132333435363738393031323334353637383930313233343536376930377c383530303030"
  },
  {
    "CREATOR_ADDRESS": 0.001
  }
]' 0 '{"fee_rate": 10}'

# Process PSBT
bitcoin-cli walletprocesspsbt "PSBT_STRING"

# Finalize and send
bitcoin-cli finalizepsbt "PROCESSED_PSBT"
bitcoin-cli sendrawtransaction "FINAL_TX_HEX"
```

## Signet/Testnet Notes

For signet and testnet networks:
- Use appropriate network flag: `-signet` or `-testnet`
- Adjust fee rates based on network congestion
- Creator address must be valid for the target network
- Example testnet address: `tb1qexampleaddress...`
- Example signet address: `tb1qexampleaddress...`

### Signet-specific Command
```bash
bitcoin-cli -signet createrawtransaction '[...]' '[
  {"data": "HEX_ENCODED_DATA"},
  {"tb1q_creator_address": 0.001}
]'
```

## Mainnet Considerations

**⚠️ Warning: Mainnet transactions are irreversible and use real Bitcoin**

For mainnet:
- Double-check all addresses and amounts
- Use conservative fee estimates
- Test on regtest/signet first
- Consider using RBF (Replace-By-Fee) for fee adjustments
- Verify the expiry block is reasonable (typically current height + 144 blocks for ~24 hours)

### Mainnet Fee Estimation
```bash
# Get fee estimate for 6 block confirmation
bitcoin-cli estimatesmartfee 6

# Use the feerate in your transaction creation
```

## Troubleshooting

### Common Issues and Solutions

#### "Invalid OP_RETURN data"
- Ensure data is properly hex-encoded
- Check that the format includes the pipe separator `|`
- Verify inscription ID format (should end with 'i' followed by output index)

#### "Transaction rejected"
- Check if inputs are already spent
- Verify sufficient balance for fee + payment
- Ensure creator address is valid for the network

#### "Expiry block already passed"
- Use a future block height for `<EXPIRY_BLOCK>`
- Recommended: current height + 144 (approximately 24 hours)

#### "Missing OP_RETURN in transaction"
- Verify the "data" field is included in outputs
- Check hex encoding is correct
- Ensure no spaces in hex string

### Hex Encoding Reference

Convert string to hex (Linux/Mac):
```bash
echo -n "<NFT_ID>|<EXPIRY_BLOCK>" | xxd -p
```

Convert string to hex (using Python):
```bash
python3 -c "import sys; print(sys.argv[1].encode('utf-8').hex())" "<NFT_ID>|<EXPIRY_BLOCK>"
```

### Validation Commands

Verify transaction before sending:
```bash
# Decode to check structure
bitcoin-cli decoderawtransaction "TX_HEX"

# Test mempool acceptance
bitcoin-cli testmempoolaccept '["TX_HEX"]'
```

### Parser Validation Reference

The registration parser expects:
1. OP_RETURN output containing `<NFT_ID>|<EXPIRY_BLOCK>`
2. Payment output(s) to creator address totaling at least minimum fee
3. Transaction confirmed before expiry block height
4. For provenance validation: fee transaction height ≤ child inscription height

## Cross-References

- Parser implementation: `server/src/services/registration/parser/`
- Status API behavior: `server/src/routes/registration.ts`
- Template validation: `client/src/templates/inscription/registrationWrapper.html`