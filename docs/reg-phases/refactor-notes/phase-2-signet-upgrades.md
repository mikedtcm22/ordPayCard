# Phase 2 Signet Upgrades - TDD Development Breakdown

## Overview

This document outlines the TDD tasks required to upgrade the Phase 2 Enhanced Validation implementation from regtest-only to support Signet network testing.

### Current State
- **Completed**: Tracks A-E of Phase 2 for regtest network
  - Parser library with OP_RETURN validation
  - NFT template integration
  - Backend status API with provenance gating
  - Documentation and examples
- **Network Support**: Currently regtest-only with hardcoded localhost:8080
- **Missing**: Network-aware configuration, Signet test coverage, real ord integration

### Goal
Enable full Phase 2 functionality testing on Signet network while maintaining regtest compatibility.

### Success Criteria
- All parser tests pass with `network: 'signet'` parameter
- Status API validates real Signet inscriptions
- Configuration dynamically adapts to network environment
- Integration tests prove end-to-end flow on Signet

---

## Track S1: Network Configuration

### Micro-task S1.1: Environment Configuration Schema
**Purpose**: Define and validate network-specific environment variables

**RED**:
```typescript
// server/src/config/__tests__/network.config.test.ts
describe('Network configuration', () => {
  it('should load Signet configuration from environment', () => {
    process.env.BITCOIN_NETWORK = 'signet';
    process.env.SIGNET_ORD_URL = 'http://localhost:8080';
    process.env.SIGNET_CREATOR_ADDRESS = 'tb1q...';
    const config = loadNetworkConfig();
    expect(config.network).toBe('signet');
    expect(config.ordUrl).toBe('http://localhost:8080');
  });
  
  it('should validate Signet addresses', () => {
    const config = { network: 'signet', creatorAddress: 'bc1...' };
    expect(() => validateNetworkConfig(config)).toThrow('Invalid Signet address');
  });
});
```

**GREEN**:
- Create `server/src/config/network.ts` with network-specific loaders
- Implement address validation per network type
- Add `.env.signet` example file

**REFACTOR**:
- Consider using zod for schema validation
- Centralize network constants

**Files**:
- `server/src/config/network.ts`
- `server/src/config/__tests__/network.config.test.ts`
- `.env.signet.example`

**Acceptance**: Environment variables correctly load and validate for each network

---

### Micro-task S1.2: Dynamic Endpoint Resolution
**Purpose**: Map network to appropriate ord endpoints

**RED**:
```typescript
// server/src/config/__tests__/endpoints.test.ts
describe('Endpoint resolution', () => {
  it('should return Signet endpoints for Signet network', () => {
    const endpoints = getEndpoints('signet', 'http://localhost:8080');
    expect(endpoints.metadata).toBe('http://localhost:8080/r/metadata/');
    expect(endpoints.children).toBe('http://localhost:8080/r/children/');
  });
  
  it('should support custom ord URLs per network', () => {
    const endpoints = getEndpoints('signet', 'https://ord.signet.example.com');
    expect(endpoints.metadata).toContain('ord.signet.example.com');
  });
});
```

**GREEN**:
- Implement `getEndpoints(network, baseUrl)` function
- Support environment variable overrides per endpoint
- Handle trailing slashes consistently

**REFACTOR**:
- Extract endpoint paths to constants
- Add endpoint health checking

**Files**:
- `server/src/config/endpoints.ts`
- `server/src/config/__tests__/endpoints.test.ts`

**Dependencies**: S1.1 (network configuration)

---

### Micro-task S1.3: Config Service Integration
**Purpose**: Integrate network-aware config into existing ConfigManager

**RED**:
```typescript
// server/src/config/__tests__/index.integration.test.ts
describe('ConfigManager network integration', () => {
  it('should switch configurations based on BITCOIN_NETWORK', () => {
    process.env.BITCOIN_NETWORK = 'signet';
    const config = getConfig();
    expect(config.network.bitcoin).toBe('signet');
    expect(config.registration.endpoints.ordinalsApi).toContain('localhost:8080');
  });
  
  it('should maintain backward compatibility with regtest', () => {
    process.env.BITCOIN_NETWORK = 'regtest';
    const config = getConfig();
    expect(config.network.bitcoin).toBe('regtest');
  });
});
```

**GREEN**:
- Update `ConfigManager.applyEnvironmentVariables()` 
- Add network-specific endpoint mapping
- Ensure backward compatibility

