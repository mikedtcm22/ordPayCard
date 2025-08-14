### Testing Guide: Phase 1 MVP (Regtest)

This guide walks you through an end-to-end manual test on regtest:
- 0) Bring up Bitcoin Core + ord with correct settings
- 1) Inscribe the parent (initially Unregistered)
- 2) Advance a few blocks
- 3) Inscribe a child registration JSON
- 4) Advance a few more blocks and observe parent switch to Registered (and verify via API)

Prereqs:
- Docker Desktop running
- Repo cloned; working dir at project root

References:
- Compose: `docker-compose.regtest.yml`
- Parent template: `client/src/templates/inscription/registrationWrapper.html`
- Registration JSON: will be created at `inscription-testing/registration.json`
- Helpers: `inscription-testing/mine.sh`, `inscription-testing/create-registration.sh`, `inscription-testing/sanity.sh`
- Server (status API): `server/` on port 3001

Special considerations (MVP):
- Use `/content/<ID>` for raw inscription content (ord versions may not support `/r/content/<ID>`)
- Children endpoints differ by ord version. This repo’s code handles both:
  - New: `/r/children/<PARENT_ID>/inscriptions` (returns objects with `id`)
  - Old: `/r/children/<PARENT_ID>` (returns `ids` array)
- If ord lags behind bitcoind, mine blocks and retry. In rare cases you can use `wallet --no-sync inscribe` to bypass a 1–2 block lag warning.

---

0) Bring up regtest stack and sanity-check

Option A (script):
```bash
./inscription-testing/sanity.sh
```
Expect: bitcoin healthy, ord HTTP OK, wallet receive prints an address.

Option B (manual):
```bash
docker compose -f docker-compose.regtest.yml up -d --build bitcoin
# wait healthy
CID=$(docker compose -f docker-compose.regtest.yml ps -q bitcoin); \
until [ "$(docker inspect -f '{{.State.Health.Status}}' "$CID")" = healthy ]; do sleep 1; done

docker compose -f docker-compose.regtest.yml up -d ord
curl -sf http://localhost:8080/r/blockheight || curl -sf http://localhost:8080/blockcount

# Ensure ord wallet exists and get an address
docker compose -f docker-compose.regtest.yml exec -T ord \
  sh -lc "ord --regtest --cookie-file /root/.bitcoin/regtest/.cookie \
  --bitcoin-rpc-url http://bitcoin:18443 wallet create || true"
ADDR=$(docker compose -f docker-compose.regtest.yml exec -T ord \
  sh -lc "ord --regtest --cookie-file /root/.bitcoin/regtest/.cookie \
  --bitcoin-rpc-url http://bitcoin:18443 wallet receive" \
  | sed -n 's/.*"\(bcrt1[^\"]*\)".*/\1/p'); echo "$ADDR"

# Fund (mine 101 blocks to your ord wallet address)
./inscription-testing/mine.sh "$ADDR" 101
```

Start the server (status API):
```bash
cd server
npm run dev
# Health: curl -s http://localhost:3001/health
```

---

1) Inscribe the parent (Unregistered state)

Template file:
- `client/src/templates/inscription/registrationWrapper.html`

Command:
```bash
docker compose -f docker-compose.regtest.yml exec -T ord sh -lc \
  "ord --regtest --cookie-file /root/.bitcoin/regtest/.cookie \
   --bitcoin-rpc-url http://bitcoin:18443 wallet inscribe \
   --fee-rate 1 --file /workspace/client/src/templates/inscription/registrationWrapper.html | tee /tmp/parent.log"

PID=$(docker compose -f docker-compose.regtest.yml exec -T ord sh -lc \
  "sed -n 's/.*\"id\": \"\([a-f0-9]\{64\}i[0-9]\)\".*/\1/p' /tmp/parent.log" | tr -d '\r')
echo "$PID" > inscription-testing/.last_parent
echo "Parent: $PID"
```

View parent:
- `http://localhost:8080/inscription/<PARENT_ID>` (shows Unregistered watermark)

Check API (optional):
```bash
curl -s http://localhost:3001/api/registration/status/$PID
```
Expect: `isRegistered:false`

---

2) Advance a few blocks

```bash
ADDR=$(docker compose -f docker-compose.regtest.yml exec -T ord \
  sh -lc "ord --regtest --cookie-file /root/.bitcoin/regtest/.cookie \
  --bitcoin-rpc-url http://bitcoin:18443 wallet receive" \
  | sed -n 's/.*"\(bcrt1[^\"]*\)".*/\1/p')
./inscription-testing/mine.sh "$ADDR" 2
```

---

