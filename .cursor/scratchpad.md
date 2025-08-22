# SatSpray Membership Card - Project Scratchpad

## Background and Motivation

The SatSpray Membership Card project is a Bitcoin ordinals-based membership system that requires:

- Frontend web interface with wallet integration
- Backend API for authentication and verification
- Bitcoin/ordinals integration for signet and mainnet
- Privacy-focused manual flows alongside automated wallet connections
- Real-time balance polling and status updates
- Self-contained ordinal inscriptions with embedded logic

The project prioritizes simplicity, security, and decentralization with minimal server-side state storage. Development progresses through distinct phases, each building toward a cohesive, functional product.

## Key Challenges and Analysis

### Technical Challenges:
1. **Enhanced Validation**: OP_RETURN binding, provenance receipts, parser parity
2. **Last-Transfer Awareness**: Prevent activation with stale receipts after ownership change
3. **On-chain API Library**: Embers Core v1 with size budget constraints
4. **Client/Server Parity**: Consistent parser behavior across environments

### Architecture Considerations:
- Decentralized design with ordinal inscriptions as source of truth
- Bitcoin signet for development, regtest for testing
- TDD methodology with RED/GREEN/REFACTOR cycles
- Fail-closed behavior for security-critical operations

## High-level Task Breakdown

### Current Phase: Phase 2 Enhanced Validation (In Progress)

**Goal**: Harden registration validation with provenance receipts and OP_RETURN-based fee binding

#### **Track A: Parser Library v1.0 (Server-first)**
- ✅ A0: Parent/child heights derivation utilities
- ✅ A1: OP_RETURN extraction and inscription ID + expiry matching
- ✅ A2: Decode outputs and sum payments to creator
- ✅ A3: `verifyPayment` orchestration with provenance window checks
- ✅ A4: Deduplicate registrations by txid
- ✅ A6: Defensive parsing with bounds checks and timeouts

#### **Track B: NFT Template Updates**
- ✅ B1: Parser-verified flow returns 0 sats on OP_RETURN missing/mismatch/expired
- ✅ B2: Deduplicate by `feeTxid`
- ✅ B3: Developer debug flag

#### **Track C: Backend Status API**
- ✅ C1: Endpoint contract with provenance gating
- ✅ C2: 30s cache freshness

#### **Track D: On-chain API Library (Embers Core v1)**
- [ ] D1: Public API surface and types
- [ ] D2: Build/minify bundle within size budget
- [ ] D3: Loader snippet to resolve latest child by parent ID

#### **Track E: Tooling & Examples**
- ✅ E1: `bitcoin-cli` OP_RETURN examples - `docs/testing/opreturn-bitcoin-cli-examples.md`
- ✅ E2: Wallet troubleshooting guide - `docs/testing/wallet-troubleshooting.md`
  
#### Track E: Tooling & Examples — Planner Breakdown

##### Micro-task E1 — `bitcoin-cli` OP_RETURN examples
- **Goal**: Provide canonical, copy-pasteable CLI commands to construct a fee transaction embedding OP_RETURN data `<NFT_ID>|<EXPIRY_BLOCK>` that pays the creator address, for regtest/signet/testnet/mainnet.
- **Scope**:
  - End-to-end raw tx flow with `fundrawtransaction`/`walletcreatefundedpsbt` and `OP_RETURN` output.
  - Canonicalize OP_RETURN encoding and parameter placeholders; include expiry rationale and validation notes.
  - Network-specific notes (fee rates, address formats); troubleshooting section for common errors.
- **Deliverables**:
  - `docs/testing/opreturn-bitcoin-cli-examples.md` with sections: Overview, Prereqs, Regtest walk-through, Signet/Testnet notes, Mainnet cautions, Troubleshooting.
  - Tests (RED→GREEN): `server/src/__tests__/docs.e1.examples.test.ts` validates file presence and that examples include `<NFT_ID>` and `<EXPIRY_BLOCK>` placeholders and an OP_RETURN output.
- **TDD**:
  - RED: Failing Jest test asserting doc exists and contains required markers and a code block with `OP_RETURN`.
  - GREEN: Author the doc with minimal, accurate examples that satisfy the test.
- **Success criteria**:
  - New doc is discoverable and passes tests; examples execute on regtest as written (with placeholder replacement).
  - Explicit cross-links to parser rules and status API behavior.
- **Risks**: Wallet/CLI version differences; mitigate via version notes and alternatives section.

##### Micro-task E2 — Wallet troubleshooting guide
- **Goal**: Help users succeed when their wallet cannot add OP_RETURN or deviates from required encoding by providing clear alternatives and verification steps.
- **Scope**:
  - Supported wallet matrix and OP_RETURN capability notes.
  - Alternatives: raw PSBT/CLI builder path (link to E1), manual verification steps to confirm OP_RETURN and payment amount.
  - Common errors and fixes; FAQs.
