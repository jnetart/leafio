#!/usr/bin/env node
/**
 * Leafio static-site verification (READ-ONLY).
 *
 * Verifies the built bilingual landing site under docs/ without modifying a
 * single file. Four checks:
 *
 *   1. Broken local links / images across every *.html under docs/ (and CSS
 *      url() refs). External http(s):// hrefs are out of scope — the download
 *      page's https://github.com/<owner>/leafio(/releases) placeholder is expected.
 *   2. Sensitive info in the site text: real /Users/<user> absolute paths,
 *      ~/… home-shorthand paths, email addresses, and known secret formats.
 *      Email matching is inline-text only and skips media/file-extension
 *      false positives (e.g. `128x128@2x.png` -> TLD `png`).
 *   3. Every data-i18n / data-i18n-alt key referenced in HTML is defined in
 *      i18n.js (loaded in a Node vm) with BOTH a `zh` and an `en` value.
 *   4. The expected screenshot set (8 states x light/dark x 1x/2x = 32 files)
 *      exists, every 1x screenshot is referenced from HTML, and every @2x
 *      variant has a referenced 1x companion.
 *
 * Exit code 0 when everything passes; non-zero with a printed problem list
 * otherwise. Uses Node built-in modules only — no new dependencies.
 *
 * Usage: node scripts/verify-site.mjs
 */

import { existsSync, readFileSync, statSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DOCS = join(ROOT, 'docs');

// docs/superpowers/ holds internal SDD coordination documents (plans/specs).
// They legitimately quote the privacy red-line rule and the app's standard
// data location (`~/Library/Application Support/com.leafio.app/`, etc.), so a
// naive `~/` scan would self-defeat on coordination prose rather than a leak.
// The deliverable (pages + assets) is scanned with the full pattern set; the
// coordination docs are still scanned for hard indicators (emails, tokens,
// real /Users/<user> absolute paths), just not the `~/` shorthand.
const COORDINATION_DIR = join(DOCS, 'superpowers');

const problems = []; // hard failures -> non-zero exit
const warnings = []; // informational only

const problem = (category, loc, msg) => problems.push(`[${category}] ${loc}: ${msg}`);
const warn = (category, loc, msg) => warnings.push(`[${category}] ${loc}: ${msg}`);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function walk(dir, exts, skipDirs = new Set()) {
  const out = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (skipDirs.has(full)) continue;
      out.push(...(await walk(full, exts, skipDirs)));
    } else if (entry.isFile() && (!exts || exts.has(extname(entry.name)))) {
      out.push(full);
    }
  }
  return out.sort();
}

function isFile(p) {
  try {
    return existsSync(p) && statSync(p).isFile();
  } catch {
    return false;
  }
}

function isDir(p) {
  try {
    return existsSync(p) && statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function resolveLocalTarget(baseDir, clean) {
  const target = clean.startsWith('/')
    ? resolve(DOCS, `.${clean}`)
    : resolve(baseDir, clean);
  if (isFile(target)) return target;
  if (isDir(target) && isFile(join(target, 'index.html'))) {
    return join(target, 'index.html');
  }
  if (!extname(clean) && isFile(`${target}/index.html`)) {
    return `${target}/index.html`;
  }
  return target;
}

const rel = (p) => relative(ROOT, p) || p;

// ---------------------------------------------------------------------------
// Check 1: broken local links / images
// ---------------------------------------------------------------------------

const URL_ATTR_RE = /\b(href|src)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
const CSS_URL_RE = /url\(\s*(?:"([^"]*)"|'([^']*)'|([^'")]+))\s*\)/g;

