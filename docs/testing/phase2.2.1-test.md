# Phase 2.2.1: Inscription Template Testing Plan

**Document Type**: AI-Executable Testing Plan  
**Phase**: 2.2.1 - Inscription Template Foundation  
**Testing Method**: MCP-Automated Cloud Services  
**Date**: August 2, 2025  

---

## Overview

### Objective
Execute comprehensive testing of the SatSpray membership card inscription template using MCP automation to ensure 100% confidence before Signet blockchain deployment.

### Critical Importance
The inscription template is **immutable once inscribed** - any errors require creating entirely new membership cards. This testing plan validates every aspect before blockchain deployment.

### Success Criteria
- ✅ Template renders correctly in all major browsers (Chrome, Firefox, Safari)
- ✅ SVG assets display properly in both active and expired states
- ✅ JavaScript balance calculation accurately tracks decay rate (35 sats/block)
- ✅ cardStatus() function is accessible from external contexts
- ✅ Template size is optimized for inscription costs (< 10KB)
- ✅ No external dependencies (fully self-contained)
- ✅ All test inscriptions created successfully on Signet
- ✅ Content validation passes for all inscriptions

---

## Prerequisites

### Environment Setup
- ✅ Testing environment created at `/inscription-testing/`
- ✅ Base template implemented (`membershipCard_base.html`)
- ✅ Automated testing scripts created (`automated_test.sh`)
- ✅ API connection test script created (`test_api_connection.sh`)

### Required Human Actions (COMPLETED)
- ✅ Hiro API account created
- ✅ API key obtained
- ✅ Environment variable set: `HIRO_API_KEY`

### MCP Configuration (READY)
- ✅ Playwright: Browser automation
- ✅ Bash: Command-line automation
- ✅ curl: HTTP API requests
- ✅ File operations: Template creation and management

---

## Testing Phases

### Phase 1: Environment Validation (5 minutes)

#### Task 1.1: Verify API Connection
**Objective**: Confirm Hiro API is accessible and functional

**MCP Commands**:
```bash
cd /Users/michaelchristopher/repos/ordPayCard/inscription-testing
./test_api_connection.sh
```

**Expected Result**: 
- HTTP Status Code: 200
- "✅ API connection successful!" message
- Response preview showing valid JSON

**Success Criteria**: API responds with 200 status and valid JSON

**AI Action**: Execute the command and verify the output

**Human Confirmation Required**: 
> **STOP HERE** - Confirm with human user that API connection test passed successfully before proceeding to Phase 2.

---

### Phase 2: Template Validation (30 minutes)

#### Task 2.1: Verify Base Template Structure
**Objective**: Validate base template meets all requirements

**MCP Commands**:
```bash
# Check template size
ls -la templates/membershipCard_base.html

# Verify no external dependencies
grep -i "http\|https\|cdn\|external" templates/membershipCard_base.html || echo "No external dependencies found"

# Check for embedded SVG assets
grep -c "SVG_ACTIVE\|SVG_EXPIRED" templates/membershipCard_base.html

# Verify cardStatus function exists
grep -c "window.cardStatus" templates/membershipCard_base.html
```

**Expected Results**:
- Template size < 10KB
- No external dependencies found
- SVG assets count: 2 (active and expired)
- cardStatus function: 1 occurrence

**Success Criteria**: All checks pass with expected values

#### Task 2.2: Test Template in Browser
**Objective**: Verify template renders correctly in all browsers

**MCP Commands**:
```bash
# Create a simple test server
python3 -m http.server 8000 &
SERVER_PID=$!

# Wait for server to start
sleep 2

# Test template loading
curl -s http://localhost:8000/templates/membershipCard_base.html | head -20

# Stop server
kill $SERVER_PID
```

**Expected Result**: Template loads without errors, shows HTML structure

**Success Criteria**: Template loads successfully via HTTP

**AI Action**: Execute all commands and verify results

