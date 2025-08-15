### Testing Guide: Phase 1 MVP (Signet)

This guide walks you through an end-to-end manual test on Signet testnet:
- 0) Initialize Bitcoin Core + ord with Signet configuration
- 1) Fund wallet from Signet faucet
- 2) Inscribe the parent (initially Unregistered)
- 3) Wait for confirmations
- 4) Inscribe a child registration JSON
- 5) Verify parent switches to Registered (via API and browser)

Prereqs:
- Bitcoin Core v29.0.0+ installed
- ord v0.23.2+ installed
- Stable internet connection (Signet requires syncing with the network)

References:
- Bitcoin config: `configs/bitcoin-signet.conf`
- Ord config: `configs/ord-signet.yaml`
- Parent template: `client/src/templates/inscription/registrationWrapper.html`
- Registration JSON: will be created at `inscription-testing/registration.json`
- Helper scripts: `scripts/signet-*.sh`, `scripts/ord-signet-*.sh`
- Server (status API): `server/` on port 3001

Special considerations (Signet):
- Block time is ~10 minutes (not instant like regtest)
- Coins must be obtained from faucets (cannot mine locally)
- Network is persistent - inscriptions remain visible to others
- Use Signet explorers to verify transactions: https://mempool.space/signet

---

## 0) Initialize Signet stack and sanity-check

Start Bitcoin Core:
```bash
./scripts/signet-start.sh
```
This will start bitcoind with Signet configuration. Initial sync may take 10-30 minutes.

Check sync status:
```bash
./scripts/signet-status.sh
```
Wait until `verificationprogress` is close to 1.0 (fully synced).

Create ord wallet (first time only):
```bash
./scripts/signet-wallet.sh create
```

Start ord server:
```bash
./scripts/ord-signet-start.sh
```
This starts the ord indexer and HTTP server on port 8080.

Start the backend server (for status API):
```bash
cd server
npm run dev
```
Verify health: `curl -s http://localhost:3001/health`

---

## 1) Fund wallet from Signet faucet

Get a receive address:
```bash
./scripts/signet-wallet.sh receive
```
Copy the address that starts with `tb1...`

Get free Signet BTC:
1. Visit https://signet.bc-2.jp/ or https://alt.signetfaucet.com/
2. Paste your address and request coins (usually 0.001 BTC)
3. Wait for the transaction to be confirmed (1-2 blocks, ~10-20 minutes)

Check balance:
```bash
./scripts/signet-wallet.sh balance
```
You should see a non-zero balance once the faucet transaction confirms.

---

## 2) Inscribe the parent (Unregistered state)

Template file:
- `client/src/templates/inscription/registrationWrapper.html`

Inscribe the parent:
```bash
./scripts/signet-inscribe.sh \
  client/src/templates/inscription/registrationWrapper.html \
  1


#OR...with a custom image!
node inscription-testing/prepare-parent.js \
  --image ./path/to/your-image.png \
  --template client/src/templates/inscription/registrationWrapper.html \
  --out inscription-testing/parent-custom.html

# Inscribe the customized parent
./scripts/signet-inscribe.sh \
  inscription-testing/parent-custom.html \
  1

# Or manually with ord:
ord \
  --bitcoin-rpc-url http://127.0.0.1:38332 \
  --bitcoin-rpc-username ordtest \
  --bitcoin-rpc-password ordtest2024 \
  --chain signet \
  wallet inscribe \
  --fee-rate 1 \
  --file inscription-testing/parent-custom.html
```
The command will output JSON with the inscription details. Note the `id` field (format: `<txid>i0`).
Save this as your PARENT_ID:
```bash
PARENT_ID="<inscription_id_from_output>"
echo "$PARENT_ID" > inscription-testing/.last_parent
```

**Important**: The inscription will be pending until confirmed in a block (~10 minutes on Signet).

---

## 3) Wait for confirmations

Check inscription status:
```bash
# Check if inscription is confirmed
curl -s http://localhost:8080/inscription/$PARENT_ID
```

You can also check on Signet explorer:
- https://mempool.space/signet/tx/<txid_part_of_inscription_id>

Once confirmed, view the parent:
- Browser: `http://localhost:8080/inscription/<PARENT_ID>`
- Should show "Unregistered" watermark

Check API status:
```bash
curl -s http://localhost:3001/api/registration/status/$PARENT_ID
```
Expected: `{"isRegistered": false}`

---

## 4) Create and inscribe a child registration JSON

Create the registration JSON:
```bash
PARENT_ID=$(cat inscription-testing/.last_parent)
CREATOR_ADDRESS="tb1p39d957nu4w76nfdu3flsmvz9ka6huve5awetm0f9dy9lnznjmelsr6xhke"
FEE_SATS=50000

./inscription-testing/create-registration.sh \
  "$PARENT_ID" \
  "$CREATOR_ADDRESS" \
  "$FEE_SATS"
```

This creates `inscription-testing/registration.json` with the registration data.

Inscribe as a child of the parent:
```bash
ord \
  --bitcoin-rpc-url http://127.0.0.1:38332 \
  --bitcoin-rpc-username ordtest \
  --bitcoin-rpc-password ordtest2024 \
  --chain signet \
  wallet inscribe \
  --fee-rate 1 \
  --parent $PARENT_ID \
  --file inscription-testing/registration.json
```

