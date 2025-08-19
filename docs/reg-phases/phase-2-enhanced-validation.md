### Phase 2: Enhanced Validation

Version: 1.0 • Owner: Core Eng • Duration: ~1 week

Purpose: Harden registration validation. Adopt provenance receipts (owner-enforced via spending the parent) and OP_RETURN-based fee binding, plus richer parser and chain integrity checks.

----

### Scope
- Provenance receipts: child inscription must be created as a provenance child (reveal spends the parent and includes tag 3 with the parent ID) to enforce owner consent on-chain
- Require registration fee payments to include OP_RETURN with NFT inscription ID and expiry
- Parser v1.0: hex parsing, outputs, OP_RETURN extraction, basic address decoding; buyer BIP-322 becomes optional (attribution) under provenance
- Deduplicate registrations by txid
- Server mirrors logic for status API
 - Artwork handling: DEFAULT remains embedded image in parent; ALT continue to support a single full-image child; atlas/tiling deferred to Phase 3
  - Introduce on-chain API library inscriptions ("Embers Core v1") to keep parent HTML minimal by offloading parsing/validation logic
  - Provenance gating: accept only when latest child genesis height equals current parent satpoint height (H_child == H_parent). Fee tx must confirm ≤ child height and within a small window K (e.g., K ≤ 1) when fee and reveal are separate txs.

----

- ### Deliverables
- Parser library v1.0 child with:
  - `verifyPayment(txid, creatorAddr, minFee, nftId, opts)` → amount or 0 if OP_RETURN/expiry mismatch
  - Transaction output parsing for P2PKH, P2WPKH, P2TR (simplified ok)
  - Optional `verifyBuyerSig(message, signature, pubkey)` (BIP-322) for early buyer-binding
- NFT template updated to require OP_RETURN validation
- Parent default: embedded image; ALT: continue to load a single full-image child when Active
- Updated docs guiding wallets/CLI to include OP_RETURN
- Status API validates with parser; returns integrity summary
 - On-chain API library (Embers Core v1):
   - Published as a parent inscription ID with versioned child scripts (upgrade path)
   - Public JS API surface documented (e.g., `EmbersCore.verifyPayment`, `EmbersCore.dedupe`)
   - Loader snippet that fetches the latest child for a stable parent ID
  - Size budget: parent inscription HTML ≤ 5 KB (minified), library code lives in shared inscription(s)
  - New: last-transfer gating implemented server-side, with optional template parity when recursive endpoints provide satpoint and tx height; fail-closed behavior documented

----

### Tasks

- Parser
  - [ ] Implement OP_RETURN extraction and inscription ID + expiry matching (reject stale)
  - [ ] Decode common output types and sum payments to creator
  - [ ] (Optional) BIP-322 message verify for buyer_pubkey
  - [ ] Add defensive parsing (bounds checks, timeouts)
  - [ ] Provide semantic version metadata and changelog

- NFT template
  - [ ] Switch to parser-verified flow (0 sats if missing OP_RETURN or mismatch/expired)
  - [ ] Deduplicate by `feeTxid`
  - [ ] Expose debug info flag for developers

- Backend status API
  - [x] Fetch provenance children for parent and identify the latest child and its genesis height (H_child)
  - [x] Load child JSON; verify it references `feeTxid`
  - [x] Fetch parent current satpoint → height (H_parent); enforce `H_child == H_parent`
  - [x] Fetch `feeTxid`; enforce OP_RETURN match, creator sum ≥ minFee, and `fee.height ≤ H_child` with `(H_child - fee.height) ≤ K`
  - [x] Return `{isRegistered, lastRegistration, integrity, debug}`

- Tooling & examples
  - [ ] Example `bitcoin-cli` commands adding OP_RETURN with inscription ID
  - [ ] Troubleshooting guide for wallets without OP_RETURN support

- On-chain API library (Embers Core v1)
  - [ ] Define JS API surface (functions, inputs/outputs, errors)
  - [ ] Build and minify library bundle (no external deps; self-contained)
  - [ ] Publish as a parent inscription (stable ID) plus v1 child script; document semver
  - [ ] Implement lightweight loader in parent HTML to load the latest child via `/r/children/{LIB_PARENT_ID}`
  - [ ] Add env/config to hold `EMBERS_CORE_PARENT_ID` per network
  - [ ] Document size budgets and how to keep the main parent minimal