- **Deliverables**:
  - `docs/testing/wallet-troubleshooting.md` with sections: Supported wallets, Alternatives, Raw builder flow, Verification, FAQ.
  - Tests (RED→GREEN): `server/src/__tests__/docs.e2.troubleshooting.test.ts` checks presence and section headings listed above.
- **TDD**:
  - RED: Failing Jest test asserting doc exists and includes required section headings.
  - GREEN: Author the guide minimally to satisfy tests; iterate as needed.
- **Success criteria**:
  - Users can complete a registration by following either a supported wallet path or the raw builder fallback.
  - Guide cross-links to E1 examples and status API debug fields to validate outcomes.
- **Dependencies**: E1 examples referenced by E2; reuse network setup from existing SIGNET/TESTING docs.
- **Risks**: Wallet UIs change; mitigate by focusing on principles and CLI fallback.

## Project Status Board

### Current Status / Progress Tracking
- [x] **Phase 1 Complete**: Project foundation, Bitcoin integration, development environment
- [x] **Track A Complete**: Server parser library with all utilities and tests
- [x] **Track B Complete**: Template updates with parser integration, deduplication, and debug features
- [x] **Track C Complete**: Backend status API with endpoint contract and 30s cache freshness
- [x] **Pre-Core Refactors**: B2, B3, C1.1 completed on `pre_core_refactors` branch
- [ ] **In Progress**: D1 - On-chain API library public surface
- [ ] **Pending**: D2-D3, E1-E2, C1.2-C1.5, C2
- [x] **Planning Artifact**: Created `docs/reg-phases/phase-2-refactors.md` to track refactors from Tracks A–C on branch `pre_core_refactors`

### TDD Progress Summary
**Completed (GREEN)**:
- A0: `getLastTransferHeight`, `getLatestChildHeight` with 30s cache
- A1: `parseOpReturn`, `isExpired` with inscription ID matching
- A2: `sumOutputsToAddress` for P2PKH/P2WPKH/P2TR
- A3: `verifyPayment` with provenance window enforcement
- A4: `dedupeTxids` utility
- A6: Defensive parsing with `ParserError` types and timeouts
- B1: Template integration with `EmbersCore.verifyPayment` mock
- B2: Template feeTxid deduplication with `EmbersCore.dedupe` integration
- B3: Developer debug flag with PII-safe diagnostic information
- C1: Backend status API endpoint contract with provenance gating and debug info
- C2: Cache freshness validation with 30s TTL and comprehensive test coverage

**Current**: D1 - On-chain API library public surface definition

### Development Environment Status
- **Node.js**: v22.17.1 (NVM managed)
- **Testing**: 176 total tests passing (server: 176, client: 23)
- **CI/CD**: Fully operational with strict linting enforcement
- **Docker**: Development and production configurations ready

## Current Working Context

### Phase 2 TDD Methodology
- **RED**: Write failing tests first with clear specifications
- **GREEN**: Minimal implementation to pass tests
- **REFACTOR**: Only README/process updates (no code changes)
- **Commit**: Only on GREEN with format `feat: implement <behavior> to pass test`
- **Coverage**: ≥ 80% for new/changed files

### Network Configuration
- **Default**: Regtest for Phase 2 testing
- **Development**: Signet for integration testing
- **Production**: Mainnet preparation in Phase 4

### File Organization
- **Server Parser**: `server/src/services/registration/parser/*`
- **Client Parity**: `client/src/lib/embers-core/parser/*`
- **Templates**: `client/src/templates/inscription/*`
- **Tests**: `__tests__/` subdirectories with comprehensive coverage

## Executor's Feedback or Assistance Requests

### Completed Task: C1 - Backend Status API Endpoint Contract

**Objective**: ✅ Implemented status endpoint with provenance gating and debug info

**Achievements**:
1. ✅ **RED**: Added comprehensive test suite for `GET /api/registration/:nftId` endpoint contract
2. ✅ **GREEN**: Implemented route with parser integration, provenance window validation, 30s caching
3. **REFACTOR**: Extract cache into utility, add metrics hooks (planning only)

### Completed Task: C2 - Cache Freshness Implementation

**Objective**: ✅ Verified 30s cache behavior with comprehensive test coverage

**Achievements**:
1. ✅ **RED**: Added cache behavior tests for TTL validation and timing verification
2. ✅ **GREEN**: Confirmed existing cache implementation meets all requirements
3. **REFACTOR**: Identified opportunities for centralized cache utility (planning only)

### Completed Task: Phase 2 Refactors (Pre-Core)

**Objective**: ✅ Implemented structural improvements identified during Tracks A-C

**Achievements**:
1. ✅ **B2**: Standardized registration object shapes with `normalizeRegistration()` utility
2. ✅ **B3**: Confirmed comprehensive debug instrumentation already implemented (PII filtering, BigInt safety, opt-in behavior)
3. ✅ **C1.1**: Extracted in-route cache to reusable `SimpleCache` utility with TTL and cleanup
4. **REFACTOR**: Additional backend hardening (C1.2-C1.5) and enhanced cache service (C2) pending

