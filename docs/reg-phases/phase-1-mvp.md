### Phase 1: MVP Registration System

Version: 1.0 • Owner: Feature Team • Duration: ~1 week

Purpose: Deliver a functional MVP where NFTs are registration-aware. Assets show Unregistered vs Active states based on presence and validity of child registration inscriptions and verified creator fee payment.

----

### Scope
- Single collection demo (one NFT template)
- Fixed registration fee (e.g., 50,000 sats) to creator wallet
 - Registration child schema v1.0
 - MVP trusts child receipts (no on-chain tx validation); parser optional for advisory info. Prepare fields needed for Phase 2/3 (e.g., `fee_txid`, optional `expiry_block`, optional `buyer_pubkey`).
- Regtest only (Signet added post-MVP)
- Wallet priority: Unisat → Xverse (Magic Eden next)
 - Artwork handling (Phase 1): DEFAULT embed full image in parent via data URI; ALT allow single full-image child; show placeholder when Unregistered

----

### Deliverables
- Registration-aware NFT HTML template (shows Unregistered/Active)
- Registration JSON format implemented and documented
- Backend endpoints:
  - `GET /api/v1/registration/status/{inscription_id}`
  - `POST /api/v1/registration/create` (scaffold: return fixed fee + creator addr + instructions)
- Simple registration UI (how-to + “Pay & Register” doc)
- Regtest demo with at least 1 registered asset
 - Example "Big Spender" parent (embedded image) and ALT full-image child wiring guide

----

### Tasks

- NFT template
  - [x] Implement `checkRegistration()` fetching children and filtering by schema
  - [x] Render states: Unregistered (watermark), Active (full display)
  - [x] Provide `window.registrationStatus()` returning `{isRegistered, lastRegistration}`
  - [x] Embedded image path: load data URI directly in parent markup
  - [x] ALT child path: render full-image child via `<img src="/r/content/{childId}">` when Active (documented; default path remains embedded image)

 - Registration schema & creation
   - [x] Define JSON schema (per PRD §3.1/8.1) with types and examples; include `fee_txid` (required), and optionally `expiry_block`, `buyer_pubkey` for forward compatibility
  - [x] CLI/docs to create a registration JSON file referencing fee txid
  - [x] Inscription guidance for creating child registration
  - [x] Document how to embed image in parent (data URI) and, as ALT, to inscribe artwork as a separate child (image/png, image/jpeg, image/svg+xml)

 - Parser integration (MVP)
   - [x] MVP trusts child registration receipts; no on-chain validation required. If present, surface `expiry_block` and `buyer_pubkey` as advisory data.
  - [x] Optional: load parser parent → latest child to surface advisory/diagnostic info (not required for MVP demo)
  - [x] Mark entries as trusted; show parser-verified label only if available (N/A in MVP; prepared fields documented)

 - Backend/API (minimal)
   - [x] Implement status endpoint that replicates on-inscription checks server-side
  - [x] Implement create endpoint that returns: required fee, creator addr, OP_RETURN guidance (if any), and how to inscribe registration JSON (include optional `expiry_block` and `buyer_pubkey` hints for wallets)

- Test & demo
  - [x] Local regtest walkthrough documented
  - [x] Regtest inscription of NFT + one registration (embedded-image parent)
  - [x] Record block heights, txids, and screenshots

----

### Learnings and fixes during MVP

- Self-identification in iframe viewers: relying on `window.location` alone fails when rendered as `srcdoc`. We added parsing from `document.referrer` and `location.pathname`, which works consistently with ord viewers.
- Ord children endpoint shape differs across versions: handled both `/r/children/{id}/inscriptions` and `/r/children/{id}`, and both `children: [{ id }]` and `ids: []` response shapes.
- Indexer lag on regtest: the ord index can trail Core. Mining a few extra blocks after inscriptions resolves most “not found” races. We documented this in the testing guide.
- Creator filtering and fee checks: the `paid_to` vs `CREATOR_WALLET` mismatch can silently filter valid receipts. We made `CREATOR_WALLET` optional for MVP filtering and documented the env usage clearly.
- Embedded image injection: large base64 strings can confuse editors/linters and appeared as “Unterminated string literal.” We fixed the injector to:
  - JSON-escape the data-URI assignment so quotes/newlines are safe
  - Replace the entire `var EMBED_DATA_URI = ...;` assignment robustly (ignoring internal semicolons in the original expression)
  - This removed trailing `+ encodeURIComponent(...)` tails that caused syntax errors
- Ord server CLI compatibility: set correct flag ordering and `ORD_SERVER_URL` to pass internal probes; use cookie auth paths that match the Bitcoin container.
- Added helper scripts and docs to streamline repeatable testing: `regtest-up.sh`, `mine.sh`, `sanity.sh`, `create-registration.sh`, and `prepare-parent.js`.

MVP result: Parent displays Unregistered by default and flips to Active visually upon valid child inscription; the server status endpoint returns `isRegistered: true`. Custom embedded artwork is supported via the injector script.

----

### Acceptance Criteria
 - NFT displays Unregistered by default; switches to Active after valid registration child found
 - Status endpoint returns `isRegistered: true` after registration on regtest
 - Server and template trust the child receipt (schema-valid, correct parent, includes `CREATOR_WALLET` and fixed fee fields)
 - No on-chain payment validation required in MVP
 - Documentation enables a new dev to reproduce within one day

All acceptance criteria have been met. Phase 1 is complete and ready to proceed to Phase 2.

----

### Risks & Mitigations
- Wallet UX for OP_RETURN (if used) → For MVP, do not require OP_RETURN; add in Phase 2
- Parser bugs → Keep a trusted fallback path for demos

----

### References
- PRD: docs/PRD-registration-system.md

