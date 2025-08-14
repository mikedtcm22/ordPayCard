# Product Requirements Document: On-Chain Registration System for Digital Assets

**Product Name:** BitReg (Bitcoin Registration Protocol)  
**Document Version:** 1.0  
**Date:** January 2025  
**Status:** Proposal  
**Author:** SatSpray Team  

---

## Executive Summary

BitReg is a revolutionary on-chain registration system that creates sustainable creator revenue through a "buyer-pays" registration model for Bitcoin inscriptions. Unlike traditional royalty systems that attempt to enforce payment at point of sale, BitReg makes digital assets "registration-aware" - they only fully function when properly registered by their current owner.

This system transforms the NFT ownership model from attempting to enforce unenforceable royalties into a voluntary but economically rational registration system where buyers activate their assets by paying a registration fee directly to creators.

---

## 1. Thesis & Market Opportunity

### 1.1 Core Thesis

**Traditional royalties are technically impossible to enforce on Bitcoin**, but we can achieve the same economic outcome by making inscriptions that only "work" when registered. This shifts the model from "forced payment" to "voluntary activation" - buyers want their assets to function, so they register them.

### 1.2 Key Innovation

The breakthrough is using Bitcoin's parent-child inscription relationships to create an unforgeable registration system:
- Only the current owner can create child inscriptions
- Registration proves ownership AND generates creator revenue
- Assets without valid registration display as "inactive"

### 1.3 Market Opportunity

- **Total Addressable Market**: All Bitcoin inscriptions ($500M+ market cap)
- **Creator Revenue Potential**: 5-10% of all secondary sales
- **Platform Opportunity**: First-mover advantage in Bitcoin creator economy
- **Ecosystem Benefits**: Sustainable funding for creators on Bitcoin

### 1.4 Competitive Advantages

1. **No External Dependencies**: Pure Bitcoin, no L2s or sidechains needed
2. **Trustless**: Cryptographically secured by parent-child relationships
3. **Upgradeable**: Parser library can be updated without changing NFTs
4. **Social Proof**: Unregistered NFTs are visibly "broken"
5. **Incentive Aligned**: Buyers want working assets, creators want revenue

---

## 2. Product Vision & Goals

### 2.1 Vision Statement

Create the first truly sustainable creator economy on Bitcoin by making digital assets that are "registration-aware" - transforming one-time sales into ongoing creator relationships.

### 2.2 Success Metrics

**Primary KPIs:**
- Registration rate: >80% of transfers registered within 100 blocks
- Creator revenue: Average 5% of sale value captured
- Asset activation: >90% of assets properly registered
- User satisfaction: <5% support tickets about registration

**Secondary Metrics:**
- Time to register: <10 minutes average
- Failed registration rate: <1%
- Chain integrity: 0 broken chains after 6 months
- Creator adoption: 100+ collections using BitReg

### 2.3 User Personas

**Creators:**
- Want sustainable revenue from their work
- Need simple integration with existing collections
- Require transparent on-chain verification

**Collectors:**
- Want their NFTs to display properly
- Need clear registration instructions
- Expect fair and transparent fees

**Marketplaces:**
- Need API for registration status
- Want automated registration flows
- Require minimal integration work

---

## 3. Technical Architecture

### 3.1 System Components

```
┌─────────────────────────────────────────────────────────┐
│                    NFT Inscription                       │
│  - Contains artwork/content                              │
│  - Defines creator wallet & registration fee             │
│  - Checks children for valid registrations               │
└────────────────────────┬─────────────────────────────────┘
                         │ Parent-Child
                         ▼
┌─────────────────────────────────────────────────────────┐
│              Registration Inscriptions                   │
│  - Created by current owner as children                  │
│  - Contains proof of payment to creator                  │
│  - Includes purchase details & timestamp                 │
└─────────────────────────────────────────────────────────┘
                         │ References
                         ▼
┌─────────────────────────────────────────────────────────┐
│           Parser Library (Upgradeable)                   │
│  - Validates payment transactions                        │
│  - Verifies registration integrity                       │
│  - Handles different payment types                       │
└─────────────────────────────────────────────────────────┘
```

### 3.2 Core Technical Requirements

**Inscription Requirements:**
- Support for recursive inscriptions (`/r/children`, `/r/content`)
- Parent-child relationship validation
- JSON parsing capability
- Async JavaScript execution