**Impact**: 176 tests passing, improved data consistency, enhanced reusability, zero breaking changes

### Next Task: D1 - On-chain API Library Public Surface

**Objective**: Define and implement EmbersCore v1 public API surface with types

**Next Steps**:
1. **RED**: Add tests for public API surface existence and correct types
2. **GREEN**: Implement minimal index exporting server-parity functions with version metadata
3. **REFACTOR**: Generate API docs from TSDoc and lock public API tests

### Key Implementation Notes
- Template now calls `EmbersCore.verifyPayment` and displays results
- Template deduplicates feeTxids using `EmbersCore.dedupe` before processing
- Developer debug flag exposes sanitized diagnostic information via `window.__debug`
- Vitest module alias resolution fixed to match Vite config
- All server parser utilities have comprehensive test coverage
- Cache implementations use 30s TTL with per-inscription isolation
- Status API endpoint integrates all parser utilities for comprehensive validation
- Provenance gating enforces H_child == H_parent constraint before fee validation
- Response caching improves performance while maintaining data freshness
- Jest hanging issue resolved with NODE_ENV=test isolation and forceExit configuration
- TDD automation now runs smoothly without manual interruption or Ctrl+C requirement

## Lessons

## REFACTOR Notes for S1.2 - Endpoint validation and per-endpoint timeouts

1. **Centralize timeout configuration**: Create a centralized config for all endpoint timeouts instead of passing them inline
2. **Add health check service**: Extract health checking logic into a reusable service that can be used at startup and runtime
3. **Implement metrics hooks**: Add hooks for tracking timeout occurrences and network latency for monitoring
4. **URL validation depth**: Consider deeper URL validation (check for valid TLDs, reserved IPs, etc.)
5. **Retry with backoff**: Add configurable retry logic with exponential backoff for transient failures
6. **Circuit breaker pattern**: Implement circuit breaker to prevent cascading failures when endpoints are down
7. **Timeout escalation**: Different timeouts for different operations (fast fail for health, longer for data fetch)

## REFACTOR Notes for S2.1 - Explicit network validation

1. **Network type safety**: Consider using const assertion or enum for network types instead of string literals
2. **Default network handling**: Consider making network optional with 'regtest' default for backward compatibility
3. **Error categorization**: Create specific error classes (NetworkValidationError) for better error handling
4. **Validation depth**: Add validation for network-specific configurations (e.g., port ranges)
5. **Common typo detection**: Expand suggestions for common network name mistakes
6. **Centralize network constants**: Extract all network-related constants to a single module

## Documentation/Process Tasks Queued (from D1–D3 Refactor Notes)

These are deliberately deferred and not part of the current code task plan. Keep in queue for a later documentation-focused pass.

- **API docs generation**: Evaluate and wire up TypeDoc; add `docs:api` script; enrich JSDoc with `@example` blocks.
- **Public API test locking (docs/process)**: Author guidance on snapshot test maintenance and contract test workflow.
- **Changelog tooling**: Consider conventional commits + changelog generator; document release process.
- **Shared fixtures documentation**: Document server/client shared fixture approach and parity guarantees.
- **Build reporting docs**: Write guidance for interpreting size reports and visualizer artifacts.
- **Loader developer guide**: Document checksum mode, caching behavior, and failure modes; add troubleshooting.

### Phase 2 Development Insights
- **TDD Discipline**: Small, focused tests prevent overengineering and ensure complete requirements coverage
- **Parser Parity**: Client/server consistency requires identical test cases and deterministic results
- **Fail-Closed Design**: Security-critical operations default to safe state when dependencies fail
- **Cache Strategy**: 30s TTL balances performance with data freshness for inscription metadata
- **Module Resolution**: Vitest and Vite configs must stay synchronized for consistent import handling
- **Template Integration**: Error boundaries needed for EmbersCore API calls; async timing critical for diagnostics
- **Debug Implementation**: PII sanitization must apply recursively to inputs and outputs; JSON serialization requires BigInt conversion
- **Deduplication Logic**: Order-preserving uniqueness with graceful fallback for missing utilities
- **Async Testing**: Template functions triggered by events require explicit waiting for async completion in tests
- **Jest Test Isolation**: Express server startup during tests causes hanging; NODE_ENV=test check prevents server startup in test mode
- **TDD Automation**: forceExit and detectOpenHandles in Jest config eliminate manual intervention during test runs
- **Cache Testing Strategy**: Observable behavior tests (timing, response identity) more reliable than fetch mocking for integration testing
- **Cache Validation**: Existing implementation already met requirements; comprehensive tests confirmed TTL and isolation behavior
- **Linter Automation**: ESLint config converted to .cjs format resolves ES module conflicts; all 'any' types replaced with 'unknown' for type safety

