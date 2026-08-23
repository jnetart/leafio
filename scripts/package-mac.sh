#!/usr/bin/env bash
# Build macOS Apple Silicon + Intel releases into `releases/<version>/`.
# Output: Leafio_<version>_macOS_<arch>.dmg
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
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

copy_dmg_for_arch() {
  local arch_label="$1"
  local app="$2"
  local dmg=""
  local cand
  for cand in \
    "$BUNDLE_DMG/Leafio_${VERSION}_${arch_label}.dmg" \
    "$BUNDLE_DMG/Leafio_${VERSION}_aarch64.dmg" \
    "$BUNDLE_DMG/Leafio_${VERSION}_x64.dmg" \
    "$BUNDLE_DMG"/Leafio_"${VERSION}"_*.dmg; do
    if [[ -f "$cand" ]]; then
      dmg="$cand"
      break
    fi
  done
  local dest="$RELEASES/Leafio_${VERSION}_${OS_LABEL}_${arch_label}.dmg"
  if [[ -z "$dmg" ]]; then
    echo "warn: Tauri DMG missing for ${arch_label}; creating with hdiutil"
    local stage
    stage="$(mktemp -d)"
    cp -R "$app" "$stage/Leafio.app"
    ln -sf /Applications "$stage/Applications"
    hdiutil create -volname "Leafio" -srcfolder "$stage" -ov -format UDZO "$dest"
    rm -rf "$stage"
  else
    cp -f "$dmg" "$dest"
  fi
  echo "Released $dest"
  ls -lh "$dest"
}

build_one() {
  local target="$1"
  local arch_label="$2"
  echo "==> Building macOS ${arch_label}${target:+ (${target})}"
  if [[ -n "$target" ]]; then
    npm run tauri -- build --target "$target" --bundles dmg
  else
    npm run tauri -- build --bundles dmg
  fi
  resolve_bundle_dirs "$target"

  local dest="$RELEASES/Leafio_${VERSION}_${OS_LABEL}_${arch_label}.dmg"
  local dmg=""
  for cand in \
    "$BUNDLE_DMG/Leafio_${VERSION}_${arch_label}.dmg" \
    "$BUNDLE_DMG/Leafio_${VERSION}_aarch64.dmg" \
    "$BUNDLE_DMG/Leafio_${VERSION}_x64.dmg" \
    "$BUNDLE_DMG"/Leafio_"${VERSION}"_*.dmg; do
    if [[ -f "$cand" ]]; then
      dmg="$cand"
      break
    fi
  done

  if [[ -n "$dmg" ]]; then
    cp -f "$dmg" "$dest"
    echo "Released $dest"
    ls -lh "$dest"
    return
  fi

  local app="$BUNDLE_MACOS/Leafio.app"
  if [[ ! -d "$app" ]]; then
    echo "error: neither DMG nor Leafio.app found under $BUNDLE_DMG / $BUNDLE_MACOS" >&2
    exit 1
  fi
  codesign --force --deep --sign - "$app"
  codesign --verify --deep --strict "$app"
  copy_dmg_for_arch "$arch_label" "$app"
}

if ! rustup target list --installed | grep -qx x86_64-apple-darwin; then
  echo "error: rust target x86_64-apple-darwin not installed" >&2
  echo "  rustup target add x86_64-apple-darwin" >&2
  exit 1
fi

build_one "" aarch64
build_one x86_64-apple-darwin x64

echo "Released to $RELEASES:"
ls -lh "$RELEASES"/Leafio_"${VERSION}"_"${OS_LABEL}"_*.dmg