**REFACTOR**:
- Consider factory pattern for network configs
- Add config validation on startup

**Files**:
- `server/src/config/index.ts` (update)
- `server/src/config/__tests__/index.integration.test.ts`

**Dependencies**: S1.1, S1.2

---

## Track S2: Parser Network Compatibility

### Micro-task S2.1: Network Parameter Support
**Purpose**: Add network parameter to all parser functions

**RED**:
```typescript
// server/src/services/registration/parser/__tests__/network.sumToCreator.test.ts
describe('sumToCreator with network parameter', () => {
  it('should parse Signet addresses correctly', () => {
    const signetTx = fixtures.signetP2WPKHTx;
    const amount = sumOutputsToAddress(signetTx, 'tb1q...', 'signet');
    expect(amount).toBe(100000n);
  });
  
  it('should reject mainnet addresses on Signet', () => {
    const signetTx = fixtures.signetP2WPKHTx;
    const amount = sumOutputsToAddress(signetTx, 'bc1q...', 'signet');
    expect(amount).toBe(0n);
  });
});
```

**GREEN**:
- Add optional `network` parameter to parser functions
- Default to 'regtest' for backward compatibility
- Implement network-aware address validation

**REFACTOR**:
- Consider network type enum
- Extract address validation utilities

**Files**:
- `server/src/services/registration/parser/sumToCreator.ts` (update)
- `server/src/services/registration/parser/__tests__/network.sumToCreator.test.ts`
- `server/src/services/registration/parser/types.ts` (update)

---

### Micro-task S2.2: Signet Test Fixtures
**Purpose**: Create realistic Signet transaction fixtures

**RED**:
```typescript
// server/src/services/registration/parser/__tests__/fixtures.signet.test.ts
describe('Signet fixtures', () => {
  it('should have valid Signet P2WPKH transaction', () => {
    const tx = signetFixtures.p2wpkhWithOpReturn;
    expect(isValidSignetTransaction(tx)).toBe(true);
    expect(extractOpReturn(tx)).toMatchObject({
      nftId: expect.stringMatching(/^[a-f0-9]{64}i\d+$/),
      expiryBlock: expect.any(Number)
    });
  });
  
  it('should have valid Signet P2TR transaction', () => {
    const tx = signetFixtures.p2trWithOpReturn;
    expect(isValidSignetTransaction(tx)).toBe(true);
  });
});
```

**GREEN**:
- Create `fixtures/signet/` directory with transaction samples
- Include various output types (P2PKH, P2WPKH, P2TR)
- Add OP_RETURN data in correct format

**REFACTOR**:
- Script to generate fixtures from real Signet
- Document fixture creation process

**Files**:
- `server/src/services/registration/parser/fixtures/signet/*.json`
- `server/src/services/registration/parser/__tests__/fixtures.signet.test.ts`

**Dependencies**: S2.1

---

### Micro-task S2.3: VerifyPayment Network Integration
**Purpose**: Update verifyPayment orchestration for network awareness

**RED**:
```typescript
// server/src/services/registration/parser/__tests__/verifyPayment.signet.test.ts
describe('verifyPayment on Signet', () => {
  it('should verify Signet transaction with correct network', async () => {
    const amount = await verifyPayment(
      signetFixtures.validPaymentTx,
      'tb1qcreatoraddress',
      50000n,
      'abc123...i0',
      { network: 'signet', currentBlock: 200000 }
    );
    expect(amount).toBeGreaterThan(0n);
  });
  
  it('should reject regtest address on Signet', async () => {
    const amount = await verifyPayment(
      signetFixtures.validPaymentTx,
      'bcrt1q...', // regtest address
      50000n,
      'abc123...i0',
      { network: 'signet', currentBlock: 200000 }
    );
    expect(amount).toBe(0n);
  });
});
```

**GREEN**:
- Update `verifyPayment` to pass network to `sumOutputsToAddress`
- Add network validation
- Update options type

**REFACTOR**:
- Consider network validation middleware
- Optimize network checks

**Files**:
- `server/src/services/registration/parser/verifyPayment.ts` (update)
- `server/src/services/registration/parser/__tests__/verifyPayment.signet.test.ts`

**Dependencies**: S2.1, S2.2

---

## Track S3: Integration Testing

### Micro-task S3.1: Signet Parser Integration Tests
**Purpose**: Test parser with real Signet blockchain data

