#!/usr/bin/env bash
# Push v0.8.43 and publish GitHub Release assets.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VERSION="$(node -p "require('$ROOT/package.json').version")"
TAG="v${VERSION}"
RELEASE_DIR="$ROOT/releases/${VERSION}"

cd "$ROOT"

if [[ ! -d "$RELEASE_DIR" ]]; then
  echo "error: missing $RELEASE_DIR" >&2
  exit 1
fi

echo "==> Pushing commits and tag ${TAG}"
git push -u origin HEAD
git push origin "$TAG"

echo "==> Creating GitHub release ${TAG}"
gh release create "$TAG" \
  --title "Leafio ${VERSION}" \
  --notes "Leafio ${VERSION}

- In-app signed updates via GitHub Releases
- Editor width toggle in status bar
- Docs and language switch improvements" \
  "$RELEASE_DIR/Leafio_${VERSION}_macOS_aarch64.dmg" \
  "$RELEASE_DIR/Leafio_${VERSION}_macOS_x64.dmg" \
  "$RELEASE_DIR/Leafio_${VERSION}_Windows_x64-setup.exe" \
  "$RELEASE_DIR/Leafio_${VERSION}_Windows_arm64-setup.exe" \
  "$RELEASE_DIR/Leafio_${VERSION}_macOS_aarch64.app.tar.gz" \
  "$RELEASE_DIR/Leafio_${VERSION}_macOS_aarch64.app.tar.gz.sig" \
  "$RELEASE_DIR/Leafio_${VERSION}_macOS_x64.app.tar.gz" \
  "$RELEASE_DIR/Leafio_${VERSION}_macOS_x64.app.tar.gz.sig" \
  "$RELEASE_DIR/Leafio_${VERSION}_Windows_x64-setup.exe.sig" \
  "$RELEASE_DIR/Leafio_${VERSION}_Windows_arm64-setup.exe.sig" \
  "$RELEASE_DIR/latest.json"

echo "Done: https://github.com/jnetart/leafio/releases/tag/${TAG}"