- Provenance gating (new)
  - [ ] Server: compute `H_parent` from current satpoint; compute `H_child` from latest provenance child; enforce `H_child == H_parent`
  - [ ] Orchestration: enforce `fee.height ≤ H_child` and `(H_child - fee.height) ≤ K` (configurable; default K = 1)
  - [ ] Status API: include `debug.{H_parent,H_child,feeHeight,K}` and enforce in `isRegistered`
  - [ ] Template (optional): when recursion endpoints expose child heights and satpoint height, gate client-side best-effort; fail closed otherwise
  - [ ] Non-sale moves: support a lightweight "rebind" provenance child (no fee) so `H_child == H_parent` remains true across owner transfers

----

- ### Acceptance Criteria
- Transactions without OP_RETURN, with mismatched data, or expired credit 0 sats
- Parser handles at least 3 output types and returns consistent results between client and server
### Notes toward Phase 3
- Prepare for sale/fee template by:
  - Documenting OP_RETURN canonicalization and expiry now
  - Adding optional `buyer_pubkey` field in receipts and exposing `verifyBuyerSig` (strictly enforced in Phase 3)
- Status API latency ≤ 700 ms median for 10 registrations
 - Parent HTML ≤ 5 KB and only includes a small loader plus calls to `Embers Core v1`
 - Upgrading the library does not require changing the parent—adding a new child version is sufficient

----

### Risks & Mitigations
- Some wallets can’t add OP_RETURN → provide raw tx builder docs and PSBT examples
- Parser size growth → minify, share utils, prune features

----

### References
- Parser plan: docs/phases-card/phase-2.2/phase-2.2.1c-parser.md
- PRD: docs/PRD-registration-system.md


----

### TDD Development Breakdown (Red/Green/Refactor)

Purpose: Execute Phase 2 with strict, small TDD loops. Each micro-task specifies the failing test(s) to write first (RED), the minimal implementation (GREEN), and limited refactor guidance (REFACTOR planning only; no code changes during refactor step beyond README/process updates).

Conventions
- Test frameworks: client uses Vitest + Testing Library; server uses Jest + supertest.
- File size: new files ≤ 500 lines; prefer modularization.
- Function style: pure functions with `function` keyword; no classes.
- Commit on GREEN only, message format: `feat: implement <behavior> to pass test`.
- Coverage target: ≥ 80% lines/branches in new modules; enforce per package.
- Default network for Phase 2 tests: regtest.

Progress notes (Updated 2025-08-16)
- **Track A (Parser Library) - COMPLETED**: All server-side parser utilities implemented and GREEN
  - A0 implemented utilities:
    - `getLastTransferHeight` (server): `server/src/services/registration/parser/lastTransfer.ts`, tests: `__tests__/lastTransfer.test.ts`
    - `getLatestChildHeight` (server): `server/src/services/registration/parser/latestChildHeight.ts`, tests: `__tests__/latestChildHeight.test.ts`
  - A1 OP_RETURN parsing: `server/src/services/registration/parser/opReturn.ts`, tests: `__tests__/opReturnExtractor.test.ts`
  - A2 sum-to-creator: `server/src/services/registration/parser/sumToCreator.ts`, tests: `__tests__/sumToCreator.test.ts`
  - A3 verifyPayment orchestration: `server/src/services/registration/parser/verifyPayment.ts`, tests: `__tests__/verifyPayment.test.ts`
  - A4 dedupe: `server/src/services/registration/parser/dedupe.ts`, tests: `__tests__/dedupe.test.ts`
  - A6 defensive parsing: implemented with ParserError types and timeouts
  - Jest setup centralized ECC init for P2TR tests: `server/jest.setup.ts`

- **Track B (NFT Template Updates) - COMPLETED**: All template functionality implemented and GREEN
  - B1 parser-verified flow: `client/src/templates/inscription/registrationWrapper.html` with `EmbersCore.verifyPayment` integration
  - B2 feeTxid deduplication: template uses `EmbersCore.dedupe` for order-preserving uniqueness
  - B3 developer debug flag: `window.__debug` with PII-safe diagnostic information
  - Tests: `client/src/templates/inscription/__tests__/registrationWrapper.test.ts` (8 comprehensive test cases)

- **Track C (Backend Status API) - COMPLETED**: All status endpoint functionality implemented and GREEN
  - C1 endpoint contract: `server/src/routes/registration.ts` with provenance gating, parser integration, and debug info
  - C2 cache freshness: 30s TTL cache with comprehensive behavior testing
  - Tests: `server/src/__tests__/registration.status.test.ts` (8 test cases), `server/src/__tests__/registration.cache.test.ts` (8 test cases)

- **Current Status**: 175 total tests passing (server: 159, client: 23)