**RED**:
```typescript
// server/src/__tests__/integration/signet/parser.signet.test.ts
describe('Parser Signet integration', () => {
  beforeAll(async () => {
    await waitForSignetSync();
  });
  
  it('should parse real Signet transaction', async () => {
    const txid = await createSignetOpReturnTx();
    const txHex = await fetchSignetTx(txid);
    
    const opReturn = parseOpReturn(txHex);
    expect(opReturn).toMatchObject({
      nftId: expect.any(String),
      expiryBlock: expect.any(Number)
    });
  });
  
  it('should sum outputs from real Signet tx', async () => {
    const txid = await createSignetPaymentTx('tb1qtest...', 0.00001);
    const txHex = await fetchSignetTx(txid);
    
    const sum = sumOutputsToAddress(txHex, 'tb1qtest...', 'signet');
    expect(sum).toBe(1000n);
  });
});
```

**GREEN**:
- Implement Signet test utilities
- Add Bitcoin RPC client for test transactions
- Create helper functions for test data

**REFACTOR**:
- Extract test utilities to shared module
- Add transaction caching for speed

**Files**:
- `server/src/__tests__/integration/signet/parser.signet.test.ts`
- `server/src/__tests__/integration/signet/utils.ts`

**Dependencies**: S2.3, Signet node running

---

### Micro-task S3.2: Status API Signet Tests
**Purpose**: Test registration status endpoint with Signet data

**RED**:
```typescript
// server/src/__tests__/integration/signet/status.signet.test.ts
describe('Status API Signet integration', () => {
  it('should validate Signet inscription registration', async () => {
    // Setup: Create parent inscription and child with payment
    const parentId = await inscribeOnSignet('parent.html');
    const paymentTxid = await createSignetPayment(parentId);
    const childId = await inscribeChild(parentId, { feeTxid: paymentTxid });
    
    // Test: Check registration status
    const response = await request(app)
      .get(`/api/registration/${parentId}`)
      .expect(200);
    
    expect(response.body).toMatchObject({
      isRegistered: true,
      lastRegistration: {
        txid: paymentTxid
      }
    });
  });
  
  it('should enforce provenance gating on Signet', async () => {
    const parentId = await inscribeOnSignet('parent.html');
    const oldPaymentTxid = await createSignetPayment(parentId, -10); // 10 blocks ago
    
    const response = await request(app)
      .get(`/api/registration/${parentId}`)
      .expect(200);
    
    expect(response.body.isRegistered).toBe(false);
    expect(response.body.debug.H_parent).toBeGreaterThan(response.body.debug.feeHeight);
  });
});
```

**GREEN**:
- Configure app with Signet settings for tests
- Implement inscription helpers
- Add block height utilities

**REFACTOR**:
- Consider test data cleanup
- Add retry logic for network delays

**Files**:
- `server/src/__tests__/integration/signet/status.signet.test.ts`
- `server/src/__tests__/integration/signet/inscription-helpers.ts`

**Dependencies**: S3.1, S1.3

---

### Micro-task S3.3: End-to-End Registration Flow
**Purpose**: Complete registration workflow on Signet

**RED**:
```typescript
// server/src/__tests__/integration/signet/e2e.signet.test.ts
describe('E2E registration on Signet', () => {
  it('should complete full registration flow', async () => {
    // 1. Deploy parent template
    const parentHtml = generateTemplate('tb1qcreator...', 1000);
    const parentId = await inscribeOnSignet(parentHtml);
    
    // 2. Create payment with OP_RETURN
    const paymentTx = await createTxWithOpReturn(
      `${parentId}|${currentBlock + 144}`,
      'tb1qcreator...',
      0.00001
    );
    
    // 3. Create child registration
    const receipt = { feeTxid: paymentTx, timestamp: Date.now() };
    const childId = await inscribeChild(parentId, receipt);
    
    // 4. Wait for confirmation
    await waitForConfirmations(childId, 1);
    
    // 5. Verify registration active
    const status = await fetchRegistrationStatus(parentId);
    expect(status.isRegistered).toBe(true);
    
    // 6. Verify in browser simulation
    const rendered = await renderTemplate(parentId);
    expect(rendered).toContain('Active');
  });
});
```

**GREEN**:
- Implement complete test flow
- Add template generation utilities
- Create browser simulation helpers

**REFACTOR**:
- Parameterize test scenarios
- Add performance benchmarks

