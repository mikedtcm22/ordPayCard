# Regtest Automated Testing Environment for Ordinals Projects

This document describes a standalone, repeatable setup to spin up an automated testing environment for Bitcoin Ordinals projects on regtest, designed to be driven by an LLM or CI system. It captures required tools, container settings, environment variables, and deterministic command flows. Use this as a base for future projects with different inscription schemas.

## Goals

- Fast, fully local regtest network (Bitcoin Core + ord) in Docker
- Deterministic, non-interactive commands suitable for automation
- Minimal moving parts; clear remediation for common errors
- Works across projects by parameterizing only file paths and IDs

## Prerequisites

- macOS with Docker Desktop installed and running
- Git, curl
- Shell: bash or zsh
- Optional: jq (for JSON pretty-printing when used outside containers)

## Components

- Bitcoin Core (regtest) with txindex enabled
- ord (CLI + HTTP server) connected to Bitcoin Core via cookie RPC
- Project workspace bind-mounted to ord for inscription file access
- Health checks and predictable service names (`bitcoin`, `ord`)

## Directory assumptions

- Project root contains:
  - `docker-compose.regtest.yml` (compose file for regtest)
  - `inscription-testing/` (utility scripts and docs)
  - Inscription source files, e.g. `client/src/templates/inscription/*.html`

## Docker Compose (regtest)

Recommended baseline `docker-compose.regtest.yml` with required settings and proven fixes:

```yaml
services:
  bitcoin:
    image: bitcoin/bitcoin:28.1
    command:
      - -regtest=1
      - -server=1
      - -txindex=1
      - -listen=1
      - -rpcallowip=0.0.0.0/0
      - -rpcbind=0.0.0.0
      - -fallbackfee=0.0002
    ports:
      - "18443:18443"  # RPC
    volumes:
      - bitcoin-data:/home/bitcoin/.bitcoin
    healthcheck:
      test: ["CMD-SHELL", "bitcoin-cli -regtest -rpccookiefile=/home/bitcoin/.bitcoin/regtest/.cookie getblockchaininfo >/dev/null 2>&1 || exit 1"]
      interval: 1s
      timeout: 5s
      retries: 300

  ord:
    # Option A (recommended): build ord from a pinned Dockerfile
    build:
      context: .
      dockerfile: inscription-testing/ord.Dockerfile
    depends_on:
      bitcoin:
        condition: service_healthy
    command: ["--regtest", "--cookie-file", "/root/.bitcoin/regtest/.cookie", "--bitcoin-rpc-url", "http://bitcoin:18443", "server", "--http-port", "8080"]
    environment:
      - ORD_BITCOIN_RPC_COOKIE=/root/.bitcoin/regtest/.cookie
      - ORD_BITCOIN_RPC_URL=http://bitcoin:18443
      # Critical for CLI flows: prevents 127.0.0.1/blockcount probe failures
      - ORD_SERVER_URL=http://127.0.0.1:8080
    ports:
      - "8080:8080"
    volumes:
      - ./:/workspace
      - ord-data:/root/.ord
      - bitcoin-data:/root/.bitcoin
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:8080/r/blockheight"]
      interval: 5s
      timeout: 5s
      retries: 30

volumes:
  bitcoin-data:
  ord-data:
```

Notes:
- `ORD_SERVER_URL` is required so ord CLI subcommands that internally probe the server do not default to `http://127.0.0.1/blockcount` and fail.
- The healthcheck uses the `/r/blockheight` recursive endpoint; `/blockcount` may also be available depending on ord version.

## ord Dockerfile (pinned build)

Pinning ord avoids surprises when upstream releases change CLI behavior. Example `inscription-testing/ord.Dockerfile`:

```dockerfile
FROM rust:1.81-bullseye as builder
RUN apt-get update && apt-get install -y --no-install-recommends git pkg-config libssl-dev build-essential ca-certificates wget && rm -rf /var/lib/apt/lists/*
RUN rustup toolchain install nightly && rustup default nightly
WORKDIR /src
RUN git clone https://github.com/ordinals/ord.git
WORKDIR /src/ord
# Choose a known-good tag compatible with Bitcoin Core 28.x, or rely on runtime 0.23.x if present
RUN git fetch --tags && git checkout v0.15.0 || true
RUN cargo build --release

FROM debian:bullseye-slim
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates wget && rm -rf /var/lib/apt/lists/*
COPY --from=builder /src/ord/target/release/ord /usr/local/bin/ord
EXPOSE 8080
WORKDIR /workspace
ENTRYPOINT ["ord"]
```

