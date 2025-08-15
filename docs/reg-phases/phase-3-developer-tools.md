### Phase 3: Developer Tools

Version: 1.0 • Owner: DevEx • Duration: ~2 weeks

Purpose: Reduce integration time for marketplaces and creators. Deliver SDK, status API, template generator, and registration UI flows.

----

### Scope
- JavaScript SDK for registration status queries and helpers
- Registration status API hardened and documented
- NFT template generator and registration wizard UI
- Example integrations and tests
 - Introduce atlas-based artwork composition (anti-reconstitution friction)
 - Expand on-chain API libraries: split concerns into `Embers Core v2` (validation/utilities), `Embers Atlas v1` (tile composition), and `Embers UI v1` (optional UI snippets)
 - Add cost-optimized strategies: background/foreground split and trait-based composition (shared assets reused across a collection)
 - Big Spender (DEFAULT from early phases): embedding the full image in parent (data URI) remains supported; Phase 3 adds alternatives that can reduce costs (trait, BG/FG, shares)

  - Economically enforced sale structure (auto-brick without it):
    - Sale tx (signed by seller) MUST include:
      - OP_RETURN commitment with fields: tag/version (e.g., `EMBR1`), `parent_digest` = sha256(lowercase parent inscriptionId), `sale_amount_sats` (u64), `buyer_pubkey` (x-only), `sale_nonce` (u64)
      - Marker output (1 sat) whose locking script is P2TR key-path to `buyer_pubkey` (buyer-locked marker) and whose script path commits the same tuple `(parent_digest, sale_amount_sats, buyer_pubkey, sale_nonce)`; marker is later spent by the fee tx. Buyer signature is required to spend it, preventing racer DoS.
      - Seller payout outputs derived via pay-to-contract (taproot tweak) from the commitment tuple to bind price to actual outputs (no hidden payouts)
    - Fee tx (by buyer) MUST:
      - Spend the exact buyer-locked marker outpoint from the sale tx (Ordinals wallet signs only this input via PSBT; payments wallet funds and signs its inputs)
      - Pay the creator address ≥ feePolicy(sale_amount_sats)
      - Optionally include a fee OP_RETURN re-committing `(parent_digest, sale_amount_sats, buyer_pubkey, sale_nonce)` plus `receipt_hash` and `expiry_block`
     - Receipt JSON (child, provenance):
      - Created as a provenance child (reveal spends the parent and includes tag 3). MUST include `fee_txid`, `expiry_block`, and canonical fields; buyer BIP-322 signature remains recommended for attribution but is not required for on-chain consent in provenance mode.
    - On-chain parser (Embers Core v2) verifies entirely on-chain:
      - Sale OP_RETURN fields; recomputes seller payout addresses via pay-to-contract; sums amounts to equal `sale_amount_sats`; rejects extraneous outputs
      - Marker presence, that it is buyer-locked to `buyer_pubkey`, and that the fee tx spends that exact marker; parser also verifies fee tx includes a buyer-signed input if required by policy
      - Fee tx pays creator ≥ policy and (if present) fee OP_RETURN recommit matches `receipt_hash`
      - Buyer BIP-322 signature validity; expiry window using `/r/blockheight`
     - Parent inscription auto-bricks unless a provenance child receipt passes all checks and `H_child == H_parent` with fee window satisfied

    - Split-wallet compatibility (e.g., Xverse payments vs ordinals wallets):
       - PSBT flow: payments wallet adds/Signs funding inputs and creator output; ordinals wallet signs only the buyer-locked marker input; finalize and broadcast. No buyer funds required.
       - Provenance integration: child reveal spends the parent in the same flow or immediately after (two-tx mode), ensuring `H_child == H_parent`. SDK provides single-reveal builder when supported, and two-tx fallback with fee window (K).
      - Fallbacks: if buyer wallet cannot sign P2TR key-path, tool offers (1) hash-locked marker variant; or (2) require a small buyer UTXO input (less preferred). CPFP packaging and short expiry further reduce race surface.

----

### Deliverables
- JS SDK (`@embers/bitreg-sdk`):
  - `getRegistrationStatus(inscriptionId)`
  - `createRegistrationPayload(params)`
  - `verifyPayment(txid, creatorAddr, minFee, nftId)` (client-safe wrapper)
