### Phase 2 Refactors (Pre-Core)

This document consolidates refactoring items identified during Phase 2 implementation (Tracks A–C) and organizes them into small, verifiable tasks with clear success criteria. All work should occur on branch `pre_core_refactors`.

**Progress**: 6/7 themes completed ✅ (B2 ✅, B3 ✅, C1 ✅, C2 ✅, D2 ✅, D3 ✅, D1 pending)

#### Scope
- Focus: Hardening, structure, and consistency improvements discovered after completing Tracks A (Parser), B (Template), and C (Backend Status API).
- Out of scope: New features and functional changes to core verification logic unless required by refactors below.

#### Goals
- Improve consistency of data shapes and API boundaries across client/server.
- Centralize caching, configuration, and error handling.
- Strengthen debug/diagnostic ergonomics while preserving privacy by default.
- Keep changes incremental with TDD (RED/GREEN/REFACTOR) for any code-level work.

---

### Refactor Themes and Tasks

#### B2 — Template Deduplication and Result Shape ✅
- Problem: `lastRegistration` JSON shape is inconsistent; template returns the first unique registration rather than a standardized object. Deduplication is correct but downstream consumption is brittle.
- Tasks:
  - [x] Standardize a `{ feeTxid, amount, schema, ... }` result shape for last registration objects in both client and server.
  - [x] Update template code to rely on the standardized shape instead of ad-hoc fields.
  - [x] Ensure `EmbersCore.dedupe` integration remains order-preserving and fails closed.
- Success criteria:
  - ✅ Single source of truth type definition is referenced in template and server.
  - ✅ Existing behavior is preserved; tests cover the standardized shape and dedupe order.

#### B3 — Debug Instrumentation and PII Safety ✅
- Problem: Debug diagnostics are helpful but need consistent keys, strict PII filtering, and safe serialization for complex values (e.g., BigInt).
- Tasks:
  - [x] Normalize debug keys to `{ lastInputs, lastOutputs, timestamp, provenance? }`.
  - [x] Enforce recursive PII filtering for `buyer_email`, `buyer_name`, and variants on both inputs and outputs.
  - [x] Convert BigInt values to strings for JSON safety.
  - [x] Attach debug object only when `DEBUG=1|true`; remove otherwise.
  - [x] Ensure debug capture occurs after async operations complete.
- Success criteria:
  - ✅ Deterministic debug payload with sanitized fields; no PII leaks in tests.
  - ✅ Opt-in behavior verified; off by default.

#### C1 — Backend Status API Hardening ✅
- Problem: Cache, metrics, and error handling are in-route and not standardized. Configuration is scattered.
- Tasks:
  - [x] Extract in-route cache to a shared utility/module for reuse.
  - [x] Add structured error responses and centralized error handling for the route.
  - [x] Introduce lightweight metrics hooks (request timing, cache hit ratio).
  - [x] Centralize configuration (timeouts, TTL, endpoints) in a single config module.
  - [x] Abstract ord endpoint calls into a service layer for easier testing/mocking.
- Success criteria:
  - ✅ Route imports cache, config, metrics, and service abstractions instead of inlining.
  - ✅ Existing endpoint contract and cache behavior remain unchanged (all tests pass).

#### C2 — Centralized Cache Service ✅
- Problem: Cache is local to the status route; needs a reusable, observable implementation.
- Tasks:
  - [x] Implement a `CacheService` with TTL, basic LRU, and metrics counters.
  - [x] Make TTL configurable per cache type (status, metadata, etc.).
  - [x] Add observable behavior tests validating TTL expiry and isolation.
  - [ ] Provide optional cache warming hooks for frequently accessed IDs (deferred if out of scope).
- Success criteria:
  - ✅ Existing status cache tests pass using the new service.
  - ✅ Additional tests cover multiple TTLs and isolation between keys.

---

### D — EmbersCore v1 and Loader Follow-ups (from D1–D3 Notes)

The items below are prioritized code tasks for the Executor. Documentation/process tasks extracted from the same notes have been queued separately in `.cursor/scratchpad.md`.