**Parser Library:**
- Transaction hex parsing
- OP_RETURN validation
- Multi-address type support (P2PKH, P2WPKH, P2TR)
- Under 20KB compressed size

**Registration Format:**
```json
{
  "type": "buyer_registration",
  "version": "1.0",
  "buyer": "bc1q...",
  "seller": "bc1q...", 
  "purchasePrice": 1000000,
  "registrationFee": 50000,
  "feeTxid": "payment_to_creator_txid",
  "purchaseTxid": "nft_transfer_txid",
  "registrationBlock": 850000,
  "timestamp": 1234567890
}
```

### 3.3 Technical Flow

1. **Purchase Phase:**
   - Buyer acquires NFT through any method (marketplace, P2P, etc.)
   - NFT transfers to buyer's wallet
   - NFT displays as "Unregistered - Activation Required"

2. **Registration Phase:**
   - Buyer sends registration fee to creator wallet
   - Buyer inscribes registration data as child of NFT
   - Registration includes proof of payment (txid)

3. **Validation Phase:**
   - NFT fetches all child inscriptions
   - Filters for valid registrations
   - Verifies payment via parser library
   - Updates display based on registration status

4. **Display Phase:**
   - **Registered**: Full artwork/content displayed
   - **Unregistered**: Watermarked/degraded view with registration prompt
   - **Invalid**: Error message with remediation steps

---

## 4. Security Model & Attack Mitigations

### 4.1 Security Principles

1. **Cryptographic Protection**: Parent-child relationships cannot be forged
2. **Economic Incentives**: Registration cost < asset value
3. **Social Verification**: Unregistered assets are visibly broken
4. **Transparent History**: All registrations on-chain and auditable

### 4.2 Attack Vectors & Mitigations

| Attack Vector | Description | Mitigation | Residual Risk |
|--------------|-------------|------------|---------------|
| Fork Attack | Multiple parties claim ownership | Parent-child requirement prevents | None |
| Wash Trading | Self-trade at low price to reduce fee | Fee based on declared price, minimum fee | Low |
| Shadow Markets | Trade unregistered NFTs | Social pressure, visible broken state | Low |
| Fee Evasion | Never register, use offline | Asset remains broken on-chain | None (working as intended) |
| Double Registration | Register same sale twice | Timestamp validation, deduplication | None |
| Creator Rug | Creator changes fee arbitrarily | Fee hardcoded in NFT | None |
| Fake Receipts | Create false payment proofs | Transaction verification via parser | None |

### 4.3 The "Return to Genesis" Safety Valve

**Mechanism:** If an NFT becomes "bricked" due to broken registration chain:
1. Current owner can sell back to creator
2. Creator creates special "reset" registration
3. Chain restarts fresh from creator
4. Prevents permanent loss of valuable assets

**Protection:** Limited resets (max 2-3 per NFT lifetime) to prevent abuse

---

## 5. Implementation Phases

### Phase 0: Foundation (Prerequisites)
**Duration:** Completed via membership card project
- ✅ Recursive inscription infrastructure
- ✅ Transaction parser library
- ✅ Parent-child validation system

### Phase 1: MVP Registration System
**Duration:** 1 week
**Deliverables:**
- Basic registration NFT template
- Simple registration inscription format  
- Manual registration process documentation
- Testing on Bitcoin testnet/signet

**Success Criteria:**
- Can register ownership transfer
- NFT correctly shows registered/unregistered state
- Registration creates creator revenue

### Phase 2: Enhanced Validation
**Duration:** 1 week
**Deliverables:**
- Robust payment verification
- Multi-address type support
- Chain integrity validation
- Return-to-genesis mechanism

**Success Criteria:**
- 99% accurate payment verification
- Handles all Bitcoin address types
- Can recover from broken chains

### Phase 3: Developer Tools
**Duration:** 2 weeks
**Deliverables:**
- Registration status API
- JavaScript SDK for marketplaces
- NFT template generator
- Registration UI components

**Success Criteria:**
- <1 hour marketplace integration time
- <10 minute NFT creation with registration
- 90% developer satisfaction score

### Phase 4: Production Launch
**Duration:** 2 weeks
**Deliverables:**
- Mainnet deployment
- Creator onboarding program
- Marketplace partnerships
- User education materials

