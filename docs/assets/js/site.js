import {
  assetUrlFor,
  detectArch,
  detectPlatform,
  versionFromGithubRelease,
  versionFromLatestJson,
} from './detect.mjs';

const FALLBACK_VERSION = '0.8.43';
const LATEST_JSON = 'https://github.com/jnetart/leafio/releases/latest/download/latest.json';
const GITHUB_API = 'https://api.github.com/repos/jnetart/leafio/releases/latest';

function currentLang() {
  return document.documentElement.lang === 'en' ? 'en' : 'zh';
}

function t(key) {
  const table = globalThis.LeafioI18N || {};
  return table[key]?.[currentLang()] || table[key]?.zh || '';
}

function readWebGLRenderer() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return '';
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    if (!ext) return '';
    return String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || '');
  } catch {
    return '';
  }
}

function navigatorInfo(extra = {}) {
  const uaData = navigator.userAgentData;
  return {
    platform: navigator.platform,
    userAgent: navigator.userAgent,
    userAgentData: uaData
      ? { platform: uaData.platform, architecture: extra.architecture || '' }
      : undefined,
    webglRenderer: extra.webglRenderer ?? readWebGLRenderer(),
  };
}

async function refineArchitecture(os) {
  try {
    if (navigator.userAgentData?.getHighEntropyValues) {
      const { architecture } = await navigator.userAgentData.getHighEntropyValues([
        'architecture',
      ]);
      if (architecture) {
        return detectArch(
          navigatorInfo({ architecture, webglRenderer: readWebGLRenderer() }),
          os,
        );
      }
    }
  } catch {
    // UA-CH architecture is optional.
  }
  return detectArch(navigatorInfo(), os);
}

function computedDark() {
  const saved = localStorage.getItem('leafio-theme');
  if (saved === 'dark') return true;
  if (saved === 'light') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function applyThemeClass() {
  const dark = computedDark();
  document.documentElement.classList.toggle('dark', dark);
  document.querySelectorAll('.shot-light').forEach((el) => {
    el.toggleAttribute('aria-hidden', dark);
  });
  document.querySelectorAll('.shot-dark').forEach((el) => {
    el.toggleAttribute('aria-hidden', !dark);
  });
}

function initTheme() {
  applyThemeClass();
  const btn = document.querySelector('.theme-toggle');
  btn?.addEventListener('click', () => {
    localStorage.setItem('leafio-theme', computedDark() ? 'light' : 'dark');
    applyThemeClass();
  });
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const onChange = () => {
    if (!localStorage.getItem('leafio-theme')) applyThemeClass();
  };
  if (mq.addEventListener) mq.addEventListener('change', onChange);
  else mq.addListener(onChange);
}

async function fetchLatestRelease() {
  try {
    const res = await fetch(LATEST_JSON, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      const version = versionFromLatestJson(data);
      if (version) return { version, assets: null };
    }
  } catch {
    // github.com release assets typically omit CORS — try the API next.
  }
  try {
    const res = await fetch(GITHUB_API, {
      cache: 'no-store',
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (res.ok) {
      const data = await res.json();
      const version = versionFromGithubRelease(data);
      if (version) return { version, assets: data.assets || [] };
    }
  } catch {
    // offline or rate-limited
  }
  return { version: FALLBACK_VERSION, assets: null };
}

function setVersions(version) {
  document.querySelectorAll('.js-app-version').forEach((el) => {
    el.textContent = version;
  });
}

function smartLabel(os, arch) {
  const platformKey = os === 'windows' ? 'download.windows' : 'download.macos';
  const archKey =
    os === 'windows'
      ? arch === 'arm'
        ? 'download.windows.arm64'
        : 'download.windows.x64'
      : arch === 'arm'
        ? 'download.macos.arm'
        : 'download.macos.intel';
  const tpl =
    t('download.smart') ||
    (currentLang() === 'en' ? 'Download {platform} · {arch}' : '下载 {platform} · {arch}');
  return tpl.replace('{platform}', t(platformKey)).replace('{arch}', t(archKey));
}

function assetKey(os, arch) {
  if (os === 'macos') return arch === 'arm' ? 'macos-arm' : 'macos-x64';
  if (os === 'windows') return arch === 'arm' ? 'windows-arm' : 'windows-x64';
  return null;
}

function emphasizeArch(card, arch) {
  const actions = card.querySelector('.download-actions');
  if (!actions) return;
  const buttons = [...actions.querySelectorAll('[data-arch]')];
  if (buttons.length === 0) return;
  const match = buttons.find((btn) => btn.dataset.arch === arch) || buttons[0];
  buttons.forEach((btn) => {
    const on = btn === match;
    btn.classList.toggle('btn-primary', on);
    btn.classList.toggle('btn-outline', !on);
  });
  if (match !== actions.firstElementChild) {
    actions.insertBefore(match, actions.firstChild);
  }
}

function applyReleaseUrls(version, assets) {
  document.querySelectorAll('[data-asset]').forEach((el) => {
    const url = assetUrlFor(el.dataset.asset, version, assets);
    if (url && el.tagName === 'A') el.setAttribute('href', url);
  });
}

function highlightDetected(os, arch) {
  document.querySelectorAll('.platform-card[data-platform]').forEach((card) => {
    const detected = card.dataset.platform === os;
    card.classList.toggle('is-detected', detected);
    if (detected) card.setAttribute('aria-current', 'true');
    else card.removeAttribute('aria-current');
    const badge = card.querySelector('.detected-badge');
    if (badge) badge.hidden = !detected;
    if (detected && (os === 'macos' || os === 'windows')) emphasizeArch(card, arch);
  });

  const cta = document.querySelector('[data-smart-cta]');
  const wrap = document.querySelector('.smart-download');
  if (!cta || !wrap) return;
  const key = assetKey(os, arch);
  const href = key && document.querySelector(`[data-asset="${key}"]`)?.getAttribute('href');
  if (!href) {
    wrap.hidden = true;
    return;
  }
  cta.setAttribute('href', href);
  cta.textContent = smartLabel(os, arch);
  wrap.hidden = false;
}

async function initDownload(release) {
  const os = detectPlatform(navigatorInfo());
  let arch = os ? detectArch(navigatorInfo(), os) : 'x64';
  applyReleaseUrls(release.version, release.assets);
  highlightDetected(os, arch);
  if (os === 'macos' || os === 'windows') {
    const refined = await refineArchitecture(os);
    if (refined && refined !== arch) {
      arch = refined;
      highlightDetected(os, arch);
    }
  }
  document.addEventListener('leafio:lang', () => highlightDetected(os, arch));
}

function initOgImage() {
  const icon = document.querySelector('link[rel="icon"]');
  const og = document.querySelector('meta[property="og:image"]');
  const twitter = document.querySelector('meta[name="twitter:image"]');
  if (!icon || !og) return;
  if (location.protocol !== 'http:' && location.protocol !== 'https:') return;
  try {
    const iconUrl = new URL(icon.getAttribute('href'), location.href);
    const imageUrl = new URL(
      iconUrl.href.replace(/img\/favicon\.png$/, 'screenshots/editor-light.png'),
    );
    og.setAttribute('content', imageUrl.href);
    twitter?.setAttribute('content', imageUrl.href);
  } catch {
    // keep the static GitHub raw fallback in HTML
  }
}

initTheme();
initOgImage();

const release = await fetchLatestRelease();
setVersions(release.version);
if (document.querySelector('.download-grid')) {
  await initDownload(release);
}