Track A — Parser Library v1.0 (server-first parity, then client bundle)
Micro-task A0 (updated): Parent/child heights derivation (server utilities)
- RED
  - Add `server/src/services/registration/parser/__tests__/lastTransfer.test.ts`
  - Cases (H_parent): missing meta → null; meta with `satpoint` → extracts `txid` and fetches tx height; unconfirmed tx → null; caches for 30s.
  - Add `server/src/services/registration/parser/__tests__/latestChildHeight.test.ts`
  - Cases (H_child): no children → null; children with heights → returns max height; caches for 30s; error → null (fail closed).
- GREEN
  - `async function getLastTransferHeight(inscriptionId: string, deps: { fetchMeta: (id:string)=>Promise<any>, fetchTx:(txid:string)=>Promise<any>, nowMs?:()=>number }): Promise<number|null>`
  - `async function getLatestChildHeight(inscriptionId: string, deps: { fetchChildren: (id:string)=>Promise<any[]>, nowMs?:()=>number }): Promise<number|null>`
  - Implement simple in-memory TTL caches keyed by inscriptionId
- REFACTOR (planning)
  - Normalize meta field names (`satpoint` vs `location`), centralize cache; align child height fetch with ord recursion shape

Location plan
- Server source of truth: `server/src/services/registration/parser/*`
- Client parity (for inscription and local rendering): `client/src/lib/embers-core/*`
- Later bundling for on-chain child script from client lib

Micro-task A1: OP_RETURN extraction and NFT/expiry matching
- RED
  - Add `server/src/services/registration/parser/__tests__/opReturnExtractor.test.ts`
  - Cases: missing OP_RETURN → null; malformed hex → throws; valid `OP_RETURN <nftId>|<expiryBlock>` → parsed object; expiry past current height → `isExpired=true`.
- GREEN
  - `function parseOpReturn(rawTxHex: string): { nftId: string; expiryBlock: number } | null`
  - `function isExpired(expiryBlock: number, currentBlock: number): boolean`
- REFACTOR (planning)
  - Extract constants and shared regex; document OP_RETURN canonical format in README.

Micro-task A2: Decode outputs and sum payments to creator
- RED
  - `server/src/services/registration/parser/__tests__/sumToCreator.test.ts`
  - Cases: P2PKH, P2WPKH, P2TR outputs paying to `creatorAddr`; ignores change; mixed outputs; zero sum when none match.
- GREEN
  - `function sumOutputsToAddress(rawTxHex: string, creatorAddr: string, network: 'regtest'|'testnet'|'mainnet'): bigint`
  - Handle the three output types minimally using `bitcoinjs-lib` decode.
- REFACTOR (planning)
  - Move script-type checks into small helpers; add fast-path Bech32 prefix pre-screen.

Micro-task A3: `verifyPayment` orchestration
- RED
  - `server/src/services/registration/parser/__tests__/verifyPayment.test.ts`
  - Cases: missing OP_RETURN → 0n; mismatched nftId → 0n; expired → 0n; provenance window violations → 0n (fee.height > H_child or H_child - fee.height > K); valid → returns bigint ≥ minFee; sums across multiple matching outputs.
- GREEN
  - `function verifyPayment(txhexOrId: string, creatorAddr: string, minFee: bigint, nftId: string, opts: { currentBlock: number; network: 'regtest'|'signet'|'testnet'|'mainnet'; childHeight?: number; feeHeight?: number; kWindow?: number; fetchTx?: (txid: string) => Promise<string> }): Promise<bigint>`
  - Enforce provenance window when `childHeight` is provided; accept txid by fetching raw hex via `opts.fetchTx`.
- REFACTOR (planning)
  - Split network/address validation; centralize error messages.

Micro-task A4: Deduplicate registrations by txid
- RED
  - `server/src/services/registration/parser/__tests__/dedupe.test.ts`
  - Input: array of `feeTxid` strings with duplicates; expect unique order-preserving set.
- GREEN
  - `function dedupeTxids(txids: string[]): string[]`
- REFACTOR (planning)
  - Provide `Map`-based implementation variants benchmark note.

Micro-task A5: BIP-322 buyer signature verify — Deferred to Phase 3
- This item has been moved out of Phase 2 to reduce early complexity.
- New location: see Phase 3 plan (Developer Tools) for `verifyBuyerSig` tasks and tests.

Micro-task A6: Defensive parsing and timeouts
- RED
  - `server/src/services/registration/parser/__tests__/defensiveParsing.test.ts`
  - Large inputs trigger bounds checks; decode failures surface typed errors; async path times out under configured ms.
