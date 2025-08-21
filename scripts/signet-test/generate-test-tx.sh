#!/bin/bash
# Generate test transactions on Signet network
# Creates OP_RETURN and payment transactions for testing

set -e

# Default values
NETWORK="signet"
TYPE="opreturn"
DRY_RUN=false
ADDRESS=""
AMOUNT=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --network)
      NETWORK="$2"
      shift 2
      ;;
    --type)
      TYPE="$2"
      shift 2
      ;;
    --address)
      ADDRESS="$2"
      shift 2
      ;;
    --amount)
      AMOUNT="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Function to generate OP_RETURN transaction
generate_opreturn_tx() {
  local nft_id="abc123def456789i0"
  local expiry_block=$(($(bitcoin-cli -signet getblockcount) + 144))
  local op_return_data="${nft_id}|${expiry_block}"
  
  if [ "$DRY_RUN" = true ]; then
    echo "DRY RUN: Would create OP_RETURN transaction with data: $op_return_data"
    echo "dry-run-tx-id" > last-tx.txt
    return 0
  fi
  
  # Create hex data for OP_RETURN
  local hex_data=$(echo -n "$op_return_data" | xxd -p -c 256)
  
  # Create transaction with OP_RETURN output
  local tx_id=$(bitcoin-cli -signet -named createrawtransaction inputs='[]' outputs='[{"data":"'$hex_data'"}]' | \
                bitcoin-cli -signet -stdin fundrawtransaction | \
                jq -r '.hex' | \
                bitcoin-cli -signet -stdin signrawtransactionwithwallet | \
                jq -r '.hex' | \
                bitcoin-cli -signet -stdin sendrawtransaction)
  
  echo "$tx_id" > last-tx.txt
  echo "Created OP_RETURN transaction: $tx_id"
}

# Function to generate payment transaction
generate_payment_tx() {
  if [ -z "$ADDRESS" ] || [ -z "$AMOUNT" ]; then
    echo "Error: Payment transaction requires --address and --amount"
    exit 1
  fi
  
  if [ "$DRY_RUN" = true ]; then
    echo "DRY RUN: Would send $AMOUNT BTC to $ADDRESS"
    echo "dry-run-payment-tx" > last-tx.txt
    return 0
  fi
  
  local tx_id=$(bitcoin-cli -signet sendtoaddress "$ADDRESS" "$AMOUNT")
  echo "$tx_id" > last-tx.txt
  echo "Created payment transaction: $tx_id"
}

# Main execution
case $TYPE in
  opreturn)
    generate_opreturn_tx
    ;;
  payment)
    generate_payment_tx
    ;;
  *)
    echo "Error: Unknown transaction type: $TYPE"
    exit 1
    ;;
esac