### Technical Decisions
- **OP_RETURN Format**: `<nftId>|<expiryBlock>` canonical encoding
- **Provenance Window**: Configurable K parameter (default: 1 block)
- **Size Budget**: Parent HTML ≤ 5KB, library in shared inscriptions
- **Network Support**: Regtest primary, signet for integration, mainnet for production
- **Registration Deduplication**: Template uses `EmbersCore.dedupe` for order-preserving feeTxid uniqueness

### REFACTOR Notes for B2
- **lastRegistration JSON Shape**: Current implementation returns first unique registration object; future enhancement should standardize `{feeTxid, amount, schema, ...}` structure across client/server APIs
- **Error Handling**: Template gracefully falls back when EmbersCore.dedupe fails or is unavailable
- **Performance**: O(n²) lookup acceptable for small children arrays; consider Map-based optimization for larger datasets

### REFACTOR Notes for B3
- **Debug Keys**: `window.__debug` contains `{lastInputs, lastOutputs, timestamp, provenance?}` with sanitized data
- **PII Avoidance**: Filters out `buyer_email`, `buyer_name`, and variations; applies to both inputs and outputs recursively
- **Serialization**: BigInt values converted to strings for JSON compatibility; handles nested object sanitization
- **Timing**: Debug attachment occurs after all async operations complete for accurate diagnostic capture
- **Security**: Debug object only created when `DEBUG=1` or `DEBUG=true`; explicitly removed when `DEBUG=false`
- **Performance**: PII filtering has O(n) complexity per object; acceptable for debug-only usage

### REFACTOR Notes for C1
- **Cache Centralization**: Current in-route cache should be extracted to shared utility for reuse across endpoints
- **Metrics Integration**: Add request timing, cache hit ratio, and parser utility performance metrics
- **Error Handling**: Standardize error responses and add structured logging for debugging
- **Configuration**: Environment variables for timeouts, cache TTL, and network endpoints should be centralized
- **Network Abstraction**: ord endpoint calls should be abstracted into service layer for easier testing and mocking
- **Response Optimization**: Consider partial response caching to reduce computation for frequently accessed debug fields

### REFACTOR Notes for C1 - Error Handling (Completed)
- **Error Categorization**: Consider adding more specific error codes (e.g., `INSCRIPTION_NOT_FOUND`, `CACHE_ERROR`) for better granularity
- **Error Logging**: Add structured logging when errors occur to help with debugging and monitoring
- **Error Response Consistency**: Consider adding timestamps to error responses for debugging correlation
- **Performance**: Current error handler creates new error objects which is fine, but could consider factory pattern for common errors
- **Documentation**: Add JSDoc comments for all error codes and their meanings to improve maintainability
- **Type Safety**: Create TypeScript types for error responses to ensure consistency across the API

### REFACTOR Notes for C2
- **Centralized Cache Service**: Extract status cache into shared `CacheService` class with TTL management, LRU eviction, and metrics
- **Test Strategy Evolution**: Observable behavior testing proved more reliable than network mocking; standardize this pattern for integration tests
- **Cache Monitoring**: Add cache hit/miss ratio logging and performance metrics for production monitoring
- **Cache Configuration**: Make TTL configurable per cache type (status: 30s, metadata: 5min, etc.) through environment variables
- **Memory Management**: Consider implementing cache size limits and automatic cleanup for long-running processes
- **Cache Warming**: Add optional cache pre-warming for frequently accessed NFT IDs to improve initial response times

### REFACTOR Notes for E1 - bitcoin-cli OP_RETURN Examples
- **Example Variety**: Add more network-specific examples with actual addresses for each network type
- **Script Automation**: Consider adding bash script examples that automate the entire flow
- **Error Recovery**: Add examples of RBF (Replace-By-Fee) for stuck transactions
- **PSBT Workflow**: Expand PSBT examples with multi-sig and hardware wallet scenarios
- **Validation Tools**: Add examples using `bitcoin-cli validateaddress` and transaction simulation
- **Size Optimization**: Document OP_RETURN size limits (80 bytes standard, up to 83 bytes with OP_PUSHDATA)
- **Cross-Platform**: Add Windows PowerShell equivalents for hex encoding commands
- **Integration Examples**: Show how to integrate with popular wallet libraries (bitcoinjs-lib, etc.)

### REFACTOR Notes for E2 - Wallet Troubleshooting Guide
- **Wallet Updates**: Maintain current wallet compatibility as new versions release
- **Video Tutorials**: Consider adding links to video walkthroughs for visual learners
- **Script Repository**: Create companion repository with ready-to-use scripts
- **Internationalization**: Translate guide to other languages for wider adoption
- **Interactive Debugger**: Build web-based tool to decode and validate transactions
- **Community Examples**: Add section for community-contributed solutions
- **Hardware Wallets**: Expand coverage for Ledger, Trezor, and other hardware wallets
- **Mobile Wallets**: Add mobile-specific troubleshooting for iOS/Android wallets
- **API Integration**: Document programmatic registration via popular Bitcoin libraries

## Phase 2 Signet Upgrades - S1 Track Refactor Notes

