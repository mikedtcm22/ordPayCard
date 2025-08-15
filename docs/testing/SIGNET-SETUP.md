# Signet Setup Guide for Ordinals Testing

This guide helps you set up Bitcoin Core and ord to work with Signet testnet for testing Phase 2 enhanced validation features.

## Prerequisites

✅ Bitcoin Core v29.0.0 installed
✅ ord v0.23.2 installed

## Quick Start

```bash
# 1. Start Bitcoin Core on Signet
./scripts/signet-start.sh

# 2. Create ord wallet (first time only)
./scripts/signet-wallet.sh create

# 3. Get a receive address and fund from faucet
./scripts/signet-wallet.sh faucet

# 4. Start ord server
./scripts/ord-signet-start.sh

# 5. Check your balance
./scripts/signet-wallet.sh balance
```

## Configuration Files

### Bitcoin Core Configuration
Location: `configs/bitcoin-signet.conf`

Key settings:
- Network: Signet
- RPC Port: 38332
- P2P Port: 38333
- Username: ordtest
- Password: ordtest2024
- Full indexing enabled (txindex=1)
- Pruning disabled for ord compatibility

### Ord Configuration
Location: `configs/ord-signet.yaml`

Key settings:
- Chain: signet
- HTTP Port: 8080
- JSON API enabled
- Runes and sats indexing enabled

## Helper Scripts

All scripts are in the `scripts/` directory:

### Bitcoin Core Management
- `signet-start.sh` - Start Bitcoin Core with Signet config
- `signet-stop.sh` - Stop Bitcoin Core

### Ord Server Management
- `ord-signet-start.sh` - Start ord server (requires Bitcoin Core running)
- `ord-signet-stop.sh` - Stop ord server

### Wallet Operations
- `signet-wallet.sh` - Comprehensive wallet management tool
  ```bash
  ./signet-wallet.sh create       # Create wallet
  ./signet-wallet.sh receive      # Get address
  ./signet-wallet.sh balance      # Check balance
  ./signet-wallet.sh faucet       # Get faucet info
  ./signet-wallet.sh inscriptions # List inscriptions
  ./signet-wallet.sh cardinals    # List safe UTXOs
  ```

### Inscription Operations
- `signet-inscribe.sh` - Inscribe files on Signet
  ```bash
  ./signet-inscribe.sh <file> <fee_rate> [destination]
  # Example:
  ./signet-inscribe.sh test.html 1
  ```

## Testing Phase 2 Features

### 1. Testing OP_RETURN Validation

Create a test transaction with OP_RETURN data:
```bash
# Get raw transaction hex for testing
bitcoin-cli -rpcport=38332 -rpcuser=ordtest -rpcpassword=ordtest2024 \
  createrawtransaction '[]' \
  '{"data":"<inscription_id>|<expiry_block>"}'
```

### 2. Testing Parent-Child Inscriptions

```bash
# Inscribe parent
./scripts/signet-inscribe.sh parent.html 1

# Get parent inscription ID from output
# Then inscribe child with parent reference
ord --chain signet wallet inscribe \
  --parent <parent_inscription_id> \
  --fee-rate 1 \
  --file child.json
```

### 3. Testing Registration Flow

1. Deploy parent inscription with registration template
2. Create child inscriptions with registration data
3. Test payment verification with OP_RETURN
4. Verify satpoint-based gating

## Signet Faucets

Get free Signet BTC from:
1. https://signet.bc-2.jp/ (Primary)
2. https://alt.signetfaucet.com/ (Alternative)

## Useful Commands

### Check Sync Status
```bash
bitcoin-cli -conf=configs/bitcoin-signet.conf getblockchaininfo
```

### Monitor Logs
```bash
# Bitcoin Core logs
tail -f ~/.bitcoin/signet/debug.log

# Ord server logs
tail -f logs/ord-signet.log
```

### Get Block Height
```bash
bitcoin-cli -rpcport=38332 -rpcuser=ordtest -rpcpassword=ordtest2024 getblockcount
```

### List Inscriptions
```bash
curl http://localhost:8080/inscriptions
```

### Check Inscription Details
```bash
curl http://localhost:8080/inscription/<inscription_id>
```

## Network Details

- **Network**: Signet (Bitcoin's official test network)
- **Block Time**: ~10 minutes
- **Coins**: Free from faucets
- **Reset**: Never (persistent testnet)
- **Explorer**: https://mempool.space/signet

## Troubleshooting

### Bitcoin Core won't start
- Check if another instance is running: `ps aux | grep bitcoind`
- Check ports: `lsof -i :38332` and `lsof -i :38333`
- Review logs: `tail -100 ~/.bitcoin/signet/debug.log`

### Ord server errors
- Ensure Bitcoin Core is fully synced
- Check RPC credentials match in both configs
- Review ord logs: `tail -f logs/ord-signet.log`

### No balance after faucet
- Wait for confirmations (usually 1-2 blocks)
- Check transaction on explorer: https://mempool.space/signet
- Verify address matches: `./scripts/signet-wallet.sh receive`

### Inscription not appearing
- Wait for confirmation in a block
- Check ord indexing status: `curl http://localhost:8080/status`
- Verify inscription: `curl http://localhost:8080/inscription/<id>`

## Phase 2 Testing Checklist

- [ ] Bitcoin Core synced with Signet
- [ ] Ord server running and indexed
- [ ] Wallet created and funded
- [ ] Can inscribe parent templates
- [ ] Can inscribe child registrations
- [ ] OP_RETURN data properly formatted
- [ ] Payment verification working
- [ ] Satpoint gating functional
- [ ] API endpoints responding

## Security Notes

⚠️ **Development Only**: These configurations use simple passwords and are for development only
⚠️ **Firewall**: Ensure ports 38332, 38333, and 8080 are not exposed externally
⚠️ **Backup**: Always backup wallet files before testing destructive operations

## Additional Resources

- [Signet Wiki](https://en.bitcoin.it/wiki/Signet)
- [Ord Documentation](https://docs.ordinals.com/)
- [Bitcoin Core RPC Docs](https://developer.bitcoin.org/reference/rpc/)
- [Mempool Signet Explorer](https://mempool.space/signet)