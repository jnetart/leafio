#!/usr/bin/env node
// Build GitHub Releases updater manifest (`latest.json`) from packaged artifacts.
// Usage: node scripts/build-latest-json.mjs [releases/<version>]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const version = require(path.join(root, 'package.json')).version;
const releases = path.resolve(process.argv[2] || path.join(root, 'releases', version));
const repo = process.env.LEAFIO_GITHUB_REPO || 'jnetart/leafio';
const tag = process.env.LEAFIO_RELEASE_TAG || `v${version}`;
const baseUrl = `https://github.com/${repo}/releases/download/${tag}`;

if (!fs.existsSync(releases)) {
  console.error(`error: release directory not found: ${releases}`);
  process.exit(1);
}

const candidates = [
  ['darwin-aarch64', `Leafio_${version}_macOS_aarch64.app.tar.gz`],
  ['darwin-x86_64', `Leafio_${version}_macOS_x64.app.tar.gz`],
  ['windows-x86_64', `Leafio_${version}_Windows_x64-setup.exe`],
  ['windows-aarch64', `Leafio_${version}_Windows_arm64-setup.exe`],
  ['linux-x86_64', `Leafio_${version}_Linux_x64.AppImage`],
];

const platforms = {};
for (const [key, name] of candidates) {
  const artifact = path.join(releases, name);
  const sigFile = `${artifact}.sig`;
  if (!fs.existsSync(artifact)) continue;
  if (!fs.existsSync(sigFile)) {
    console.warn(`warning: skipping ${name} (missing .sig)`);
    continue;
  }
  platforms[key] = {
    url: `${baseUrl}/${name}`,
    signature: fs.readFileSync(sigFile, 'utf8').replace(/\r?\n/g, ''),
  };
}

if (Object.keys(platforms).length === 0) {
  console.error(`error: no signed updater artifacts found in ${releases}`);
  process.exit(1);
}

const out = path.join(releases, 'latest.json');
const manifest = {
  version,
  notes: `Leafio ${version}`,
  pub_date: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
  platforms,
};
fs.writeFileSync(out, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Wrote ${out}`);
console.log(`Upload this file (and the updater assets + .sig) to GitHub release ${tag}`);
