### Registered Ordinals Security Threat Model and Mitigations

Version: 1.0 • Owner: Core Eng + PM • Living Document

Purpose: Centralize the security posture for the Registered Ordinals project across Phase 2 (Enhanced Validation), Phase 3 (Developer Tools), and Phase 4 (Production Launch). For each attack scenario, this document explains how an attacker could attempt it, which features mitigate it in each phase, and any residual risks or known gaps to track.

References:
- Phase 2: `docs/reg-phases/phase-2-enhanced-validation.md`
- Phase 3: `docs/reg-phases/phase-3-developer-tools.md`
- Phase 4: `docs/reg-phases/phase-4-production-launch.md`

----

### Threat Model Summary

- Assets protected:
  - Registration integrity: only registrations authorized by the current parent owner should be considered valid.
  - Economic binding: creator must receive the required fee; prices must not be bypassed or redirected.
  - On-chain template behavior: parents auto-brick unless requirements are met; library upgrades must not break parents.
  - Operational reliability: status API correctness, availability, and freshness under load.
  - Developer/creator ecosystem safety: wallets, PSBT flows, and docs that don’t enable foot-guns.

- High-level design pillars used in mitigations:
  - Provenance receipts (child reveal spends the parent; owner consent on-chain).
  - OP_RETURN contracts binding fee to an inscription ID and expiry (Phase 2), later expanded to sale commitments (Phase 3).
  - Block-height gating: `H_child == H_parent` and fee confirmation window `(H_child - fee.height) ≤ K`.
  - Parser hardening: defensive parsing, output decoding, and exact matching to the creator address.
  - Economic commitments (Phase 3): buyer-locked marker, pay-to-contract payouts, and recomputation checks.
  - Operational controls (Phase 4): caching, rate limiting, tracing, multi-provider fallbacks, and circuit breakers.

----

### A1 — Unauthorized Registration Without Owner Consent

Attack scenario
- Attacker crafts a JSON “receipt” child that claims a registration, without the parent owner’s consent.
- They try to get the status API or parent template to treat the NFT as Registered.

Mitigations
- Phase 2
  - Provenance receipts: the valid receipt is a provenance child whose reveal spends the parent (tag 3). This enforces on-chain owner consent.
  - Provenance gating: enforce `H_child == H_parent` (latest child genesis height equals current parent satpoint height). If the parent moved, old receipts no longer count.
- Phase 3
  - Keep provenance enforcement and add receipt canonical fields; SDK and on-chain library verify presence and shape.
- Phase 4
  - Observability alerts when provenance or height checks fail at unusual rates (potential abuse or index failure).

Residual risk / notes
- If recursion endpoints are temporarily unavailable for client-side parity, server remains the source of truth and fails closed.

----

### A2 — Paying Without Required OP_RETURN

Attack scenario
- Attacker sends sats to the creator address but omits the required OP_RETURN (or includes a mismatched inscription ID or expired value) to claim status illegitimately.

Mitigations
- Phase 2
  - Parser validates fee OP_RETURN format and exact match to `nftId` and an unexpired `expiry_block`. Missing or mismatched ⇒ 0 sats credited.
  - `verifyPayment` returns 0 when OP_RETURN is absent/invalid/expired.
- Phase 3
  - OP_RETURN moves from simple `(nftId|expiry)` to full sale tuple recommitments; mismatch ⇒ rejection.
- Phase 4
  - Operational dashboards track rejection categories; documentation instructs creators and wallets on canonical OP_RETURN usage.

Residual risk / notes
- Wallets that cannot add OP_RETURN must use documented raw/PSBT flows; otherwise registrations will not be recognized.

----

### A3 — Replay/Reuse of Old Fee Transactions

Attack scenario
- Attacker re-broadcasts or references an old fee tx to regain Registered status after conditions changed (e.g., parent transferred or fee expired).

