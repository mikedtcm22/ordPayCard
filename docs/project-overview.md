# SatSpray Membership Card – Proof‑of‑Concept PRD (v0.2)

**Project Name:** SatSpray Membership Card  
**Version:** 0.2 (Proof‑of‑Concept – updated with clarifications, 11 Jul 2025)  
**Author:** ChatGPT (Bitcoin‑Ordinals SME)  
**Date:** 11 July 2025  

---

## 1. Purpose & Goals
Replace traditional username/password plus fiat billing in *SatSpray* with a tradable on‑chain “membership card” Ordinal that  

1. **Accrues value** whenever the holder mints a *top‑up receipt* inscription paying the SatSpray treasury.  
2. **Self‑depletes** at a fixed **35 sats per block** (≈ 5050 sats / 30‑day month).  
3. Exposes real‑time status — **ACTIVE** vs **EXPIRED** — via Ordinals recursion.  
4. Lets the SatSpray backend verify “wallet X holds an ACTIVE card” without storing keys or billing data.

Scope: single decay rate & single treasury address; signet first, then mainnet.

---

## 2. User Stories
| ID | As a … | I want … | So that … |
|----|--------|----------|-----------|
|U1|Visitor|to buy a SatSpray membership card|I can unlock paid graffiti tools.|
|U2|Card‑holder|to see in my wallet whether my card is *active* or *expired*.|I know when to top‑up.|
|U3|Card‑holder|to top‑up my card from any webpage.|I can stay active without a marketplace’s help.|
|U4|SatSpray backend|to verify a signed challenge from a user|Only *active* members get access.|
|U5|Dev / AI agent|clear schemas, PSBT formats, API contracts|I can implement without guessing.|

---

## 3. Functional Requirements

### 3.1  On‑chain Artefacts
| # | Item | Type | Must contain |
|---|------|------|--------------|
|F1|**Parent inscription** (“Membership Card”)|`text/html` with inline JS + two inline SVGs:<br>• `active.svg` – brick‑wall background, orange BTC logo spray‑painted & overlay text<br>• `expired.svg` – greyscale wall + “EXPIRED” stencil|Hard‑coded in `<script>`: `DECAY_PER_BLOCK = 35`, `TREASURY_ADDR`, `CARD_SCHEMA_VER="1"`.<br>Viewer must render **current balance** (sats left) and **decay rate** inside the image. Export helper `window.cardStatus()`.|
|F2|**Child receipt inscription** (“Top‑up”)|`application/json`; 1‑sat output in same or later tx paying treasury.|Schema v1 (see §5). *No limit* on `amount`.|
|F3|**Top‑up PSBT template**|Partially‑signed tx with two outputs:<br>1. ≥ `amount` sats → `TREASURY_ADDR`<br>2. 1‑sat output embedding receipt JSON.|Wallet adds change automatically.|

### 3.2  Front‑end Widgets
| # | Widget | Behaviour |
|---|--------|-----------|
|F4|**Top‑up Widget (React)**|Inputs: `parentInscriptionId`, `desiredDays` (optional). Calculates sats: `35 × 144 × days`. Builds PSBT (F3); hands to browser wallet (Xverse, Leather, Unisat). Shows success with new receipt ID.|
|F5|**Status Badge**|Given `inscriptionId`, fetches `/r/children`, recomputes balance, renders ✔ Active / ✖ Expired with sats remaining & decay rate. Polls every 30 s.|

### 3.3  Backend API
| Endpoint | Method | Input | Output | Notes |
|----------|--------|-------|--------|-------|
|`/auth/challenge`|GET|—|`{nonce}`|32‑byte hex|
|`/auth/verify`|POST|`{addr, sig, inscriptionId}`|`{active:bool, balance:number}`|Server recomputes balance exactly as front‑end.|

---

## 4. Non‑Functional Requirements
* **Network:** Signet PoC; swap only `TREASURY_ADDR` for mainnet.  
* **Wallet support:** Xverse & Leather (Taproot PSBT + message signing).  
* **Latency:** Balance calc ≤ 1 s with 200 receipts.  
* **Licensing:** MIT for code; inscription art CC‑BY‑SA 4.0.  

---

## 5. Data Contracts & Schemas

### 5.1  Receipt JSON (`satspray.topup.v1`)
```jsonc
{
  "schema": "satspray.topup.v1",
  "parent": "ord:abc…def",
  "amount": 123000,
  "block": 841200,
  "paid_to": "tb1qxyz…",
  "txid": "deadbeef…"
}
```

### 5.2  Parent JS Exports
```js
window.CARD_SCHEMA_VER = "1";
window.cardStatus = async () => ({
  balance: Number,          // sats
  blocksRemaining: Number,
  status: "ACTIVE" | "EXPIRED"
});
```

### 5.3  Backend Verification (Python‑style)
```python
DECAY_PER_BLOCK = 35  # sats

def recompute_balance(inscription_id):
    height = ord_api.get_block_height()
    balance = 0
    for kid in ord_api.list_children(inscription_id):
        rec = ord_api.get_json(kid)
        if rec["paid_to"] != TREASURY_ADDR:
            continue
        if not tx_pays_treasury(rec["txid"], rec["amount"]):
            continue
        age = height - rec["block"]
        balance += max(rec["amount"] - age * DECAY_PER_BLOCK, 0)
    return balance
```

---

## 6. UX Flows

### 6.1 Buy New Card
1. User visits `/buy`; backend returns PSBT that mints parent (and optional initial top‑up).  
2. Wallet signs & broadcasts.  
3. Front‑end polls ord server; badge shows **ACTIVE** with full balance.

### 6.2 Top‑Up
1. Widget F4 computes sats (`35 × 144 × days`) or takes custom amount.  
2. Builds PSBT + receipt inscription; launches wallet.  
3. On broadcast, widget watches `/r/children` until new receipt confirmed; badge refreshes.

### 6.3 Site Authentication
1. GET `/auth/challenge` → nonce.  
2. Wallet signs nonce with address controlling card UTXO (message‑sign or cold PSBT).  
3. POST `/auth/verify`; server checks sig & balance.  
4. If active, session cookie issued.

---

## 7. Success Metrics
| Metric | Target (PoC) |
|--------|--------------|
|Top‑up success rate|≥ 90 % on signet|
|Status calc time|≤ 1 s (200 receipts)|
|Auth round‑trip|≤ 700 ms median|
|AI‑generated code share|≥ 75 %|

---

## 8. Out‑of‑Scope (PoC)
* Variable decay tiers (future “OG” cards).  
* Mobile‑native deeplinks.  
* Marketplace auto‑integration.  
* Fiat on‑ramp.

---

## 9. Open Questions (Remaining)
1. Provide custom SVG assets or generate via AI?  
2. Does SatSpray need server‑side balance cache to meet latency under heavy load?  

---

*End of Document*
