### Phase 4: Production Launch

Version: 1.0 • Owner: PM/Eng • Duration: ~2 weeks

Purpose: Ship mainnet-ready registration system with operational guardrails, security review, and partner onboarding.

----

### Scope
- Mainnet deployment
- Creator onboarding and docs
- Observability, SLOs, and error budgets
- Security hardening and performance budgets
 - Productize atlas pipeline and hosting guidance (docs for creators)
 - Versioning strategy for on-chain API libraries (Core/Atlas/UI) and deprecation policy

----

### Deliverables
- Mainnet configuration (`CREATOR_WALLET`, network params, endpoints)
- Robust caching for status API (e.g., 30–60s TTL; invalidation hooks)
- Logging, tracing, dashboards (latency, error rates, cache hit ratio)
- Security review and threat model
- Creator onboarding guide and examples
 - Atlas pipeline docs with best practices (tile size, manifests, performance)
 - Library governance doc: how to publish new child versions, stability guarantees, and change logs

----

### Tasks

- Infrastructure
  - [ ] Production build pipelines for client/server
  - [ ] ENV/secrets management (Vault/SOPS/GH Secrets)
  - [ ] CDN for static assets and docs

- Performance
  - [ ] Load test status API (200+ registrations per NFT)
  - [ ] Optimize parser invocation and memoization
  - [ ] Introduce async background warmers for popular NFTs

- Security
  - [ ] Audit parser code paths for buffer handling and bounds checks
  - [ ] Add abuse protections (rate-limit, bot filters)
  - [ ] Log redaction, PII review (if any)

- Product
  - [ ] Creator docs: fees, OP_RETURN requirement, step-by-step wallet guides
  - [ ] Partner integration playbook (marketplace SDK + examples)
  - [ ] Public status page and incident handbook
  - [ ] Library versioning guide (semantic versioning mapped to child indices)

----

### Acceptance Criteria
- Mainnet launch with at least 1 creator and 1 marketplace demo
- P95 status API ≤ 1s with 200 registrations
- Zero critical security findings outstanding
 - Library upgrade (new child) rolls out without breaking existing parents

----

### Risks & Mitigations
- Ord endpoint instability → Circuit breakers and exponential backoff; multi-provider abstraction
- Cache staleness causing UX confusion → Display “last updated” timestamp and refresh action

----

### References
- PRD: docs/PRD-registration-system.md