If your base image already includes ord (e.g., runtime 0.23.x), the compose build step may be bypassed. Verify with `ord --version` inside the container.

## Bring-up sequence (automation-friendly)

Always run non-interactively and avoid TTY requirements.

1) Start Bitcoin Core and wait for health:

```bash
docker compose -f docker-compose.regtest.yml up -d --build bitcoin
# Wait until healthy
CID=$(docker compose -f docker-compose.regtest.yml ps -q bitcoin); \
until [ "$(docker inspect -f '{{.State.Health.Status}}' "$CID")" = "healthy" ]; do sleep 1; done
```

2) Start ord server:

```bash
docker compose -f docker-compose.regtest.yml up -d ord
```

3) Verify ord HTTP is serving (either endpoint works depending on version):

```bash
curl -sf http://localhost:8080/r/blockheight || curl -sf http://localhost:8080/blockcount
```

## Wallet and funding (CLI-only flow)

Use explicit cookie-file and RPC URL. Global flags MUST precede subcommands.

```bash
# Create or load ord wallet (idempotent)
docker compose -f docker-compose.regtest.yml exec -T ord \
  sh -lc "ord --regtest --cookie-file /root/.bitcoin/regtest/.cookie \
  --bitcoin-rpc-url http://bitcoin:18443 wallet create || true"

# Obtain a receive address (parse with sed to avoid jq dependency)
ADDR=$(docker compose -f docker-compose.regtest.yml exec -T ord \
  sh -lc "ord --regtest --cookie-file /root/.bitcoin/regtest/.cookie \
  --bitcoin-rpc-url http://bitcoin:18443 wallet receive" \
  | sed -n 's/.*"\(bcrt1[^\"]*\)".*/\1/p'); echo "$ADDR"

# Read RPC cookie from node (host-side curl to exposed 18443)
COOKIE=$(docker compose -f docker-compose.regtest.yml exec -T bitcoin \
  sh -lc "cat /home/bitcoin/.bitcoin/regtest/.cookie" | tr -d '\r')

# Mine 101 blocks to fund wallet using curl JSON-RPC
curl -sS --user ${COOKIE} \
  --data-binary '{"jsonrpc":"1.0","id":"curl","method":"generatetoaddress","params":[101,"'"$ADDR"'"]}' \
  -H 'content-type:text/plain;' http://127.0.0.1:18443/
```

Why curl? Some Bitcoin images don’t include `bitcoin-cli` on PATH under the default shell in containers. Curl to the mapped RPC port is robust and avoids shell differences.

## Inscribing (parent and children)

Parent inscription from a project file mounted at `/workspace`:

```bash
FILE=/workspace/client/src/templates/inscription/registrationWrapper.html
docker compose -f docker-compose.regtest.yml exec -T ord sh -lc \
  "ord --regtest --cookie-file /root/.bitcoin/regtest/.cookie \
   --bitcoin-rpc-url http://bitcoin:18443 wallet inscribe \
   --fee-rate 1 --file $FILE | tee /tmp/parent.log"

# Extract and persist the inscription ID artifact
ID=$(docker compose -f docker-compose.regtest.yml exec -T ord sh -lc \
  "sed -n 's/.*\"id\": \"\([a-f0-9]\{64\}i[0-9]\)\".*/\1/p' /tmp/parent.log" | tr -d '\r')
echo "$ID" > inscription-testing/.last_parent
echo "Parent inscription: $ID"
echo "View: http://localhost:8080/inscription/$ID"
```

For child inscriptions (e.g., receipts/metadata), repeat the `wallet inscribe` step with the appropriate `--file` path. Save to `inscription-testing/.last_child` or a project-specific artifact name.

## LLM/CI automation guidelines

