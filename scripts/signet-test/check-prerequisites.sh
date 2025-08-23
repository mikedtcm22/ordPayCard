#!/bin/bash
# Check prerequisites for Signet testing
# Verifies node sync, wallet funding, and ord installation

set -e

# Default values
CHECK_NODE=false
CHECK_WALLET=false
CHECK_ORD=false
CHECK_ALL=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --check-node)
      CHECK_NODE=true
      shift
      ;;
    --check-wallet)
      CHECK_WALLET=true
      shift
      ;;
    --check-ord)
      CHECK_ORD=true
      shift
      ;;
    --all)
      CHECK_ALL=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# If --all flag is set, enable all checks
if [ "$CHECK_ALL" = true ]; then
  CHECK_NODE=true
  CHECK_WALLET=true
  CHECK_ORD=true
fi

# Initialize status
PREREQUISITES_MET=true

# Function to check Bitcoin node
check_bitcoin_node() {
  echo -n "Checking Bitcoin node... "
  
  if command -v bitcoin-cli &> /dev/null; then
    # Try to get block count
    if bitcoin-cli -signet getblockcount &> /dev/null; then
      local block_count=$(bitcoin-cli -signet getblockcount 2>/dev/null || echo "0")
      echo "OK (block height: $block_count)"
      return 0
    else
      echo "FAIL (node not running or not accessible)"
      return 1
    fi
  else
    echo "FAIL (bitcoin-cli not found)"
    return 1
  fi
}

# Function to check wallet funding
check_wallet_funding() {
  echo -n "Checking wallet funding... "
  
  if command -v bitcoin-cli &> /dev/null; then
    # Try to get wallet balance
    local balance=$(bitcoin-cli -signet getbalance 2>/dev/null || echo "0")
    
    if [ "$balance" != "0" ]; then
      echo "OK (balance: $balance BTC)"
      return 0
    else
      echo "WARNING (wallet empty or not accessible)"
      echo "  Tip: Get testnet coins from a Signet faucet"
      return 1
    fi
  else
    echo "SKIP (bitcoin-cli not found)"
    return 1
  fi
}

# Function to check ord installation
check_ord_installation() {
  echo -n "Checking ord installation... "
  
  if command -v ord &> /dev/null; then
    local ord_version=$(ord --version 2>/dev/null || echo "unknown")
    echo "OK (version: $ord_version)"
    return 0
  else
    echo "NOT FOUND"
    echo "  Tip: Install ord from https://github.com/ordinals/ord"
    return 1
  fi
}

# Main execution
echo "==================================="
echo "Signet Testing Prerequisites Check"
echo "==================================="
echo ""

# Run requested checks
if [ "$CHECK_NODE" = true ] || [ "$CHECK_ALL" = true ]; then
  check_bitcoin_node || PREREQUISITES_MET=false
fi

if [ "$CHECK_WALLET" = true ] || [ "$CHECK_ALL" = true ]; then
  check_wallet_funding || PREREQUISITES_MET=false
fi

if [ "$CHECK_ORD" = true ] || [ "$CHECK_ALL" = true ]; then
  check_ord_installation || PREREQUISITES_MET=false
fi

echo ""
echo "==================================="

if [ "$PREREQUISITES_MET" = true ]; then
  echo "All prerequisites met!"
  echo "==================================="
  exit 0
else
  echo "Some prerequisites not met"
  echo "Tests may fail or have limited functionality"
  echo "==================================="
  exit 1
fi