### Completed S1.1: Environment Configuration Schema
- Created network configuration module with type-safe network handling
- Implemented basic address validation for signet vs regtest networks
- Added .env.signet.example for configuration reference

### Refactor opportunities identified for S1.1:
1. **Address validation**: Current implementation uses simple prefix checking. Consider integrating a proper Bitcoin address validation library (e.g., bitcoinjs-lib) for more robust validation including checksum verification.

2. **Configuration schema validation**: Consider using zod or joi for runtime schema validation to catch configuration errors early and provide better error messages.

3. **Network constants**: Extract network-specific constants (prefixes, default ports) into a separate constants file for better maintainability.

4. **Environment variable typing**: Consider creating a typed environment variable interface to avoid string indexing throughout the codebase.

5. **Configuration factory pattern**: As we add more networks (testnet, mainnet), consider implementing a factory pattern for network-specific configurations.

### Completed S1.2: Dynamic Endpoint Resolution
- Created endpoint resolution function with network mapping
- Implemented environment variable overrides for each endpoint
- Handled URL normalization (trailing slashes, protocols, ports)

### Refactor opportunities identified for S1.2:
1. **Endpoint path constants**: Extract endpoint paths (`/r/metadata/`, `/r/children/`, etc.) to constants for maintainability.

2. **Health checking**: Add endpoint health checking functionality to verify endpoints are accessible before use.

3. **Endpoint validation**: Add URL validation to ensure provided base URLs are valid before constructing endpoints.

4. **Network-specific endpoints**: Some networks might have different endpoint structures; consider network-specific endpoint patterns.

5. **Caching**: Consider caching endpoint resolution results to avoid repeated string operations.

6. **Timeout configuration**: Add per-endpoint timeout configuration for network calls.

### Completed S1.3: Config Service Integration
- Successfully integrated network-aware configuration into existing ConfigManager
- Maintained backward compatibility with legacy environment variables
- Added support for network-specific ord endpoints
- Implemented address validation per network

### Refactor opportunities identified for S1.3:
1. **Factory pattern**: Consider implementing a factory pattern for creating network-specific configurations to reduce complexity in applyEnvironmentVariables.

2. **Config validation middleware**: Extract validation logic into a separate middleware layer for better separation of concerns.

3. **Environment variable schema**: Define a comprehensive schema for all environment variables with validation rules.

4. **Config migration**: Add version tracking and migration support for config changes over time.

5. **Config hot-reload**: Implement config hot-reload capability for development without server restart.

6. **Network config abstraction**: Create a NetworkConfigProvider interface to abstract network-specific logic.

## Phase 2 Signet Upgrades - S2 Track Progress

### Completed S2.1: Network Parameter Support
- Parser already had network parameter support in sumOutputsToAddress
- Created comprehensive tests for network-specific address validation
- Verified support for all networks including mainnet

### Refactor opportunities identified for S2.1:
1. **Backward compatibility**: Consider making network parameter optional with 'regtest' default for backward compatibility with existing code.

2. **Network validation**: Add explicit network validation at function entry to fail fast with clear error messages.

3. **Address format validation**: Current implementation relies on bitcoinjs-lib for address validation. Consider adding pre-validation for address prefixes per network.

4. **Network type safety**: Consider using enum or const assertion for network types instead of string literals.

5. **Error messages**: Enhance error messages to include which network was expected vs provided.

### Completed S2.2: Signet Test Fixtures
- Created comprehensive Signet transaction fixtures
- Implemented fixtures for P2WPKH, P2TR, P2PKH output types
- Added complex transaction fixtures (multi-input, multi-output)
- Created edge case fixtures (minimum fee, expired, large OP_RETURN)

### Refactor opportunities identified for S2.2:
1. **Real transaction data**: Consider using actual Signet transaction data instead of generated fixtures for more realistic testing.

2. **Fixture generation script**: Create a script to generate fixtures from real Signet network transactions automatically.

3. **Network-specific fixtures**: Extend fixtures to support testnet and mainnet with their specific characteristics.

4. **Fixture validation**: Add deeper validation of fixture structure (e.g., valid scripts, proper witness data).

5. **Performance testing fixtures**: Add large transaction fixtures for performance testing of parser functions.

6. **Deterministic generation**: Use deterministic seeds for all random values to ensure reproducible tests.

### Completed S2.3: VerifyPayment Network Integration
- Created comprehensive tests for verifyPayment with network support
- Verified correct behavior across all networks (regtest, signet, testnet, mainnet)
- Confirmed OP_RETURN validation with network awareness
- Tested complex scenarios including multi-output and edge cases

### Refactor opportunities identified for S2.3:
1. **Test organization**: Consider splitting the large test file into smaller, focused test suites for better maintainability.

2. **Fixture reuse**: Extract common transaction building utilities into a shared test helper module.

3. **Error testing**: Add more tests for error conditions and edge cases (malformed transactions, invalid networks).