Note the child inscription ID from the output:
```bash
CHILD_ID="<child_inscription_id>"
echo "$CHILD_ID" > inscription-testing/.last_child
```

Wait for confirmation (~10 minutes).

Verify child content:
```bash
curl -s http://localhost:8080/content/$CHILD_ID
```
Should show the registration JSON.

---

## 5) Verify registration status

After the child inscription confirms, check the parent's registration status:

Via API:
```bash
PARENT_ID=$(cat inscription-testing/.last_parent)
curl -s http://localhost:3001/api/registration/status/$PARENT_ID | jq
```
Expected output:
```json
{
  "isRegistered": true,
  "lastRegistration": {
    "childId": "<child_inscription_id>",
    "timestamp": "2024-XX-XX...",
    "fee_sats": 50000,
    "paid_to": "tb1qexample..."
  }
}
```

Via browser:
- Navigate to `http://localhost:8080/inscription/<PARENT_ID>`
- The parent should now show "Active" status (watermark removed)
- The template fetches children and validates registration client-side

---

## Custom artwork injection (embedded image)

You can customize the parent template with your own artwork before inscribing.

### Option A: Manual edit
1. Edit `client/src/templates/inscription/registrationWrapper.html`
2. Find the `EMBED_DATA_URI` variable
3. Replace with your image as a data URI: `data:image/png;base64,...`
4. Inscribe the modified template

### Option B: Script-assisted injection
```bash
# Prepare custom parent with your image
node inscription-testing/prepare-parent.js \
  --image ./path/to/your-image.png \
  --template client/src/templates/inscription/registrationWrapper.html \
  --out inscription-testing/parent-custom.html

# Inscribe the customized parent
./scripts/signet-inscribe.sh \
  inscription-testing/parent-custom.html \
  1

# Save the parent ID
PARENT_ID="<inscription_id_from_output>"
echo "$PARENT_ID" > inscription-testing/.last_parent
```

Supported image formats: PNG, JPEG, GIF, WebP, SVG
Note: Large images increase inscription size and fees.

---

## Troubleshooting

### Bitcoin Core won't sync
- Check internet connection
- Verify firewall allows connections on port 38333
- Check logs: `tail -f ~/.bitcoin/signet/debug.log`
- Ensure sufficient disk space (Signet requires ~10GB)

### Ord server errors
- Ensure Bitcoin Core is fully synced before starting ord
- Check RPC credentials match in both configs
- Review ord logs: `tail -f logs/ord-signet.log`
- Try restarting ord after Bitcoin syncs

### No balance after faucet
- Wait for at least 1 confirmation (~10 minutes)
- Check transaction on explorer: https://mempool.space/signet
- Try alternative faucet if one is down
- Verify correct address format (should start with `tb1`)

### Inscription not appearing
- Wait for confirmation in a block
- Check ord indexing status: `curl http://localhost:8080/status`
- Verify inscription on explorer: https://mempool.space/signet/tx/<txid>
- Ensure ord is fully indexed (may take time on first run)

### Parent not showing as Registered
- Ensure child inscription is confirmed
- Verify child has correct parent reference
- Check child JSON format matches schema
- Try refreshing after a few minutes (indexer lag)
- Verify via API: `curl http://localhost:3001/api/registration/status/<parent_id>`

### Fee estimation issues
- Signet fees are typically very low (1 sat/vbyte works)
- If transaction stuck, wait for it to confirm (may take multiple blocks)
- Check mempool: https://mempool.space/signet

---

## Useful commands

### Check current block height
```bash
bitcoin-cli -rpcport=38332 -rpcuser=ordtest -rpcpassword=ordtest2024 getblockcount
```

### List wallet inscriptions
```bash
./scripts/signet-wallet.sh inscriptions
```

### Check cardinal UTXOs (safe to spend)
```bash
./scripts/signet-wallet.sh cardinals
```

### Monitor ord server logs
```bash
tail -f logs/ord-signet.log
```

### Stop services
```bash
./scripts/ord-signet-stop.sh
./scripts/signet-stop.sh
```

---

## Network comparison

| Aspect | Regtest | Signet |
|--------|---------|--------|
| Block time | Instant (manual) | ~10 minutes |
| Funding | Mine locally | Faucets |
| Persistence | Local only | Global testnet |
| Explorers | None | mempool.space/signet |
| Resets | On restart | Never |
| Other users | No | Yes |
| Disk usage | Minimal | ~10GB |

---

## Next steps

After successful testing on Signet:
1. Test with different wallet integrations (Unisat, Xverse)
2. Test multiple registrations for same parent
3. Test expiry scenarios (Phase 2)
4. Test buyer_pubkey validation (Phase 2)
5. Performance test with multiple inscriptions
6. Test on mainnet with real transactions (Phase 3)

---

## References

- Signet Faucets:
  - https://signet.bc-2.jp/
  - https://alt.signetfaucet.com/
- Signet Explorer: https://mempool.space/signet
- Ord Documentation: https://docs.ordinals.com/
- Bitcoin Signet Wiki: https://en.bitcoin.it/wiki/Signet
- Project Setup Guide: `docs/SIGNET-SETUP.md`