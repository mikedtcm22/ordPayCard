# Comprehensive Automation Plan for Inscription Testing

**Document Type:** Testing Infrastructure Plan  
**Created:** January 2025  
**Purpose:** Enable Claude Code to autonomously build, test, and validate inscriptions for the Membership Card project

---

## Overview

This document outlines a comprehensive plan to enable fully automated inscription testing for the SatSpray Membership Card project, specifically targeting Phase 2.2.1b (MVP with recursive inscriptions) and Phase 2.2.1c (parser library with OP_RETURN validation).

### Goal
Enable Claude Code to autonomously build, test, and validate inscriptions with minimal manual intervention, allowing for rapid iteration and comprehensive validation of all success criteria.

---

## Part 1: Local Testing Infrastructure

### 1.1 Mock Ord Server Setup

Create a local mock ord server that simulates recursive inscription endpoints without requiring a real Bitcoin network.

**File:** `inscription-testing/mock-ord-server/server.js`

**Endpoints to Implement:**
- `/r/blockheight` - Returns current block height
- `/r/children/{id}/inscriptions/{page}` - Returns child inscriptions
- `/r/content/{id}` - Returns inscription content
- `/r/tx/{txid}` - Returns transaction hex data
- `/inscription/{id}` - Returns inscription HTML

**Features:**
- Controllable test data for different scenarios
- Configurable responses for error testing
- Performance metrics logging
- WebSocket support for real-time updates

### 1.2 Browser Testing Framework

Set up Playwright for automated browser testing of inscription HTML.

**Installation:**
```bash
npm install --save-dev @playwright/test
npx playwright install chromium
```

**Configuration File:** `playwright.config.ts`
```typescript
{
  testDir: './inscription-testing/tests/browser',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:8080',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  }
}
```

**Pre-authorize in Claude Code settings:**
- `mcp__playwright__browser_navigate`
- `mcp__playwright__browser_snapshot`
- `mcp__playwright__browser_click`
- `mcp__playwright__browser_evaluate`
- `mcp__playwright__browser_take_screenshot`

### 1.3 Test Data Generator

Create utilities to generate comprehensive test data.

**File:** `inscription-testing/utils/testDataGenerator.js`

**Functions:**
- `generateMockTransaction(options)` - Create transactions with OP_RETURN
- `generateReceipt(parentId, amount, block)` - Create receipt inscriptions
- `generateParserTestCases()` - Generate edge cases for parser
- `generateDecayScenarios()` - Create time-based test scenarios

---

## Part 2: Build Automation

### 2.1 Template Build Pipeline

**Script:** `scripts/build-inscriptions.js`

**Features:**
- HTML/CSS/JavaScript minification
- Template size validation (<15KB for MVP, <20KB for parser)
- Development and production build modes
- Source map generation for debugging
- Build metrics reporting

**Build Steps:**
1. Read source templates
2. Process embedded styles and scripts
3. Minify with `html-minifier-terser`
4. Validate output size
5. Generate build report
6. Save to `dist/inscriptions/`

### 2.2 Parser Library Build

**Script:** `scripts/build-parser.js`

**Features:**
- Combine parent and child inscriptions
- Version management system
- Code minification and optimization
- Function validation
- Size optimization

**Output Structure:**
```
dist/parser/
├── btc-parser-parent.min.js
├── btc-parser-v1.0.min.js
├── btc-parser-v1.1.min.js
└── build-report.json
```

---

## Part 3: Testing Automation

### 3.1 Unit Testing Suite

**Test Framework:** Vitest

**Files Structure:**
```
inscription-testing/tests/unit/
├── balanceCalculation.test.js
├── receiptValidation.test.js
├── parserValidation.test.js
├── transactionParser.test.js
├── opReturnExtraction.test.js
└── addressDecoding.test.js
```

**Test Coverage Requirements:**
- Balance calculation with various decay scenarios
- Receipt schema validation
- OP_RETURN parsing and validation
- Transaction hex parsing
- Address format handling (P2PKH, P2WPKH, P2TR)
- Edge cases and error conditions

### 3.2 Integration Testing

**Files Structure:**
```
inscription-testing/tests/integration/
├── recursiveEndpoints.test.js
├── paymentFlow.test.js
├── upgradeFlow.test.js
├── childInscriptionFlow.test.js
└── deduplicationFlow.test.js
```

