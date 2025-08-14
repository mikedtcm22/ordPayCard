#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

./inscription-testing/regtest-down.sh || true
./inscription-testing/regtest-up.sh