- Always pass global ord flags before subcommands: `ord [GLOBAL_FLAGS] wallet receive` (not after)
- Use `docker compose exec -T` to disable TTY; avoid interactive prompts
- Pipe outputs to `tee` or `| cat` to prevent pagers and capture logs
- Avoid tools not guaranteed inside containers (e.g., jq). Use sed/grep for simple extraction
- Check health via `docker inspect` rather than waiting on logs
- Persist artifacts (`.last_parent`, `.last_child`) for later steps
- Keep inscription file paths under `/workspace` to simplify container access

## Troubleshooting playbook

Symptom: `error sending request for url (http://127.0.0.1/blockcount)`
- Cause: ord CLI probed server URL without config
- Fix: set `ORD_SERVER_URL=http://127.0.0.1:8080` in the ord service environment

Symptom: `Bitcoin Core 28.0.0 or newer required`
- Cause: ord binary expects a newer node
- Fix: use `bitcoin/bitcoin:28.1` (or newer) image

Symptom: `cookie file ... does not exist`
- Cause: volume mount mismatch or wrong path
- Fix: ensure `bitcoin-data` volume is mounted into ord at `/root/.bitcoin` and into bitcoin at `/home/bitcoin/.bitcoin`; reference `/root/.bitcoin/regtest/.cookie` from ord

Symptom: `Database already open. Cannot acquire lock.` when running `ord index` while server is up
- Cause: concurrent index access by server and CLI
- Fix: prefer using CLI flows without `index update` while server is running; or stop server first

Symptom: `Error: No bech32 addresses available.` from `getnewaddress` via RPC
- Context: not needed if you mine to the ord wallet receive address; prefer the ord-generated `bcrt1...` address

## Health verification

- Bitcoin RPC live: `curl -sS --user ${COOKIE} --data-binary '{"jsonrpc":"1.0","id":"curl","method":"getblockchaininfo","params":[]}' -H 'content-type:text/plain;' http://127.0.0.1:18443/`
- ord server live: `curl -sf http://localhost:8080/r/blockheight || curl -sf http://localhost:8080/blockcount`
- View inscription: `http://localhost:8080/inscription/<INSCRIPTION_ID>`

## Suggested scripts (optional)

Create thin wrappers in `inscription-testing/` for convenience:

- `regtest-up.sh`: start bitcoin; wait healthy; print RPC port
- `regtest-down.sh`: `docker compose -f docker-compose.regtest.yml down -v`
- `regtest-reset.sh`: down + up
- `regtest-inscribe-parent.sh`: end-to-end flow (start ord, wallet create/receive, fund, inscribe, save ID)
- `mine.sh`: mine N blocks to a given regtest address via JSON-RPC curl
- `sanity.sh`: quick environment verification (bitcoin health, cookie, ord HTTP, wallet receive)

These wrappers should:
- Be idempotent
- Exit non-zero on failure (`set -euo pipefail`)
- Use `docker compose -f docker-compose.regtest.yml exec -T ...` and explicit flags

## .gitignore recommendations

- Ignore transient artifacts and logs:
  - `inscription-testing/.last_parent`
  - `inscription-testing/.last_child`
  - `inscription-testing/*.log`
  - `inscription-testing/tmp/`

## Security notes

- regtest only; do not use real funds
- ord has access to Bitcoin Core wallets; do not connect it to production wallets

## Porting to new projects

To reuse this environment on a different Ordinals project:
- Copy `docker-compose.regtest.yml` and ensure volume paths match the new repo structure
- Ensure your inscription files are mounted under `/workspace/...`
- Keep `ORD_SERVER_URL` and cookie/RPC settings unchanged
- Update inscription file paths in scripts to point to your new templates/binaries

## Appendix: Quick checklist

- Docker Desktop running
- `docker-compose.regtest.yml` present with `ORD_SERVER_URL`
- `bitcoin` healthy; ord listening on 8080
- Wallet created; receive address obtained
- Blocks mined to that address (101+)
- Parent inscribed; ID saved to `inscription-testing/.last_parent`

This setup has been validated with Bitcoin Core 28.1 and ord 0.23.x (runtime) and with a pinned ord build (v0.15.0) for CLI compatibility. Adjust versions as needed, keeping the configuration and flow unchanged.

