#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")"
if [ ! -d node_modules ]; then
  npm ci --no-audit --no-fund
fi
if [ "${1:-}" = "--dev" ]; then
  exec npm run dev
fi
exec npm run testar
