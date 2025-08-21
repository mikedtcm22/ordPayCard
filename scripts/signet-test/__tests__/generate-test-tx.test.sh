#!/bin/bash
# Test script for generate-test-tx.sh

set -e

echo "Testing generate-test-tx.sh script..."

# Test 1: Script should exist
if [ ! -f "./scripts/signet-test/generate-test-tx.sh" ]; then
  echo "FAIL: generate-test-tx.sh script does not exist"
  exit 1
fi

# Test 2: Script should be executable
if [ ! -x "./scripts/signet-test/generate-test-tx.sh" ]; then
  echo "FAIL: generate-test-tx.sh script is not executable"
  exit 1
fi

# Test 3: Script should generate OP_RETURN transaction on signet
./scripts/signet-test/generate-test-tx.sh --network signet --type opreturn
if [ $? -ne 0 ]; then
  echo "FAIL: Script should generate OP_RETURN transaction"
  exit 1
fi

# Test 4: Verify transaction was created and saved
if [ ! -f "last-tx.txt" ]; then
  echo "FAIL: Script should create last-tx.txt with transaction ID"
  exit 1
fi

# Test 5: Script should support payment transactions
./scripts/signet-test/generate-test-tx.sh --network signet --type payment --address tb1qtest --amount 0.00001
if [ $? -ne 0 ]; then
  echo "FAIL: Script should generate payment transaction"
  exit 1
fi

# Test 6: Script should support dry-run mode
./scripts/signet-test/generate-test-tx.sh --network signet --type opreturn --dry-run
if [ $? -ne 0 ]; then
  echo "FAIL: Script should support dry-run mode"
  exit 1
fi

echo "PASS: All generate-test-tx.sh tests passed"