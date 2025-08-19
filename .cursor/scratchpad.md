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
- [ ] E1: `bitcoin-cli` OP_RETURN examples
- [ ] E2: Wallet troubleshooting guide
  
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

## Next Steps

1. **Backend API**: Track C completed (C1-C2)
2. **Embers Core**: D1-D3 on-chain library preparation
3. **Documentation**: E1-E2 tooling and troubleshooting guides

---

**Archive Note**: Completed Phase 1 work and infrastructure analysis archived to:
- `.cursor/scratchpad-history-phase1.md`
- `.cursor/scratchpad-history-infrastructure.md`
