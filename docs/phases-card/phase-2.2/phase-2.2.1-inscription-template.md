# Phase 2.2.1: Inscription Template Foundation

**Feature:** Membership Card Creation  
**Sub-Phase:** 2.2.1 - Inscription Template Foundation  
**Duration:** 2-3 days  
**Document Type:** Implementation Plan  
**Date:** August 1, 2025  

---

## Overview

### Goal
Create the HTML inscription template that will be inscribed on the Bitcoin blockchain as the parent membership card. This template must be self-contained, include all visual assets inline, implement balance calculation logic, and expose a cardStatus() function for external queries.

### Critical Importance
This template is the core of the entire system. Once inscribed on the blockchain, it cannot be modified. Any errors in the template will require creating entirely new membership cards, so extreme care must be taken during development.

### Success Criteria
- HTML template renders correctly in all major browsers (Chrome, Firefox, Safari)
- SVG assets display properly in both active and expired states
- JavaScript balance calculation accurately tracks decay rate (35 sats/block)
- cardStatus() function is accessible from external contexts
- Template size is optimized for inscription costs
- No external dependencies (fully self-contained)

---

## Prerequisites

### Knowledge Requirements
- Understanding of ordinals inscription standards
- HTML/CSS/JavaScript for self-contained applications
- SVG creation and optimization
- Bitcoin block time concepts

### Environment Setup
```bash
# Ensure development environment is ready
cd /Users/michaelchristopher/repos/ordPayCard
npm install

# Create template directory structure
mkdir -p client/src/templates/inscription
mkdir -p client/src/assets/svgs/membership
```

### Tools Needed
- SVG editor (Figma, Inkscape, or similar)
- Browser developer tools for testing
- Ordinals inscription size calculator
- Local web server for preview testing

---

## Implementation Steps

### Step 1: Create Base HTML Template Structure

**File:** `client/src/templates/inscription/membershipCard.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SatSpray Membership Card</title>
    <style>
        /* All styles must be inline - no external CSS */
        body {
            margin: 0;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f5f5;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }
        
        .card-container {
            width: 400px;
            max-width: 90vw;
            background: white;
            border-radius: 16px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        
        .card-visual {
            width: 100%;
            height: 240px;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .card-info {
            padding: 24px;
        }
        
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 9999px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .status-active {
            background: #10b981;
            color: white;
        }
        
        .status-expired {
            background: #ef4444;
            color: white;
        }
        
        .balance-info {
            margin-top: 16px;
            font-size: 14px;
            color: #6b7280;
        }
        
        .balance-value {
            font-size: 24px;
            font-weight: 700;
            color: #111827;
            margin-top: 4px;
        }
    </style>
</head>
<body>
    <div class="card-container">
        <div class="card-visual" id="cardVisual">
            <!-- SVG will be inserted here by JavaScript -->
        </div>
        <div class="card-info">
            <div id="statusBadge" class="status-badge">Loading...</div>
            <div class="balance-info">
                <div>Current Balance</div>
                <div id="balanceDisplay" class="balance-value">-- sats</div>
            </div>
            <div style="margin-top: 8px; font-size: 12px; color: #9ca3af;">
                Decay Rate: <span id="decayRate">35</span> sats/block
            </div>
        </div>
    </div>

    <script>
        // Configuration - These values are hardcoded into the inscription
        window.CARD_SCHEMA_VER = "1";
        window.DECAY_PER_BLOCK = 35;
        window.TREASURY_ADDR = "tb1q..."; // Will be set during creation
        
        // Embedded SVG assets
        const SVG_ACTIVE = `<svg viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg">
            <!-- Active state SVG design -->
        </svg>`;
        
        const SVG_EXPIRED = `<svg viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg">
            <!-- Expired state SVG design -->
        </svg>`;
        
        // Main card logic will go here
    </script>
</body>
</html>
```

### Step 2: Design and Embed SVG Assets

