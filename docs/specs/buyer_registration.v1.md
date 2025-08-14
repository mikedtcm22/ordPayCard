### Buyer Registration Schema v1

Purpose: Minimal schema for Phase 0/1 registration receipts.

Fields:
- schema: string (constant "buyer_registration.v1")
- parent: string (inscription ID of NFT, e.g., 64-hex + 'i' + index)
- paid_to: string (creator address used in payment)
- fee_sats: number (amount paid in sats)
- txid: string (hex txid paying the fee)
- timestamp: string (ISO8601 UTC)

Example:

```json
{
  "schema": "buyer_registration.v1",
  "parent": "<PARENT_INSCRIPTION_ID>",
  "paid_to": "tb1qexamplecreatoraddressxxxxxxxxxxxxxxxxxxxxxx",
  "fee_sats": 50000,
  "txid": "b8f7...deadbeef",
  "timestamp": "2025-08-09T12:34:56Z"
}
```

Notes:
- Phase 0 trusts the presence of this child; Phase 2 will require OP_RETURN binding and parser verification.
