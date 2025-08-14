# Inscription Services

This directory contains services for creating Bitcoin ordinals inscriptions for the SatSpray membership card system.

## Overview

The inscription services handle:
- Creating ordinals envelope format for HTML inscriptions
- Generating commit and reveal PSBTs
- Calculating inscription fees
- Supporting optional initial top-ups

## Files

### envelopeBuilder.ts
Handles the creation of ordinals inscription envelopes following the standard format:
```
OP_FALSE
OP_IF
  OP_PUSH "ord"
  OP_1
  OP_PUSH <content-type>
  OP_0
  OP_PUSH <content>
OP_ENDIF
```

Key functions:
- `buildInscriptionScript()` - Creates the inscription envelope
- `createInscriptionOutput()` - Creates taproot output for inscription
- `calculateInscriptionFee()` - Calculates commit and reveal fees

### inscriptionPsbt.ts
Manages PSBT creation for the two-phase inscription process:

1. **Commit PSBT** - Funds the inscription
2. **Reveal PSBT** - Contains the actual inscription data

Key functions:
- `createInscriptionPsbt()` - Creates both PSBTs
- `updateRevealPsbt()` - Updates reveal with actual commit txid
- `estimateInscriptionCost()` - Estimates total inscription cost

## Usage

### Creating an Inscription

1. Call `/api/inscriptions/create-psbt` with UTXOs and addresses
2. Sign and broadcast the commit PSBT
3. Wait for commit tx in mempool
4. Update reveal PSBT with commit txid using `/api/inscriptions/update-reveal`
5. Sign and broadcast the reveal PSBT

### Testing on Signet

The PSBTs can be tested using:
- Unisat wallet (web interface)
- Sparrow wallet (import PSBT)
- mempool.space/signet/tx/push (manual broadcast)

## Fee Calculation

Fees are calculated based on:
- Commit tx: ~200 vbytes
- Reveal tx: Base size + inscription content
- 10% safety buffer applied to both

## Security Notes

- All addresses are validated
- Content size is limited to 400KB
- Treasury address must be configured for top-ups
- PSBTs don't contain private keys