const REPO = 'jnetart/leafio';

const ASSET_PATTERNS = {
  'macos-arm': /macOS_aarch64\.dmg$/i,
  'macos-x64': /macOS_x64\.dmg$/i,
  'windows-x64': /Windows_x64-setup\.exe$/i,
  'windows-arm': /Windows_arm64-setup\.exe$/i,
  'linux-x64': /Linux.*\.AppImage$/i,
};

const ASSET_FILES = {
  'macos-arm': (version) => `Leafio_${version}_macOS_aarch64.dmg`,
  'macos-x64': (version) => `Leafio_${version}_macOS_x64.dmg`,
  'windows-x64': (version) => `Leafio_${version}_Windows_x64-setup.exe`,
  'windows-arm': (version) => `Leafio_${version}_Windows_arm64-setup.exe`,
  'linux-x64': (version) => `Leafio_${version}_Linux_x64.AppImage`,
};

export function detectPlatform(info = {}) {
  const uaPlatform = String(info.userAgentData?.platform || '').toLowerCase();
  if (uaPlatform === 'macos' || uaPlatform === 'mac os') return 'macos';
  if (uaPlatform === 'windows') return 'windows';
  if (uaPlatform === 'linux') return 'linux';

  const platform = String(info.platform || '');
  const ua = String(info.userAgent || '');
  const blob = `${platform} ${ua}`.toLowerCase();

  // iPhone UA contains "like Mac OS X" — exclude mobile before matching Mac.
  if (/iphone|ipad|ipod|android/.test(blob)) return null;
  if (/\bmac/.test(blob) || blob.includes('macintosh')) return 'macos';
  if (blob.includes('win')) return 'windows';
  if (blob.includes('linux') || blob.includes('cros')) return 'linux';
  return null;
}

export function detectArch(info = {}, os) {
  const chArch = String(info.userAgentData?.architecture || '').toLowerCase();
  if (chArch === 'arm' || chArch === 'arm64' || chArch === 'aarch64') return 'arm';
  if (chArch === 'x86' || chArch === 'x86_64' || chArch === 'amd64') return 'x64';

  const ua = String(info.userAgent || '');

  if (os === 'windows') {
    if (/arm64|aarch64|windows arm/i.test(ua)) return 'arm';
    return 'x64';
  }

  if (os === 'macos') {
    const renderer = String(info.webglRenderer || '');
    if (/Intel|AMD|Radeon|NVIDIA/i.test(renderer)) return 'x64';
    if (/Apple/i.test(renderer)) return 'arm';
    // Safari reports MacIntel / "Intel Mac OS X" on Apple Silicon too.
    return 'arm';
  }

  return 'x64';
}

export function normalizeVersion(raw) {
  if (raw == null) return null;
  const s = String(raw).trim().replace(/^v/i, '');
  return /^\d+\.\d+/.test(s) ? s : null;
}

export function versionFromLatestJson(data) {
  return normalizeVersion(data?.version);
}

export function versionFromGithubRelease(data) {
  return normalizeVersion(data?.tag_name || data?.name);
}

export function assetUrlFor(key, version, assets) {
  if (Array.isArray(assets)) {
    const pattern = ASSET_PATTERNS[key];
    const hit = pattern && assets.find((asset) => asset && pattern.test(asset.name || ''));
    if (hit?.browser_download_url) return hit.browser_download_url;
  }
  const file = version && ASSET_FILES[key]?.(version);
  if (!file) return null;
  return `https://github.com/${REPO}/releases/download/v${version}/${file}`;
}
