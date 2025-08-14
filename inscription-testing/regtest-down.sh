#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "[regtest] Stopping and removing stack..."
docker compose -f docker-compose.regtest.yml down -v

echo "[regtest] Done."