**Human Confirmation Required**:
> **STOP HERE** - Confirm with human user that template validation passed and template renders correctly before proceeding to Phase 3.

---

### Phase 3: Automated Test Execution (2-3 hours)

#### Task 3.1: Run Full Test Suite
**Objective**: Execute comprehensive automated testing with 4 test scenarios

**MCP Commands**:
```bash
# Run the complete automated test suite
./automated_test.sh
```

**Test Scenarios**:
1. **Fresh Top-up**: 100,000 sats, no decay (block 850000)
2. **Partial Decay**: 100,000 sats, 100 blocks decay (block 850100)  
3. **Multiple Receipts**: Multiple top-ups with different timings
4. **Expired Card**: Fully decayed card (0 balance)

**Expected Results**:
- All 4 test templates created successfully
- All 4 inscriptions uploaded to Signet
- All inscriptions confirmed within 30 minutes each
- Content validation passes for all inscriptions
- Balance calculation tests pass

**Success Criteria**: 
- 4 successful inscriptions created
- 0 failed inscriptions
- All content validations pass
- All balance calculations accurate

**AI Action**: Execute the test suite and monitor progress

**Human Confirmation Required**:
> **STOP HERE** - After test suite completes, confirm with human user that all 4 test inscriptions were created successfully and all validations passed before proceeding to Phase 4.

---

### Phase 4: Content Validation (30 minutes)

#### Task 4.1: Verify Inscription Content
**Objective**: Ensure inscribed content matches original templates exactly

**MCP Commands**:
```bash
# Check for successful inscriptions
cat results/successful_inscriptions.txt

# For each successful inscription, validate content
while read -r inscription_id; do
    echo "Validating inscription: $inscription_id"
    # Fetch inscribed content
    curl -s "https://api.hiro.so/ordinals/v1/inscriptions/$inscription_id/content" > "results/validation_${inscription_id}.html"
    
    # Compare with original template
    original_template=$(echo "$inscription_id" | sed 's/.*test_\(.*\)_inscription_id.*/templates\/test_\1.html/')
    if [ -f "$original_template" ]; then
        diff "$original_template" "results/validation_${inscription_id}.html" > "results/diff_${inscription_id}.txt"
        if [ -s "results/diff_${inscription_id}.txt" ]; then
            echo "❌ Content mismatch for $inscription_id"
        else
            echo "✅ Content validation passed for $inscription_id"
        fi
    fi
done < results/successful_inscriptions.txt
```

**Expected Results**:
- All inscriptions have matching content
- No differences found between original and inscribed content

**Success Criteria**: All content validations pass (no differences)

#### Task 4.2: Test Balance Calculations
**Objective**: Verify balance calculation logic is mathematically accurate

**MCP Commands**:
```bash
# Test balance calculation for each scenario
for test_file in tests/*_balance_test.html; do
    echo "Testing balance calculation: $test_file"
    # Open in browser and check result
    open "$test_file" 2>/dev/null || echo "Cannot open $test_file automatically"
done

# Verify expected calculations
echo "Expected balance calculations:"
echo "Fresh top-up: 100,000 sats"
echo "Partial decay: 96,500 sats (100,000 - (100 * 35))"
echo "Multiple receipts: 146,500 sats"
echo "Expired card: 0 sats"
```

**Expected Results**:
- All balance calculations match expected values
- 35 sats/block decay rate is accurate

**Success Criteria**: All balance calculations are mathematically correct

**AI Action**: Execute validation commands and verify results

**Human Confirmation Required**:
> **STOP HERE** - Confirm with human user that all content validations passed and balance calculations are accurate before proceeding to Phase 5.

---

### Phase 5: Performance and Size Validation (15 minutes)

#### Task 5.1: Template Size Analysis
**Objective**: Ensure template meets size requirements

