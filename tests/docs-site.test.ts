import { describe, expect, it } from 'vitest';
import {
  assetUrlFor,
  detectArch,
  detectPlatform,
  normalizeVersion,
  versionFromGithubRelease,
  versionFromLatestJson,
} from '../docs/assets/js/detect.mjs';

describe('detectPlatform', () => {
  it('reads userAgentData.platform first', () => {
    expect(detectPlatform({ userAgentData: { platform: 'macOS' } })).toBe('macos');
    expect(detectPlatform({ userAgentData: { platform: 'Windows' } })).toBe('windows');
    expect(detectPlatform({ userAgentData: { platform: 'Linux' } })).toBe('linux');
  });

  it('falls back to navigator.platform and userAgent', () => {
    expect(detectPlatform({ platform: 'MacIntel', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' })).toBe('macos');
    expect(detectPlatform({ platform: 'Win32', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' })).toBe('windows');
    expect(detectPlatform({ platform: 'Linux x86_64', userAgent: 'Mozilla/5.0 (X11; Linux x86_64)' })).toBe('linux');
  });

  it('returns null for phones and unknown agents', () => {
    expect(detectPlatform({ platform: 'iPhone', userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)' })).toBe(null);
    expect(detectPlatform({ platform: '', userAgent: 'UnknownBot/1.0' })).toBe(null);
  });
});

describe('detectArch', () => {
  it('uses UA-CH architecture when present', () => {
    expect(detectArch({ userAgentData: { architecture: 'arm' } }, 'macos')).toBe('arm');
    expect(detectArch({ userAgentData: { architecture: 'x86' } }, 'macos')).toBe('x64');
    expect(detectArch({ userAgentData: { architecture: 'arm' } }, 'windows')).toBe('arm');
  });

  it('treats Apple GPU renderers as Apple Silicon, Intel/AMD as Intel', () => {
    expect(detectArch({ webglRenderer: 'Apple M3 Pro' }, 'macos')).toBe('arm');
    expect(detectArch({ webglRenderer: 'ANGLE (Apple, ANGLE Metal Renderer: Apple GPU)' }, 'macos')).toBe('arm');
    expect(detectArch({ webglRenderer: 'Intel Iris Plus Graphics' }, 'macos')).toBe('x64');
    expect(detectArch({ webglRenderer: 'AMD Radeon Pro 5500M' }, 'macos')).toBe('x64');
  });

  it('does not trust MacIntel / Intel Mac OS X userAgent as Intel', () => {
    expect(
      detectArch(
        {
          platform: 'MacIntel',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15',
        },
        'macos',
      ),
    ).toBe('arm');
  });

  it('defaults Windows to x64 unless UA says ARM', () => {
    expect(detectArch({ userAgent: 'Windows NT 10.0; Win64; x64' }, 'windows')).toBe('x64');
    expect(detectArch({ userAgent: 'Windows NT 10.0; ARM64' }, 'windows')).toBe('arm');
  });
});

describe('release version and asset URLs', () => {
  it('normalizes v-prefixed versions', () => {
    expect(normalizeVersion('v0.8.43')).toBe('0.8.43');
    expect(normalizeVersion('0.8.43')).toBe('0.8.43');
    expect(normalizeVersion('')).toBe(null);
    expect(normalizeVersion('latest')).toBe(null);
  });

  it('reads version from latest.json and GitHub API payloads', () => {
    expect(versionFromLatestJson({ version: '0.9.0' })).toBe('0.9.0');
    expect(versionFromGithubRelease({ tag_name: 'v0.9.0' })).toBe('0.9.0');
  });

  it('prefers GitHub asset URLs, then constructs download URLs', () => {
    const assets = [
      {
        name: 'Leafio_0.9.0_macOS_aarch64.dmg',
        browser_download_url: 'https://example.test/arm.dmg',
      },
    ];
    expect(assetUrlFor('macos-arm', '0.9.0', assets)).toBe('https://example.test/arm.dmg');
    expect(assetUrlFor('macos-x64', '0.9.0', assets)).toBe(
      'https://github.com/jnetart/leafio/releases/download/v0.9.0/Leafio_0.9.0_macOS_x64.dmg',
    );
    expect(assetUrlFor('windows-x64', '0.9.0', null)).toBe(
      'https://github.com/jnetart/leafio/releases/download/v0.9.0/Leafio_0.9.0_Windows_x64-setup.exe',
    );
  });
});
