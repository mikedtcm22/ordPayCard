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
- [ ] C1: Endpoint contract with provenance gating
- [ ] C2: 30s cache freshness

#### **Track D: On-chain API Library (Embers Core v1)**
- [ ] D1: Public API surface and types
- [ ] D2: Build/minify bundle within size budget
- [ ] D3: Loader snippet to resolve latest child by parent ID

#### **Track E: Tooling & Examples**
- [ ] E1: `bitcoin-cli` OP_RETURN examples
- [ ] E2: Wallet troubleshooting guide

## Project Status Board

### Current Status / Progress Tracking
- [x] **Phase 1 Complete**: Project foundation, Bitcoin integration, development environment
- [x] **Track A Complete**: Server parser library with all utilities and tests
- [x] **Track B Complete**: Template updates with parser integration, deduplication, and debug features
- [ ] **In Progress**: C1 - Backend status API endpoint contract
- [ ] **Pending**: C2, D1-D3, E1-E2

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

**Current**: C1 - Backend status API endpoint contract

### Development Environment Status
- **Node.js**: v22.17.1 (NVM managed)
- **Testing**: 166 total tests passing (server: 143, client: 23)
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

### Current Task: C1 - Backend Status API Endpoint Contract

**Objective**: Implement status endpoint with provenance gating and debug info

**Next Steps**:
1. **RED**: Add test for `GET /api/registration/:nftId` endpoint contract
2. **GREEN**: Implement route + controller with provenance window integration
3. **REFACTOR**: Extract cache into utility, add metrics hooks

### Key Implementation Notes
- Template now calls `EmbersCore.verifyPayment` and displays results
- Template deduplicates feeTxids using `EmbersCore.dedupe` before processing
- Developer debug flag exposes sanitized diagnostic information via `window.__debug`
- Vitest module alias resolution fixed to match Vite config
- All server parser utilities have comprehensive test coverage
- Cache implementations use 30s TTL with per-inscription isolation

## Lessons

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

## Next Steps

1. **Backend API**: C1-C2 status endpoint with caching and provenance gating
2. **Embers Core**: D1-D3 on-chain library preparation
3. **Documentation**: E1-E2 tooling and troubleshooting guides

---

**Archive Note**: Completed Phase 1 work and infrastructure analysis archived to:
- `.cursor/scratchpad-history-phase1.md`
- `.cursor/scratchpad-history-infrastructure.md`