**MCP Commands**:
```bash
# Check template sizes
echo "Template size analysis:"
for template in templates/*.html; do
    size=$(wc -c < "$template")
    echo "$(basename "$template"): $size bytes ($(echo "scale=2; $size/1024" | bc) KB)"
    
    if [ $size -gt 10240 ]; then
        echo "⚠️  WARNING: Template exceeds 10KB optimal size"
    elif [ $size -gt 51200 ]; then
        echo "❌ ERROR: Template exceeds 50KB maximum size"
    else
        echo "✅ Template size is acceptable"
    fi
done

# Estimate inscription costs
echo "Estimated inscription costs (roughly 1 sat per byte):"
for template in templates/*.html; do
    size=$(wc -c < "$template")
    echo "$(basename "$template"): ~$size sats"
done
```

**Expected Results**:
- All templates < 10KB (optimal) or < 50KB (maximum)
- Reasonable inscription costs

**Success Criteria**: All templates meet size requirements

#### Task 5.2: Browser Performance Test
**Objective**: Verify template loads quickly and efficiently

**MCP Commands**:
```bash
# Test load time
echo "Testing template load performance..."
start_time=$(date +%s.%N)
curl -s http://localhost:8000/templates/membershipCard_base.html > /dev/null
end_time=$(date +%s.%N)
load_time=$(echo "$end_time - $start_time" | bc)
echo "Load time: ${load_time}s"

if (( $(echo "$load_time < 2.0" | bc -l) )); then
    echo "✅ Load time is acceptable (< 2 seconds)"
else
    echo "⚠️  Load time is slow (> 2 seconds)"
fi
```

**Expected Results**:
- Load time < 2 seconds
- No memory leaks or performance issues

**Success Criteria**: Template loads quickly and efficiently

**AI Action**: Execute performance tests and verify results

**Human Confirmation Required**:
> **STOP HERE** - Confirm with human user that all performance and size requirements are met before proceeding to Phase 6.

---

### Phase 6: Final Validation and Report Generation (15 minutes)

#### Task 6.1: Generate Comprehensive Test Report
**Objective**: Create detailed report of all test results