**Active State SVG Design Requirements:**
- Vibrant green gradient background (#10b981 to #059669)
- Bitcoin "₿" symbol prominently displayed
- "ACTIVE" text overlay
- Circuit/network pattern suggesting connectivity
- Size: 400x240px viewBox

**Expired State SVG Design Requirements:**
- Muted red gradient background (#ef4444 to #dc2626)
- Faded Bitcoin "₿" symbol
- "EXPIRED" text overlay
- Broken circuit pattern suggesting disconnection
- Size: 400x240px viewBox

**SVG Optimization Checklist:**
- [ ] Remove all external references
- [ ] Inline all styles
- [ ] Optimize paths using SVGO
- [ ] Convert text to paths
- [ ] Remove unnecessary metadata
- [ ] Test rendering in all browsers

### Step 3: Implement Balance Calculation Logic

```javascript
// Balance calculation and state management
(function() {
    // Get receipt inscriptions (child inscriptions)
    async function getReceipts() {
        // In the actual inscription, this will interface with the ordinals protocol
        // For now, we'll structure it to be easily replaceable
        try {
            // This is a placeholder - actual implementation will query child inscriptions
            const receipts = window.RECEIPTS || [];
            return receipts;
        } catch (error) {
            console.error('Error fetching receipts:', error);
            return [];
        }
    }
    
    // Calculate current balance based on receipts and decay
    async function calculateBalance() {
        const receipts = await getReceipts();
        const currentBlock = window.CURRENT_BLOCK || 0;
        
        let totalBalance = 0;
        
        for (const receipt of receipts) {
            try {
                // Validate receipt format
                if (receipt.schema !== 'satspray.topup.v1') continue;
                if (receipt.paid_to !== window.TREASURY_ADDR) continue;
                
                // Calculate remaining value after decay
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
    
    // Update UI based on current balance
    async function updateCardDisplay() {
        const balance = await calculateBalance();
        const isActive = balance > 0;
        
        // Update visual
        const cardVisual = document.getElementById('cardVisual');
        cardVisual.innerHTML = isActive ? SVG_ACTIVE : SVG_EXPIRED;
        
        // Update status badge
        const statusBadge = document.getElementById('statusBadge');
        statusBadge.textContent = isActive ? 'Active' : 'Expired';
        statusBadge.className = `status-badge ${isActive ? 'status-active' : 'status-expired'}`;
        
        // Update balance display
        const balanceDisplay = document.getElementById('balanceDisplay');
        balanceDisplay.textContent = `${balance.toLocaleString()} sats`;
        
        // Calculate blocks remaining
        const blocksRemaining = Math.floor(balance / window.DECAY_PER_BLOCK);
        
        return {
            balance,
            blocksRemaining,
            status: isActive ? 'ACTIVE' : 'EXPIRED'
        };
    }
    
    // Expose cardStatus function for external queries
    window.cardStatus = async function() {
        return await updateCardDisplay();
    };
    
    // Initialize on load
    window.addEventListener('load', function() {
        updateCardDisplay();
        
        // Set up periodic updates (every 10 seconds for demo)
        setInterval(updateCardDisplay, 10000);
    });
})();
```

### Step 4: Create Test Harness

**File:** `client/src/pages/InscriptionPreview.tsx`

```typescript
import React, { useState, useEffect } from 'react';

export const InscriptionPreview: React.FC = () => {
  const [templateContent, setTemplateContent] = useState<string>('');
  const [mockData, setMockData] = useState({
    currentBlock: 850000,
    receipts: [
      {
        schema: 'satspray.topup.v1',
        parent: 'test_inscription_id',
        amount: 50000,
        block: 849900,
        paid_to: 'tb1q...',
        txid: 'test_txid'
      }
    ]
  });

  useEffect(() => {
    // Load template file
    fetch('/src/templates/inscription/membershipCard.html')
      .then(res => res.text())
      .then(content => {
        // Inject mock data for testing
        const modifiedContent = content
          .replace('window.CURRENT_BLOCK || 0', `${mockData.currentBlock}`)
          .replace('window.RECEIPTS || []', JSON.stringify(mockData.receipts))
          .replace('window.TREASURY_ADDR = "tb1q..."', 'window.TREASURY_ADDR = "tb1q..."');
        
        setTemplateContent(modifiedContent);
      });
  }, [mockData]);

  const updateMockData = (key: string, value: any) => {
    setMockData(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Inscription Template Preview</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Controls */}
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Mock Data Controls</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Current Block Height
                </label>
                <input
                  type="number"
                  value={mockData.currentBlock}
                  onChange={(e) => updateMockData('currentBlock', parseInt(e.target.value))}
                  className="input-field"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Test Receipt Amount (sats)
                </label>
                <input
                  type="number"
                  value={mockData.receipts[0]?.amount || 0}
                  onChange={(e) => {
                    const receipts = [...mockData.receipts];
                    receipts[0] = { ...receipts[0], amount: parseInt(e.target.value) };
                    updateMockData('receipts', receipts);
                  }}
                  className="input-field"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Receipt Block Height
                </label>
                <input
                  type="number"
                  value={mockData.receipts[0]?.block || 0}
                  onChange={(e) => {
                    const receipts = [...mockData.receipts];
                    receipts[0] = { ...receipts[0], block: parseInt(e.target.value) };
                    updateMockData('receipts', receipts);
                  }}
                  className="input-field"
                />
              </div>
            </div>
          </div>
          
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Template Info</h2>
            <div className="space-y-2 text-sm">
              <div>Size: {new Blob([templateContent]).size} bytes</div>
              <div>Estimated inscription cost: ~{Math.ceil(new Blob([templateContent]).size * 0.01)} sats</div>
            </div>
          </div>
        </div>
        
        {/* Preview */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Live Preview</h2>
          <div className="border rounded-lg overflow-hidden">
            <iframe
              srcDoc={templateContent}
              style={{ width: '100%', height: '600px', border: 'none' }}
              title="Inscription Preview"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
```

---

## Technical Specifications

### HTML Template Requirements
- **Maximum Size:** 10KB (optimal), 50KB (absolute maximum)
- **Character Encoding:** UTF-8
- **No External Resources:** All assets must be embedded inline
- **Browser Compatibility:** Chrome 90+, Firefox 88+, Safari 14+

### JavaScript Requirements
- **ES5 Compatible:** For maximum browser compatibility
- **No External APIs:** Cannot make network requests
- **Global Namespace:** Only expose `window.cardStatus()`
- **Error Handling:** Graceful degradation for missing data

### SVG Requirements
- **Embedded as String:** Must be inlined in JavaScript
- **Optimized Paths:** Use SVGO for optimization
- **No External Fonts:** Convert text to paths
- **Color Palette:** Limited to ensure good compression

---

## Testing Approach

### Local Testing
1. Create test HTML file with mock data
2. Test in all major browsers
3. Verify responsive design
4. Test with various receipt scenarios
5. Measure performance and size

### Integration Testing
```javascript
// Test the cardStatus function
async function testCardStatus() {
  // Set up mock environment
  window.CURRENT_BLOCK = 850000;
  window.RECEIPTS = [
    {
      schema: 'satspray.topup.v1',
      amount: 100000,
      block: 849000,
      paid_to: 'tb1q...'
    }
  ];
  
  // Call cardStatus
  const status = await window.cardStatus();
  
  // Verify response
  console.assert(status.balance === 65000, 'Balance calculation error');
  console.assert(status.status === 'ACTIVE', 'Status calculation error');
  console.assert(status.blocksRemaining === 1857, 'Blocks remaining error');
}
```

### Testnet Inscription Testing
1. Create minimal test inscription first
2. Verify inscription appears correctly in ordinals explorers
3. Test querying inscription content via API
4. Validate child inscription relationships

---

## Common Pitfalls to Avoid

### Critical Mistakes
1. **External Dependencies**
   - ❌ Don't use CDN links for libraries
   - ❌ Don't reference external CSS files
   - ❌ Don't make API calls
   - ✅ Embed everything inline

2. **Browser Compatibility**
   - ❌ Don't use modern JS features (arrow functions, async/await in main scope)
   - ❌ Don't use CSS Grid or modern properties without fallbacks
   - ✅ Test in older browsers
   - ✅ Use feature detection

3. **Size Optimization**
   - ❌ Don't include unnecessary whitespace
   - ❌ Don't use unoptimized images
   - ✅ Minify after testing
   - ✅ Use SVG instead of raster images

4. **Security Considerations**
   - ❌ Don't include private keys or secrets
   - ❌ Don't trust external data without validation
   - ✅ Validate all receipt data
   - ✅ Handle errors gracefully

### Testing Oversights
1. **Edge Cases**
   - Test with no receipts
   - Test with invalid receipts
   - Test with future block heights
   - Test with very large numbers

2. **Performance**
   - Test with hundreds of receipts
   - Ensure UI remains responsive
   - Monitor memory usage

---

## Deliverables

### Required Files
1. `membershipCard.html` - Complete inscription template
2. `card-active.svg` - Optimized active state SVG
3. `card-expired.svg` - Optimized expired state SVG
4. `InscriptionPreview.tsx` - Test harness component
5. `template.test.js` - Unit tests for balance calculation

### Documentation
1. SVG design source files
2. Size optimization report
3. Browser compatibility test results
4. Example inscription IDs from testnet

### Validation Checklist
- [ ] Template renders without external resources
- [ ] Balance calculation is accurate
- [ ] cardStatus() function is accessible
- [ ] SVG assets display correctly
- [ ] Total size is under 10KB
- [ ] Works in all target browsers
- [ ] Handles edge cases gracefully
- [ ] Code is well-commented
- [ ] No hardcoded test data in final version

---

## Next Phase

Upon successful completion of the inscription template:
1. Test inscription on testnet
2. Verify child inscription queries work
3. Begin PSBT generation implementation
4. Create API endpoints for inscription creation

---

*This document provides a comprehensive plan for creating the inscription template foundation. The template is the immutable core of the system, so careful attention to detail during this phase will prevent costly mistakes later.*