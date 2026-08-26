#!/usr/bin/env node
/**
 * Leafio landing-page screenshot pipeline.
 *
 * Renders the Vite web build (without a real Tauri backend) in headless
 * Chromium, injects a mock `window.__TAURI_INTERNALS__` to fake the Tauri
 * v2 IPC surface the app expects, drives the UI into 8 states, and captures
 * each in light + dark at 1x and 2x retina.
 *
 * Output: docs/assets/screenshots/<name>-<light|dark>.png and ...@2x.png
 *
 * Usage:
 *   npm run dev:web   (port 1420)
 *   node scripts/screenshot.mjs
 *
 * Env:
 *   LEAFIO_APP_URL  override app URL (default http://localhost:1420/)
 *   LEAFIO_CHANNEL  Playwright browser channel (default chrome)
 *   LEAFIO_SMOKE=1  only light / 1x captures (fast validation)
 */

import { chromium } from 'playwright';
import { mkdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCREENSHOT_DIR = join(__dirname, '..', 'docs', 'assets', 'screenshots');
const APP_URL = process.env.LEAFIO_APP_URL || 'http://localhost:1420/';

/**
 * Mock Tauri v2 IPC. Injected via context.addInitScript before app scripts
 * run. Must be fully self-contained (Playwright serializes only this function,
 * not any module-scope closure), so all fixtures live inside here.
 */
function installMock(env) {
  // ---- Workaround: stabilize Array.prototype.map output references ---------
  // Leafio's Sidebar computes `rootPaths = roots.map((root) => root.path)` and
  // `useExpandedPaths` (FileTree.tsx) keeps effects whose dependency arrays
  // include that array BY REFERENCE (deps `[activePath, rootsKey, roots]`).
  // Without a stable reference, the effect re-runs every render, calling
  // setExpandedPaths -> re-render -> fresh `rootPaths` -> ... -> React's
  // "Maximum update depth exceeded" infinite loop.
  //
  // To stabilize it without touching app source, we wrap Array.prototype.map
  // and hand back a cached reference whenever a newly-mapped output is
  // deep-equal to one already produced for the same source array.
  //
  // SCOPE GATE (stale-reference protection): the cache ONLY applies to arrays
  // of primitive values (string / number / boolean / null / undefined) -- the
  // only kind of derived array the app relies on as a reference-stable effect
  // dependency (`rootPaths` is `['/Demo']`). Object and JSX arrays are
  // intentionally-new on every render (Sidebar folder rows, renameRoot's
  // `{...root, label}` copies, etc.) and are NEVER cached, so a component can
  // never receive a stale object reference. Because primitives are immutable,
  // every holder of a cached primitive array observes the same contents.
  //
  // Residual risk (documented): if any app code MUTATES a cached primitive
  // array in place (push / splice / element assignment), that mutation leaks
  // to every holder of the cached reference and can poison the cache. Leafio
  // treats these derived arrays as read-only (they flow into effects/render
  // only), so this is accepted for the screenshot pipeline. The per-source
  // cache list is capped at 8 distinct outputs so it cannot grow unboundedly.
  const origMap = Array.prototype.map;
  const mapCache = new WeakMap();
  function isPrimitiveArray(arr) {
    return (
      Array.isArray(arr) &&
      arr.every((v) => v === null || ['string', 'number', 'boolean', 'undefined'].includes(typeof v))
    );
  }
  function deepEqual(a, b, depth) {
    if (a === b) return true;
    if (typeof a !== typeof b) return false;
    if (a === null || b === null) return false;
    if (depth > 6) return false;
    if (Array.isArray(a)) {
      if (!Array.isArray(b) || a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (!deepEqual(a[i], b[i], depth + 1)) return false;
      }
      return true;
    }
    if (typeof a === 'object') {
      const ka = Object.keys(a);
      const kb = Object.keys(b);
      if (ka.length !== kb.length) return false;
      for (const k of ka) {
        if (!deepEqual(a[k], b[k], depth + 1)) return false;
      }
      return true;
    }
    return false;
  }
  Array.prototype.map = function (cb, thisArg) {
    const out = origMap.call(this, cb, thisArg);
    // Scope gate: only stable-cache arrays of primitives (see comment above).
    if (isPrimitiveArray(out) && this && typeof this.length === 'number') {
      let list = mapCache.get(this);
      if (!list) {
        list = [];
        mapCache.set(this, list);
      }
      for (const cached of list) {
        if (deepEqual(cached.out, out, 0)) {
          return cached.out;
        }
      }
      list.push({ out });
      if (list.length > 8) list.shift();
    }
    return out;
  };

  const theme = env && env.theme === 'dark' ? 'dark' : 'light';
  const language = (env && env.language) || 'zh-CN';

  const DEMO_FILES = {
    '/Demo/notes/welcome.md': [
      '# Welcome to Leafio',
      '',
      'Leafio is a local-first Markdown editor for your daily notes.',
      '',
      'Everything stays on your machine. No accounts, no cloud, no lock-in.',
      '',
      '- WYSIWYG editing right where you type',
      '- Full ownership of your Markdown files',
      '- Fast full-text search across the workspace',
      '',
    ].join('\n'),

    '/Demo/notes/sample.md': [
      '# Getting Started with Leafio',
      '',
      'A quick tour of the blocks you can create with the slash menu.',
      '',
      '## Headings',
      '',
      'Use `/heading` to add a title, or type `#` in source view.',
      '',
      '## A simple table',
      '',
      '| Feature | Status | Notes |',
      '| --- | --- | --- |',
      '| WYSIWYG editing | Done | Inline format toolbar |',
      '| Slash menu | Done | Type `/` anywhere |',
      '| Full-text search | Done | Across the workspace |',
      '| Export | Planned | HTML and Markdown |',
      '',
      '## A code block',
      '',
      '```js',
      'function greet(name) {',
      '  return `Hello, ${name}!`;',
      '}',
      '```',
      '',
      '## Task list',
      '',
      '- [x] Set up the workspace',
      '- [x] Open your first note',
      '- [ ] Try the slash menu',
      '',
    ].join('\n'),
  };

  const VFS = {
    '/Demo': [
      { name: 'notes', path: '/Demo/notes', is_dir: true },
      { name: 'welcome.md', path: '/Demo/welcome.md', is_dir: false },
    ],
    '/Demo/notes': [
      { name: 'welcome.md', path: '/Demo/notes/welcome.md', is_dir: false },
      { name: 'sample.md', path: '/Demo/notes/sample.md', is_dir: false },
    ],
  };

  const RECENT_FILES = ['/Demo/notes/sample.md', '/Demo/notes/welcome.md'];

  const SEARCH_INDEX = [
    {
      name: 'sample.md',
      path: '/Demo/notes/sample.md',
      snippet: 'A quick tour of Markdown blocks: headings, a table, code, and a task list.',
    },
    {
      name: 'welcome.md',
      path: '/Demo/notes/welcome.md',
      snippet: 'Welcome to Leafio — a local-first Markdown editor for daily notes.',
    },
  ];

  // Store state is per-page (each capture gets a fresh context/page).
  const storeData = {
    'preferences.json': {
      app: {
        editorWidthMode: 'centered',
        theme,
        language,
        launchBehavior: 'welcome',
      },
      workspace: { roots: ['/Demo'], rootLabels: {} },
    },
  };
  const ridToPath = {};
  const callbacks = {};
  let ridCounter = 0;
  let cbCounter = 0;

  const searchWorkspace = (_path, query) => {
    const q = String(query || '').trim().toLowerCase();
    if (!q) {
      return [];
    }
    return SEARCH_INDEX.filter((row) =>
      `${row.name} ${row.snippet}`.toLowerCase().includes(q),
    );
  };

  const invoke = async (cmd, args = {}) => {
    switch (cmd) {
      // ---- Tauri v2 plugin-store commands -------------------------------
      case 'plugin:store|load': {
        const rid = ++ridCounter;
        ridToPath[rid] = args.path;
        return rid;
      }
      case 'plugin:store|get': {
        const path = ridToPath[args.rid];
        const data = path ? (storeData[path] || {})[args.key] : undefined;
        return [data, data !== undefined];
      }
      case 'plugin:store|set': {
        const path = ridToPath[args.rid];
        if (path) {
          storeData[path] = storeData[path] || {};
          storeData[path][args.key] = args.value;
        }
        return null;
      }
      case 'plugin:store|save':
      case 'plugin:store|has':
      case 'plugin:store|delete':
      case 'plugin:store|clear':
      case 'plugin:store|reset':
      case 'plugin:store|reload':
        return null;

      // ---- Tauri v2 event plugin (listen is used for fs watcher) --------
      case 'plugin:event|listen':
        return ++cbCounter;
      case 'plugin:event|unlisten':
      case 'plugin:event|emit':
      case 'plugin:event|emit_to':
        return null;

      // ---- App commands (see src/lib/fs.ts) -----------------------------
      case 'user_home_dir':
        // null on purpose: keeps StatusBar / welcome paths relative (no ~)
        return null;
      case 'get_recent_files':
        return [...RECENT_FILES];
      case 'add_recent_file':
      case 'remove_recent_file':
      case 'replace_recent_file':
        return null;
      case 'list_workspace':
        return VFS[args.path] || [];
      case 'list_markdown_files':
        return (VFS[args.path] || []).filter((entry) => !entry.is_dir);
      case 'read_file':
        return DEMO_FILES[args.path] ?? '# New note\n';
      case 'write_file':
      case 'create_markdown_file':
      case 'create_subdirectory':
      case 'rename_file':
      case 'rename_directory':
      case 'move_to_trash':
      case 'copy_file':
      case 'move_file':
      case 'set_workspace_watchers':
        return null;
      case 'search_workspace':
        return searchWorkspace(args.path, args.query);
      case 'suggest_markdown_filename':
        return 'untitled.md';
      case 'suggest_subdirectory_name':
        return 'New Folder';
      case 'default_new_file_dir':
        return '/Demo/notes';
      case 'default_leafio_workspace_dir':
        return '/Demo';
      case 'open_in_terminal':
        return null;

      // ---- plugin-dialog / plugin-opener / menu / window (not used) ------
      case 'plugin:dialog|open':
      case 'plugin:dialog|save':
      case 'plugin:dialog|message':
      case 'plugin:dialog|ask':
      case 'plugin:dialog|confirm':
      case 'plugin:opener|open_path':
      case 'plugin:opener|open_url':
      case 'plugin:opener|reveal_item_in_dir':
      case 'plugin:menu|new':
      case 'plugin:window|start_dragging':
        return null;

      default:
        return null;
    }
  };

  window.__TAURI_INTERNALS__ = {
    invoke,
    transformCallback: (callback, _once = false) => {
      const id = ++cbCounter;
      callbacks[id] = callback;
      return id;
    },
    unregisterCallback: (id) => {
      delete callbacks[id];
    },
    convertFileSrc: (filePath) => filePath,
  };
  window.__TAURI_EVENT_PLUGIN_INTERNALS__ = {
    unregisterListener: () => {},
  };
  window.__TAURI__ = {
    core: { invoke },
    plugin: {},
  };
}

// ---------------------------------------------------------------------------
// UI driving helpers
// ---------------------------------------------------------------------------

async function openDemoFile(page, fileName) {
  // .file-tree-folder-actions has `pointer-events: none` until the row is
  // hovered, so a normal Playwright click on a chevron is intercepted by the
  // parent row. Dispatch the click directly on the button (React listens at
  // the root) to bypass the hit-test.
  const rootRow = page.locator('.file-tree-folder-row').filter({ hasText: 'Demo' }).first();
  await rootRow.waitFor({ state: 'visible', timeout: 8000 });
  await rootRow.locator('.file-tree-chevron-btn').evaluate((el) => el.click());
  const notesRow = page.locator('.file-tree-folder-row').filter({ hasText: 'notes' }).first();
  await notesRow.waitFor({ state: 'visible', timeout: 8000 });
  await notesRow.locator('.file-tree-chevron-btn').evaluate((el) => el.click());
  const fileRow = page
    .locator('.file-tree-row')
    .filter({ hasText: fileName.replace(/\.md$/, '') })
    .first();
  await fileRow.waitFor({ state: 'visible', timeout: 8000 });
  await fileRow.click();
  await page.waitForSelector('.leafio-editor .ProseMirror', { timeout: 15000 });
  await page.waitForTimeout(300);
}

async function selectTextInEditor(page) {
  // Drag the mouse across a task-list item to create a native selection.
  // ProseMirror turns this into a selection transaction, which makes the
  // BubbleMenu (inline format toolbar) appear. (pmViewDesc does not expose
  // the view in TipTap 2, so a programmatic TextSelection dispatch is not
  // reachable.) We deliberately select text mid-document: selecting the
  // first paragraph parks the toolbar at the top edge of the viewport,
  // where it covers the H1 and reads as a fixed app toolbar.
  const paragraph = page
    .locator('.leafio-editor .ProseMirror p')
    .filter({ hasText: 'Open your first note' })
    .first();
  await paragraph.waitFor({ state: 'visible', timeout: 8000 });
  const box = await paragraph.boundingBox();
  if (!box) {
    // Never silently continue: a null box means the paragraph is not actually
    // laid out, and capturing now would yield a plain editor shot with no
    // floating toolbar while the pipeline reports success.
    throw new Error('selectTextInEditor: target paragraph has no bounding box');
  }
  const cy = box.y + box.height / 2;
  await page.mouse.move(box.x + 8, cy);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width - 8, cy, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(500);
}

async function openSlashMenu(page) {
  const paragraph = page
    .locator('.leafio-editor .ProseMirror p')
    .filter({ hasText: 'A quick tour' })
    .first();
  await paragraph.click();
  await page.keyboard.press('End');
  // '/h' filters the menu to the heading entries: the full unfiltered menu
  // is taller than its max-height, so the last row renders half-clipped.
  await page.keyboard.type('/h');
  await page.waitForTimeout(450);
}

async function openSearchDialog(page) {
  await page.locator('.sidebar-search-item').first().click();
  const input = page.getByPlaceholder('搜索 Markdown 文件…');
  await input.waitFor({ state: 'visible', timeout: 8000 });
  await input.fill('markdown');
  await page.waitForTimeout(700);
}

async function switchToSource(page) {
  await page.getByRole('tab', { name: '源码' }).first().waitFor({ timeout: 5000 });
  await page.getByRole('tab', { name: '源码' }).click();
  await page.waitForSelector('.source-editor', { timeout: 8000 });
  await page.waitForTimeout(300);
}

async function openSettings(page) {
  await page.locator('.sidebar-settings-btn[aria-label="设置"]').click();
  await page.waitForSelector('.settings-content', { timeout: 8000 });
  await page
    .locator('.sidebar-nav-item')
    .filter({ hasText: '外观' })
    .first()
    .click();
  await page.waitForTimeout(300);
}

async function openInspector(page) {
  await page.locator('.outline-collapse-btn[aria-label="展开大纲"]').click();
  await page
    .locator('.outline-panel:not(.outline-panel--collapsed)')
    .waitFor({ timeout: 8000 });
  await page.waitForTimeout(300);
}

async function driveState(page, name) {
  switch (name) {
    case 'welcome':
      return;
    case 'editor':
      await openDemoFile(page, 'sample.md');
      return;
    case 'toolbar':
      await openDemoFile(page, 'sample.md');
      await selectTextInEditor(page);
      return;
    case 'slash':
      await openDemoFile(page, 'sample.md');
      await openSlashMenu(page);
      return;
    case 'search':
      await openDemoFile(page, 'sample.md');
      await openSearchDialog(page);
      return;
    case 'source':
      await openDemoFile(page, 'sample.md');
      await switchToSource(page);
      return;
    case 'settings':
      await openDemoFile(page, 'sample.md');
      await openSettings(page);
      return;
    case 'inspector':
      await openDemoFile(page, 'sample.md');
      await openInspector(page);
      return;
    default:
      throw new Error(`Unknown view name: ${name}`);
  }
}

// ---------------------------------------------------------------------------
// Post-drive state assertions
// ---------------------------------------------------------------------------

// Each state must render its signature UI before we capture. If the floating
// toolbar / slash menu / search dialog / settings / inspector / source view
// fails to appear, the run fails loudly (non-zero exit) instead of silently
// capturing a plain editor shot.
//
// We assert via bounding rect rather than Playwright getByRole/getByPlaceholder:
// elements living in tippy portals are flagged `aria-hidden` during the entrance
// animation, which makes Playwright's locators report them as not visible even
// though they are drawn — and it is what the screenshot pixels show that matters.
const STATE_SIGNATURES = {
  welcome: '.welcome-screen',
  editor: '.leafio-editor .ProseMirror',
  toolbar: '[role="toolbar"], .tippy-box',
  slash: '[role="listbox"]',
  search: 'input[placeholder="搜索工作区中的 Markdown 文件…"]',
  source: '.source-editor',
  settings: '.settings-content',
  inspector: '.outline-panel:not(.outline-panel--collapsed)',
};

async function assertState(page, name) {
  const selector = STATE_SIGNATURES[name];
  if (!selector) {
    throw new Error(`No signature selector for state: ${name}`);
  }
  let visible = false;
  for (let attempt = 0; attempt < 6 && !visible; attempt += 1) {
    visible = await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (!el) {
        return false;
      }
      const rect = el.getBoundingClientRect();
      return (
        rect.width > 2 &&
        rect.height > 2 &&
        rect.x >= 0 &&
        rect.y >= 0 &&
        rect.x < 1200 &&
        rect.y < 800
      );
    }, selector);
    if (!visible) {
      await page.waitForTimeout(250);
    }
  }
  if (!visible) {
    throw new Error(
      `state "${name}" did not render its signature UI ` +
        `(expected "${selector}" to occupy viewport pixels); ` +
        'refusing to capture a misleading screenshot',
    );
  }
}

