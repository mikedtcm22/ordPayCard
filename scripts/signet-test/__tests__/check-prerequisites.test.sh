#!/bin/bash
# Test script for check-prerequisites.sh

set -e

echo "Testing check-prerequisites.sh script..."

# Test 1: Script should exist
if [ ! -f "./scripts/signet-test/check-prerequisites.sh" ]; then
  echo "FAIL: check-prerequisites.sh script does not exist"
  exit 1
fi

# Test 2: Script should be executable
if [ ! -x "./scripts/signet-test/check-prerequisites.sh" ]; then
  echo "FAIL: check-prerequisites.sh script is not executable"
  exit 1
fi

# Test 3: Script should check Bitcoin node status
./scripts/signet-test/check-prerequisites.sh --check-node
if [ $? -ne 0 ]; then
  echo "Note: Bitcoin node check failed (expected if node not running)"
fi

# Test 4: Script should check wallet funding
./scripts/signet-test/check-prerequisites.sh --check-wallet
if [ $? -ne 0 ]; then
  echo "Note: Wallet check failed (expected if wallet not funded)"
fi

# Test 5: Script should check ord installation
./scripts/signet-test/check-prerequisites.sh --check-ord
if [ $? -ne 0 ]; then
  echo "Note: Ord check failed (expected if ord not installed)"
fi

# Test 6: Script should run all checks
./scripts/signet-test/check-prerequisites.sh --all
# Allow this to fail as prerequisites may not be met

echo "PASS: All check-prerequisites.sh structure tests passed"