## Phase 2 — Signet Core Embers: TDD Refactor Implementation Plan (NOW set)

This plan defines a focused, test-driven path to implement the NOW-prioritized refactors that increase the likelihood of a successful Signet test of core Embers functionality with minimal anti-forgery safeguards. Each item follows RED → GREEN → REFACTOR with explicit tests, success criteria, and risks.

### Conventions
- Write failing tests first. No implementation until RED is committed locally.
- Only commit on GREEN using: `feat: implement <behavior> to pass test`.
- Skip real-network tests on CI. Use existing describeSkipCI/test helpers if available.
- Keep functions small with TSDoc; files ≤ 500 LOC.
- Error messages must be actionable (what failed, why, and what to try next).

---

## 1) S5.2 — Deployment verification and rich logs

Harden deployment confidence by verifying inscription content post-deploy with checksum, size, and identifiers.

### RED
- Add unit tests for a small verification helper (Node module) invoked by the deploy script.
- Files:
  - `scripts/verifyDeployment.ts` (new)
  - `scripts/__tests__/verifyDeployment.test.ts` (new)
- Assertions:
  - Computes SHA-256 for fetched inscription content; logs `txid`, `inscriptionId`, `byteLength`, `checksum`.
  - Throws with message containing `checksum mismatch` on mismatch; process should exit non-zero when wired.
  - Accepts `--inscription <id>` or env; rejects missing/invalid input with guidance (examples/flags/env vars).
  - Retries transient HTTP errors up to N with capped backoff; logs retry attempts.

### GREEN
- Implement `verifyDeployment.ts` with:
  - Fetch by inscription URL/provider, checksum calculation, structured logs.
  - Pure function for logic; tiny CLI wrapper for the script to call in `deploy-embers-core.sh --verify`.
  - Return a result object for tests; throw Error to signal failure.

### REFACTOR (planning only)
- Emit a single JSON line for CI artifacts and timing metrics.

### Success criteria
- `--verify` fails fast on mismatch; success logs include ids and checksum. Tests cover success, mismatch, retry, and input validation.

### Risks/Mitigations
- Network flakiness → retries with capped backoff; CI skips if no network.

---

## 2) S5.3 — Loader: stronger error reporting + multi-source fallback

Improve runtime resilience by falling back from inscription to CDN to local bundle, with clear errors.

### RED
- Add client tests for loader behavior across failure chains and messages.
- Files:
  - `client/src/lib/loader/embersLoader.ts` (new or thin wrapper)
  - `client/src/__tests__/loader.fallback.test.ts` (new)
- Assertions:
  - On inscription fetch failure/timeout, loader falls back to CDN; if CDN fails, falls back to local bundle.
  - Error surfaces include network and failing URL, and hint to check ord sync or use fallback.
  - Success path does not attempt fallbacks and has minimal logs.

### GREEN
- Implement ordered source resolution with `AbortController` timeouts; produce typed error objects/messages.

### REFACTOR (planning only)
- Configurable source order and telemetry hooks.

### Success criteria
- Tests validate fallback ordering and actionable error content.

### Risks/Mitigations
- Timer flakiness → mock timers for deterministic tests.

---

## 3) S1.2 — Endpoint validation and per-endpoint timeouts

Fail fast on bad configuration; ensure network calls do not hang indefinitely.

### RED
- Add tests around endpoint validation and request-level timeouts.
- Files:
  - `server/src/config/validateEndpoints.ts` (new)
  - `server/src/__tests__/endpoints.validation.test.ts` (new)
- Assertions:
  - Invalid base URLs rejected with clear error before server starts (actionable guidance).
  - Network client applies per-endpoint timeout; stalled requests produce a timeout error kind/message.
  - Startup health probe is not executed in tests; validation is unit-tested in isolation.

### GREEN
- Implement `validateEndpoints(config)` using strict URL parsing.
- Wrap ord client calls with a tiny `withTimeout(signal, ms)` helper and use it where appropriate.

### REFACTOR (planning only)
- Centralize timeouts and health checks behind a small service.

### Success criteria
- Misconfigurations detected early with precise guidance; timeout behavior is enforced and test-covered.

### Risks/Mitigations
- Over-validation in CI → gate probes behind `CI=true`; validation remains pure.

---

## 4) S2.1 — Explicit network validation + clearer errors

Guard critical entry points with strict network validation to avoid ambiguous failures.