**Success Criteria:**
- 10+ collections using system
- 3+ marketplace integrations
- 1000+ successful registrations

### Phase 5: Ecosystem Growth
**Duration:** Ongoing
**Deliverables:**
- Advanced features (batch registration, etc.)
- Analytics dashboard for creators
- Automated registration services
- Community governance model

---

## 6. User Experience Design

### 6.1 Buyer Journey

```
Purchase NFT → See "Unregistered" state → Click "Activate" →
Follow payment instructions → Create registration child →
NFT activates instantly → Enjoy full content
```

### 6.2 Registration Interface Mock

```
┌────────────────────────────────────┐
│      🔒 REGISTRATION REQUIRED      │
│                                    │
│  This NFT requires registration    │
│  to display properly.              │
│                                    │
│  Registration Fee: 50,000 sats     │
│  Creator: bc1q...xyz               │
│                                    │
│  [How to Register]  [Pay Now]      │
│                                    │
│  Why register?                     │
│  • Unlock full artwork             │
│  • Support the creator             │
│  • Prove authentic ownership       │
└────────────────────────────────────┘
```

### 6.3 Creator Dashboard Mock

```
┌────────────────────────────────────┐
│         Creator Dashboard          │
├────────────────────────────────────┤
│ Collection: Cool Cats              │
│ Total NFTs: 1,000                  │
│ Registered: 876 (87.6%)            │
│ Revenue (30d): 2.5 BTC             │
│                                    │
│ Recent Registrations:              │
│ • #123 - 50k sats - 2 hours ago   │
│ • #456 - 50k sats - 5 hours ago   │
│ • #789 - 50k sats - 1 day ago     │
└────────────────────────────────────┘
```

---

## 7. Economic Model

### 7.1 Fee Structure Options

**Fixed Fee Model:**
- Simple: Same fee for all transfers
- Predictable for buyers
- Example: 50,000 sats per registration

**Percentage Model:**
- Fair: Scales with asset value
- Complex: Requires price oracle
- Example: 5% of declared sale price

**Hybrid Model (Recommended):**
- Minimum fee + percentage
- Protects against wash trading
- Example: Greater of 50k sats or 5% of sale

### 7.2 Revenue Projections

| Metric | Conservative | Expected | Optimistic |
|--------|--------------|----------|------------|
| Collections | 50 | 200 | 500 |
| NFTs per Collection | 500 | 1,000 | 5,000 |
| Transfers per Year | 0.5 | 2 | 5 |
| Registration Rate | 60% | 80% | 95% |
| Avg Registration Fee | $10 | $25 | $50 |
| Annual Creator Revenue | $75,000 | $800,000 | $5,937,500 |

---

## 8. Technical Specifications

### 8.1 NFT Template Structure

```javascript
// Core registration checking logic
async function checkRegistration() {
    const children = await fetch(`/r/children/${this.id}/inscriptions`);
    const registrations = await validateRegistrations(children);
    
    if (registrations.length === 0) {
        return showUnregisteredState();
    }
    
    const latest = registrations[registrations.length - 1];
    if (await verifyPayment(latest)) {
        return showActiveContent();
    }
    
    return showInvalidState();
}
```

### 8.2 Registration Validation

```javascript
async function validateRegistration(registration) {
    // 1. Verify is child of NFT
    const parent = await fetch(`/r/parent/${registration.id}`);
    if (parent !== this.nftId) return false;
    
    // 2. Verify payment transaction
    const paymentValid = await BTCParser.verifyPayment(
        registration.feeTxid,
        CREATOR_WALLET,
        registration.registrationFee
    );
    if (!paymentValid) return false;
    
    // 3. Verify ownership transfer
    const transferValid = await BTCParser.verifyTransfer(
        registration.purchaseTxid,
        registration.seller,
        registration.buyer
    );
    
    return transferValid;
}
```

### 8.3 API Specifications

**GET /api/v1/registration/status/{inscription_id}**
```json
{
    "inscriptionId": "abc123...i0",
    "isRegistered": true,
    "currentOwner": "bc1q...",
    "lastRegistration": {
        "block": 850000,
        "fee": 50000,
        "timestamp": 1234567890
    },
    "chainIntegrity": "valid"
}
```