// ---------------------------------------------------------------------------
// Capture
// ---------------------------------------------------------------------------

const SHOTS = ['welcome', 'editor', 'toolbar', 'slash', 'search', 'source', 'settings', 'inspector'];

// The browser render has no native window chrome, so the app's 78px
// traffic-light drag zone reads as an empty gap and the sidebar toggle next
// to it looks displaced. Draw the macOS traffic lights where the native
// window would overlay them — tauri.conf.json trafficLightPosition (16, 28)
// is the center of the red button; buttons are 12px with an 8px gap.
async function injectTrafficLights(page) {
  await page.evaluate(() => {
    const wrap = document.createElement('div');
    wrap.setAttribute('aria-hidden', 'true');
    wrap.style.cssText =
      'position:fixed;left:10px;top:22px;z-index:99999;pointer-events:none;' +
      'display:flex;gap:8px;';
    for (const color of ['#ff5f57', '#febc2e', '#28c840']) {
      const dot = document.createElement('span');
      dot.style.cssText = `width:12px;height:12px;border-radius:50%;background:${color};`;
      wrap.appendChild(dot);
    }
    document.body.appendChild(wrap);
  });
}

async function capture(browser, name, dark, scale) {
  const context = await browser.newContext({
    viewport: { width: 1200, height: 800 },
    deviceScaleFactor: scale,
  });
  await context.addInitScript(installMock, {
    theme: dark ? 'dark' : 'light',
    language: 'zh-CN',
  });
  const page = await context.newPage();

  const errors = [];
  page.on('pageerror', (err) => errors.push(`pageerror: ${String(err)}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(`console.error: ${msg.text()}`);
    }
  });

  try {
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForSelector('.welcome-screen, .sidebar-column', { timeout: 20000 });

    if (dark) {
      await page.evaluate(() => document.documentElement.classList.add('dark'));
    }

    await injectTrafficLights(page);

    await driveState(page, name);

    // Allow final paints (bubble menu, dialogs, theme transitions).
    await page.waitForTimeout(500);

    // Self-verify the intended state actually rendered before capturing.
    await assertState(page, name);

    const theme = dark ? 'dark' : 'light';
    const retina = scale === 2 ? '@2x' : '';
    const filePath = join(SCREENSHOT_DIR, `${name}-${theme}${retina}.png`);
    await page.screenshot({ path: filePath });
    return { name, theme, scale, filePath, errors };
  } catch (err) {
    return {
      name,
      theme: dark ? 'dark' : 'light',
      scale,
      filePath: null,
      errors: [...errors, `fatal: ${String(err)}`],
    };
  } finally {
    await context.close();
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  mkdirSync(SCREENSHOT_DIR, { recursive: true });

  const browser = await chromium.launch({
    channel: process.env.LEAFIO_CHANNEL || 'chrome',
  });
  const results = [];
  let fatalCount = 0;

  const smoke = process.env.LEAFIO_SMOKE === '1';
  const darks = smoke ? [false] : [false, true];
  const scales = smoke ? [1] : [1, 2];

  try {
    for (const dark of darks) {
      for (const name of SHOTS) {
        for (const scale of scales) {
          const result = await capture(browser, name, dark, scale);
          results.push(result);
          const label = `${result.name}-${result.theme}${result.scale === 2 ? '@2x' : ''}`;
          if (result.filePath) {
            const size = statSync(result.filePath).size;
            const flag = size < 2000 ? ' [TOO SMALL?]' : '';
            console.log(`ok   ${label}  ${size} bytes${flag}`);
          } else {
            fatalCount += 1;
            console.log(`FAIL ${label}`);
          }
          for (const error of result.errors) {
            console.log(`  ! ${error}`);
          }
        }
      }
    }
  } finally {
    await browser.close();
  }

  console.log(
    `\nDone. ${results.length} captures, ${fatalCount} fatal, screenshots in ${SCREENSHOT_DIR}`,
  );
  if (fatalCount > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
