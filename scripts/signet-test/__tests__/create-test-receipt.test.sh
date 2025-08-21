#!/bin/bash
# Test script for create-test-receipt.sh

set -e

echo "Testing create-test-receipt.sh script..."

# Test 1: Script should exist
if [ ! -f "./scripts/signet-test/create-test-receipt.sh" ]; then
  echo "FAIL: create-test-receipt.sh script does not exist"
  exit 1
fi

# Test 2: Script should be executable
if [ ! -x "./scripts/signet-test/create-test-receipt.sh" ]; then
  echo "FAIL: create-test-receipt.sh script is not executable"
  exit 1
fi

# Test 3: Script should create receipt for parent inscription
./scripts/signet-test/create-test-receipt.sh --network signet --parent-id "abc123i0" --expiry-blocks 144
if [ $? -ne 0 ]; then
  echo "FAIL: Script should create receipt for parent inscription"
  exit 1
fi

# Test 4: Verify receipt was saved
if [ ! -f "last-receipt.json" ]; then
  echo "FAIL: Script should create last-receipt.json with receipt data"
  exit 1
fi

# Test 5: Script should create child inscription with receipt
./scripts/signet-test/create-test-receipt.sh --network signet --parent-id "abc123i0" --expiry-blocks 144 --inscribe-child
if [ $? -ne 0 ]; then
  echo "FAIL: Script should create child inscription with receipt"
  exit 1
fi

# Test 6: Script should support batch receipt creation
./scripts/signet-test/create-test-receipt.sh --network signet --parent-id "abc123i0" --batch 5
if [ $? -ne 0 ]; then
  echo "FAIL: Script should support batch receipt creation"
  exit 1
fi

echo "PASS: All create-test-receipt.sh tests passed"