function checkBrokenLinks() {
  const htmlFiles = [];
  const walkHtml = async () => {
    const files = await walk(DOCS, new Set(['.html']), new Set([COORDINATION_DIR]));
    htmlFiles.push(...files);
  };
  return (async () => {
    await walkHtml();
    let refCount = 0;
    let checkedCount = 0;

    for (const file of htmlFiles) {
      const html = readFileSync(file, 'utf8');
      const dir = dirname(file);
      for (const m of html.matchAll(URL_ATTR_RE)) {
        const url = (m[2] ?? m[3] ?? '').trim();
        if (!url) continue;
        refCount += 1;
        const type = m[1];
        const isExternal =
          /^(https?:|mailto:|tel:|data:|javascript:|\/\/)/i.test(url);
        const isFragment = url.startsWith('#');
        if (isExternal || isFragment) continue;

        const clean = url.split('#')[0].split('?')[0];
        if (!clean) continue;
        checkedCount += 1;

        // Site-relative `/...` resolves from the docs root; otherwise relative
        // to the referencing page.
        const target = resolveLocalTarget(dir, clean);

        if (!isFile(target)) {
          problem(
            'broken-link',
            rel(file),
            `missing ${type} target "${url}" (resolved to ${rel(target)})`,
          );
        }
      }
    }

    // Also verify CSS url() references (site.css currently has none, but keep
    // the check future-proof and consistent with the screenshot reference scan).
    const cssFiles = await walk(DOCS, new Set(['.css']), new Set([COORDINATION_DIR]));
    for (const file of cssFiles) {
      const css = readFileSync(file, 'utf8');
      const dir = dirname(file);
      for (const m of css.matchAll(CSS_URL_RE)) {
        const url = (m[1] ?? m[2] ?? m[3] ?? '').trim();
        if (!url || /^(https?:|data:|#|\/\/)/i.test(url)) continue;
        const clean = url.split('#')[0].split('?')[0];
        if (!clean) continue;
        refCount += 1;
        checkedCount += 1;
        const target = resolveLocalTarget(dir, clean);
        if (!isFile(target)) {
          problem('broken-link', rel(file), `missing CSS url() target "${url}"`);
        }
      }
    }

    console.log(
      `[1] local links/images: ${htmlFiles.length} pages, ${checkedCount}/${refCount} local refs verified`,
    );
  })();
}

// ---------------------------------------------------------------------------
// Check 2: sensitive info
// ---------------------------------------------------------------------------

// Email TLDs that are really just file extensions (e.g. `128x128@2x.png`
// would otherwise match the email regex with TLD `png`).
const FILE_EXT_TLDS = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ico', 'avif',
  'css', 'js', 'html', 'htm', 'md', 'json', 'txt',
  'app', 'dmg', 'msi', 'exe', 'zip', 'tar', 'gz',
  'ts', 'tsx', 'mjs', 'cjs', 'map',
  'woff', 'woff2', 'ttf', 'eot', 'otf', 'pdf',
]);

const EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;

// Well-known secret / token formats. Intentionally a curated list of shapes
// rather than a generic entropy scan to avoid false positives on prose.
const SECRET_PATTERNS = [
  { name: 'GitHub PAT', re: /\bghp_[A-Za-z0-9]{20,}\b/g },
  { name: 'GitHub OAuth token', re: /\bgho_[A-Za-z0-9]{20,}\b/g },
  { name: 'GitHub refresh token', re: /\bghr_[A-Za-z0-9]{20,}\b/g },
  { name: 'Slack token', re: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g },
  { name: 'OpenAI-style key', re: /\bsk-[A-Za-z0-9]{16,}\b/g },
  { name: 'AWS access key', re: /\bAKIA[0-9A-Z]{16}\b/g },
  { name: 'GitLab PAT', re: /\bglpat-[A-Za-z0-9_-]{16,}\b/g },
  { name: 'Google API key', re: /\bAIza[0-9A-Za-z_-]{35}\b/g },
  { name: 'Stripe key', re: /\b(?:sk|rk|pk)_(?:live|test)_[A-Za-z0-9]{16,}\b/g },
  { name: 'private key block', re: /-----BEGIN [A-Z0-9 ]+ PRIVATE KEY-----/g },
];

// A real absolute macOS home path requires a username segment. The coordination
// docs' bare `/Users/` (inside backticks, quoting the rule) is intentionally
// not flagged.
const ABS_HOME_RE = /\/(Users)\/[A-Za-z0-9_.-]+/g;

// Home-shorthand path: `~/` must be followed by a path fragment. The changelog
// feature line "show home directory paths with ~/ prefix in UI" (space after
// `~/`) and the coordination docs' quoted bare `~/` are intentionally not
// flagged.
const HOME_SHORTHAND_RE = /~\/[A-Za-z0-9_.-]/g;

function isEmailMatchAllowed(match) {
  const tld = match.split('.').pop().toLowerCase();
  return !FILE_EXT_TLDS.has(tld);
}

