### Phase 2: Enhanced Validation

Version: 1.0 • Owner: Core Eng • Duration: ~1 week

Purpose: Harden registration validation. Introduce OP_RETURN-based binding of payments to a specific NFT, richer parser, and chain integrity checks.

----

### Scope
- Require registration fee payments to include OP_RETURN with NFT inscription ID and expiry
- Parser v1.0: hex parsing, outputs, OP_RETURN extraction, basic address decoding, optional buyer BIP-322 verification
- Deduplicate registrations by txid
- Server mirrors logic for status API
 - Artwork handling: DEFAULT remains embedded image in parent; ALT continue to support a single full-image child; atlas/tiling deferred to Phase 3
  - Introduce on-chain API library inscriptions ("Embers Core v1") to keep parent HTML minimal by offloading parsing/validation logic
  - Satpoint-based last-transfer gating: only accept receipts whose fee tx block height is ≥ parent’s last transfer height (derived from current satpoint)

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
  - [ ] Fetch children, load their JSON, call parser, cache results for 30s
  - [ ] Return `{isRegistered, lastRegistration, integrity, debug}`

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

- Satpoint gating (new)
  - [ ] Server: fetch parent inscription metadata to derive `lastTransferHeight` (via current satpoint → tx → block height) with 30s cache; fail-closed on error
  - [ ] Parser orchestration: accept `minBlock` in options and reject receipts whose fee tx block < `minBlock`
  - [ ] Status API: include `debug.lastTransferHeight` and enforce gating in `isRegistered`
  - [ ] Template (optional best-effort): when recursive endpoints expose satpoint and tx height, gate activation client-side; otherwise fail closed and defer to server

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

Track A — Parser Library v1.0 (server-first parity, then client bundle)
Micro-task A0 (new): Last-transfer height derivation (server utility)
- RED
  - Add `server/src/services/registration/parser/__tests__/lastTransfer.test.ts`
  - Cases: missing meta → null; meta with `satpoint` → extracts `txid` and fetches tx height; unconfirmed tx → returns null; caches for 30s.
- GREEN
  - `async function getLastTransferHeight(inscriptionId: string, deps: { fetchMeta: (id:string)=>Promise<any>, fetchTx:(txid:string)=>Promise<any>, nowMs?:()=>number }): Promise<number|null>`
  - Implement simple in-memory cache keyed by inscriptionId with TTL
- REFACTOR (planning)
  - Normalize meta field names (`satpoint` vs `location`), centralize cache

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
  - Cases: missing OP_RETURN → returns 0n; mismatched nftId → 0n; expired → 0n; below `minBlock` (receipt older than last transfer) → 0n; valid → returns bigint ≥ minFee; sums across multiple matching outputs.
- GREEN
  - `function verifyPayment(txhexOrId: string, creatorAddr: string, minFee: bigint, nftId: string, opts: { currentBlock: number; network: 'regtest'|'testnet'|'mainnet'; minBlock?: number; fetchTx?: (txid: string) => Promise<string> }): Promise<bigint>`
  - Enforce `opts.minBlock` when provided; accept txid by fetching raw hex via `opts.fetchTx`.
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

Micro-task A5 (Optional): BIP-322 buyer signature verify
- RED
  - `server/src/services/registration/parser/__tests__/buyerSig.test.ts`
  - Valid signature returns true; invalid returns false; unsupported pubkey format throws.
- GREEN
  - `function verifyBuyerSig(message: string, signature: string, pubkey: string, network: 'regtest'|'testnet'|'mainnet'): boolean`
  - Minimal third-party-free verification or thin wrapper with fallback stub under feature flag.
- REFACTOR (planning)
  - Replace stub with full implementation or well-maintained lib, measured size impact for client bundle.

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

Track B — NFT Template updates (registration wrapper flows)
Files: `client/src/templates/inscription/registrationWrapper.html` + test harness

Micro-task B1: Parser-verified flow returns 0 sats on OP_RETURN missing/mismatch/expired
- RED
  - `client/src/templates/inscription/__tests__/registrationWrapper.test.ts`
  - Simulate calling `EmbersCore.verifyPayment` via injected mock; assert UI displays 0 sats and "Not Registered".
- GREEN
  - Wire wrapper to call `EmbersCore.verifyPayment`; render result; guard against undefined.
- REFACTOR (planning)
  - Extract minimal DOM helpers; document env hooks in template header.

Micro-task B2: Deduplicate by `feeTxid`
- RED
  - Add test to ensure only latest unique tx is used in status summary.
- GREEN
  - Use `dedupeTxids` before summarizing.
- REFACTOR (planning)
  - Surface lastRegistration in a consistent JSON shape.

Micro-task B3: Developer debug flag
Micro-task B0 (new, optional): Recursive satpoint gating best-effort
- RED
  - `client/src/templates/inscription/__tests__/registrationWrapper.satpoint.test.ts`
  - When `/r/inscription/{id}` exposes `satpoint` and `/r/tx/{txid}` exposes `block_height`, wrapper gates activation requiring receipt.block ≥ lastTransferHeight. When endpoints missing, wrapper fails closed.
- GREEN
  - Implement `getLastTransferHeight` in template with timeouts; integrate into activation logic guarded by feature flag
- REFACTOR (planning)
  - Document ord minimum version for this optional path
- RED
  - When `DEBUG=1`, wrapper exposes `window.__debug` with last inputs/outputs; test presence gated by flag.
- GREEN
  - Implement gated attach; ensure removed when flag is false.
- REFACTOR (planning)
  - Document debug keys, avoid PII.

Track C — Backend Status API
Files: `server/src/routes/registration.ts`, controller + service integration

Micro-task C1: Endpoint contract
- RED
  - `server/src/__tests__/registration.status.test.ts` with supertest
  - `GET /api/registration/:nftId` returns `{isRegistered, lastRegistration, integrity, debug}` including `debug.lastTransferHeight`; invalid nftId → 400.
- GREEN
  - Implement route + controller calling `getLastTransferHeight` and parser (with `minBlock`); integrate 30s cache layer.
- REFACTOR (planning)
  - Extract cache into utility; metrics hooks.

Micro-task C2: Cache freshness (30s)
- RED
  - Two requests within 30s hit cache (assert underlying fetch not called twice); after 30s, re-fetch.
- GREEN
  - Implement simple in-memory cache keyed by nftId.
- REFACTOR (planning)
  - Swap to LRU later if needed.

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

Micro-task E1: `bitcoin-cli` OP_RETURN examples
- RED
  - Lint/validate docs presence via docs test (markdown check); ensure example includes inscription ID and expiry.
- GREEN
  - Provide canonical commands in `docs/` with placeholders; include troubleshooting.
- REFACTOR (planning)
  - Add PSBT examples with annotate steps.

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
1) A0 → A1 → A2 → A3 → A4 → (A5 optional) → A6 (server)
2) Port A1–A6 to client lib parity
3) B1 → B2 → B3 (+ optional B0 if recursion supports) (template)
4) C1 → C2 (backend API)
5) D1 → D2 → D3 (on-chain library + loader)
6) E1 → E2 (docs)

### Test Data & Fixtures
- Create synthetic raw tx hex fixtures for each output type (smallest possible)
- Provide OP_RETURN encoding helper for tests
- Add block height fixture provider

### CI Gates
- Run `test`, `lint`, and `type-check` for both client and server
- Enforce coverage threshold files by path: `registration/parser/**`, `lib/embers-core/**`
- Add bundle size check for Embers Core child script

