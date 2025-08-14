# Phase 2.2.1b: MVP - Payment-Aware Inscriptions with Recursive Endpoints

**Feature:** Payment-Aware Membership Cards  
**Sub-Phase:** 2.2.1b - MVP Implementation with Basic Recursive Inscriptions  
**Duration:** 2-3 days  
**Document Type:** Implementation Plan  
**Date:** January 2025  

---

## Overview

### Goal
Implement the first truly payment-aware inscription system by updating the membership card template to use recursive inscription endpoints. This MVP will enable inscriptions to dynamically fetch their child inscriptions (receipts), validate them, and calculate real-time balance with decay.

### Critical Importance
This phase transforms static inscriptions into dynamic, payment-aware digital assets. We're implementing the core functionality that makes the entire SatSpray system possible - inscriptions that can track and respond to Bitcoin payments.

### Success Criteria
- Inscription can fetch its own child inscriptions via `/r/children`
- Balance calculation works with real child inscription data
- Current block height is fetched dynamically via `/r/blockheight`
- Receipt validation ensures proper schema and parent relationship
- Template remains under 15KB for reasonable inscription costs
- Works on local ord server and Bitcoin Signet

---

## Prerequisites

### Technical Requirements
- Understanding of recursive inscription endpoints
- Existing `membershipCard.html` template from Phase 2.2.1
- Local ord server running with `--enable-index-runes --enable-json-api`
- Bitcoin Signet wallet with test coins
- Basic understanding of async JavaScript and fetch API

### Environment Setup
```bash
# Ensure ord is installed and updated
ord --version  # Should be 0.18.0 or higher

# Start local ord server
ord --signet server --http-port 8080 --enable-index-runes --enable-json-api

# Verify recursive endpoints are available
curl http://localhost:8080/r/blockheight
```

---

## Implementation Steps

### Step 1: Update the Inscription Template Structure

**File:** `client/src/templates/inscription/membershipCard.html`

First, we need to update the template to identify itself and prepare for recursive operations:

```javascript
// Add at the beginning of the script section
(function() {
    // Get inscription ID from URL path
    function getInscriptionId() {
        const pathParts = window.location.pathname.split('/');
        const inscriptionId = pathParts[pathParts.length - 1];
        
        // Validate inscription ID format
        if (!/^[a-f0-9]{64}i\d+$/i.test(inscriptionId)) {
            console.error('Invalid inscription ID format');
            return null;
        }
        
        return inscriptionId;
    }
    
    // Store inscription ID globally
    window.INSCRIPTION_ID = getInscriptionId();
})();
```

### Step 2: Implement Recursive Data Fetching

Replace the placeholder `getReceipts()` function with actual recursive fetching:

```javascript
// Get current block height from ord
async function getCurrentBlockHeight() {
    try {
        const response = await fetch('/r/blockheight');
        if (!response.ok) {
            throw new Error('Failed to fetch block height');
        }
        const blockHeight = await response.json();
        return blockHeight;
    } catch (error) {
        console.error('Error fetching block height:', error);
        // Fallback to a reasonable estimate
        return 850000;
    }
}

// Get receipt inscriptions (child inscriptions)
async function getReceipts() {
    try {
        if (!window.INSCRIPTION_ID) {
            console.error('No inscription ID available');
            return [];
        }
        
        const receipts = [];
        let page = 0;
        let hasMore = true;
        
        // Paginate through all children
        while (hasMore) {
            const response = await fetch(`/r/children/${window.INSCRIPTION_ID}/inscriptions/${page}`);
            if (!response.ok) {
                console.error('Failed to fetch children');
                break;
            }
            
            const data = await response.json();
            
            // Process each child inscription
            for (const childId of data.ids) {
                try {
                    // Fetch the content of each child
                    const contentResponse = await fetch(`/r/content/${childId}`);
                    if (!contentResponse.ok) continue;
                    
                    const receiptText = await contentResponse.text();
                    const receipt = JSON.parse(receiptText);
                    
                    // Validate receipt before adding
                    if (isValidReceipt(receipt)) {
                        receipts.push(receipt);
                    }
                } catch (err) {
                    console.error(`Error processing child ${childId}:`, err);
                }
            }
            
            hasMore = data.more;
            page++;
        }
        
        return receipts;
    } catch (error) {
        console.error('Error fetching receipts:', error);
        return [];
    }
}

// Validate receipt format and data
function isValidReceipt(receipt) {
    // Check required fields
    if (!receipt || typeof receipt !== 'object') return false;
    if (receipt.schema !== 'satspray.topup.v1') return false;
    if (receipt.parent !== window.INSCRIPTION_ID) return false;
    if (receipt.paid_to !== window.TREASURY_ADDR) return false;
    
    // Validate data types
    if (typeof receipt.amount !== 'number' || receipt.amount <= 0) return false;
    if (typeof receipt.block !== 'number' || receipt.block <= 0) return false;
    if (typeof receipt.txid !== 'string' || !/^[a-f0-9]{64}$/i.test(receipt.txid)) return false;
    
    return true;
}
```