function scanSensitive() {
  return (async () => {
    // Full pattern set over the site deliverable — any text-ish file that a
    // deploy of docs/ would expose, so newly-added .md/.txt/.json pages get
    // the same scrutiny as the HTML pages.
    const SITE_TEXT_EXTS = new Set([
      '.html', '.css', '.js', '.md', '.txt', '.json',
      '.svg', '.xml', '.yaml', '.yml', '.toml',
    ]);
    const siteFiles = await walk(DOCS, SITE_TEXT_EXTS, new Set([COORDINATION_DIR]));
    // Hard indicators only (no `~/`) over the coordination docs.
    const coordFiles = await walk(COORDINATION_DIR, new Set(['.md', '.html', '.css', '.js']));

    let scanned = 0;
    let findings = 0;

    for (const file of siteFiles) {
      scanned += 1;
      const lines = readFileSync(file, 'utf8').split('\n');

      lines.forEach((line, idx) => {
        const loc = `${rel(file)}:${idx + 1}`;

        for (const m of line.matchAll(ABS_HOME_RE)) {
          findings += 1;
          problem('sensitive', loc, `absolute home path "${m[0]}"`);
        }
        for (const m of line.matchAll(HOME_SHORTHAND_RE)) {
          findings += 1;
          problem('sensitive', loc, `home-shorthand path "${m[0]}"`);
        }
        for (const m of line.matchAll(EMAIL_RE)) {
          if (isEmailMatchAllowed(m[0])) {
            findings += 1;
            problem('sensitive', loc, `email address "${m[0]}"`);
          }
        }
        for (const { name, re } of SECRET_PATTERNS) {
          for (const m of line.matchAll(re)) {
            findings += 1;
            problem('sensitive', loc, `${name} "${m[0]}"`);
          }
        }
      });
    }

    for (const file of coordFiles) {
      scanned += 1;
      const lines = readFileSync(file, 'utf8').split('\n');
      lines.forEach((line, idx) => {
        const loc = `${rel(file)}:${idx + 1}`;
        for (const m of line.matchAll(ABS_HOME_RE)) {
          findings += 1;
          problem('sensitive', loc, `absolute home path "${m[0]}"`);
        }
        for (const m of line.matchAll(EMAIL_RE)) {
          if (isEmailMatchAllowed(m[0])) {
            findings += 1;
            problem('sensitive', loc, `email address "${m[0]}"`);
          }
        }
        for (const { name, re } of SECRET_PATTERNS) {
          for (const m of line.matchAll(re)) {
            findings += 1;
            problem('sensitive', loc, `${name} "${m[0]}"`);
          }
        }
      });
    }

    console.log(`[2] sensitive info: ${scanned} text files scanned, ${findings} finding(s)`);
  })();
}

// ---------------------------------------------------------------------------
// Check 3: i18n key coverage
// ---------------------------------------------------------------------------

function loadI18N() {
  const jsPath = join(DOCS, 'assets', 'js', 'i18n.js');
  const src = readFileSync(jsPath, 'utf8');
  const sandbox = {
    console,
    document: {
      addEventListener() {},
      querySelectorAll() {
        return [];
      },
      documentElement: {},
    },
    localStorage: {
      getItem: () => null,
      setItem: () => {},
    },
    navigator: { language: 'en' },
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(`${src}\n;globalThis.__I18N__ = I18N;`, sandbox, { filename: jsPath });
  return sandbox.__I18N__;
}

function checkI18n() {
  const i18n = loadI18N();
  const definedKeys = new Set(Object.keys(i18n));

  const referenced = new Map(); // key -> [{ file, attr }]
  const htmlFiles = [];
  return (async () => {
    htmlFiles.push(...(await walk(DOCS, new Set(['.html']), new Set([COORDINATION_DIR]))));

    for (const file of htmlFiles) {
      const html = readFileSync(file, 'utf8');
      for (const m of html.matchAll(/data-i18n(?:-alt)?="([^"]+)"/g)) {
        const key = m[1];
        const attrName = /data-i18n-alt/.test(html.slice(m.index - 20, m.index))
          ? 'data-i18n-alt'
          : 'data-i18n';
        if (!referenced.has(key)) referenced.set(key, []);
        referenced.get(key).push({ file, attr: attrName });
      }
    }

    let refCount = 0;
    for (const [key, usages] of referenced) {
      refCount += usages.length;
      if (!definedKeys.has(key)) {
        problem('i18n', usages[0].file, `referenced key "${key}" is not defined in i18n.js`);
        continue;
      }
      const entry = i18n[key];
      if (typeof entry.zh !== 'string' || entry.zh.trim() === '') {
        problem('i18n', usages[0].file, `key "${key}" is missing a zh value`);
      }
      if (typeof entry.en !== 'string' || entry.en.trim() === '') {
        problem('i18n', usages[0].file, `key "${key}" is missing an en value`);
      }
    }

    // Informational: keys defined in i18n.js but never referenced.
    const unused = Object.keys(i18n).filter((k) => !referenced.has(k));
    if (unused.length > 0) {
      warn('i18n', 'i18n.js', `unused key(s): ${unused.join(', ')}`);
    }

    console.log(
      `[3] i18n coverage: ${definedKeys.size} keys defined, ${referenced.size} unique keys referenced (${refCount} refs)`,
    );
  })();
}