**Files**:
- `server/src/__tests__/integration/signet/e2e.signet.test.ts`
- `server/src/__tests__/integration/signet/template-utils.ts`

**Dependencies**: S3.2

---

## Track S4: Test Infrastructure

### Micro-task S4.1: Test Data Generator Scripts
**Purpose**: Create scripts to generate test data on Signet

**RED**:
```bash
# scripts/signet-test/__tests__/generate-test-tx.test.sh
#!/bin/bash
./generate-test-tx.sh --network signet --type opreturn
if [ $? -ne 0 ]; then
  echo "FAIL: Script should generate OP_RETURN transaction"
  exit 1
fi

# Verify transaction was created
TX_ID=$(cat last-tx.txt)
bitcoin-cli -signet getrawtransaction $TX_ID || exit 1
```

**GREEN**:
```bash
# scripts/signet-test/generate-test-tx.sh
#!/bin/bash
# Implementation that creates various test transactions
# - OP_RETURN transactions
# - Payment transactions
# - Parent/child inscriptions
```

**REFACTOR**:
- Add parameter validation
- Support batch generation
- Add dry-run mode

**Files**:
- `scripts/signet-test/generate-test-tx.sh`
- `scripts/signet-test/inscribe-test-parent.sh`
- `scripts/signet-test/create-test-receipt.sh`

---

### Micro-task S4.2: Automated Test Runner
**Purpose**: Orchestrate all Signet tests

**RED**:
```bash
# scripts/__tests__/test-signet.test.sh
./test-signet.sh --quick
if [ $? -ne 0 ]; then
  echo "FAIL: Test runner should complete successfully"
  exit 1
fi

# Check report was generated
[ -f "signet-test-report.json" ] || exit 1
```

**GREEN**:
```bash
# scripts/test-signet.sh
#!/bin/bash
# Comprehensive test runner that:
# - Checks prerequisites (node sync, wallet funded)
# - Runs unit tests with network=signet
# - Runs integration tests
# - Generates report
```

**REFACTOR**:
- Add parallel test execution
- Implement test selection flags
- Add CI/CD integration

**Files**:
- `scripts/test-signet.sh`
- `scripts/signet-test/check-prerequisites.sh`

**Dependencies**: S4.1

---

### Micro-task S4.3: Network Health Monitoring
**Purpose**: Monitor Signet health during tests

**RED**:
```typescript
// server/src/__tests__/integration/signet/health.test.ts
describe('Signet health checks', () => {
  it('should verify ord is synced', async () => {
    const health = await checkSignetHealth();
    expect(health.ordSynced).toBe(true);
    expect(health.blockHeight).toBeGreaterThan(0);
  });
  
  it('should detect when ord is behind', async () => {
    // Simulate ord being behind
    const health = await checkSignetHealth();
    if (health.ordHeight < health.chainHeight - 2) {
      expect(health.warnings).toContain('Ord is behind chain tip');
    }
  });
});
```

**GREEN**:
- Implement health check utilities
- Add ord sync status checking
- Monitor block production rate

**REFACTOR**:
- Add metrics collection
- Create health dashboard

**Files**:
- `server/src/utils/signet-health.ts`
- `server/src/__tests__/integration/signet/health.test.ts`

---

## Track S5: Embers Core Deployment (Phase 2 Track D completion)

### Micro-task S5.1: Build Configuration for Networks
**Purpose**: Configure Embers Core builds per network

**RED**:
```typescript
// client/src/lib/embers-core/__tests__/build.config.test.ts
describe('Embers Core build configuration', () => {
  it('should build with network-specific settings', () => {
    const config = getBuildConfig('signet');
    expect(config.define.NETWORK).toBe('signet');
    expect(config.define.ORD_URL).toBe('http://localhost:8080');
  });
  
  it('should minimize bundle size', () => {
    const bundle = buildEmbersCore('signet');
    expect(bundle.size).toBeLessThan(8192); // 8KB limit
  });
});
```

**GREEN**:
- Create network-aware build configs
- Implement build script with size checking
- Add minification settings

**REFACTOR**:
- Add source maps for debugging
- Implement tree shaking optimization

**Files**:
- `client/vite.embers.config.ts`
- `client/scripts/build-embers-core.js`

---

### Micro-task S5.2: Deployment Script
**Purpose**: Automate Embers Core inscription on Signet

