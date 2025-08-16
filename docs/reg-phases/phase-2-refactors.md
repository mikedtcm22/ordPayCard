### Phase 2 Refactors (Pre-Core)

This document consolidates refactoring items identified during Phase 2 implementation (Tracks A–C) and organizes them into small, verifiable tasks with clear success criteria. All work should occur on branch `pre_core_refactors`.

**Progress**: 3/4 themes completed ✅ (B2 ✅, B3 ✅, C1 ✅, C2 pending)

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

#### C2 — Centralized Cache Service
- Problem: Cache is local to the status route; needs a reusable, observable implementation.
- Tasks:
  - [ ] Implement a `CacheService` with TTL, basic LRU, and metrics counters.
  - [ ] Make TTL configurable per cache type (status, metadata, etc.).
  - [ ] Add observable behavior tests validating TTL expiry and isolation.
  - [ ] Provide optional cache warming hooks for frequently accessed IDs (deferred if out of scope).
- Success criteria:
  - Existing status cache tests pass using the new service.
  - Additional tests cover multiple TTLs and isolation between keys.

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


