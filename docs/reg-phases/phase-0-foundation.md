### Phase 0: Foundation (Prerequisites)

Version: 1.0 • Owner: Eng Lead • Duration: 2–3 days

Purpose: Establish the minimum technical base to build a registration-aware Ordinals system per PRD. Leverage existing membership-card work (recursive endpoints, parser scaffolding) but refocus on registration flows.

----

### Objectives
- Confirm environment, recursive endpoints, and toolchain
- Set baseline project structure and naming for the “registration” track
- Prepare inscription templates and test harnesses
- Stand up CI, linting, type checks, and smoke tests

----

### Deliverables
- docs/reg-phases/phase-1-mvp.md approved
- Local ord server running with JSON + recursive endpoints
- Baseline inscription templates (NFT + registration JSON skeleton)
- Minimal parser library seed (parent + child stub) ready for Phase 2
- CI pipeline: lint + type-check + unit tests green

----

### Tasks

- Repo setup
  - [ ] Create `.env.development` and `.env.production` entries for registration track
  - [x] Define `CREATOR_WALLET` placeholders for dev/test (present via server fallback; will formalize in env files)
  - [x] Add `REGISTRY_API_URL` to client/server configs
  - [ ] Ensure Docker dev targets run ord server alongside app (regtest stack is separate and working)
  - [x] Confirm docs folder naming is lower-case `docs/` for new materials

- Ord server & endpoints
  - [x] Install/verify ord ≥ 0.18.0 (running ord 0.23.x)
  - [x] Run `ord --regtest` with JSON/recursive endpoints (flag name differs in newer ord; HTTP and recursion are active)
  - [x] Verify `/r/blockheight`, `/r/children/{id}` (ids), `/r/content/{id}` respond; child enumeration will be revisited during Phase 1 (observed empty list despite parent linkage; index/endpoint variant under review)

- Network & wallet baseline
  - [ ] Target network for MVP: regtest only
  - [ ] Wallet priority: Unisat first, Xverse second (Magic Eden next)

- Templates (baseline only)
  - [x] NFT inscription HTML template stub that:
        - identifies its own `INSCRIPTION_ID` (placeholder)
        - fetches children via `/r/children` (to be wired in Phase 1; stubbed in Phase 0)
        - exposes `window.registrationStatus()` (placeholder implemented)
  - [x] Registration JSON schema draft (buyer_registration v1.0) aligned to PRD (see `docs/specs/buyer_registration.v1.md`; sample at `inscription-testing/registration.sample.json`)
  - [x] Artwork handling baseline (Phases 0–2):
        - DEFAULT: Embed full image directly in the parent via data URI (implemented in template)
        - Alternative: Optionally reference a single full-image child (documented, not default)
        - Parent displays placeholder/watermark until registered
        - Atlas/tiling and trait/background strategies are deferred to Phase 3

- Parser seed (for Phase 2 expansion)
  - [ ] Parent inscription loader (serves latest child)
  - [ ] Minimal child that exposes `BTCParser.verifyPayment` (returns fixed success in dev)

- Backend/API
  - [x] Server route placeholders for:
        - `GET /api/registration/status/{inscription_id}` (mock implemented; path simplified without version for MVP; can alias to `/api/v1/...` later)
        - `POST /api/registration/create` (returns fee, creator addr, and instructions)
  - [x] Simple rate limiter + request logging enabled
  - [x] Added `/api/v1/registration/*` alias for forward compatibility

- Tooling/quality gates
  - [x] ESLint + Prettier + TypeScript strict (configs and scripts present)
  - [x] Basic unit tests for endpoint smoke tests (Supertest added; server tests green)
  - [x] CI job wiring for lint, type-check, test (GitHub Actions at `.github/workflows/ci.yml` for server and client)

----

### Acceptance Criteria
- Ord server reachable; recursive endpoints verified locally (met; `/r/blockheight` responding; children/content endpoints reachable)
- NFT template loads without errors and can enumerate children (mock) (met via stub; real fetch wired in Phase 1)
- Parser loader parent/child tested in a browser context (mock fetch) (pending)
- API endpoints return the correct shapes with placeholder data (met)
- CI pipeline passing (lint, types, tests) (pending)

----

### Risks & Mitigations
- Endpoint variance across ord versions → pin version; wrap fetches with timeouts and retries
- Case-sensitive paths in repo (Docs vs docs) → standardize new registration docs under `docs/`
- Template size creep → plan minification from Phase 2 onward

----

### References
- PRD: docs/PRD-registration-system.md
- Parser direction: docs/phases-card/phase-2.2/phase-2.2.1c-parser.md

----

### Notes on changes in approach / environment fixes

- ord CLI server probe: Added `ORD_SERVER_URL=http://127.0.0.1:8080` to the ord container environment to prevent internal probes from defaulting to `http://127.0.0.1/blockcount` and failing. This unblocked all CLI flows.
- Mining helper: Some Bitcoin images lack `bitcoin-cli` in container PATH. We mine blocks from the host via curl JSON-RPC against `18443` and wrapped it as `inscription-testing/mine.sh`.
- Endpoint paths: Using `/api/registration/...` (no version) for MVP simplicity. We can alias to `/api/v1/registration/...` in Phase 1 without breaking clients.
- Artwork default: Implemented embedded image (data URI) as the default in the parent HTML per final decision. Recursive composition strategies remain Phase 3+.
- ord recursive children: Observed `/r/children/{id}` returning an empty list immediately after inscribing a parented child on regtest. We mine additional blocks to aid index propagation. This will be revisited when wiring real child enumeration in Phase 1; non-blocking for Phase 0 since template uses a stub.

