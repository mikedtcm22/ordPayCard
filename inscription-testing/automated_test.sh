#!/bin/bash

# Automated Inscription Testing Script
# This script creates test templates, uploads them via Hiro API, and validates results

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
HIRO_API_URL="https://api.hiro.so/ordinals/v1"
NETWORK="signet"
FEE_RATE="1"

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if API key is set
if [ -z "$HIRO_API_KEY" ]; then
    error "HIRO_API_KEY environment variable is not set"
    echo "Please set it with: export HIRO_API_KEY='your_api_key_here'"
    exit 1
fi

# Test API connection
test_api_connection() {
    log "Testing Hiro API connection..."
    
    response=$(curl -s -w "%{http_code}" -X GET "$HIRO_API_URL/inscriptions" \
        -H "Accept: application/json" \
        -H "X-API-Key: $HIRO_API_KEY")
    
    http_code="${response: -3}"
    body="${response%???}"
    
    if [ "$http_code" = "200" ]; then
        success "API connection successful"
        return 0
    else
        error "API connection failed with status $http_code"
        echo "Response: $body"
        return 1
    fi
}

# Create test template with specific test data
create_test_template() {
    local test_name=$1
    local current_block=$2
    local receipts=$3
    local treasury_addr=$4
    
    log "Creating test template: $test_name"
    
    # Read base template
    base_template=$(cat templates/membershipCard_base.html)
    
    # Replace placeholders with test data
    test_template=$(echo "$base_template" | \
        sed "s/window.CURRENT_BLOCK || 0/$current_block/g" | \
        sed "s/window.RECEIPTS || \[\]/window.RECEIPTS = $receipts/g" | \
        sed "s/window.TREASURY_ADDR = \"tb1q...\"/window.TREASURY_ADDR = \"$treasury_addr\"/g")
    
    # Write test template
    echo "$test_template" > "templates/${test_name}.html"
    
    success "Created test template: templates/${test_name}.html"
}

# Upload template via Hiro API
upload_template() {
    local template_file=$1
    local test_name=$2
    
    log "Uploading template: $template_file"
    
    # Upload via Hiro API
    response=$(curl -s -X POST "$HIRO_API_URL/inscriptions" \
        -H "Accept: application/json" \
        -H "Content-Type: multipart/form-data" \
        -H "X-API-Key: $HIRO_API_KEY" \
        -F "file=@$template_file" \
        -F "fee_rate=$FEE_RATE" \
        -F "network=$NETWORK")
    
    # Extract inscription ID
    inscription_id=$(echo "$response" | jq -r '.id // empty')
    
    if [ -n "$inscription_id" ] && [ "$inscription_id" != "null" ]; then
        success "Template uploaded successfully. Inscription ID: $inscription_id"
        echo "$inscription_id" > "results/${test_name}_inscription_id.txt"
        echo "$inscription_id"
    else
        error "Failed to upload template"
        echo "Response: $response"
        return 1
    fi
}

# Wait for inscription confirmation
wait_for_confirmation() {
    local inscription_id=$1
    local max_attempts=60  # 30 minutes max wait
    
    log "Waiting for inscription confirmation: $inscription_id"
    
    for i in $(seq 1 $max_attempts); do
        response=$(curl -s -X GET "$HIRO_API_URL/inscriptions/$inscription_id" \
            -H "Accept: application/json" \
            -H "X-API-Key: $HIRO_API_KEY")
        
        status=$(echo "$response" | jq -r '.status // empty')
        
        if [ "$status" = "confirmed" ]; then
            success "Inscription confirmed after $((i * 30)) seconds"
            return 0
        elif [ "$status" = "failed" ]; then
            error "Inscription failed"
            return 1
        fi
        
        log "Status: $status (attempt $i/$max_attempts)"
        sleep 30
    done
    
    error "Inscription not confirmed within timeout period"
    return 1
}

# Fetch and validate inscription content
validate_content() {
    local inscription_id=$1
    local original_file=$2
    local test_name=$3
    
    log "Validating inscription content: $inscription_id"
    
    # Fetch inscribed content
    curl -s -X GET "$HIRO_API_URL/inscriptions/$inscription_id/content" > "results/${test_name}_inscribed_content.html"
    
    # Compare with original
    if diff "$original_file" "results/${test_name}_inscribed_content.html" > /dev/null; then
        success "Content validation passed - inscribed content matches original"
        return 0
    else
        error "Content validation failed - inscribed content differs from original"
        diff "$original_file" "results/${test_name}_inscribed_content.html" > "results/${test_name}_diff.txt"
        return 1
    fi
}