- REST API docs (OpenAPI/Swagger)
- CLI: `bitreg init-template`, `bitreg create-registration`
- UI components: `RegistrationPrompt`, `StatusBadge`, `HowToRegister`
 - Sale/fee PSBT tooling:
   - CLI to generate seller-side sale PSBT with OP_RETURN + marker + pay-to-contract payouts
   - CLI to generate buyer-side fee PSBT that spends the buyer-locked marker and adds fee OP_RETURN (optional); supports split-wallet co-signing (payments + ordinals)
   - Canonical receipt generator that produces JSON + buyer BIP-322 signature
 - Atlas pipeline:
  - Creator tool to slice images into tiles (grid or quadtree) and generate manifest JSON
  - Default cost-aware strategies:
    - Two-share split (checkerboard halves or XOR shares) → 2 child inscriptions per artwork
    - Optional 3-part split (thirds) → 3 child inscriptions per artwork
    - Advanced N×N tiling (e.g., 3×3) available but not default due to cost
  - Background/foreground mode: single shared background inscription + per-artwork foreground
  - Trait mode: import traits as shared assets (e.g., 5 sets × 10 variants → ~50 inscriptions) and compose per-artwork
  - Script to inscribe shares/tiles/traits as separate children and produce parent HTML glue code
  - Parent template that composes shares/tiles/traits when Active; degraded/placeholder when Unregistered
 - Big Spender mode:
  - Parent embeds the full image as a data URI (no separate image child)
  - Template generator supports both embedded and recursive modes; shows estimated size and cost impact
  - Includes UX and performance warnings for very large parents
 - On-chain API libraries:
   - `Embers Core v2` (child of Core parent): full sale+fee verification (commitments, marker linkage, pay-to-contract payouts, buyer BIP-322), caching hints, helpers
   - `Embers Atlas v1`: functions to layout tiles from manifest, handle DPR/resize, lazy-load, and compose backgrounds + traits
   - `Embers UI v1`: optional helpers to render status badges and prompts
  - Size budgets: parent HTML ≤ 6 KB (atlas loader + minimal logic) for recursive modes; libraries handle heavy lifting
    - Exception: Big Spender (embedded) can exceed this; generator must display a prominent warning and require explicit confirmation

----

### Tasks

- SDK
  - [ ] Typed interfaces, error classes, retries, and timeout policies
  - [ ] Node + browser builds; tree-shaking
  - [ ] Examples with regtest/signet configs
  - [ ] Wallet helpers for Unisat and Xverse (connection, tx creation hints)
  - [ ] (Moved from Phase 2) BIP-322 buyer signature verification utility:
    - API: `verifyBuyerSig(message, signature, pubkey, network)` with types and errors
    - Unit tests: valid/invalid signatures; unsupported pubkey format throws
    - Integration: optional buyer attribution in receipt tools

- API
  - [ ] OpenAPI spec and Swagger UI mounted at `/api/docs`
  - [ ] Pagination and caching for status endpoint
  - [ ] Rate limiting and simple auth (API key for partner usage)

  - CLI & templates
  - [ ] PSBT generator for seller sale tx (OP_RETURN, marker UTXO, pay-to-contract payouts)
  - [ ] PSBT generator for buyer fee tx (spend marker, pay creator, optional fee OP_RETURN)
   - [ ] Canonical receipt JSON (provenance) generator + optional BIP-322 signer for attribution
   - [ ] Provenance helpers: build reveal PSBT that spends parent and inscribes JSON; single-reveal (fee+receipt in one) and two-tx (fee then reveal) modes
  - [ ] Plop or custom generator for NFT + registration JSON skeletons
  - [ ] Commands to fetch status and validate txids locally
  - [ ] Atlas creator tool (`embers-atlas`): CLI + simple UI; inputs: image, split strategy (2-share/XOR/3×3), tile size; outputs: shares/tiles + manifest + HTML snippet
  - [ ] Trait importer: folder-based trait ingestion (e.g., `traits/backgrounds`, `traits/hats`), outputs shared asset inscriptions + manifest
  - [ ] Background/foreground helper: inscribe one background per collection and reference in manifests
  - [ ] Cost estimator: preview total planned inscriptions for selected strategy before inscribing
  - [ ] Template generator emits minimal parents that import `Embers Core/Atlas` via stable parent IDs
  - [ ] Big Spender flag (`--embed-parent`): embed full image into parent via data URI; show size/cost estimate and require confirmation

 - UI components
  - [ ] React components with minimal styling and props for customization
  - [ ] Storybook or docs page demonstrating flows
  - [ ] `AtlasPreview` component to visualize manifests and composition
  - [ ] `TraitPreview` and `BGFGPreview` components to validate shared assets

  - Testing
   - [ ] E2E: generate sale+fee PSBTs, inscribe provenance receipt (spend parent), parser auto-bricks/activates correctly on regtest without any server or index attestation
   - [ ] E2E (two-tx window): fee first then reveal; accept if `fee.height ≤ H_child` and `(H_child - fee.height) ≤ K`
  - [ ] Split-wallet E2E: payments wallet funds fee tx while ordinals wallet signs marker input; racer attempts cannot consume marker
  - [ ] Unit tests for SDK and API
  - [ ] (Moved from Phase 2) Client/server parity tests for BIP-322 verification
  - [ ] E2E on regtest that simulates full registration
  - [ ] E2E that composes a tiled image from children and verifies layout
  - [ ] Backward-compat test: upgrade `Embers Core` child; parent continues to work without change
  - [ ] Trait composition E2E: reuse ~50 trait inscriptions across 100+ parents
  - [ ] Background/foreground E2E: shared background across a collection