#### D1 — Public API Surface Hardening (Code)
- Tasks:
  - [ ] Add signature snapshot tests for public exports to detect breaking changes without widening the surface
    - Targets: `verifyPayment`, `dedupe`, `SEMVER`, and exported option/result types
  - [ ] Introduce a branded `Network` string type and propagate it through public function signatures
  - [ ] Export input/option/result shapes as named TypeScript interfaces for clarity and IDE discoverability
  - [ ] Add a JSON-schema based contract test that validates the runtime public API shape (name, arity, option keys)
  - [ ] Implement `SEMVER` auto-read from `package.json` during build and ensure it is exported at runtime
  - [ ] Establish server/client parity tests using shared fixtures to guarantee identical results
- Success criteria:
  - ✅ A failing snapshot test is produced by intentional signature drift and passes when reverted
  - ✅ Type checker enforces `Network` usage across public entry points
  - ✅ Public option/result types are named and imported in tests without `any`
  - ✅ Contract test validates API shape; build exports `SEMVER` from `package.json`
  - ✅ Parity tests run the same fixtures against server and client and assert identical outputs

#### D2 — Build Configuration, Size Budget, and CI (Code) ✅
- Tasks:
  - [x] Add `postbuild:embers-core` script that reports gzipped size and exits non-zero over 8KB
  - [x] Add size budget manifest `embers-core.size-budget.json` with thresholds; enforce in CI
  - [x] Add CI workflow to run build + size checks on every PR and fail on regression
  - [x] Add `analyze:embers-core` script using `rollup-plugin-visualizer` to emit an artifact (e.g., `stats.html`)
  - [x] Inject build metadata (version, timestamp, git hash) into the bundle and expose via a stable export
  - [x] Add browser-like integration tests that load the built IIFE via a simulated `<script>` in jsdom/happy-dom
  - [x] Verify the bundle works in an inscription-like environment (no network; restricted globals)
- Success criteria:
  - ✅ Local `npm run build` prints gzipped size and enforces ≤ 8KB
  - ✅ CI fails when size exceeds budget and passes otherwise
  - ✅ Visualizer artifact is generated and attached to CI run
  - ✅ An exported `buildInfo` object contains `{ version, timestamp, gitHash }` and is covered by tests
  - ✅ Integration tests import and execute the built IIFE without throwing

#### D3 — Loader Snippet Resilience and Safety (Code) ✅
- Tasks:
  - [x] Optional checksum verification using `SubtleCrypto` when `expectedHash` is provided; reject mismatches
  - [x] Local caching of loaded scripts keyed by `{ parentId, height }` with invalidation strategy
  - [x] Exponential backoff retry with a bounded number of attempts and jitter
  - [x] Fallback to last known good cached version when latest fails
  - [x] Strict input validation for inscription IDs before fetching
  - [x] Batch and parallel fetching for children metadata with bounded concurrency
  - [x] Support loading a specific version by height or exact ID, in addition to "latest"
- Success criteria:
  - ✅ Unit tests verify hash pass/fail paths using deterministic fixtures
  - ✅ Cache hit/miss behavior verified with fake timers; invalidation rules covered
  - ✅ Retry/backoff attempts verified with fake timers; no unbounded loops
  - ✅ Fallback path returns cached content when latest retrieval fails
  - ✅ Invalid IDs are rejected early with a typed error; valid IDs proceed
  - ✅ Parallelization improves latency without exceeding concurrency limits in tests
  - ✅ API supports `load({ target: 'latest' | { id } | { height } })` and is covered by tests

---

### Guardrails
- Maintain fail-closed behavior throughout templates and APIs.
- Do not widen public surfaces without tests locking behavior.
- Keep files under 500 lines; prefer small modules and pure functions.

### TDD Notes (Executor)
- For each code refactor: 
  - RED: add focused failing tests that pin current/desired behavior.
  - GREEN: minimal changes to pass tests without feature creep.
  - REFACTOR: doc/process updates only; no logic changes.

### Tracking
- Source of these refactors: `.cursor/scratchpad.md` (REFACTOR notes for B2, B3, C1, C2).
- Branch: `pre_core_refactors`.


