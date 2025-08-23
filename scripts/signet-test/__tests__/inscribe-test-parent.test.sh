#!/bin/bash
# Test script for inscribe-test-parent.sh

set -e

echo "Testing inscribe-test-parent.sh script..."

# Test 1: Script should exist
if [ ! -f "./scripts/signet-test/inscribe-test-parent.sh" ]; then
  echo "FAIL: inscribe-test-parent.sh script does not exist"
  exit 1
fi

# Test 2: Script should be executable
if [ ! -x "./scripts/signet-test/inscribe-test-parent.sh" ]; then
  echo "FAIL: inscribe-test-parent.sh script is not executable"
  exit 1
fi

# Test 3: Script should inscribe parent template
./scripts/signet-test/inscribe-test-parent.sh --network signet --template "test-parent.html"
if [ $? -ne 0 ]; then
  echo "FAIL: Script should inscribe parent template"
  exit 1
fi

# Test 4: Verify inscription ID was saved
if [ ! -f "last-parent-inscription.txt" ]; then
  echo "FAIL: Script should create last-parent-inscription.txt with inscription ID"
  exit 1
fi

# Test 5: Script should support custom creator address
./scripts/signet-test/inscribe-test-parent.sh --network signet --template "test-parent.html" --creator tb1qcreator
if [ $? -ne 0 ]; then
  echo "FAIL: Script should support custom creator address"
  exit 1
fi

# Test 6: Script should validate template size
./scripts/signet-test/inscribe-test-parent.sh --network signet --template "large-template.html" --max-size 5000
if [ $? -ne 0 ]; then
  echo "FAIL: Script should validate template size"
  exit 1
fi

echo "PASS: All inscribe-test-parent.sh tests passed"