**Test Scenarios:**
- Complete payment flow with OP_RETURN
- Parser library upgrade mechanism
- Child inscription fetching
- Receipt deduplication
- Multi-card payment isolation

### 3.3 Visual Testing

**Tool:** Playwright with screenshot comparison

**Test Cases:**
- Active card rendering
- Expired card rendering
- Balance display accuracy
- SVG animation behavior
- Responsive layout

**Configuration:**
```javascript
{
  threshold: 0.2, // 20% difference threshold
  animations: 'disabled',
  maxDiffPixels: 100
}
```

---

## Part 4: Continuous Validation

### 4.1 Test Runner Script

**File:** `inscription-testing/run-all-tests.sh`

```bash
#!/bin/bash
# Master test runner script

# Start mock ord server
npm run mock:ord:start

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run browser tests
npm run test:browser

# Generate test report
npm run test:report

# Clean up
npm run mock:ord:stop
```

### 4.2 Success Criteria Validation

**Automated Checks:**

**Phase 2.2.1b (MVP):**
- [ ] Inscription can fetch its own child inscriptions
- [ ] Balance calculation uses real block height
- [ ] Current block height fetched dynamically
- [ ] Receipt validation ensures proper schema
- [ ] Template remains under 15KB
- [ ] Works with mock ord server
- [ ] Error handling prevents crashes

**Phase 2.2.1c (Parser):**
- [ ] Parser correctly extracts OP_RETURN data
- [ ] Payment verification returns 0 for mismatched IDs
- [ ] Transaction parsing handles all output types
- [ ] Deduplication prevents receipt reuse
- [ ] Parser remains under 20KB
- [ ] Upgrade mechanism works correctly

---

## Part 5: Required Installations

### 5.1 NPM Packages

```json
{
  "devDependencies": {
    "@playwright/test": "^1.40.0",
    "express": "^4.18.0",
    "html-minifier-terser": "^7.2.0",
    "vitest": "^1.0.0",
    "bitcoinjs-lib": "^6.1.0",
    "tiny-secp256k1": "^2.2.0",
    "jsdom": "^23.0.0",
    "ws": "^8.14.0",
    "dotenv": "^16.3.0"
  }
}
```

### 5.2 System Tools

**Required:**
- Node.js 18+ (already installed)
- npm 9+ (already installed)

**Optional (for advanced testing):**
- ord CLI (for real inscription testing)
- Bitcoin Core (for transaction creation)
- jq (for JSON processing in scripts)

---

## Part 6: Claude Code Settings Configuration

### 6.1 Pre-authorized Functions

Add to Claude Code settings for autonomous execution:

```json
{
  "pre_authorized_functions": [
    "Bash(npm run test*)",
    "Bash(npm run build*)",
    "Bash(npm run mock*)",
    "Bash(node inscription-testing/*)",
    "Bash(node scripts/build-*)",
    "Bash(npx playwright*)",
    "Bash(npx vitest*)",
    "mcp__playwright__browser_navigate",
    "mcp__playwright__browser_snapshot",
    "mcp__playwright__browser_click",
    "mcp__playwright__browser_evaluate",
    "mcp__playwright__browser_take_screenshot",
    "mcp__playwright__browser_close",
    "Bash(curl http://localhost*)",
    "Bash(kill*)",
    "Bash(pkill*)",
    "Bash(lsof -i:*)"
  ]
}
```

### 6.2 Environment Variables

**File:** `.env.test`

```bash
# Mock Server Configuration
MOCK_ORD_PORT=8080
MOCK_ORD_HOST=localhost

# Test Network Configuration
TEST_NETWORK=regtest
TEST_TREASURY_ADDR=tb1qexampleaddress
TEST_PARSER_LIBRARY_ID=test123i0

# Test Data Configuration
TEST_DECAY_PER_BLOCK=35
TEST_MIN_BALANCE=1000
TEST_MAX_RECEIPTS=100

# Browser Testing
PLAYWRIGHT_HEADLESS=true
PLAYWRIGHT_SLOW_MO=0
```

---

## Part 7: Test Execution Workflow

### 7.1 Development Cycle

1. **Build Phase**
   - Compile and minify templates
   - Validate size constraints
   - Generate development builds

2. **Local Testing**
   - Start mock ord server
   - Run unit tests
   - Run integration tests
   - Run browser tests