Mitigations
- Phase 2
  - Expiry in OP_RETURN enforces time-bounded validity.
  - Height gating enforces `fee.height ≤ H_child` and `(H_child - fee.height) ≤ K` when using two-tx flows.
  - Dedupe by `feeTxid` ensures repeated references don’t double count.
- Phase 3
  - Recommitments tie fee to the specific sale tuple; replay on another sale/inscription fails.
- Phase 4
  - Cache TTL (30–60s) with “last updated” metadata avoids long-lived stale status; invalidation hooks for popular NFTs.

Residual risk / notes
- Deep chain reorgs could temporarily surface stale states; height equality checks and caching windows minimize exposure and self-correct.

----

### A4 — Hidden or Misdirected Payouts to Seller (Price Bypass)

Attack scenario
- Seller colludes with a buyer to route funds in ways that bypass the intended sale price or creator fee, while still appearing valid.

Mitigations
- Phase 2
  - Minimal: only creator fee is enforced by summing outputs to the exact creator address; hidden seller payouts are not economically bound yet.
- Phase 3
  - Economic enforcement via pay-to-contract for seller payouts derived from sale commitments; parser recomputes to ensure outputs match the committed tuple.
  - Fee tx must spend the buyer-locked marker from the sale tx; linkage prevents arbitrary replacement.
- Phase 4
  - SDK and CLI generators default to the safe pattern; documentation flags deviations.

Details (Phase 3 tuple and worked example)
- Tuple definition
  - We commit to an ordered set of fields: `T = (parent_digest, sale_amount_sats, buyer_pubkey, sale_nonce)`.
  - The sale transaction commits T twice:
    - In OP_RETURN (explicit tuple fields).
    - In the 1-sat buyer‑locked marker output’s script path, which also commits T.
  - Seller payout outputs in the sale transaction are derived via pay‑to‑contract from T. A validator recomputes these payouts from T and rejects if amounts/addresses don’t match the committed price.
  - The fee transaction MUST spend the exact marker outpoint from the sale transaction that committed T, and must pay the creator ≥ `feePolicy(sale_amount_sats)`. It may optionally re‑commit T in its own OP_RETURN.

