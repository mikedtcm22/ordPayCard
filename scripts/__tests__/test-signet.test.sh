#!/bin/bash
# Test script for test-signet.sh automated test runner

set -e

echo "Testing test-signet.sh automated test runner..."

# Test 1: Script should exist
if [ ! -f "./scripts/test-signet.sh" ]; then
  echo "FAIL: test-signet.sh script does not exist"
  exit 1
fi

# Test 2: Script should be executable
if [ ! -x "./scripts/test-signet.sh" ]; then
  echo "FAIL: test-signet.sh script is not executable"
  exit 1
fi

# Test 3: Script should run with --quick flag
./scripts/test-signet.sh --quick
if [ $? -ne 0 ]; then
  echo "FAIL: Test runner should complete successfully with --quick flag"
  exit 1
fi

# Test 4: Check report was generated
if [ ! -f "signet-test-report.json" ]; then
  echo "FAIL: Test runner should generate signet-test-report.json"
  exit 1
fi

# Test 5: Script should support --check-prerequisites flag
./scripts/test-signet.sh --check-prerequisites
if [ $? -ne 0 ]; then
  echo "FAIL: Test runner should check prerequisites"
  exit 1
fi

# Test 6: Script should support --unit-only flag
./scripts/test-signet.sh --unit-only
if [ $? -ne 0 ]; then
  echo "FAIL: Test runner should support unit tests only mode"
  exit 1
fi

# Test 7: Script should support --integration-only flag
./scripts/test-signet.sh --integration-only
if [ $? -ne 0 ]; then
  echo "FAIL: Test runner should support integration tests only mode"
  exit 1
fi

echo "PASS: All test-signet.sh tests passed"