### Step 3: Update Balance Calculation

Modify the balance calculation to use real block height:

```javascript
// Calculate current balance based on receipts and decay
async function calculateBalance() {
    const receipts = await getReceipts();
    const currentBlock = await getCurrentBlockHeight();
    
    // Sort receipts by block height (oldest first)
    const validReceipts = receipts.sort((a, b) => a.block - b.block);
    
    // Calculate balance with proper decay logic
    let totalBalance = 0;
    
    for (const receipt of validReceipts) {
        // Calculate decay from receipt block to current
        const blocksSinceReceipt = currentBlock - receipt.block;
        const decayAmount = blocksSinceReceipt * window.DECAY_PER_BLOCK;
        
        // Add receipt amount minus decay
        const remainingValue = Math.max(0, receipt.amount - decayAmount);
        totalBalance += remainingValue;
        
        console.log(`Receipt: ${receipt.amount} sats at block ${receipt.block}, remaining: ${remainingValue}`);
    }
    
    return Math.max(0, totalBalance);
}
```

### Step 4: Update Display Function

Modify the display update to be async:

```javascript
// Update UI based on current balance
async function updateCardDisplay() {
    try {
        // Show loading state
        const statusBadge = document.getElementById('statusBadge');
        const balanceDisplay = document.getElementById('balanceDisplay');
        statusBadge.textContent = 'Loading...';
        balanceDisplay.textContent = '-- sats';
        
        // Calculate balance
        const balance = await calculateBalance();
        const isActive = balance > 0;
        
        // Update visual
        const cardVisual = document.getElementById('cardVisual');
        cardVisual.innerHTML = isActive ? SVG_ACTIVE : SVG_EXPIRED;
        
        // Update status badge
        statusBadge.textContent = isActive ? 'Active' : 'Expired';
        statusBadge.className = 'status-badge ' + (isActive ? 'status-active' : 'status-expired');
        
        // Update balance display
        balanceDisplay.textContent = balance.toLocaleString() + ' sats';
        
        // Calculate blocks remaining
        const blocksRemaining = Math.floor(balance / window.DECAY_PER_BLOCK);
        
        // Update decay rate display
        const decayRateElement = document.getElementById('decayRate');
        if (decayRateElement) {
            decayRateElement.textContent = window.DECAY_PER_BLOCK;
        }
        
        return {
            balance: balance,
            blocksRemaining: blocksRemaining,
            status: isActive ? 'ACTIVE' : 'EXPIRED',
            inscriptionId: window.INSCRIPTION_ID
        };
    } catch (error) {
        console.error('Error updating display:', error);
        statusBadge.textContent = 'Error';
        statusBadge.className = 'status-badge status-expired';
        return {
            balance: 0,
            blocksRemaining: 0,
            status: 'ERROR',
            error: error.message
        };
    }
}

// Update the exposed cardStatus function
window.cardStatus = async function() {
    return await updateCardDisplay();
};
```

### Step 5: Update Initialization

Update the initialization to handle async operations:

```javascript
// Initialize on load
window.addEventListener('load', function() {
    // Initial update
    updateCardDisplay().then(function(status) {
        console.log('Card initialized:', status);
    });
    
    // Set up periodic updates (every 30 seconds)
    setInterval(function() {
        updateCardDisplay().then(function(status) {
            console.log('Card updated:', status);
        });
    }, 30000);
});
```

### Step 6: Add Error Handling and Fallbacks

Add comprehensive error handling:

```javascript
// Wrapper for fetch with timeout
async function fetchWithTimeout(url, timeout = 5000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('Request timeout');
        }
        throw error;
    }
}

// Add retry logic for critical endpoints
async function fetchWithRetry(url, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetchWithTimeout(url);
            if (response.ok) return response;
            
            // Don't retry on 4xx errors
            if (response.status >= 400 && response.status < 500) {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            // Wait before retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
    }
}
```

---

## Testing Strategy

### Step 1: Local Testing with Mock Endpoints

Create a test harness that simulates recursive endpoints:

**File:** `inscription-testing/test-recursive-endpoints.html`