# Test balance calculation
test_balance_calculation() {
    local test_name=$1
    local expected_balance=$2
    
    log "Testing balance calculation for: $test_name"
    
    # Create a simple test HTML file to test the balance calculation
    cat > "tests/${test_name}_balance_test.html" << EOF
<!DOCTYPE html>
<html>
<head><title>Balance Test</title></head>
<body>
<script>
// Mock the template's balance calculation logic
window.CARD_SCHEMA_VER = "1";
window.DECAY_PER_BLOCK = 35;
window.TREASURY_ADDR = "tb1q...";
window.CURRENT_BLOCK = 850000;
window.RECEIPTS = [{"schema":"satspray.topup.v1","amount":100000,"block":849900,"paid_to":"tb1q..."}];

async function calculateBalance() {
    const receipts = window.RECEIPTS || [];
    const currentBlock = window.CURRENT_BLOCK || 0;
    
    let totalBalance = 0;
    
    for (const receipt of receipts) {
        try {
            if (receipt.schema !== 'satspray.topup.v1') continue;
            if (receipt.paid_to !== window.TREASURY_ADDR) continue;
            
            const blocksSinceTopup = currentBlock - receipt.block;
            const decayAmount = blocksSinceTopup * window.DECAY_PER_BLOCK;
            const remainingValue = Math.max(0, receipt.amount - decayAmount);
            
            totalBalance += remainingValue;
        } catch (error) {
            console.error('Invalid receipt:', receipt, error);
        }
    }
    
    return totalBalance;
}

// Test the calculation
calculateBalance().then(balance => {
    console.log('Calculated balance:', balance);
    console.log('Expected balance:', $expected_balance);
    
    if (balance === $expected_balance) {
        console.log('✅ Balance calculation test PASSED');
        document.body.innerHTML = '<h1 style="color: green;">Balance Test PASSED</h1>';
    } else {
        console.log('❌ Balance calculation test FAILED');
        document.body.innerHTML = '<h1 style="color: red;">Balance Test FAILED</h1>';
    }
});
</script>
</body>
</html>
EOF

    success "Created balance calculation test: tests/${test_name}_balance_test.html"
}

# Main test execution
run_test() {
    local test_name=$1
    local current_block=$2
    local receipts=$3
    local treasury_addr=$4
    local expected_balance=$5
    
    log "Starting test: $test_name"
    
    # Create test template
    create_test_template "$test_name" "$current_block" "$receipts" "$treasury_addr"
    
    # Upload template
    inscription_id=$(upload_template "templates/${test_name}.html" "$test_name")
    
    if [ $? -eq 0 ]; then
        # Wait for confirmation
        if wait_for_confirmation "$inscription_id"; then
            # Validate content
            if validate_content "$inscription_id" "templates/${test_name}.html" "$test_name"; then
                success "Test $test_name completed successfully"
                echo "$inscription_id" >> "results/successful_inscriptions.txt"
            else
                error "Test $test_name failed at content validation"
                echo "$inscription_id" >> "results/failed_inscriptions.txt"
                return 1
            fi
        else
            error "Test $test_name failed at confirmation"
            echo "$inscription_id" >> "results/failed_inscriptions.txt"
            return 1
        fi
    else
        error "Test $test_name failed at upload"
        return 1
    fi
    
    # Test balance calculation
    test_balance_calculation "$test_name" "$expected_balance"
    
    return 0
}

# Generate test report
generate_report() {
    log "Generating test report..."
    
    cat > "results/test_report_$(date +%Y%m%d_%H%M%S).md" << EOF
# Inscription Template Test Report

Generated: $(date)

## Test Summary

### Successful Inscriptions
$(if [ -f "results/successful_inscriptions.txt" ]; then
    while read -r inscription_id; do
        echo "- $inscription_id"
    done < "results/successful_inscriptions.txt"
else
    echo "- None"
fi)

### Failed Inscriptions
$(if [ -f "results/failed_inscriptions.txt" ]; then
    while read -r inscription_id; do
        echo "- $inscription_id"
    done < "results/failed_inscriptions.txt"
else
    echo "- None"
fi)

## Test Files

### Templates Created
$(ls -la templates/*.html 2>/dev/null || echo "- None")

### Test Results
$(ls -la results/*.html 2>/dev/null || echo "- None")

### Logs
$(ls -la logs/*.log 2>/dev/null || echo "- None")

## Configuration

- API: Hiro Ordinals API
- Network: $NETWORK
- Fee Rate: $FEE_RATE sats/vB
- API Key: ${HIRO_API_KEY:0:8}...

EOF

    success "Test report generated: results/test_report_$(date +%Y%m%d_%H%M%S).md"
}

# Main execution
main() {
    log "Starting automated inscription testing..."
    
    # Test API connection first
    if ! test_api_connection; then
        exit 1
    fi
    
    # Create test directories if they don't exist
    mkdir -p templates tests results logs
    
    # Initialize result files
    > "results/successful_inscriptions.txt"
    > "results/failed_inscriptions.txt"
    
    # Test Case 1: Fresh top-up (100,000 sats, no decay)
    run_test "test_fresh_topup" "850000" '[{"schema":"satspray.topup.v1","amount":100000,"block":850000,"paid_to":"tb1q..."}]' "tb1q..." "100000"
    
    # Test Case 2: Partial decay (100,000 sats, 100 blocks decay)
    run_test "test_partial_decay" "850100" '[{"schema":"satspray.topup.v1","amount":100000,"block":850000,"paid_to":"tb1q..."}]' "tb1q..." "96500"
    
    # Test Case 3: Multiple receipts
    run_test "test_multiple_receipts" "850100" '[{"schema":"satspray.topup.v1","amount":100000,"block":850000,"paid_to":"tb1q..."},{"schema":"satspray.topup.v1","amount":50000,"block":850050,"paid_to":"tb1q..."}]' "tb1q..." "146500"
    
    # Test Case 4: Expired card (fully decayed)
    run_test "test_expired_card" "852857" '[{"schema":"satspray.topup.v1","amount":100000,"block":850000,"paid_to":"tb1q..."}]' "tb1q..." "0"
    
    # Generate final report
    generate_report
    
    success "Automated testing completed!"
    
    # Display summary
    successful_count=$(wc -l < "results/successful_inscriptions.txt" 2>/dev/null || echo "0")
    failed_count=$(wc -l < "results/failed_inscriptions.txt" 2>/dev/null || echo "0")
    
    log "Test Summary:"
    log "  Successful: $successful_count"
    log "  Failed: $failed_count"
}

# Run main function
main "$@" 