----

### Acceptance Criteria
- Marketplace can integrate status check in < 1 hour using SDK
- CLI can generate a working template and guide a registration in dev
- API docs accurate and deployed with the server
 - Atlas pipeline can split an input image and produce a working parent that renders shares/tiles only when Active
 - With the sale/fee template, on-chain parser validates price/fee fully on-chain; parent auto-bricks if template not followed
 - Default generator uses 2-share strategy and results in exactly 2 child inscriptions per artwork
  - Main parent inscription remains ≤ 6 KB and imports only tiny loader + calls into libraries
 - Trait mode: compose a large collection using ~50 shared trait inscriptions (+ optional per-artwork overlays)
 - Background/foreground mode: share 1 background across the collection and swap only per-artwork foregrounds
  - Big Spender: generator creates a parent with embedded image, shows a cost/size warning, and the output renders correctly

----

### Cost estimation (creator launch costs)

Notes:
- Counts below exclude buyer registration receipts (incurred post-sale by buyers).
- "Parents" are the main payment-aware HTML inscriptions, one per artwork.
- Costs in sats depend on content size and feerate; our CLI will compute precise estimates. This table gives relative counts.
 - Embedding images in parent uses base64, which inflates payload size by ~33% vs binary child images; savings from removing a separate child’s tx overhead typically do not fully offset this for medium/large images.

| Strategy | Per-artwork children (content) | Shared children (collection) | Parents per artwork | Total initial inscriptions for 100-piece | Relative cost vs baseline |
|---|---:|---:|---:|---:|---:|
| Baseline (full-image child) | 1 | 0 | 1 | 100 parents + 100 children = 200 | 1.00× |
| 2-share split (default) | 2 | 0 | 1 | 100 + 200 = 300 | 1.50× |
| 3-part split | 3 | 0 | 1 | 100 + 300 = 400 | 2.00× |
| 3×3 tiling | 9 | 0 | 1 | 100 + 900 = 1000 | 5.00× |
| Trait mode (shared ~50 traits) | 0 | ~50 | 1 | 100 + 50 = 150 | 0.75× |
| Trait mode + per-artwork overlay | 1 | ~50 | 1 | 100 + 50 + 100 = 250 | 1.25× |
| Background/foreground (shared BG) | 1 (FG) | 1 (BG) | 1 | 100 + 100 + 1 = 201 | ~1.01× |
| Big Spender (embed in parent) | 0 | 0 | 1 (large) | 100 | ≈1.1×–1.4× (base64 size-dependent) |

Formula (used by CLI estimator):
- Estimated sats = Σ_i(vbytes_i) × feerate_sat_per_vB, where vbytes_i is computed from each planned inscription (content size, mime type, envelope). The tool will report both total sats and per-artwork average for the selected strategy.

Recommendations:
- For large trait collections, prefer Trait mode to minimize per-artwork inscriptions.
- For non-trait sets with fixed backgrounds, use Background/foreground mode.
- Use 2-share split only when traits/background reuse don’t apply and you want modest friction vs baseline.
- Big Spender is for purists: typically higher cost vs baseline because embedding converts binary → base64 (~4/3 size). A single large parent saves one child’s tx overhead, which may narrow the gap for small images, but for 100–300 KB images expect ~15–40% more vs baseline.

----

### Risks & Mitigations
- SDK drift from API → CI contract tests; version pinning
- Cross-origin issues → CORS config and examples

----

### References
- PRD: docs/PRD-registration-system.md

