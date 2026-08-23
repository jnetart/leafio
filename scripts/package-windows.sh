#!/usr/bin/env bash
# Cross-compile Windows x64 + ARM64 installers into `releases/<version>/`.
# Output:
#   Leafio_<version>_Windows_<arch>-setup.exe  (NSIS)
#   Leafio_<version>_Windows_<arch>.msi        (WiX; Windows host only)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VERSION="$(node -p "require('$ROOT/package.json').version")"
RELEASES="$ROOT/releases/$VERSION"
OS_LABEL="Windows"

if [[ -d /opt/homebrew/opt/llvm/bin ]]; then
  export PATH="/opt/homebrew/opt/llvm/bin:$PATH"
fi
if [[ -d /opt/homebrew/opt/lld/bin ]]; then
  export PATH="/opt/homebrew/opt/lld/bin:$PATH"
fi
export PATH="${HOME}/.rustup/toolchains/stable-aarch64-apple-darwin/bin:${HOME}/.cargo/bin:/opt/homebrew/bin:$PATH"

need() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "error: missing dependency '$1'" >&2
    exit 1
  fi
}

need makensis
need llvm-rc
need cargo-xwin
need rustc
need cargo

for t in x86_64-pc-windows-msvc aarch64-pc-windows-msvc; do
  if ! rustup target list --installed | grep -qx "$t"; then
    echo "error: rust target $t not installed" >&2
    exit 1
  fi
done

mkdir -p "$RELEASES"
cd "$ROOT"

export XWIN_CACHE_DIR="${XWIN_CACHE_DIR:-$ROOT/.xwin-cache}"
export CARGO_TARGET_DIR="${CARGO_TARGET_DIR:-$ROOT/src-tauri/target}"

SHIM_DIR="$ROOT/.xwin-cache/clang-shim"
mkdir -p "$SHIM_DIR"
cat >"$SHIM_DIR/clang" <<'SHIM'
#!/bin/sh
self_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
real=""
IFS=:
for d in $PATH; do
  [ "$d" = "$self_dir" ] && continue
  if [ -x "$d/clang" ]; then real="$d/clang"; break; fi
done
unset IFS
[ -n "$real" ] || { echo "xwin-clang-shim: real clang not found on PATH" >&2; exit 127; }
n=0
for a in "$@"; do
  [ "$a" = "/imsvc" ] && a="-isystem"
  eval "arg_$n=\$a"; n=$((n+1))
done
i=0; set --
while [ "$i" -lt "$n" ]; do eval "v=\$arg_$i"; set -- "$@" "$v"; i=$((i+1)); done
exec "$real" "$@"
SHIM
chmod +x "$SHIM_DIR/clang"
export PATH="$SHIM_DIR:$PATH"

NSIS_UTILS_DIR="${HOME}/Library/Caches/tauri/NSIS/Plugins/x86-unicode/additional"
NSIS_UTILS_DLL="${NSIS_UTILS_DIR}/nsis_tauri_utils.dll"
NSIS_UTILS_SHA1="75197fee3c6a814fe035788d1c34ead39349b860"
if [[ ! -f "$NSIS_UTILS_DLL" ]] || [[ "$(shasum -a 1 "$NSIS_UTILS_DLL" | awk '{print $1}')" != "$NSIS_UTILS_SHA1" ]]; then
  mkdir -p "$NSIS_UTILS_DIR"
  for url in \
    "https://ghfast.top/https://github.com/tauri-apps/nsis-tauri-utils/releases/download/nsis_tauri_utils-v0.5.3/nsis_tauri_utils.dll" \
    "https://github.com/tauri-apps/nsis-tauri-utils/releases/download/nsis_tauri_utils-v0.5.3/nsis_tauri_utils.dll"
  do
    if curl -fsSL --connect-timeout 20 --max-time 120 -o "$NSIS_UTILS_DLL" "$url"; then
      break
    fi
  done
fi

HOST_IS_WINDOWS=0
case "$(uname -s)" in
  MINGW*|MSYS*|CYGWIN*|Windows_NT) HOST_IS_WINDOWS=1 ;;
esac

BUNDLES="nsis"
if [[ "$HOST_IS_WINDOWS" -eq 1 ]]; then
  BUNDLES="nsis,msi"
else
  echo "note: MSI (WiX) requires a Windows host; this run produces NSIS setup.exe only."
fi

find_bundle_dir() {
  local target="$1"
  local kind="$2"
  local target_dir="${CARGO_TARGET_DIR:-$ROOT/src-tauri/target}"
  echo "$target_dir/${target}/release/bundle/${kind}"
}

copy_nsis() {
  local target="$1"
  local arch_label="$2"
  local nsis_dir
  nsis_dir="$(find_bundle_dir "$target" nsis)"

  local setup=""
  for cand in \
    "$nsis_dir/Leafio_${VERSION}_${arch_label}-setup.exe" \
    "$nsis_dir"/Leafio_"${VERSION}"_*-setup.exe; do
    if [[ -f "$cand" ]]; then
      setup="$cand"
      break
    fi
  done

  if [[ -z "$setup" ]]; then
    echo "error: NSIS setup not found under $nsis_dir" >&2
    ls -la "$nsis_dir" 2>/dev/null || true
    exit 1
  fi

  local dest="$RELEASES/Leafio_${VERSION}_${OS_LABEL}_${arch_label}-setup.exe"
  cp -f "$setup" "$dest"
  echo "Released $dest"
  ls -lh "$dest"
}

copy_msi() {
  local target="$1"
  local arch_label="$2"
  local msi_dir
  msi_dir="$(find_bundle_dir "$target" msi)"

  local msi=""
  for cand in \
    "$msi_dir/Leafio_${VERSION}_${arch_label}_en-US.msi" \
    "$msi_dir/Leafio_${VERSION}_${arch_label}.msi" \
    "$msi_dir"/Leafio_"${VERSION}"_*.msi; do
    if [[ -f "$cand" ]]; then
      msi="$cand"
      break
    fi
  done

  if [[ -z "$msi" ]]; then
    echo "error: MSI not found under $msi_dir" >&2
    ls -la "$msi_dir" 2>/dev/null || true
    exit 1
  fi

  local dest="$RELEASES/Leafio_${VERSION}_${OS_LABEL}_${arch_label}.msi"
  cp -f "$msi" "$dest"
  echo "Released $dest"
  ls -lh "$dest"
}

build_one() {
  local target="$1"
  local arch_label="$2"
  echo "==> Building Windows ${arch_label} (${target}) bundles=${BUNDLES}"
  if [[ "$HOST_IS_WINDOWS" -eq 1 ]]; then
    npm run tauri -- build --target "$target" --bundles "$BUNDLES"
  else
    npm run tauri -- build --runner cargo-xwin --target "$target" --bundles "$BUNDLES"
  fi
  copy_nsis "$target" "$arch_label"
  if [[ "$HOST_IS_WINDOWS" -eq 1 ]]; then
    copy_msi "$target" "$arch_label"
  fi
}

build_one x86_64-pc-windows-msvc x64
build_one aarch64-pc-windows-msvc arm64

echo
echo "Windows packages in $RELEASES:"
ls -lh "$RELEASES"/Leafio_"${VERSION}"_"${OS_LABEL}"_* 2>/dev/null || true