- GREEN
  - Add `ParserError` types; `withTimeout<T>(p: Promise<T>, ms: number)` utility; bounds checks in decoders.
- REFACTOR (planning)
  - Centralize error codes and messages; doc troubleshooting.

Parity tasks (client)
- After A1–A6 GREEN on server, port identical APIs under `client/src/lib/embers-core/parser/*` with Vitest mirrors:
  - RED: duplicate test names and cases; GREEN: minimal port; ensure deterministic results.
  - Add RED/GREEN for provenance gating helper (compute `H_child` from children; `H_parent` from satpoint) when recursion endpoints are available.

Track B — NFT Template updates (registration wrapper flows) ✅ COMPLETED
Files: `client/src/templates/inscription/registrationWrapper.html` + test harness

Micro-task B1: Parser-verified flow returns 0 sats on OP_RETURN missing/mismatch/expired ✅ COMPLETED
- RED ✅
  - `client/src/templates/inscription/__tests__/registrationWrapper.test.ts`
  - Simulate calling `EmbersCore.verifyPayment` via injected mock; assert UI displays 0 sats and "Not Registered".
- GREEN ✅
  - Wire wrapper to call `EmbersCore.verifyPayment`; render result; guard against undefined. When recursion endpoints exist, surface provenance gating (require `H_child == H_parent` and fee window).
  - Implementation: Added `verifyPaymentAmount()` helper, `paid` element display, updated `render()` to show amount and "Not Registered" state.
  - Fixed Vitest module alias resolution to match Vite config for consistent import handling.
- REFACTOR ✅
  - Extract minimal DOM helpers; document env hooks in template header.
  - **Learning**: Template needs better error boundaries and timeout handling for `EmbersCore` calls.
  - **Learning**: Vitest and Vite configs should stay synchronized for module resolution.

Micro-task B2: Deduplicate by `feeTxid` ✅ COMPLETED
- RED ✅
  - Add test to ensure only latest unique tx is used in status summary.
- GREEN ✅
  - Use `dedupeTxids` before summarizing; implemented order-preserving deduplication in `findRegistration()`.
- REFACTOR ✅
  - Surface lastRegistration in a consistent JSON shape.
  - **Learning**: O(n²) lookup acceptable for small children arrays; fallback behavior for missing EmbersCore.

Micro-task B3: Developer debug flag ✅ COMPLETED
- RED ✅
  - When `DEBUG=1`, wrapper exposes `window.__debug` with last inputs/outputs; test presence gated by flag.
  - Add comprehensive tests for PII avoidance, provenance diagnostics, and debug object lifecycle.
- GREEN ✅
  - Implement gated attach with `attachDebugInfo()` function; ensure removed when flag is false.
  - Include `H_parent`, `H_child`, `feeHeight`, and `K` in debug output when available via provenance diagnostics.
  - Comprehensive PII filtering for inputs and outputs; BigInt serialization for JSON compatibility.
- REFACTOR ✅
  - Document debug keys, avoid PII.
  - **Learning**: Async timing critical for accurate diagnostic capture; sanitization required for both inputs and outputs.

Micro-task B0 (optional): Provenance gating best-effort — DEFERRED
- This optional enhancement deferred to maintain focus on core Phase 2 deliverables.
- Future implementation can leverage existing parser utilities when recursion endpoints provide height data.

Track C — Backend Status API ✅ COMPLETED
Files: `server/src/routes/registration.ts`, controller + service integration

Micro-task C1: Endpoint contract ✅ COMPLETED
- RED ✅
  - `server/src/__tests__/registration.status.test.ts` with supertest
  - `GET /api/registration/:nftId` returns `{isRegistered, lastRegistration, integrity, debug}` including `debug.{H_parent,H_child,feeHeight,K}`; invalid nftId → 400.
- GREEN ✅
  - Implement route + controller fetching `H_parent` and `H_child`; call parser with provenance window; integrate 30s cache layer.
  - Implementation: Added comprehensive Phase 2 endpoint with provenance gating (`H_child == H_parent`), parser integration, and 30s TTL cache.
  - Integration: Uses `getLastTransferHeight`, `getLatestChildHeight`, `verifyPayment`, and `dedupeTxids` for complete validation pipeline.
  - Response structure: `{isRegistered, lastRegistration, integrity, debug}` with debug fields `{H_parent, H_child, feeHeight, K}`.