**RED**:
```bash
# scripts/signet-test/__tests__/deploy-embers.test.sh
./deploy-embers-core.sh --network signet --dry-run
if [ $? -ne 0 ]; then
  echo "FAIL: Deployment script should succeed in dry-run"
  exit 1
fi
```

**GREEN**:
```bash
# scripts/signet-test/deploy-embers-core.sh
#!/bin/bash
# Script to:
# - Build Embers Core for target network
# - Inscribe as parent inscription
# - Output inscription ID for configuration
# - Update environment variables
```

**REFACTOR**:
- Add rollback capability
- Support version management
- Add deployment verification

**Files**:
- `scripts/signet-test/deploy-embers-core.sh`
- `scripts/signet-test/verify-deployment.sh`

**Dependencies**: S5.1

---

### Micro-task S5.3: Template Integration
**Purpose**: Update templates to use real Embers Core inscription

**RED**:
```typescript
// client/src/templates/inscription/__tests__/embers.integration.test.ts
describe('Template Embers Core integration', () => {
  it('should load Embers Core from inscription ID', async () => {
    process.env.VITE_EMBERS_CORE_SIGNET_ID = 'abc123...i0';
    const template = await renderTemplate();
    expect(template).toContain('/content/abc123...i0');
  });
  
  it('should fall back gracefully if not available', async () => {
    process.env.VITE_EMBERS_CORE_SIGNET_ID = 'invalid';
    const template = await renderTemplate();
    expect(template).toContain('<!-- Embers Core not available -->');
  });
});
```

**GREEN**:
- Update template loader logic
- Add network-specific inscription IDs
- Implement fallback handling

**REFACTOR**:
- Add version checking
- Cache loaded library
- Add integrity verification

**Files**:
- `client/src/templates/inscription/registrationWrapper.html` (update)
- `client/src/templates/inscription/loader.ts`

**Dependencies**: S5.2

---

## Execution Order

### Phase 1: Foundation (Parallel execution possible)
- S1.1, S1.2 → S1.3 (Network configuration)
- S2.1, S2.2 → S2.3 (Parser compatibility)

### Phase 2: Integration (Sequential)
- S3.1 → S3.2 → S3.3 (Integration tests)
- S4.1 → S4.2 (Test infrastructure)
- S4.3 (Health monitoring, can run parallel)

### Phase 3: Deployment
- S5.1 → S5.2 → S5.3 (Embers Core)

### Critical Path
S1.1 → S1.3 → S2.1 → S2.3 → S3.1 → S3.3

### Estimated Timeline
- Phase 1: 2-3 days (parallel work)
- Phase 2: 3-4 days
- Phase 3: 2 days
- **Total**: 7-9 days with one developer

---

## Testing Checklist

### Unit Tests
- [ ] All parser functions accept network parameter
- [ ] Network configuration loads correctly
- [ ] Address validation per network
- [ ] Fixtures for each network

### Integration Tests  
- [ ] Real Signet transaction parsing
- [ ] Status API with Signet inscriptions
- [ ] End-to-end registration flow
- [ ] Provenance gating validation

### System Tests
- [ ] Full registration on Signet
- [ ] Performance under network delays
- [ ] Cache behavior with real data
- [ ] Multi-network compatibility

---

## Risk Mitigation

### Technical Risks
- **Ord sync lag**: Add retry logic and sync waiting
- **Network delays**: Increase timeouts for Signet tests
- **Faucet availability**: Cache funded test wallets
- **Version compatibility**: Test against multiple ord versions

### Process Risks
- **Test duration**: Parallelize where possible
- **Environment setup**: Provide Docker containers
- **Debugging difficulty**: Add comprehensive logging

---

## Success Metrics

### Functionality
- 100% parser test pass rate on Signet
- Status API validates real inscriptions
- E2E flow completes successfully

### Performance
- Parser processes Signet tx < 100ms
- Status API responds < 500ms (excluding network)
- Test suite completes < 30 minutes

### Reliability
- Tests pass consistently (>95% success rate)
- Graceful handling of network issues
- Clear error messages for failures

---

## Next Steps After Completion

1. **Documentation**
   - Update user guides with Signet instructions
   - Document network-specific behaviors
   - Create troubleshooting guide

2. **Testnet Expansion**
   - Apply same patterns to Bitcoin testnet
   - Add testnet fixtures and tests

3. **Mainnet Preparation**
   - Security audit of network handling
   - Performance optimization
   - Production deployment guide