```html
<!DOCTYPE html>
<html>
<head>
    <title>Recursive Endpoint Test</title>
</head>
<body>
    <div id="test-output"></div>
    <script>
        // Mock recursive endpoints for testing
        window.mockEndpoints = {
            '/r/blockheight': 850000,
            '/r/children/test123i0/inscriptions/0': {
                ids: ['child1i0', 'child2i0'],
                more: false,
                page: 0
            },
            '/r/content/child1i0': JSON.stringify({
                schema: 'satspray.topup.v1',
                parent: 'test123i0',
                amount: 100000,
                block: 849900,
                paid_to: 'tb1q...',
                txid: '1234...'
            }),
            '/r/content/child2i0': JSON.stringify({
                schema: 'satspray.topup.v1',
                parent: 'test123i0',
                amount: 50000,
                block: 849950,
                paid_to: 'tb1q...',
                txid: '5678...'
            })
        };
        
        // Override fetch for testing
        window.fetch = async function(url) {
            const data = window.mockEndpoints[url];
            if (data) {
                return {
                    ok: true,
                    json: async () => data,
                    text: async () => typeof data === 'string' ? data : JSON.stringify(data)
                };
            }
            throw new Error('Endpoint not mocked: ' + url);
        };
        
        // Test the inscription logic
        // ... include inscription code here ...
    </script>
</body>
</html>
```

### Step 2: Local ord Server Testing

1. **Start local ord server**:
```bash
ord --regtest server --http-port 8080 --enable-index-runes --enable-json-api
```

2. **Create test parent inscription**:
```bash
# Create the inscription
ord --regtest wallet inscribe --fee-rate 1 --file membershipCard.html

# Note the inscription ID
export PARENT_ID="..."
```

3. **Create test child inscriptions**:
```bash
# Create receipt JSON files
echo '{
  "schema": "satspray.topup.v1",
  "parent": "'$PARENT_ID'",
  "amount": 100000,
  "block": 100,
  "paid_to": "bcrt1q...",
  "txid": "abc..."
}' > receipt1.json

# Inscribe as children
ord --regtest wallet inscribe --fee-rate 1 --parent $PARENT_ID --file receipt1.json
```

4. **Test in browser**:
```bash
# Open inscription in browser
open http://localhost:8080/inscription/$PARENT_ID
```

### Step 3: Signet Testing

1. **Deploy to Signet**:
```bash
# Switch to signet
ord --signet wallet inscribe --fee-rate 10 --file membershipCard.html
```

2. **Create test receipts on Signet**
3. **Monitor via ordinals explorer**

---

## Common Issues and Solutions

### Issue 1: CORS Errors
**Problem**: Recursive endpoints blocked by CORS  
**Solution**: Ensure you're accessing inscription through ord server, not file://

### Issue 2: Child Inscriptions Not Found
**Problem**: `/r/children` returns empty array  
**Solution**: Verify parent-child relationship was established during inscription

### Issue 3: Slow Performance
**Problem**: Fetching many children takes too long  
**Solution**: Implement caching and batch processing

### Issue 4: Invalid JSON in Receipts
**Problem**: Child inscriptions contain malformed JSON  
**Solution**: Add try-catch around JSON.parse and skip invalid receipts

---

## Optimization Tips

1. **Minimize Fetch Calls**:
   - Cache results where possible
   - Batch child content fetching
   - Use pagination wisely

2. **Reduce Template Size**:
   - Minify JavaScript and CSS
   - Optimize SVG assets
   - Remove comments in production

3. **Handle Large Receipt Sets**:
   - Implement pagination UI
   - Show balance while still loading
   - Limit display to recent receipts

---

## Deliverables

### Required Files
1. Updated `membershipCard.html` with recursive functionality
2. Test harness for local development
3. Documentation of testing results
4. Inscribed test parent on Signet

### Validation Checklist
- [ ] Inscription successfully fetches children
- [ ] Balance calculation uses real block height
- [ ] Receipt validation works correctly
- [ ] Error handling prevents crashes
- [ ] Performance acceptable with 10+ receipts
- [ ] Template size remains under 15KB
- [ ] Works on local ord server
- [ ] Works on Bitcoin Signet

---

## Next Phase

After successful MVP implementation:
1. Deploy parser library system (Phase 2.2.1c)
2. Implement full transaction validation
3. Optimize for production use
4. Create comprehensive test suite

---

*This document provides a detailed implementation plan for creating the first truly payment-aware inscriptions using recursive endpoints. This MVP demonstrates the core functionality while keeping complexity manageable.*