- REFACTOR ✅
  - Extract cache into utility; metrics hooks.
  - **Learning**: Provenance gating enforces owner consent by requiring `H_child == H_parent` before fee validation.
  - **Learning**: 30s cache improves performance while maintaining data freshness for registration status queries.

Micro-task C2: Cache freshness (30s) ✅ COMPLETED
- RED ✅
  - `server/src/__tests__/registration.cache.test.ts` with 8 comprehensive test cases covering cache behavior.
  - Two requests within 30s hit cache (observable via response timing and identity); cache isolation per nftId; error handling.
- GREEN ✅
  - Implement simple in-memory cache keyed by nftId with 30s TTL; cache validation through observable behavior testing.
  - Implementation: Status cache with `Map<string, {data, expiresAtMs}>` structure provides per-inscription isolation.
- REFACTOR ✅
  - Swap to LRU later if needed.
  - **Learning**: Observable behavior tests (timing, response identity) more reliable than fetch mocking for cache validation.
  - **Learning**: Cache TTL validation requires consistent response structure and proper timing comparisons.

Track D — On-chain API library (Embers Core v1)
Files: `client/src/lib/embers-core/*` → minified child inscription; loader script used by parent

Micro-task D1: Public API surface exists and types are correct
- RED
  - `client/src/lib/embers-core/__tests__/apiSurface.test.ts`
  - Expect `EmbersCore.verifyPayment`, `EmbersCore.dedupe`, version metadata present.
- GREEN
  - Implement minimal index exporting server-parity functions; add `SEMVER` string.
- REFACTOR (planning)
  - Generate API docs from TSDoc; lock public API tests.

Micro-task D2: Build/minify with size budget
- RED
  - Build produces single file bundle; assert size ≤ 8KB min.gz (target); no external deps; tree-shakeable named exports.
- GREEN
  - Configure Vite/Rollup micro-bundle config; verify output.
- REFACTOR (planning)
  - Budget report; CI check for size regressions.

Micro-task D3: Loader snippet resolves latest child by parent ID
- RED
  - Loader fetch mocked `/r/children/{LIB_PARENT_ID}` and injects latest; tests assert it appends a script tag once and calls init.
- GREEN
  - Implement `loadEmbersCore({ parentId })` helper for parent HTML.
- REFACTOR (planning)
  - Add checksum verification for child script hash (Phase 3+).

Track E — Tooling & examples

Micro-task E1: `bitcoin-cli` OP_RETURN examples ✅ COMPLETED
- RED ✅
  - Lint/validate docs presence via docs test (markdown check); ensure example includes inscription ID and expiry.
  - Test: `server/src/__tests__/docs.e1.examples.test.ts` (5 test cases verifying doc structure and content)
- GREEN ✅
  - Provide canonical commands in `docs/testing/opreturn-bitcoin-cli-examples.md` with placeholders; include troubleshooting.
  - Documentation includes: regtest/signet/testnet/mainnet examples, hex encoding, PSBT workflow, validation commands
- REFACTOR (planning) ✅
  - Add PSBT examples with annotate steps (included in GREEN phase)
  - Future enhancements documented in scratchpad: script automation, RBF examples, cross-platform commands

Micro-task E2: Wallet troubleshooting guide
- RED
  - Docs test asserts required sections present (supported wallets, alternatives, raw builder flow).
- GREEN
  - Author guide with clear steps and fallbacks.
- REFACTOR (planning)
  - Add screenshots later.

----

### Definition of Done (per micro-task)
- RED: New failing test(s) written and committed
- GREEN: Minimal implementation to pass tests; all existing tests green
- Commit message uses required format
- No linter/type errors; coverage ≥ 80% for new/changed files
- If REFACTOR is identified, add notes to README/scratchpad without code changes

### Suggested Execution Order
1) ✅ A0 → A1 → A2 → A3 → A4 → A6 (server) - COMPLETED
2) Port A1–A6 to client lib parity - DEFERRED to Track D
3) ✅ B1 → B2 → B3 (+ optional B0 if recursion supports) (template) - COMPLETED
4) ✅ C1 → C2 (backend API) - COMPLETED
5) D1 → D2 → D3 (on-chain library + loader) - IN PROGRESS
6) E1 → E2 (docs)

### Test Data & Fixtures
- Create synthetic raw tx hex fixtures for each output type (smallest possible)
- Provide OP_RETURN encoding helper for tests
- Add block height fixture provider

### CI Gates
- Run `test`, `lint`, and `type-check` for both client and server
- Enforce coverage threshold files by path: `registration/parser/**`, `lib/embers-core/**`
- Add bundle size check for Embers Core child script