**MCP Commands**:
```bash
# Generate final test report
cat > "results/final_test_report_$(date +%Y%m%d_%H%M%S).md" << 'EOF'
# Phase 2.2.1 Inscription Template - Final Test Report

Generated: $(date)

## Test Summary

### Environment Setup
- ✅ Testing environment: /inscription-testing/
- ✅ Base template: membershipCard_base.html
- ✅ Automated scripts: automated_test.sh, test_api_connection.sh
- ✅ API connection: Hiro Ordinals API (Signet)

### Test Results

#### Phase 1: Environment Validation
- API Connection: $(if [ -f "results/api_test_result.txt" ]; then echo "✅ PASSED"; else echo "❌ FAILED"; fi)

#### Phase 2: Template Validation
- Template Size: $(ls -la templates/membershipCard_base.html | awk '{print $5 " bytes"}')
- External Dependencies: $(if grep -q "http\|https\|cdn\|external" templates/membershipCard_base.html; then echo "❌ FOUND"; else echo "✅ NONE"; fi)
- SVG Assets: $(grep -c "SVG_ACTIVE\|SVG_EXPIRED" templates/membershipCard_base.html) embedded
- cardStatus Function: $(if grep -q "window.cardStatus" templates/membershipCard_base.html; then echo "✅ PRESENT"; else echo "❌ MISSING"; fi)

#### Phase 3: Automated Test Execution
- Test Scenarios: 4
- Successful Inscriptions: $(wc -l < results/successful_inscriptions.txt 2>/dev/null || echo "0")
- Failed Inscriptions: $(wc -l < results/failed_inscriptions.txt 2>/dev/null || echo "0")
- Content Validations: $(ls results/validation_*.html 2>/dev/null | wc -l) completed

#### Phase 4: Content Validation
- Content Matches: $(if [ -f "results/content_validation_result.txt" ]; then echo "✅ ALL PASSED"; else echo "❌ FAILURES FOUND"; fi)
- Balance Calculations: $(if [ -f "results/balance_test_result.txt" ]; then echo "✅ ACCURATE"; else echo "❌ INACCURATE"; fi)

#### Phase 5: Performance and Size
- Template Size: $(wc -c < templates/membershipCard_base.html) bytes
- Load Time: $(if [ -f "results/load_time.txt" ]; then cat results/load_time.txt; else echo "Not measured"; fi)
- Size Requirement: $(if [ $(wc -c < templates/membershipCard_base.html) -lt 10240 ]; then echo "✅ < 10KB"; else echo "⚠️  > 10KB"; fi)

## Inscription Details

### Successful Inscriptions
$(if [ -f "results/successful_inscriptions.txt" ]; then
    while read -r inscription_id; do
        echo "- $inscription_id"
    done < results/successful_inscriptions.txt
else
    echo "- None"
fi)

### Failed Inscriptions
$(if [ -f "results/failed_inscriptions.txt" ]; then
    while read -r inscription_id; do
        echo "- $inscription_id"
    done < results/failed_inscriptions.txt
else
    echo "- None"
fi)

## Configuration

- API: Hiro Ordinals API
- Network: Signet
- Fee Rate: 1 sats/vB
- Decay Rate: 35 sats/block
- Treasury Address: tb1q...

## Recommendations

$(if [ $(wc -l < results/successful_inscriptions.txt 2>/dev/null || echo "0") -eq 4 ]; then
    echo "✅ **READY FOR MAINNET DEPLOYMENT**"
    echo "- All tests passed successfully"
    echo "- Template meets all requirements"
    echo "- Balance calculations are accurate"
    echo "- Content integrity verified"
else
    echo "⚠️ **ISSUES FOUND - REVIEW REQUIRED**"
    echo "- Some tests failed"
    echo "- Review failed inscriptions and errors"
    echo "- Fix issues before mainnet deployment"
fi)

## Files Generated

### Templates
$(ls -la templates/*.html 2>/dev/null || echo "- None")

### Test Results
$(ls -la results/*.html 2>/dev/null || echo "- None")

### Validation Files
$(ls -la results/validation_*.html 2>/dev/null || echo "- None")

### Logs
$(ls -la logs/*.log 2>/dev/null || echo "- None")

EOF

echo "Final test report generated: results/final_test_report_$(date +%Y%m%d_%H%M%S).md"
```

**Expected Results**:
- Comprehensive test report generated
- All test results documented
- Clear recommendations provided

**Success Criteria**: Complete test report with all results

#### Task 6.2: Final Validation Checklist
**Objective**: Verify all success criteria are met

**MCP Commands**:
```bash
echo "Final Validation Checklist:"
echo ""

# Check all success criteria
criteria_passed=0
total_criteria=8

echo "1. Template renders in browsers:"
if [ -f "results/browser_test_result.txt" ]; then
    echo "   ✅ PASSED"
    ((criteria_passed++))
else
    echo "   ❌ NOT TESTED"
fi

echo "2. SVG assets display correctly:"
if [ -f "templates/membershipCard_base.html" ] && grep -q "SVG_ACTIVE\|SVG_EXPIRED" templates/membershipCard_base.html; then
    echo "   ✅ PASSED"
    ((criteria_passed++))
else
    echo "   ❌ FAILED"
fi

echo "3. Balance calculation accurate:"
if [ $(wc -l < results/successful_inscriptions.txt 2>/dev/null || echo "0") -eq 4 ]; then
    echo "   ✅ PASSED"
    ((criteria_passed++))
else
    echo "   ❌ FAILED"
fi

echo "4. cardStatus function accessible:"
if grep -q "window.cardStatus" templates/membershipCard_base.html; then
    echo "   ✅ PASSED"
    ((criteria_passed++))
else
    echo "   ❌ FAILED"
fi

echo "5. Template size optimized:"
template_size=$(wc -c < templates/membershipCard_base.html)
if [ $template_size -lt 10240 ]; then
    echo "   ✅ PASSED ($template_size bytes < 10KB)"
    ((criteria_passed++))
else
    echo "   ❌ FAILED ($template_size bytes >= 10KB)"
fi

echo "6. No external dependencies:"
if ! grep -q "http\|https\|cdn\|external" templates/membershipCard_base.html; then
    echo "   ✅ PASSED"
    ((criteria_passed++))
else
    echo "   ❌ FAILED"
fi

echo "7. All test inscriptions created:"
if [ $(wc -l < results/successful_inscriptions.txt 2>/dev/null || echo "0") -eq 4 ]; then
    echo "   ✅ PASSED"
    ((criteria_passed++))
else
    echo "   ❌ FAILED"
fi

echo "8. Content validation passed:"
if [ -f "results/content_validation_result.txt" ]; then
    echo "   ✅ PASSED"
    ((criteria_passed++))
else
    echo "   ❌ FAILED"
fi

echo ""
echo "Final Score: $criteria_passed/$total_criteria criteria passed"

if [ $criteria_passed -eq $total_criteria ]; then
    echo "🎉 ALL TESTS PASSED - TEMPLATE READY FOR MAINNET DEPLOYMENT"
else
    echo "⚠️  SOME TESTS FAILED - REVIEW REQUIRED BEFORE MAINNET DEPLOYMENT"
fi
```