3. **Validation**
   - Check all success criteria
   - Validate performance metrics
   - Ensure error handling

4. **Reporting**
   - Generate test coverage report
   - Create performance metrics
   - Document any failures

### 7.2 Pre-Production Testing

1. **Deployment**
   - Use automated deployment scripts
   - Deploy to Bitcoin testnet/signet
   - Record inscription IDs

2. **Monitoring**
   - Track inscription confirmations
   - Monitor recursive endpoint responses
   - Validate on-chain data

3. **Validation**
   - Verify balance calculations
   - Test payment flows
   - Confirm parser functionality

4. **Documentation**
   - Generate comprehensive test report
   - Document inscription IDs
   - Record performance metrics

---

## Part 8: Specific Test Scenarios

### 8.1 MVP Tests (Phase 2.2.1b)

**Test Cases:**
1. **Fresh Inscription**
   - No child inscriptions
   - Balance should be 0

2. **Single Receipt**
   - One valid receipt
   - Balance calculated with decay

3. **Multiple Receipts**
   - Various amounts and blocks
   - Correct total with individual decay

4. **Deduplication**
   - Multiple receipts with same txid
   - Only counted once

5. **Expired Card**
   - Fully decayed balance
   - Shows expired status

6. **Error Handling**
   - Missing endpoints
   - Invalid JSON responses
   - Network timeouts

### 8.2 Parser Tests (Phase 2.2.1c)

**Test Cases:**
1. **OP_RETURN Validation**
   - Matching inscription ID → full amount
   - Mismatched ID → 0 sats
   - Missing OP_RETURN → 0 sats

2. **Transaction Parsing**
   - P2PKH transactions
   - P2WPKH (native segwit)
   - P2TR (taproot)
   - Multi-output transactions

3. **Parser Upgrades**
   - Deploy new version as child
   - Automatic version switching
   - Backward compatibility

4. **Edge Cases**
   - Malformed transactions
   - Invalid OP_RETURN data
   - Buffer overflow attempts

---

## Part 9: Implementation Schedule

### Phase 1: Infrastructure Setup (Day 1)
- [ ] Install dependencies
- [ ] Create mock ord server
- [ ] Set up Playwright
- [ ] Configure test environment

### Phase 2: Build Automation (Day 1-2)
- [ ] Create build scripts
- [ ] Implement minification
- [ ] Add size validation
- [ ] Generate build reports

### Phase 3: Test Implementation (Day 2-3)
- [ ] Write unit tests
- [ ] Create integration tests
- [ ] Implement browser tests
- [ ] Add visual regression tests

### Phase 4: Validation & Reporting (Day 3-4)
- [ ] Run full test suite
- [ ] Generate coverage reports
- [ ] Document results
- [ ] Refine based on findings

---

## Part 10: Monitoring and Metrics

### 10.1 Performance Metrics

**Track:**
- Template build time
- Test execution time
- Mock server response time
- Browser rendering time
- Memory usage

### 10.2 Quality Metrics

**Track:**
- Test coverage percentage
- Success/failure rates
- Error frequency
- Performance regression

### 10.3 Reporting Dashboard

**Components:**
- Real-time test status
- Historical trends
- Performance graphs
- Error logs
- Coverage maps

---

## Benefits Summary

✅ **Fully Automated**: Minimal manual intervention required  
✅ **Fast Iteration**: Test changes immediately without blockchain delays  
✅ **Comprehensive Coverage**: Unit, integration, and visual tests  
✅ **Cost Effective**: No blockchain fees for development testing  
✅ **Reproducible**: Consistent test environments  
✅ **CI/CD Ready**: Can be integrated into GitHub Actions  
✅ **Performance Monitoring**: Track regressions and improvements  
✅ **Error Prevention**: Catch issues before deployment  

---

## Next Steps

When you're ready to implement this plan:

1. **Review and approve** this testing strategy
2. **Configure Claude Code settings** with pre-authorized functions
3. **Run setup command**: `npm run test:setup` (to be created)
4. **Start implementation** following the schedule above

This comprehensive testing infrastructure will enable rapid, reliable development of the inscription functionality while ensuring all requirements are met and validated automatically.

---

*This plan provides a complete roadmap for implementing automated inscription testing. It can be executed incrementally, starting with the most critical components and expanding to full coverage.*