**POST /api/v1/registration/create**
```json
{
    "nftId": "abc123...i0",
    "buyer": "bc1q...",
    "seller": "bc1q...",
    "purchasePrice": 1000000,
    "feeTxid": "def456..."
}
```

---

## 9. Risk Analysis

### 9.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Ord endpoint changes | Low | High | Abstract API layer |
| Parser library bugs | Medium | Medium | Extensive testing, upgradeable |
| Inscription size limits | Low | Medium | Optimize code, use compression |
| Network congestion | Medium | Low | Async registration, queue system |

### 9.2 Market Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Low adoption | Medium | High | Creator incentives, easy integration |
| Competitor copies | High | Medium | First mover advantage, network effects |
| Regulatory concerns | Low | High | Legal review, compliance framework |
| User confusion | Medium | Medium | Education, clear UX |

### 9.3 Contingency Plans

**If registration rate <50%:**
- Reduce fees
- Improve UX
- Partner with marketplaces for auto-registration

**If technical issues arise:**
- Hot-fix via parser library updates
- Emergency return-to-genesis for affected NFTs
- Community support channel

---

## 10. Success Criteria & KPIs

### 10.1 Launch Success (Month 1)
- [ ] 10+ collections integrated
- [ ] 1,000+ successful registrations
- [ ] <1% technical failure rate
- [ ] 3+ marketplace partnerships

### 10.2 Growth Success (Month 6)
- [ ] 100+ collections
- [ ] 50,000+ registrations
- [ ] $500k+ creator revenue generated
- [ ] 80%+ registration rate

### 10.3 Market Success (Year 1)
- [ ] Industry standard for Bitcoin NFTs
- [ ] $5M+ creator revenue
- [ ] Major marketplace adoption
- [ ] Self-sustaining ecosystem

---

## 11. Open Questions & Research Areas

### 11.1 Technical Research Needed
- Optimal fee calculation algorithm
- Batch registration for multiple NFTs
- Cross-collection registration standards
- Light client verification methods

### 11.2 Market Research Needed
- Creator fee preferences survey
- Buyer willingness to pay study
- Marketplace integration requirements
- Regulatory landscape analysis

### 11.3 Future Enhancements
- Multi-signature creator wallets
- Revenue sharing for collaborations
- Subscription-based registrations
- DAO governance for fee adjustments

---

## 12. Conclusion

The BitReg on-chain registration system represents a paradigm shift in how creator royalties work on Bitcoin. By making NFTs "registration-aware" rather than trying to enforce payments, we align incentives between creators and collectors while working within Bitcoin's technical constraints.

This system is:
- **Technically feasible** with current Bitcoin/Ordinals infrastructure
- **Economically rational** for all participants
- **Socially verifiable** through visible registration status
- **Legally compliant** as voluntary registration, not enforced royalty

The buyer-pays registration model solves the fundamental challenge of creator sustainability on Bitcoin while respecting the principles of true ownership and decentralization that make Bitcoin valuable.

---

## Appendix A: Comparison with Existing Solutions

| Feature | BitReg | Ethereum Royalties | Ordinals Markets |
|---------|--------|-------------------|------------------|
| Enforcement | Voluntary/Social | Marketplace | None |
| On-chain | Yes | Partial | No |
| Bypass-able | Yes but visible | Yes | N/A |
| Creator Revenue | Yes | Sometimes | No |
| Upgradeable | Yes | No | N/A |
| Decentralized | Yes | No | Yes |

## Appendix B: Technical Dependencies

- Bitcoin Core: v23.0+
- Ord: v0.18.0+
- Recursive Inscriptions: Enabled
- JavaScript: ES2020+
- JSON parsing: Native

## Appendix C: Glossary

- **Registration**: Child inscription proving ownership and fee payment
- **Parser Library**: Upgradeable on-chain code for transaction validation
- **Return to Genesis**: Creator-initiated chain reset mechanism
- **Registration-aware**: Assets that check registration status before displaying
- **Parent-child**: Inscription relationship where children reference parent

---

*This PRD represents a comprehensive plan for implementing the first truly workable creator fee system on Bitcoin. By shifting from impossible-to-enforce royalties to voluntary-but-rational registration, we can create sustainable creator revenue while respecting Bitcoin's ownership model.*