#!/bin/bash
# Create test receipts for parent inscriptions
# Generates registration receipts with OP_RETURN data

set -e

# Default values
NETWORK="signet"
PARENT_ID=""
EXPIRY_BLOCKS=144
INSCRIBE_CHILD=false
BATCH=1

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --network)
      NETWORK="$2"
      shift 2
      ;;
    --parent-id)
      PARENT_ID="$2"
      shift 2
      ;;
    --expiry-blocks)
      EXPIRY_BLOCKS="$2"
      shift 2
      ;;
    --inscribe-child)
      INSCRIBE_CHILD=true
      shift
      ;;
    --batch)
      BATCH="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Validate parent ID parameter
if [ -z "$PARENT_ID" ]; then
  echo "Error: --parent-id parameter is required"
  exit 1
fi

# Function to create receipt
create_receipt() {
  local parent_id="$1"
  local expiry="$2"
  
  # Generate receipt data
  local timestamp=$(date +%s)
  local fee_txid="test_fee_tx_${RANDOM}"
  
  # Create receipt JSON
  cat > last-receipt.json <<EOF
{
  "parentId": "$parent_id",
  "feeTxid": "$fee_txid",
  "expiryBlock": $expiry,
  "timestamp": $timestamp,
  "network": "$NETWORK"
}
EOF
  
  echo "Created receipt for parent $parent_id"
  
  # Optionally inscribe as child
  if [ "$INSCRIBE_CHILD" = true ]; then
    local child_id="child${RANDOM}i0"
    echo "Inscribed child: $child_id"
  fi
}

# Function to create batch receipts
create_batch_receipts() {
  local count="$1"
  
  for i in $(seq 1 "$count"); do
    local expiry=$(($(date +%s) + EXPIRY_BLOCKS * 600))
    create_receipt "$PARENT_ID" "$expiry"
    
    if [ "$i" -lt "$count" ]; then
      # Save individual receipts with index
      cp last-receipt.json "receipt-$i.json"
    fi
  done
  
  echo "Created $count receipts"
}

# Main execution
if [ "$BATCH" -gt 1 ]; then
  create_batch_receipts "$BATCH"
else
  current_block=100000  # Simulated block height
  expiry_block=$((current_block + EXPIRY_BLOCKS))
  create_receipt "$PARENT_ID" "$expiry_block"
fi