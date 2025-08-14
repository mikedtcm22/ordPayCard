# Complete Signet Node Setup Guide

This guide provides comprehensive instructions for setting up and maintaining a full Signet node on your machine, integrated with the ord inscription system.

## Table of Contents
1. [Quick Setup](#quick-setup)
2. [Node Architecture](#node-architecture)
3. [Initial Setup](#initial-setup)
4. [Node Management](#node-management)
5. [Service Installation](#service-installation)
6. [Monitoring & Health](#monitoring--health)
7. [Troubleshooting](#troubleshooting)
8. [Maintenance](#maintenance)

## Quick Setup

```bash
# 1. Initialize the node
./scripts/signet-node-init.sh

# 2. Start Bitcoin Core
./scripts/signet-start.sh

# 3. Monitor sync progress (takes 30-60 minutes initially)
./scripts/signet-node-status.sh

# 4. Once synced, create wallet
./signet-node/init-wallet.sh

# 5. Start ord server
./scripts/ord-signet-start.sh
```

## Node Architecture

### Directory Structure
```
~/.bitcoin/signet/          # Bitcoin Core data
├── blocks/                 # Blockchain data (~2GB)
├── chainstate/            # UTXO database
├── indexes/               # Transaction indexes
├── wallets/               # Wallet files
├── bitcoin.conf           # Configuration
└── debug.log             # Debug logs

~/.local/share/ord/signet/ # Ord data
├── index.redb            # Ord database
└── logs/                 # Ord logs

./signet-node/            # Project-specific data
├── wallets/              # Wallet backups
├── backups/              # Configuration backups
└── logs/                 # Application logs
```

### Network Architecture
- **P2P Port**: 38333 (Bitcoin network protocol)
- **RPC Port**: 38332 (JSON-RPC API)
- **Ord Port**: 8080 (HTTP API and web interface)

## Initial Setup

### Step 1: Initialize Node
```bash
./scripts/signet-node-init.sh
```

This script will:
- Create necessary directories
- Generate optimized bitcoin.conf
- Set up wallet initialization scripts
- Configure ord integration

### Step 2: Start Bitcoin Core
```bash
./scripts/signet-start.sh
```

Initial sync requires:
- **Time**: 30-60 minutes
- **Disk**: ~2GB
- **Bandwidth**: ~2GB download

### Step 3: Monitor Sync Progress
```bash
# Basic status
./scripts/signet-node-status.sh

# Detailed monitoring
watch -n 5 ./scripts/signet-node-status.sh

# Health check
./scripts/signet-node-health.sh
```

### Step 4: Create Wallet
```bash
# After sync completes
./signet-node/init-wallet.sh

# Or manually
bitcoin-cli -rpcport=38332 -rpcuser=ordtest -rpcpassword=ordtest2024 \
    createwallet "ord-signet"
```

### Step 5: Fund Wallet
```bash
# Get address
./scripts/signet-wallet.sh receive

# Visit faucet
# https://signet.bc-2.jp/
# https://alt.signetfaucet.com/
```

## Node Management

### Starting Services
```bash
# Manual start
./scripts/signet-start.sh        # Bitcoin Core
./scripts/ord-signet-start.sh    # Ord server

# With systemd (Linux)
systemctl --user start bitcoind-signet
systemctl --user start ord-signet

# With launchd (macOS)
launchctl load ~/Library/LaunchAgents/com.bitcoin.signet.plist
launchctl load ~/Library/LaunchAgents/com.ord.signet.plist
```

### Stopping Services
```bash
# Manual stop
./scripts/signet-stop.sh         # Bitcoin Core
./scripts/ord-signet-stop.sh     # Ord server

# With systemd (Linux)
systemctl --user stop ord-signet
systemctl --user stop bitcoind-signet

# With launchd (macOS)
launchctl unload ~/Library/LaunchAgents/com.ord.signet.plist
launchctl unload ~/Library/LaunchAgents/com.bitcoin.signet.plist
```

### Restarting Services
```bash
# Manual restart
./scripts/signet-stop.sh && sleep 5 && ./scripts/signet-start.sh

# With systemd
systemctl --user restart bitcoind-signet

# With launchd
launchctl kickstart -k gui/$(id -u)/com.bitcoin.signet
```

## Service Installation

### Automatic Startup
Install services for automatic startup on boot:

```bash
./scripts/signet-service-install.sh
```

#### macOS (launchd)
Services installed to: `~/Library/LaunchAgents/`
- `com.bitcoin.signet.plist`
- `com.ord.signet.plist`

#### Linux (systemd)
User services installed to: `~/.config/systemd/user/`
- `bitcoind-signet.service`
- `ord-signet.service`

### Enable Auto-start
```bash
# macOS - automatic on install

# Linux
systemctl --user enable bitcoind-signet
systemctl --user enable ord-signet
```

## Monitoring & Health

### Real-time Status
```bash
# Comprehensive status
./scripts/signet-node-status.sh

# Verbose mode with peer info
./scripts/signet-node-status.sh -v

# Health check (returns exit code)
./scripts/signet-node-health.sh
echo $?  # 0=healthy, 1=warning, 2=critical
```

### Key Metrics
```bash
# Block height
bitcoin-cli -rpcport=38332 -rpcuser=ordtest -rpcpassword=ordtest2024 getblockcount

# Peer count
bitcoin-cli -rpcport=38332 -rpcuser=ordtest -rpcpassword=ordtest2024 getconnectioncount

# Mempool size
bitcoin-cli -rpcport=38332 -rpcuser=ordtest -rpcpassword=ordtest2024 getmempoolinfo

# Wallet balance
bitcoin-cli -rpcport=38332 -rpcuser=ordtest -rpcpassword=ordtest2024 \
    -rpcwallet=ord-signet getbalance
```

### Log Files
```bash
# Bitcoin Core logs
tail -f ~/.bitcoin/signet/debug.log

# Ord server logs
tail -f logs/ord-signet.log

# System service logs (if using systemd)
journalctl --user -u bitcoind-signet -f
journalctl --user -u ord-signet -f
```

### Performance Monitoring
```bash
# CPU and memory usage
top -p $(pgrep bitcoind)

# Disk usage
du -sh ~/.bitcoin/signet/
du -sh ~/.local/share/ord/signet/

# Network bandwidth
nethogs -p $(pgrep bitcoind)  # Linux
nettop -p $(pgrep bitcoind)   # macOS
```

## Troubleshooting

### Common Issues

#### Node Won't Start
```bash
# Check if already running
ps aux | grep bitcoind
pkill bitcoind  # Force stop if needed

# Check ports
lsof -i :38332
lsof -i :38333

# Check permissions
ls -la ~/.bitcoin/signet/

# Review logs
tail -100 ~/.bitcoin/signet/debug.log | grep -i error
```

#### Sync Stuck
```bash
# Check peer connections
bitcoin-cli -rpcport=38332 -rpcuser=ordtest -rpcpassword=ordtest2024 getpeerinfo

# Add more peers manually
bitcoin-cli -rpcport=38332 -rpcuser=ordtest -rpcpassword=ordtest2024 \
    addnode "23.129.64.212:38333" "add"

# Restart with network debug
./scripts/signet-stop.sh
bitcoind -conf=configs/bitcoin-signet.conf -debug=net
```

#### RPC Connection Failed
```bash
# Verify credentials
grep rpc ~/.bitcoin/signet/bitcoin.conf

# Test connection
curl --user ordtest:ordtest2024 \
    --data-binary '{"jsonrpc":"1.0","method":"getblockchaininfo"}' \
    -H 'content-type: text/plain;' \
    http://127.0.0.1:38332/

# Check firewall
sudo iptables -L -n | grep 38332  # Linux
sudo pfctl -sr | grep 38332       # macOS
```

#### Ord Server Issues
```bash
# Ensure Bitcoin Core is synced
bitcoin-cli -rpcport=38332 -rpcuser=ordtest -rpcpassword=ordtest2024 getblockchaininfo

# Check ord index
ls -la ~/.local/share/ord/signet/

# Rebuild index if corrupted
rm -rf ~/.local/share/ord/signet/index.redb
./scripts/ord-signet-start.sh  # Will rebuild
```

### Recovery Procedures

#### Wallet Recovery
```bash
# Backup wallet
bitcoin-cli -rpcport=38332 -rpcuser=ordtest -rpcpassword=ordtest2024 \
    -rpcwallet=ord-signet backupwallet "signet-node/backups/wallet-$(date +%Y%m%d).dat"

# Restore wallet
bitcoin-cli -rpcport=38332 -rpcuser=ordtest -rpcpassword=ordtest2024 \
    restorewallet "ord-signet-restored" "signet-node/backups/wallet.dat"
```

#### Full Node Reset
```bash
# Stop everything
./scripts/ord-signet-stop.sh
./scripts/signet-stop.sh

# Backup important data
cp -r ~/.bitcoin/signet/wallets signet-node/backups/

# Clean blockchain data (keeps wallets)
rm -rf ~/.bitcoin/signet/blocks
rm -rf ~/.bitcoin/signet/chainstate
rm -rf ~/.bitcoin/signet/indexes

# Restart and resync
./scripts/signet-start.sh
```

## Maintenance

### Regular Tasks

#### Daily
- Check node health: `./scripts/signet-node-health.sh`
- Monitor disk space: `df -h ~/.bitcoin/signet`

#### Weekly
- Backup wallet: See wallet recovery section
- Review logs for errors
- Update peer connections if needed

#### Monthly
- Clean old logs: `find logs/ -name "*.log" -mtime +30 -delete`
- Verify backups are restorable
- Check for Bitcoin Core updates

### Performance Optimization

#### Memory Usage
Edit `~/.bitcoin/signet/bitcoin.conf`:
```conf
# Increase for better performance
dbcache=4000  # Use 4GB for UTXO cache

# Decrease for low memory systems
dbcache=500   # Minimum recommended
```

#### Connection Limits
```conf
# More connections = better network resilience
maxconnections=125  # Default
maxconnections=50   # Low bandwidth
maxconnections=200  # High bandwidth
```

#### Disk I/O
```conf
# Batch database writes
dbbatchsize=16777216  # 16MB batches
```

### Security Hardening

#### Firewall Rules
```bash
# Allow only local connections
# Linux
sudo ufw deny 38333
sudo ufw allow from 127.0.0.1 to any port 38332

# macOS
sudo pfctl -e
echo "block in proto tcp from any to any port 38333" | sudo pfctl -f -
```

#### RPC Security
Update `bitcoin.conf`:
```conf
# Restrict RPC access
rpcallowip=127.0.0.1
rpcbind=127.0.0.1

# Use strong password
rpcpassword=$(openssl rand -base64 32)
```

## Advanced Configuration

### Custom Data Directory
```bash
# Set custom location
export SIGNET_DATADIR="/path/to/custom/signet"
bitcoind -datadir="$SIGNET_DATADIR"
```

### Multiple Nodes
Run multiple Signet nodes with different ports:
```conf
# Node 2 config
port=38334
rpcport=38335
datadir=/path/to/signet2
```

### Tor Integration
```conf
# Enable Tor
proxy=127.0.0.1:9050
listen=1
bind=127.0.0.1
onlynet=onion
```

## Resources

### Official Documentation
- [Bitcoin Core Docs](https://bitcoincore.org/en/doc/)
- [Signet Wiki](https://en.bitcoin.it/wiki/Signet)
- [Ord Documentation](https://docs.ordinals.com/)

### Block Explorers
- [Mempool.space Signet](https://mempool.space/signet)
- [Bitcoin Explorer Signet](https://explorer.bc-2.jp/)

### Community
- [Bitcoin StackExchange](https://bitcoin.stackexchange.com/)
- [Ordinals Discord](https://discord.gg/ordinals)

## Summary

Your Signet node is now fully configured with:
- ✅ Full blockchain validation
- ✅ Transaction indexing for ord
- ✅ Wallet management
- ✅ Automatic startup options
- ✅ Health monitoring
- ✅ Complete integration with inscription testing

The node will continuously sync with the Signet network, allowing you to test Phase 2 enhanced validation features in a persistent test environment.