**Expected Results**:
- All 8 success criteria passed
- Template ready for mainnet deployment

**Success Criteria**: 8/8 criteria passed

**AI Action**: Execute final validation and generate report

**Human Confirmation Required**:
> **FINAL CONFIRMATION REQUIRED** - Present the final test report to human user and confirm that all 8 success criteria have been met before proceeding to mainnet deployment.

---

## Error Handling and Troubleshooting

### Common Issues

#### API Connection Failures
**Symptoms**: HTTP status codes other than 200
**Solutions**:
- Verify `HIRO_API_KEY` is set correctly
- Check Hiro account status and API permissions
- Ensure stable internet connection

#### Inscription Failures
**Symptoms**: Inscriptions not confirming within 30 minutes
**Solutions**:
- Check Signet network status
- Verify fee rate is sufficient
- Monitor Hiro API status

#### Content Validation Failures
**Symptoms**: Differences between original and inscribed content
**Solutions**:
- Check for encoding issues
- Verify template is self-contained
- Review API response handling

#### Balance Calculation Errors
**Symptoms**: Incorrect balance calculations
**Solutions**:
- Verify 35 sats/block decay rate
- Check receipt validation logic
- Test with known values

### Recovery Procedures

#### If Tests Fail
1. **Document the failure** in results directory
2. **Identify root cause** using error messages
3. **Fix the issue** in template or test script
4. **Re-run failed tests** only
5. **Verify fix** before proceeding

#### If API Issues Occur
1. **Wait 5 minutes** and retry
2. **Check Hiro status page**
3. **Verify API key permissions**
4. **Contact Hiro support** if persistent

---

## Success Criteria Summary

### Must Pass (All Required)
- ✅ Template renders in all browsers
- ✅ SVG assets display correctly
- ✅ Balance calculation is accurate (35 sats/block)
- ✅ cardStatus() function is accessible
- ✅ Template size < 10KB (optimal)
- ✅ No external dependencies
- ✅ All test inscriptions created successfully
- ✅ Content validation passes

### Nice to Have (Optional)
- ✅ Template size < 5KB (very optimal)
- ✅ Load time < 1 second
- ✅ Advanced error handling
- ✅ Performance optimizations

---

## Next Steps After Successful Testing

1. **Review final test report** with human user
2. **Document any issues found** and resolutions
3. **Prepare for mainnet deployment** with confidence
4. **Update project documentation** with test results
5. **Proceed to Phase 2.2.2** (PSBT Generation)

---

*This testing plan ensures comprehensive validation of the inscription template before blockchain deployment, preventing costly errors in the immutable inscription.* 