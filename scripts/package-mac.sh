#!/usr/bin/env bash
# Build macOS Apple Silicon + Intel releases into `releases/<version>/`.
# Output: Leafio_<version>_macOS_<arch>.dmg + updater .app.tar.gz(+.sig)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck source=signing-env.sh
source "$ROOT/scripts/signing-env.sh"
set_tauri_signing_env "$ROOT"

VERSION="$(node -p "require('$ROOT/package.json').version")"
RELEASES="$ROOT/releases/$VERSION"
OS_LABEL="macOS"

mkdir -p "$RELEASES"
cd "$ROOT"

export PATH="${HOME}/.rustup/toolchains/stable-aarch64-apple-darwin/bin:${HOME}/.cargo/bin:$PATH"
export CARGO_TARGET_DIR="${CARGO_TARGET_DIR:-$ROOT/src-tauri/target}"

resolve_bundle_dirs() {
  local target="${1:-}"
  local target_dir="${CARGO_TARGET_DIR:-$ROOT/src-tauri/target}"
  local base
  if [[ -n "$target" ]]; then
    base="$target_dir/$target/release/bundle"
  else
    base="$target_dir/release/bundle"
  fi
  BUNDLE_MACOS="$base/macos"
  BUNDLE_DMG="$base/dmg"
}

find_built_dmg() {
  local arch_label="$1"
  local cand
  for cand in \
    "$BUNDLE_DMG/Leafio_${VERSION}_${arch_label}.dmg" \
    "$BUNDLE_DMG/Leafio_${VERSION}_aarch64.dmg" \
    "$BUNDLE_DMG/Leafio_${VERSION}_x64.dmg" \
    "$BUNDLE_DMG"/Leafio_"${VERSION}"_*.dmg; do
    if [[ -f "$cand" ]]; then
      echo "$cand"
      return 0
    fi
  done
  return 1
}

sign_app() {
  local app="$1"
  if [[ ! -d "$app" ]]; then
    echo "error: app bundle not found: $app" >&2
    exit 1
  fi
  echo "==> Ad-hoc signing $app"
  codesign --force --deep --sign - "$app"
  codesign --verify --deep --strict "$app"
}

publish_dmg() {
  local arch_label="$1"
  local app="$2"
  local dest="$RELEASES/Leafio_${VERSION}_${OS_LABEL}_${arch_label}.dmg"
  echo "==> Creating DMG for ${arch_label}"
  local stage
  stage="$(mktemp -d)"
  cp -R "$app" "$stage/Leafio.app"
  ln -sf /Applications "$stage/Applications"
  hdiutil create -volname "Leafio" -srcfolder "$stage" -ov -format UDZO "$dest"
  rm -rf "$stage"
  echo "Released $dest"
  ls -lh "$dest"
}

publish_updater_archive() {
  local arch_label="$1"
  local tar_src=""
  local cand
  for cand in \
    "$BUNDLE_MACOS/Leafio.app.tar.gz" \
    "$BUNDLE_MACOS"/Leafio*.app.tar.gz; do
    if [[ -f "$cand" ]]; then
      tar_src="$cand"
      break
    fi
  done
  if [[ -z "$tar_src" ]]; then
    echo "error: updater archive Leafio.app.tar.gz not found under $BUNDLE_MACOS" >&2
    echo "  Ensure createUpdaterArtifacts is enabled and TAURI_SIGNING_PRIVATE_KEY is set." >&2
    exit 1
  fi
  if [[ ! -f "${tar_src}.sig" ]]; then
    echo "error: missing signature ${tar_src}.sig" >&2
    exit 1
  fi
  local dest="$RELEASES/Leafio_${VERSION}_${OS_LABEL}_${arch_label}.app.tar.gz"
  cp -f "$tar_src" "$dest"
  cp -f "${tar_src}.sig" "${dest}.sig"
  echo "Released updater $dest"
  ls -lh "$dest" "${dest}.sig"
}

build_one() {
  local target="$1"
  local arch_label="$2"
  echo "==> Building macOS ${arch_label}${target:+ (${target})}"
  # `app` is required for updater .app.tar.gz(+.sig); `dmg` is the installable package.
  if [[ -n "$target" ]]; then
    npm run tauri -- build --target "$target" --bundles app,dmg
  else
    npm run tauri -- build --bundles app,dmg
  fi
  resolve_bundle_dirs "$target"
  publish_updater_archive "$arch_label"

  local app="$BUNDLE_MACOS/Leafio.app"
  # Always ad-hoc sign the .app and rebuild the DMG. Copying Tauri's DMG can
  # ship an unsigned bundle (Gatekeeper "damaged" dialog) even when
  # signingIdentity is "-".
  if [[ -d "$app" ]]; then
    sign_app "$app"
    publish_dmg "$arch_label" "$app"
    return
  fi

  local dmg=""
  if dmg="$(find_built_dmg "$arch_label")"; then
    echo "warning: Leafio.app missing after build; extracting from Tauri DMG to ad-hoc sign"
    local mount
    mount="$(mktemp -d)"
    hdiutil attach "$dmg" -nobrowse -readonly -mountpoint "$mount"
    if [[ ! -d "$mount/Leafio.app" ]]; then
      hdiutil detach "$mount" -quiet || true
      echo "error: Leafio.app not found inside $dmg" >&2
      exit 1
    fi
    local stage
    stage="$(mktemp -d)"
    cp -R "$mount/Leafio.app" "$stage/Leafio.app"
    hdiutil detach "$mount" -quiet
    rmdir "$mount" || true
    sign_app "$stage/Leafio.app"
    publish_dmg "$arch_label" "$stage/Leafio.app"
    rm -rf "$stage"
    return
  fi

  echo "error: neither DMG nor Leafio.app found under $BUNDLE_DMG / $BUNDLE_MACOS" >&2
  exit 1
}

if ! rustup target list --installed | grep -qx x86_64-apple-darwin; then
  echo "error: rust target x86_64-apple-darwin not installed" >&2
  echo "  rustup target add x86_64-apple-darwin" >&2
  exit 1
fi

build_one "" aarch64
build_one x86_64-apple-darwin x64

bash "$ROOT/scripts/build-latest-json.sh" "$RELEASES" || true

echo "Released to $RELEASES:"
ls -lh "$RELEASES"/Leafio_"${VERSION}"_"${OS_LABEL}"_*