3) Create and inscribe a child registration JSON

Files:
- Generated JSON: `inscription-testing/registration.json`

Create the JSON (helper script):
```bash
PID=$(cat inscription-testing/.last_parent)
./inscription-testing/create-registration.sh "$PID" tb1qexamplecreatoraddressxxxxxxxxxxxxxxxxxxxxxx 50000
```

Inscribe as child:
```bash
docker compose -f docker-compose.regtest.yml exec -T ord sh -lc \
  "ord --regtest --cookie-file /root/.bitcoin/regtest/.cookie \
   --bitcoin-rpc-url http://bitcoin:18443 wallet inscribe \
   --fee-rate 1 --parent $PID --file /workspace/inscription-testing/registration.json | tee /tmp/child.log"

CID=$(docker compose -f docker-compose.regtest.yml exec -T ord sh -lc \
  "sed -n 's/.*\"id\": \"\([a-f0-9]\{64\}i[0-9]\)\".*/\1/p' /tmp/child.log" | tr -d '\r')
echo "$CID" > inscription-testing/.last_child
echo "Child: $CID"
```

Verify child content (raw JSON):
```bash
curl -s http://localhost:8080/content/$CID
```

---

4) Advance a few more blocks and confirm Registered

```bash
ADDR=$(docker compose -f docker-compose.regtest.yml exec -T ord \
  sh -lc "ord --regtest --cookie-file /root/.bitcoin/regtest/.cookie \
  --bitcoin-rpc-url http://bitcoin:18443 wallet receive" \
  | sed -n 's/.*"\(bcrt1[^\"]*\)".*/\1/p')
./inscription-testing/mine.sh "$ADDR" 2
```

Check API status:
```bash
PID=$(cat inscription-testing/.last_parent)
curl -s http://localhost:3001/api/registration/status/$PID
```
Expect: `isRegistered:true` and `lastRegistration.childId` present.

Refresh parent in browser:
- `http://localhost:8080/inscription/<PARENT_ID>`
- The template attempts to fetch children via recursive endpoints; expect it to activate (badge switches to Active, watermark hides). If your ord version’s children endpoint is slower to surface, give it a few seconds or mine one more block and refresh.

---

Troubleshooting tips:
- ord behind bitcoind by 1–2 blocks: mine a few blocks; or use `wallet --no-sync inscribe` as:
  ```bash
  docker compose -f docker-compose.regtest.yml exec -T ord sh -lc \
    "ord --regtest --cookie-file /root/.bitcoin/regtest/.cookie \
     --bitcoin-rpc-url http://bitcoin:18443 wallet --no-sync inscribe ..."
  ```
- Use `/content/<ID>` for raw JSON; `/r/content/<ID>` may not be available on some versions.
- Children endpoints: try both `/r/children/<PARENT_ID>/inscriptions` and `/r/children/<PARENT_ID>`.
- If status API still shows `isRegistered:false`, mine 1–3 extra blocks and retry.

---

Customize parent artwork (embedded image)

You can inject a custom image into the parent template as a data URI and inscribe that customized HTML instead of the stock template.

Option A: one-off manual edit
- Open `client/src/templates/inscription/registrationWrapper.html`
- Find the line that defines `EMBED_DATA_URI`
- Replace it with a data URI for your image (e.g., `data:image/png;base64,...`)
- Inscribe using the edited file path in step 1

Option B: script-assisted injection
```bash
# Build a customized parent file from an image
node inscription-testing/prepare-parent.js \
  --image ./path/to/my-image.png \
  --template client/src/templates/inscription/registrationWrapper.html \
  --out inscription-testing/parent-custom.html

# Inscribe the customized parent
docker compose -f docker-compose.regtest.yml exec -T ord sh -lc \
  "ord --regtest --cookie-file /root/.bitcoin/regtest/.cookie \
   --bitcoin-rpc-url http://bitcoin:18443 wallet inscribe \
   --fee-rate 1 --file /workspace/inscription-testing/parent-custom.html | tee /tmp/parent.log"

PID=$(docker compose -f docker-compose.regtest.yml exec -T ord sh -lc \
  "sed -n 's/.*\"id\": \"\([a-f0-9]\{64\}i[0-9]\)\".*/\1/p' /tmp/parent.log" | tr -d '\r')
echo "$PID" > inscription-testing/.last_parent
echo "Parent: $PID"
```

Notes:
- Supported image types for the script: PNG/JPEG/GIF/WebP/SVG. Large images will increase parent size and fees.
- For most viewers, `/inscription/<ID>` and `/content/<ID>` both work; the template can self-identify via URL or referrer.

