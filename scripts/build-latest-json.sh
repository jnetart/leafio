#!/usr/bin/env bash
# Build GitHub Releases updater manifest (`latest.json`) from packaged artifacts.
#
# Usage:
#   scripts/build-latest-json.sh [releases/<version>]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
exec node "$ROOT/scripts/build-latest-json.mjs" "$@"