4. **Performance benchmarks**: Add performance tests for verifyPayment with large transactions.

5. **Integration tests**: Create end-to-end integration tests that use real network data instead of fixtures.

## Phase 2 Signet Upgrades - COMPLETED TASKS SUMMARY

### ✅ Track S1: Network Configuration (COMPLETED)
All network configuration tasks successfully implemented to support Signet testing.

### ✅ Track S2: Parser Network Compatibility (COMPLETED)  
Parser functions now fully support network parameters and Signet-specific validation.

### ✅ Track S3: Integration Testing (COMPLETED)
Real Signet blockchain integration tests implemented and passing.

## Phase 2 Signet Upgrades - S3 Track Progress

### Completed S3.1: Signet Parser Integration Tests
- Created real Signet transaction tests with OP_RETURN data
- Implemented utilities for creating and fetching Signet transactions
- Successfully parsed real blockchain data with actual transaction fees

### Refactor opportunities identified for S3.1:
1. **Extract test utilities to shared module**
   - Consider creating a shared test utils package
   - Reusable functions for transaction creation
   - Common fixtures for different networks

2. **Add transaction caching**
   - Cache created transactions to speed up test runs
   - Avoid recreating identical test data
   - Implement TTL for cache entries

3. **Improve error handling**
   - Add retry logic for network timeouts
   - Better error messages for debugging
   - Handle wallet insufficient funds gracefully

4. **Optimize test performance**
   - Batch transaction creation where possible
   - Parallelize independent tests
   - Skip blockchain sync check if recently verified

### Completed S3.2: Status API Signet Tests
- Created helper functions for inscription simulation
- Implemented real Signet payment transaction creation
- Successfully tested OP_RETURN data embedding

### Refactor opportunities identified for S3.2:
1. **Real inscription integration**
   - Once ord is installed on Signet, replace mock inscriptions with real ones
   - Implement actual parent/child inscription creation
   - Add full status API validation with real data

2. **Test data cleanup**
   - Add cleanup after tests to avoid polluting wallet
   - Track created transactions for potential rollback
   - Implement test isolation

3. **Retry logic for network operations**
   - Add retry wrapper for bitcoin-cli commands
   - Handle network timeouts gracefully
   - Implement exponential backoff

4. **Configuration improvements**
   - Make test wallet name configurable
   - Add option to use existing inscriptions for testing
   - Support different fee rates for test transactions

### Completed S3.3: E2E Registration Flow
- Created template generation utilities
- Implemented complete registration workflow simulation
- Successfully tested full flow with real Signet transactions

### Refactor opportunities identified for S3.3:
1. **Template complexity**
   - Add more realistic template with actual EmbersCore integration
   - Include CSS and more complex JavaScript
   - Test with larger templates approaching size limits

2. **Performance benchmarking**
   - Add timing measurements for each step
   - Identify bottlenecks in the registration flow
   - Optimize transaction creation and broadcasting

3. **Error scenario testing**
   - Test with insufficient funds
   - Handle network failures gracefully
   - Test with invalid inscription IDs

4. **Browser simulation improvements**
   - Use jsdom or similar for more realistic rendering
   - Test actual JavaScript execution in templates
   - Validate DOM manipulation behavior

5. **Parameterized test scenarios**
   - Test different fee amounts
   - Various expiry block offsets
   - Multiple child registrations per parent

## Phase 2 Signet Upgrades - Final Status

### 🎯 COMPLETED TRACKS (S1-S3)

**Track S1: Network Configuration** ✅
- ✅ S1.1: Environment Configuration Schema - Created network.ts with validation
- ✅ S1.2: Dynamic Endpoint Resolution - Implemented getEndpoints() with URL normalization  
- ✅ S1.3: Config Service Integration - Updated ConfigManager with backward compatibility

**Track S2: Parser Network Compatibility** ✅
- ✅ S2.1: Network Parameter Support - Parser functions accept network parameter
- ✅ S2.2: Signet Test Fixtures - Created comprehensive transaction fixtures
- ✅ S2.3: VerifyPayment Network Integration - Updated with network awareness

**Track S3: Integration Testing** ✅
- ✅ S3.1: Signet Parser Integration Tests - Tests with real blockchain data
- ✅ S3.2: Status API Signet Tests - Payment transaction validation
- ✅ S3.3: End-to-End Registration Flow - Complete workflow simulation

### 📊 Test Results
- All tests passing (S1-S3 tracks)
- Real Signet transactions created and validated
- Wallet usage: ~0.00001094 sBTC for test transactions

### 🚧 REMAINING TRACKS (S4-S5)

**Track S4: Test Infrastructure** - PENDING
- S4.1: Test Data Generator Scripts
- S4.2: Automated Test Runner
- S4.3: Network Health Monitoring

**Track S5: Embers Core Deployment** - PENDING
- S5.1: Build Configuration for Networks
- S5.2: Deployment Script
- S5.3: Template Integration

## Phase 2 Signet Upgrades - Completed Work

