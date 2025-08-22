#!/bin/bash

# Test for Embers Core deployment script
# Verifies the deployment script functionality

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_SCRIPT="$SCRIPT_DIR/../deploy-embers-core.sh"

# Test 1: Script exists
if [ ! -f "$DEPLOY_SCRIPT" ]; then
  echo "FAIL: Deployment script does not exist at $DEPLOY_SCRIPT"
  exit 1
fi

# Test 2: Dry run mode works
echo "Testing dry-run mode..."
OUTPUT=$("$DEPLOY_SCRIPT" --network signet --dry-run 2>&1)
if [ $? -ne 0 ]; then
  echo "FAIL: Deployment script should succeed in dry-run"
  echo "Output: $OUTPUT"
  exit 1
fi

if ! echo "$OUTPUT" | grep -q "Dry run complete"; then
  echo "FAIL: Dry run should report completion"
  echo "Output: $OUTPUT"
  exit 1
fi

# Test 3: Network parameter validation
echo "Testing network parameter..."
OUTPUT=$("$DEPLOY_SCRIPT" --network invalid 2>&1)
if [ $? -eq 0 ]; then
  echo "FAIL: Should reject invalid network"
  exit 1
fi

# Test 4: Build step verification
echo "Testing build step..."
OUTPUT=$("$DEPLOY_SCRIPT" --network signet --dry-run 2>&1)
if ! echo "$OUTPUT" | grep -q "Building Embers Core"; then
  echo "FAIL: Should show build step"
  echo "Output: $OUTPUT"
  exit 1
fi

# Test 5: Inscription simulation (dry-run)
echo "Testing inscription simulation..."
OUTPUT=$("$DEPLOY_SCRIPT" --network signet --dry-run 2>&1)
if ! echo "$OUTPUT" | grep -q "Would inscribe"; then
  echo "FAIL: Should simulate inscription in dry-run"
  echo "Output: $OUTPUT"
  exit 1
fi

# Test 6: Environment variable output
echo "Testing environment variable output..."
OUTPUT=$("$DEPLOY_SCRIPT" --network signet --dry-run 2>&1)
if ! echo "$OUTPUT" | grep -q "VITE_EMBERS_CORE_SIGNET_ID"; then
  echo "FAIL: Should output environment variable for inscription ID"
  echo "Output: $OUTPUT"
  exit 1
fi

echo "✅ All deployment script tests passed"
exit 0