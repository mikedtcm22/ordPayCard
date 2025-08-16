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
- [ ] B3: Developer debug flag

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
- [x] **B1 Complete**: Template parser-verified flow implementation
- [x] **B2 Complete**: Template feeTxid deduplication implementation
- [ ] **In Progress**: B3 - Developer debug flag
- [ ] **Pending**: C1-C2, D1-D3, E1-E2

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

**Current**: B3 - Developer debug flag

### Development Environment Status
- **Node.js**: v22.17.1 (NVM managed)
- **Testing**: 159 total tests passing (server: 143, client: 16)
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

### Current Task: B3 - Developer Debug Flag

**Objective**: Include debug info for developers when DEBUG flag is enabled

**Next Steps**:
1. **RED**: Add test for `window.__debug` when `DEBUG=1` flag is set
2. **GREEN**: Implement gated debug info attachment
3. **REFACTOR**: Document debug keys, avoid PII

### Key Implementation Notes
- Template now calls `EmbersCore.verifyPayment` and displays results
- Vitest module alias resolution fixed to match Vite config
- All server parser utilities have comprehensive test coverage
- Cache implementations use 30s TTL with per-inscription isolation

## Lessons

### Phase 2 Development Insights
- **TDD Discipline**: Small, focused tests prevent overengineering
- **Parser Parity**: Client/server consistency requires identical test cases  
- **Fail-Closed Design**: Security-critical operations default to safe state
- **Cache Strategy**: 30s TTL balances performance with data freshness
- **Module Resolution**: Vitest and Vite configs must stay synchronized
- **Template Integration**: Error boundaries needed for EmbersCore API calls

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

## Next Steps

1. **Implement B3**: Developer debug flag with diagnostics
2. **Backend API**: C1-C2 status endpoint with caching
3. **Embers Core**: D1-D3 on-chain library preparation
4. **Documentation**: E1-E2 tooling and troubleshooting guides

---

**Archive Note**: Completed Phase 1 work and infrastructure analysis archived to:
- `.cursor/scratchpad-history-phase1.md`
- `.cursor/scratchpad-history-infrastructure.md`