### Session: August 21, 2025 - Track S4 Test Infrastructure Implementation

#### Completed S4.1: Test Data Generator Scripts ✅
- Created shell scripts for generating test transactions on Signet
- Implemented generate-test-tx.sh for OP_RETURN and payment transactions
- Implemented inscribe-test-parent.sh for parent template inscriptions
- Implemented create-test-receipt.sh for registration receipt generation
- All tests passing with proper error handling for missing bitcoin-cli

#### Completed S4.2: Automated Test Runner ✅
- Created test-signet.sh comprehensive test runner
- Implemented check-prerequisites.sh for environment validation
- Added support for quick mode, unit-only, and integration-only test runs
- Generates JSON test reports with timing and results
- Scripts handle missing dependencies gracefully

#### Completed S4.3: Network Health Monitoring ✅
- Created signet-health.ts utilities for monitoring network status
- Implemented checks for ord sync, block production, and endpoint availability
- Added comprehensive health status reporting with warnings
- Created integration tests for health monitoring
- **Added CI environment skipping** for tests requiring Signet connection

#### CI/CD Improvements
- All Signet integration tests now properly skip when CI=true
- Fixed health.test.ts to use describeSkipCI pattern
- Verified all 4 test suites skip correctly in CI environment
- Pushed all changes to embers_core_v1 branch PR

### Refactor opportunities documented for S4:

**S4.1 Refactors:**
- Bitcoin node integration when available
- Enhanced error handling and validation
- Configuration file support
- Output formatting standardization
- Cross-platform compatibility

**S4.2 Refactors:**
- Parallel test execution
- Test selection granularity
- CI/CD integration enhancements
- Report aggregation
- Performance metrics collection

**S4.3 Refactors:**
- Real API integration
- Metrics collection (Prometheus/StatsD)
- Alert thresholds configuration
- Historical tracking
- Dashboard creation
- Auto-recovery mechanisms

## Track S4 Complete! ✅

All Test Infrastructure tasks have been successfully completed and pushed to GitHub:
- ✅ S4.1: Test Data Generator Scripts (commit: 05d95e4)
- ✅ S4.2: Automated Test Runner (commit: e23f0eb)
- ✅ S4.3: Network Health Monitoring (commit: 3e677b5)
- ✅ CI Skip Fix (commit: 1345033)

## Next Steps - Track S5: Embers Core Deployment

### Completed S5.1: Build Configuration for Networks ✅
- ✅ Created network-aware build configuration module
- ✅ Implemented getBuildConfig() for regtest/signet/testnet/mainnet  
- ✅ Added build script with size checking and analysis
- ✅ Configured minification and tree-shaking
- ✅ All 15 tests passing

#### Refactor opportunities for S5.1:
1. **Real Vite integration**: Current implementation is a mock. Should integrate with actual Vite build process using defineConfig() and proper plugin architecture.

2. **Environment variable support**: Add support for reading network from BITCOIN_NETWORK env var as fallback to CLI parameter.

3. **Build caching**: Implement incremental builds and caching to speed up repeated builds for the same network.

4. **Size reporting enhancement**: Add more detailed size breakdown (before/after minification, per-module analysis).

5. **Source map configuration**: Make source map generation configurable (development vs production builds).

6. **Build validation**: Add post-build validation to ensure all required exports are present and functional.

7. **Network-specific optimizations**: Consider different optimization strategies per network (e.g., more aggressive for mainnet).

8. **Build artifacts management**: Add cleanup of old build artifacts and versioning strategy.

### Completed S5.2: Deployment Script ✅
- ✅ Created deploy-embers-core.sh script for automated inscription
- ✅ Implemented dry-run mode for testing
- ✅ Added network validation and build integration
- ✅ Created verification script for deployment validation
- ✅ Environment variable output and .env file updates
- ✅ All tests passing

#### Refactor opportunities for S5.2:
1. **Real ord integration**: Replace mock inscription with actual ord CLI commands when Bitcoin node is available.

2. **Rollback capability**: Implement actual rollback functionality to revert failed deployments.

3. **Version management**: Add version tracking and history of deployed inscriptions per network.

4. **Multi-wallet support**: Allow specifying different wallets for different networks.

5. **Fee estimation**: Add fee estimation and user confirmation before inscription.

6. **Batch deployment**: Support deploying to multiple networks in one command.

7. **CI/CD integration**: Add GitHub Actions workflow for automated deployment on release.

8. **Deployment verification**: Enhance verification to actually fetch and validate inscription content.

9. **Error recovery**: Add retry logic and better error handling for network failures.

10. **Deployment logs**: Create detailed deployment logs with timestamps and transaction IDs.

### Completed S5.3: Template Integration ✅
- ✅ Created template loader module with network-aware inscription loading
- ✅ Implemented getEmbersInscriptionId() for network-specific IDs
- ✅ Added fallback handling when inscriptions unavailable
- ✅ Implemented version checking and integrity verification
- ✅ Added template caching for performance
- ✅ All 15 tests passing

