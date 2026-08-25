#!/usr/bin/env bash
# Build GitHub Releases updater manifest (`latest.json`) from packaged artifacts.
#
# Usage:
#   scripts/build-latest-json.sh [releases/<version>]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VERSION="$(node -p "require('$ROOT/package.json').version")"
RELEASES="${1:-$ROOT/releases/$VERSION}"
REPO="${LEAFIO_GITHUB_REPO:-jnetart/leafio}"
TAG="${LEAFIO_RELEASE_TAG:-v$VERSION}"
BASE_URL="https://github.com/${REPO}/releases/download/${TAG}"

if [[ ! -d "$RELEASES" ]]; then
  echo "error: release directory not found: $RELEASES" >&2
  exit 1
fi

node <<EOF
const fs = require('fs');
const path = require('path');

const version = ${JSON.stringify(VERSION)};
const releases = ${JSON.stringify(RELEASES)};
const baseUrl = ${JSON.stringify(BASE_URL)};
const tag = ${JSON.stringify(TAG)};

const candidates = [
  ['darwin-aarch64', \`Leafio_\${version}_macOS_aarch64.app.tar.gz\`],
  ['darwin-x86_64', \`Leafio_\${version}_macOS_x64.app.tar.gz\`],
  ['windows-x86_64', \`Leafio_\${version}_Windows_x64-setup.exe\`],
  ['windows-aarch64', \`Leafio_\${version}_Windows_arm64-setup.exe\`],
  ['linux-x86_64', \`Leafio_\${version}_Linux_x64.AppImage\`],
];

const platforms = {};
for (const [key, name] of candidates) {
  const artifact = path.join(releases, name);
  const sigFile = \`\${artifact}.sig\`;
  if (!fs.existsSync(artifact)) continue;
  if (!fs.existsSync(sigFile)) {
    console.warn(\`warning: skipping \${name} (missing .sig)\`);
    continue;
  }
  platforms[key] = {
    url: \`\${baseUrl}/\${name}\`,
    signature: fs.readFileSync(sigFile, 'utf8').replace(/\\r?\\n/g, ''),
  };
}

if (Object.keys(platforms).length === 0) {
  console.error(\`error: no signed updater artifacts found in \${releases}\`);
  process.exit(1);
}

const out = path.join(releases, 'latest.json');
const manifest = {
  version,
  notes: \`Leafio \${version}\`,
  pub_date: new Date().toISOString().replace(/\\.\\d{3}Z$/, 'Z'),
  platforms,
};
fs.writeFileSync(out, JSON.stringify(manifest, null, 2) + '\\n');
console.log(\`Wrote \${out}\`);
console.log(\`Upload this file (and the updater assets + .sig) to GitHub release \${tag}\`);
EOF
