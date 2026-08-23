export type Platform = 'mac' | 'windows' | 'linux';

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  if (ua.includes('Mac')) {
    return 'mac';
  }
  if (ua.includes('Win')) {
    return 'windows';
  }
  return 'linux';
}

export const platform: Platform = detectPlatform();

export const isMac = platform === 'mac';
export const isWindows = platform === 'windows';