#### Refactor opportunities for S5.3:
1. **Async loading**: Implement async loading with progress indication for better UX.

2. **Version compatibility**: Add semver comparison to ensure minimum version requirements are met.

3. **Cache TTL**: Add time-to-live for cached templates to allow updates.

4. **Error reporting**: Enhance error messages to help debug inscription loading failures.

5. **Multiple fallback sources**: Support fallback to CDN or local bundle if inscription fails.

6. **Lazy loading**: Only load Embers Core when actually needed by the template.

7. **Preloading**: Add link preload hints for better performance.

8. **Content Security Policy**: Add CSP headers for inscription content.

9. **Template variants**: Support different templates for different networks or use cases.

10. **Hot reload**: Support hot reload in development for faster iteration.

## Track S5 Complete! ✅

All Embers Core Deployment tasks have been successfully completed:
- ✅ S5.1: Build Configuration for Networks (commit: dc23307)
- ✅ S5.2: Deployment Script (commit: 553e54d)
- ✅ S5.3: Template Integration (current)

---

**Archive Note**: Completed Phase 1 work and infrastructure analysis archived to:
- `.cursor/scratchpad-history-phase1.md`
- `.cursor/scratchpad-history-infrastructure.md`

## Planner: Refactor Prioritization for Signet Core Embers Test (Now vs Later)

### Goal Alignment
Focus only on improvements that increase the likelihood of a successful, near-production Signet test of core Embers functionality with minimal anti-forgery safeguards. Defer structural/UX/scale work.

### NOW (High impact for Signet test reliability & anti-forgery)
1. S5.2 — Deployment verification and rich logs
   - Add actual fetch-and-validate of inscription content after deploy; emit txid, inscription id, byte length, SHA-256 checksum in logs.
   - Success: `deploy-embers-core.sh --verify` fails fast on mismatch; logs contain ids + checksum.

2. S5.3 — Loader: stronger error reporting + multi-source fallback
   - Improve error surfaces with actionable messages; add fallback to CDN/local bundle if inscription fetch fails or lags.
   - Success: When ord index is behind, app loads from fallback automatically; errors include network, URL, and retry hints.

3. S1.2 — Endpoint validation and per-endpoint timeouts
   - Validate base URLs upfront; set explicit timeouts for ord endpoints; reuse S4.3 health probes at startup.
   - Success: Invalid/missing endpoints are rejected at boot; network calls respect timeouts (e.g., 10s) with clear errors.

4. S2.1 — Explicit network validation at function entry + clearer errors
   - Fail fast if network is unsupported/undefined; include expected vs provided network in messages.
   - Success: Parser/verifyPayment guard clauses return precise, network-aware errors.

5. S1.1 — Strong address validation for creator pay-to detection
   - Replace prefix-only checks with full address validation (e.g., bitcoinjs-lib) including checksum per network.
   - Success: Invalid destination addresses are rejected pre-parse; tests cover P2WPKH/P2TR/P2PKH across networks.

6. S5.2 — Optional, gated real ord CLI integration (feature flag)
   - Enable real ord inscription on Signet when node is available; keep mock as fallback.
   - Success: `ORD_INTEGRATION=1` path performs real inscription; dry-run and mock remain unchanged.

7. E1 — OP_RETURN size and validation notes (docs quality-of-life)
   - Document 80–83 byte limits and add `validateaddress`/decode examples; link to parser rules.
   - Success: Docs include explicit size guidance and a minimal validation snippet for operators.

### LATER (Valuable, but not needed for immediate Signet goal)
- S5.1 — Real Vite integration with defineConfig and plugins
- S5.2 — Rollback capability; version management; multi-wallet; fee estimation; batch deploy; CI/CD workflow; advanced error recovery
- S5.3 — Async loading/progress; semver compatibility checks; cache TTL; preload hints; CSP; template variants; hot reload
- S1.1 — Config schema via zod/joi; network constants extraction; typed env; config factory
- S1.2 — Endpoint path constants; endpoint resolution caching; network-specific endpoint patterns
- S1.3 — Config validation middleware; migration/versioning; hot-reload; provider abstraction
- S2.1 — Network type safety via const/enums; default network fallback (keep explicit for now)
- S2.2 — Real mainnet/testnet fixtures; generator; deeper fixture validation; performance fixtures; deterministic seeds
- S2.3 — Test organization split; shared test helpers; broader error/perf/integration tests
- E1 — Script automation; RBF guidance; advanced PSBT flows; Windows/PowerShell examples; library integration examples
- E2 — Wallet matrix expansion; videos; scripts repo; interactive debugger; hardware/mobile coverage; programmatic API guide

### Notes
- The NOW set is intentionally small and pragmatic: improve reliability of fetching/loading, fail-fast on config/address/network, and add post-deploy verification. This directly reduces false positives/negatives during Signet runs and strengthens minimal anti-forgery without large structural changes.