- Worked example (blocks the “cheap duplicate OP_RETURN” trick)
  - Scenario: Alice sells Bob an ordinal for 0.1 BTC. Alice also creates another 0.0001 BTC transaction and tries to reuse the “same OP_RETURN.” Bob attempts to register using the cheap 0.0001 BTC tx.
  - Case 1: The 0.0001 BTC tx claims the SAME tuple T with `sale_amount_sats = 0.1 BTC`.
    - Recompute check fails: seller payout outputs derived from T will not match a 0.0001 BTC sale. Validator rejects the sale tx as inconsistent with T.
  - Case 2: The 0.0001 BTC tx uses a DIFFERENT tuple `T'` with `sale_amount_sats = 0.0001 BTC`.
    - Marker linkage fails: the fee tx that Bob uses would spend the marker from the 0.0001 BTC sale (T'), not from the 0.1 BTC sale (T). The required link “fee spends marker of the sale that committed T” is broken.
    - Fee sufficiency fails: creator payment is checked against `feePolicy(sale_amount_sats)` from the true sale. Using T' yields an insufficient fee for a 0.1 BTC sale and is rejected.
  - Conclusion: Copying OP_RETURN text is insufficient. The validator requires (a) seller‑payout recomputation from T, and (b) that the fee tx spends the exact marker from the sale that committed T. Both conditions must hold, so the cheat cannot register the ordinal with the cheaper transaction.

Residual risk / notes
- Before Phase 3 is adopted, hidden seller payouts are not strictly constrained by the system beyond creator-fee enforcement.

----

### A5 — Fee/Sale Race Conditions and Marker Sniping

Attack scenario
- Third party attempts to race the buyer by spending the intended marker or broadcasting conflicting transactions, causing the buyer’s fee to be invalid or misapplied.

Mitigations
- Phase 2
  - Not applicable; marker pattern introduced in Phase 3.
  - Race surface reduced by provenance gating and narrow fee window K.
- Phase 3
  - Marketplace-gated marker path (Option 2a): sale includes a 1-sat marker locked to `marketplace_pubkey`; only the marketplace can authorize the fee spend. Buyer binding is enforced at fee time via OP_RETURN recommitting `(parent_digest, sale_amount_sats, buyer_pubkey, sale_nonce, expiry)`.
  - Buyer-locked marker (private sales): marker locked to `buyer_pubkey`; only the intended buyer can spend it for registration.
  - Structural parser checks: fee MUST spend the sale’s marker outpoint and include a valid recommit with `buyer_pubkey`; otherwise registration is impossible for anyone.
  - Optional short expiry and CPFP packaging reduce race window; private PSBT reveal limits leakage.
- Phase 4
  - E2E tests and load checks for race robustness; operational alerts for marker-spend failures.

Residual risk / notes
- Wallet compatibility: if buyer cannot sign P2TR key-path, fallback hash-locked variants are weaker; prefer the key-locked marker. Sale sniping (broadcasting the sale leg) cannot be fully prevented in Option 2a; however, registration sniping is blocked by marketplace-gated marker + buyer recommit.

----

### A17 — Marketplace Non-Cooperation or Misconstructed Fee

Attack scenario
- A marketplace lists an NFT but fails to build the fee transaction correctly (omits buyer binding or fee policy) or refuses to build any fee transaction, attempting to still deliver a “Registered” status.

Mitigations
- Phase 3
  - Structural enforcement: parser only accepts registration when the fee tx spends the sale’s specific marker outpoint and includes an OP_RETURN recommitting `(parent_digest, sale_amount_sats, buyer_pubkey, sale_nonce, expiry)`; creator sum ≥ policy; window K.
  - Marketplace-gated marker: since only the marketplace can spend the marker, no third party can substitute a fee; without the marketplace’s correctly structured fee, registration is impossible for anyone.
  - Seller payout binding: pay-to-contract ties sale outputs to the committed tuple; sale tuple cannot be altered post-signature without invalidating the seller’s signature.
- Phase 4
  - SDK/CLI templates generate canonical fee structures; monitoring of “fee-omitted” rates per marketplace; partner documentation and reputational incentives.

Residual risk / notes
- If a marketplace chooses not to cooperate, buyers receive an unregistered ordinal by design. This incentivizes marketplaces to complete the fee properly to deliver “Registered” status.

----

### Sales Modes and Validation Paths (Marketplace vs Private)

- Mode detection (prefer explicit tuples over SIGHASH inference):
  - Marketplace mode: sale OP_RETURN includes `marketplace_pubkey` → require marketplace-gated marker; fee must spend marker and recommit with `buyer_pubkey`.
  - Private two-tx mode: sale OP_RETURN includes `buyer_pubkey` and the sale creates a buyer-locked marker → require buyer to spend marker in fee; recommit; enforce policy/K.
  - Private single-tx mode (optional): sale tx directly pays creator ≥ policy and includes OP_RETURN tuple with `buyer_pubkey` → accept without a separate fee tx.
- Notes on SIGHASH:
  - Do not gate behavior on SIGHASH. It can be observed in witnesses but should be advisory only. Private sellers should prefer SIGHASH_ALL to avoid sale sniping; marketplace listings commonly use SIGHASH_SINGLE|ANYONECANPAY.

----

### A6 — Buyer Identity Spoofing (Attribution)

Attack scenario
- Attacker claims buyer attribution for social or marketplace benefits without actually being the buyer.

Mitigations
- Phase 2
  - Buyer BIP-322 signature is optional and not enforced.
- Phase 3
  - Introduce `buyer_pubkey` in sale commitments and verify optional BIP-322 signatures; receipt can include buyer attribution.
- Phase 4
  - SDK and API expose consistent buyer attribution fields; docs clarify optional/required states.

Residual risk / notes
- Attribution remains optional unless policy requires it; do not tie security-critical checks solely to buyer identity.

----

### A7 — Inscription ID Mismatch and Canonicalization Traps

Attack scenario
- Attacker exploits string case/format differences of inscription IDs (e.g., uppercase/lowercase) to bypass exact-match validation.

Mitigations
- Phase 2
  - Exact matching as implemented; recommend lowercasing IDs in OP_RETURN and docs to avoid ambiguity.
- Phase 3
  - Use `parent_digest = sha256(lowercase inscriptionId)` in commitments to avoid representation pitfalls.
- Phase 4
  - Docs and SDK enforce canonicalization; validators reject non-canonical representations.

Residual risk / notes
- Ensure any legacy paths are normalized before comparison.

----

### A8 — Parser Crashes, Malformed Inputs, and Resource Exhaustion

Attack scenario
- Attacker supplies extremely large, malformed, or adversarially crafted tx hex or JSON to crash the parser or cause timeouts (DoS).

Mitigations
- Phase 2
  - Defensive parsing and bounds checks; `withTimeout` utility for async calls; typed errors surfaced and fail closed.
  - Minimal output decoding for P2PKH/P2WPKH/P2TR only; unknown types ignored safely.
- Phase 3
  - On-chain library parity keeps the same constraints; SDK timeouts and retries.
- Phase 4
  - Rate limiting, bot filters, and circuit breakers. Memoization of popular results to avoid repeated heavy work.

Residual risk / notes
- Maintain small, auditable parser surface; keep libraries self-contained and size-bounded.

----

### A9 — Stale or Incorrect Index Data (Ord/Bitcoin Node Issues)

Attack scenario
- Inconsistent or lagging index causes `H_parent`/`H_child` or fee heights to be wrong, leading to false registrations or rejections.

Mitigations
- Phase 2
  - Fail closed when heights cannot be confirmed; cache with short TTL; expose debug fields for observability.
- Phase 3
  - SDK retries with backoff; multi-endpoint reads where feasible.
- Phase 4
  - Multi-provider abstraction with health checks; circuit breakers and error budgets; public status page.

Residual risk / notes
- Short-term inconsistencies may occur during network turbulence; surfaced via "last updated" and debug info.

----

### A10 — Cross-Network Replay or Misconfiguration

Attack scenario
- Transactions or IDs from a different network (regtest/signet/testnet) are injected into mainnet flows or vice versa.

Mitigations
- Phase 2
  - Network parameter is required for output decoding and address validation; mismatches return 0 or errors.
- Phase 3
  - Commitments include digest of the correct parent; SDK enforces network in its API.
- Phase 4
  - Deployment config hardens network selection; CI runs per-network tests.

Residual risk / notes
- Avoid environment leaks in client templates; document network explicitly in dev flows.

----

### A11 — Library Supply Chain or Tampering (On-chain API Scripts)

Attack scenario
- Attacker attempts to trick the parent into loading a malicious library child or change expected logic after publication.

Mitigations
- Phase 2
  - Core library v1 plan: stable parent ID for the library; parents import via that parent and use latest child.
- Phase 3
  - Documented semver; optional checksum verification of the fetched child script planned.
- Phase 4
  - Governance doc for publishing new child versions; change logs; optional checksum verification recommended.

Residual risk / notes
- Until checksums are enforced, trust relies on stable parent ID governance; keep library minimal and audited.

----

### A12 — API Abuse and Scraping

Attack scenario
- Excessive requests attempt to degrade service, scrape internal debug info, or force cache misses to increase load.

Mitigations
- Phase 2
  - Minimal defenses: timeouts, small caches, and fail-closed logic.
- Phase 3
  - Pagination and caching for status endpoints; optional API keys for partners.
- Phase 4
  - Rate limiting, bot filters, and WAF/CDN controls; redaction of logs; SLOs and error budgets.

Residual risk / notes
- Public endpoints should avoid sensitive data in debug responses; keep debug gated and scrubbed.

----

### A13 — Front-end Template Injection/XSS (Creator Modifications)

Attack scenario
- Malicious or careless template modifications introduce XSS vectors or unsafe script loading in parent inscriptions.

Mitigations
- Phase 2
  - Keep parent HTML minimal (< 5 KB), avoid dynamic eval, and fetch only known on-chain libraries.
- Phase 3
  - Template generator produces safe defaults (no inline event handlers, strict loaders); docs stress CSP where feasible.
- Phase 4
  - Security review of templates and loaders; documentation for safe hosting of any off-chain previews.

Residual risk / notes
- On-chain HTML cannot use standard CSP headers; prefer minimal, fixed logic and on-chain libraries only.

----

### A14 — Data Integrity Drift Between Client and Server Parsers

Attack scenario
- Divergent parsing results between client template and server API lead to inconsistent registration status.

Mitigations
- Phase 2
  - Server is source of truth; client parity optional until recursion endpoints provide required data.
- Phase 3
  - Shared API surface (Embers Core v2) and parity tests; SDK centralizes logic.
- Phase 4
  - Contract tests in CI to prevent drift; dashboards monitor discrepancy rates.

Residual risk / notes
- When client feature flags are on, ensure timeouts and fail-closed behavior.

----

### A15 — Logging and PII Exposure

Attack scenario
- Sensitive information is logged (wallet addresses beyond necessity, IPs without reason), creating privacy or compliance risk.

Mitigations
- Phase 2
  - Limit logs to operational errors; avoid payload dumps.
- Phase 3
  - Structured logs; redaction helpers; clear log levels; OpenAPI docs avoid PII.
- Phase 4
  - Log redaction reviews; data retention policies; privacy-friendly defaults.

Residual risk / notes
- Keep debug info behind explicit flags; never include secrets in logs.

----

### A16 — Atlas/Tiling Reconstitution and Content Leakage

Attack scenario
- For split/tiling strategies, attackers attempt to reconstruct full images from shared assets without registration.

Mitigations
- Phase 2
  - Not applicable; atlas deferred.
- Phase 3
  - Atlas pipelines add friction (not strong cryptography); registered-only composition in templates.
- Phase 4
  - Hosting guidance and manifest handling to avoid unauthenticated aggregation endpoints.

Residual risk / notes
- This is friction, not encryption; do not claim strong secrecy.

----

### Operational Controls (Phase 4)

- Caching and freshness
  - 30–60s TTL; cache hit ratio dashboards; “last updated” surfaced in API responses and UI.
- Resiliency
  - Multi-provider ord/bitcoin indexers with health checks; circuit breakers; exponential backoff.
- Security hygiene
  - Rate limiting, bot filters, WAF/CDN; secrets management; least-privilege configs.
- Observability
  - Tracing, structured logs with redaction, error budgets, and incident response runbooks.

----

### Known Gaps and Follow-ups

- Economic enforcement prior to Phase 3
  - Hidden or non-committed seller payouts aren’t fully constrained in Phase 2. Track adoption of Phase 3 sale/fee template.
- Buyer attribution policy
  - BIP-322 remains optional; define policies where attribution is required and ensure SDK/API alignment.
- Library checksum verification
  - Add checksum validation for child scripts loaded via stable parent; document in loader and CI.
- Client-side provenance gating
  - Optional parity relies on recursion endpoints for heights and satpoint; keep server as source of truth and document fail-closed behavior.
- Wallet compatibility for buyer-locked markers
  - Provide robust fallbacks and clearly mark weaker variants; prefer P2TR key-path when possible.
- Reorg handling playbooks
  - Define thresholds and UI messaging for transient mismatches due to reorgs; include auto-retry/backoff.
- API security hardening
  - Finalize API keys for partners, rate limits, and pagination; ensure OpenAPI accuracy.
- Template/XSS guidance
  - Expand docs on safe patterns, avoid inline handlers, and restrict external script usage.

----

### Change Log

- v1.0 (2025-08-15): Initial comprehensive security document covering Phases 2–4.