### RED
- Add tests to enforce network presence/support at core entry points.
- Files:
  - `server/src/services/registration/parser/verifyPayment.ts` (existing)
  - `server/src/__tests__/network.validation.test.ts` (new)
- Assertions:
  - Missing/unsupported network throws with message including expected vs provided.
  - Supported networks pass through unchanged; existing behavior intact.

### GREEN
- Add guard clauses with explicit messages; keep changes minimal and localized.

### REFACTOR (planning only)
- Centralize network constants in a small module for reuse.

### Success criteria
- Tests pass with precise error text; no behavior regressions for supported networks.

### Risks/Mitigations
- Duplicate validation → apply only at critical entry points to avoid noise.

---

## 5) S1.1 — Strong address validation for creator pay-to detection

Reject invalid destination addresses using full checksum validation per network.

### RED
- Add validation unit tests for addresses across script types and networks.
- Files:
  - `server/src/lib/validation/address.ts` (new)
  - `server/src/__tests__/address.validation.test.ts` (new)
- Assertions:
  - Invalid checksum addresses rejected with specific reason and network context.
  - Valid P2WPKH/P2TR/P2PKH accepted across regtest/signet/testnet/mainnet.

### GREEN
- Implement minimal validator using a proven library (e.g., bitcoinjs-lib) with strict network mapping.
- Integrate only at the point where creator payout address is verified in payment parsing.

### REFACTOR (planning only)
- Consider memoization for repeated address checks.

### Success criteria
- Tests verify correctness across address formats and networks.

### Risks/Mitigations
- Library differences → pin versions and test with fixtures.

---

## 6) S5.2 — Optional real ord CLI integration (feature flag)

Enable real inscription flow on Signet behind a safe feature flag while preserving mock/dry-run defaults.

### RED
- Add tests for environment/flag parsing and behavior branching without invoking ord.
- Files:
  - `scripts/deploy-helpers.ts` (new; isolates env parsing/branching)
  - `scripts/__tests__/deploy.integration.test.ts` (new)
- Assertions:
  - With `ORD_INTEGRATION=1` and ord unavailable, surface actionable error or auto-fallback based on config.
  - With flag disabled, existing behavior unchanged; no ord calls attempted.

### GREEN
- Implement feature flag check; isolate ord invocation into a thin wrapper callable by the bash script.

### REFACTOR (planning only)
- Add dry-run connectivity probe to ord when enabled.

### Success criteria
- Tests pass for both flagged and default paths; no regressions when flag is off.

### Risks/Mitigations
- Shell test brittleness → concentrate logic in Node helper with unit tests.

---

## 7) E1 — OP_RETURN size and validation notes (docs)

Improve operator guidance with explicit size limits and validation steps.

### RED
- Extend the existing docs and assert required content via tests.
- Files:
  - `docs/testing/opreturn-bitcoin-cli-examples.md` (existing)
  - `server/src/__tests__/docs.e1.examples.test.ts` (new or extend existing)
- Assertions:
  - Document mentions OP_RETURN size limits (80–83 bytes) and includes `validateaddress` usage.
  - Contains a minimal decode/verification snippet and links to parser rules.

### GREEN
- Update the doc minimally to satisfy the tests.

### REFACTOR (planning only)
- Add more network-specific examples later.

### Success criteria
- Tests pass; docs provide clear, principle-based validation guidance.

### Risks/Mitigations
- Wallet/CLI variation → keep examples canonical and minimal.

---

## Recommended Execution Order
1. Endpoint validation + timeouts (S1.2) — fail fast early.
2. Network validation (S2.1) — precise errors at critical entry points.
3. Strong address validation (S1.1) — reduce invalid payments.
4. Loader fallback + errors (S5.3) — runtime resilience.
5. Deployment verification + logs (S5.2) — post-deploy confidence.
6. Optional ord integration flag (S5.2) — enable real inscription testing safely.
7. E1 doc additions — operational clarity.

## Definition of Done
- All new tests pass locally; CI skips network-bound tests predictably.
- No linter/type errors; messages are actionable and consistent.
- Minimal code changes scoped to each item; no unrelated refactors.
- Commits follow TDD loop and naming convention.

## Rollback Strategy
- Use feature flags and environment toggles to isolate risky paths.
- Keep changes small and revertible per item.

## Commit Template
- RED: add failing tests only.
- GREEN: `feat: implement <behavior> to pass test`.
- REFACTOR: planning/README-only updates; no code changes.