// ---------------------------------------------------------------------------
// Check 4: screenshots exist and are referenced
// ---------------------------------------------------------------------------

const SHOT_STATES = ['welcome', 'editor', 'toolbar', 'slash', 'search', 'source', 'settings', 'inspector'];
const SHOT_THEMES = ['light', 'dark'];

function checkScreenshots() {
  const screenshotsDir = join(DOCS, 'assets', 'screenshots');
  return (async () => {
    // 1) Expected set exists.
    const expected = [];
    for (const state of SHOT_STATES) {
      for (const theme of SHOT_THEMES) {
        expected.push(`${state}-${theme}.png`);
        expected.push(`${state}-${theme}@2x.png`);
      }
    }
    const baseExpected = expected.filter((f) => !f.includes('@2x'));
    const retinaExpected = expected.filter((f) => f.includes('@2x'));

    let presentCount = 0;
    for (const file of expected) {
      if (isFile(join(screenshotsDir, file))) {
        presentCount += 1;
      } else {
        problem('screenshot', 'assets/screenshots/', `missing screenshot file "${file}"`);
      }
    }

    // 2) Every screenshot referenced in HTML is a real file (and collect refs).
    const referencedBases = new Set();
    const htmlFiles = await walk(DOCS, new Set(['.html']), new Set([COORDINATION_DIR]));
    const allRefs = [];
    for (const file of htmlFiles) {
      const html = readFileSync(file, 'utf8');
      for (const m of html.matchAll(URL_ATTR_RE)) {
        const url = (m[2] ?? m[3] ?? '').trim();
        if (!url || /^(https?:|mailto:|tel:|data:|javascript:|\/\/|#)/i.test(url)) continue;
        const clean = url.split('#')[0].split('?')[0];
        if (!clean) continue;
        allRefs.push({ file, url: clean });
      }
    }
    const screenshotRefs = new Set();
    for (const { file, url } of allRefs) {
      const name = url.split('/').pop();
      if (name && /^[a-z-]+-(light|dark)(@2x)?\.png$/.test(name)) {
        screenshotRefs.add(name);
        if (!isFile(join(screenshotsDir, name))) {
          problem('screenshot', rel(file), `references missing screenshot "${url}"`);
        }
      }
    }

    // 3) Every 1x base screenshot must be referenced.
    for (const base of baseExpected) {
      if (screenshotRefs.has(base)) {
        referencedBases.add(base);
      } else {
        problem('screenshot', 'assets/screenshots/', `screenshot "${base}" exists but is not referenced in any page`);
      }
    }

    // 4) Every @2x retina variant must have a referenced 1x companion.
    for (const retina of retinaExpected) {
      const base = retina.replace('@2x', '');
      if (!screenshotRefs.has(base)) {
        problem('screenshot', 'assets/screenshots/', `retina "${retina}" has no referenced 1x companion "${base}"`);
      }
    }

    console.log(
      `[4] screenshots: ${presentCount}/${expected.length} files present, ` +
        `${referencedBases.size}/${baseExpected.length} 1x referenced, ` +
        `${retinaExpected.length} @2x companions verified`,
    );
  })();
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(`verify-site: ${rel(DOCS)}/`);
  await checkBrokenLinks();
  await scanSensitive();
  await checkI18n();
  await checkScreenshots();

  if (warnings.length > 0) {
    console.log(`\n${warnings.length} warning(s):`);
    for (const w of warnings) console.log(`  ! ${w}`);
  }

  if (problems.length > 0) {
    console.log(`\n${problems.length} problem(s) found:`);
    for (const p of problems) console.log(`  FAIL ${p}`);
    console.log('\nverify-site: FAILED');
    process.exitCode = 1;
  } else {
    console.log('\nverify-site: OK (read-only, nothing modified)');
  }
}

main().catch((err) => {
  console.error('verify-site: unexpected error', err);
  process.exitCode = 2;
});
