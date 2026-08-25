#!/usr/bin/env bash
# Ensure TAURI_SIGNING_PRIVATE_KEY is available for updater artifact signing.
# Prefer an already-exported env var; otherwise load from .tauri/leafio.key.
set_tauri_signing_env() {
  local root="$1"
  if [[ -n "${TAURI_SIGNING_PRIVATE_KEY:-}" || -n "${TAURI_SIGNING_PRIVATE_KEY_PATH:-}" ]]; then
    return 0
  fi
  local key_file="$root/.tauri/leafio.key"
  if [[ -f "$key_file" ]]; then
    export TAURI_SIGNING_PRIVATE_KEY="$(cat "$key_file")"
    export TAURI_SIGNING_PRIVATE_KEY_PASSWORD="${TAURI_SIGNING_PRIVATE_KEY_PASSWORD:-}"
    echo "note: using updater signing key from $key_file"
    return 0
  fi
  echo "error: missing updater signing key." >&2
  echo "  Generate once: npm run tauri signer generate -- -w .tauri/leafio.key" >&2
  echo "  Or set TAURI_SIGNING_PRIVATE_KEY / TAURI_SIGNING_PRIVATE_KEY_PATH" >&2
  exit 1
}
