import { describe, expect, it } from 'vitest';
import {
  activateTabAt,
  cloneJsonContent,
  closeTab,
  closeTabsWhere,
  createEditorTab,
  emptyEditorDoc,
  emptyEditorTabs,
  insertTab,
  openOrActivateTab,
  parseTabShortcut,
  putTab,
  renameTabPath,
  renameTabPathsWithPrefix,
  shouldShowTabBar,
  snapshotActiveTab,
  tabIndexForShortcut,
} from '../src/lib/editor-tabs';

function tab(path: string, markdown = 'hi') {
  return createEditorTab({ path, name: path.split('/').pop() ?? path, markdown });
}

describe('shouldShowTabBar', () => {
  it('hides the bar with zero or one tab', () => {
    expect(shouldShowTabBar(emptyEditorTabs())).toBe(false);
    expect(shouldShowTabBar(openOrActivateTab(emptyEditorTabs(), tab('/a.md')))).toBe(false);
  });

  it('shows the bar once two tabs are open', () => {
    const one = openOrActivateTab(emptyEditorTabs(), tab('/a.md'));
    const two = openOrActivateTab(one, tab('/b.md'));
    expect(shouldShowTabBar(two)).toBe(true);
  });
});

describe('openOrActivateTab', () => {
  it('appends a new tab and makes it active', () => {
    const next = openOrActivateTab(emptyEditorTabs(), tab('/notes/a.md', 'A'));
    expect(next.tabs).toHaveLength(1);
    expect(next.activePath).toBe('/notes/a.md');
  });

  it('activates an existing tab instead of duplicating it', () => {
    const opened = openOrActivateTab(
      openOrActivateTab(emptyEditorTabs(), tab('/a.md', 'A')),
      tab('/b.md', 'B'),
    );
    const again = openOrActivateTab(opened, tab('/a.md', 'stale'));
    expect(again.tabs).toHaveLength(2);
    expect(again.activePath).toBe('/a.md');
    expect(again.tabs[0]?.markdown).toBe('A');
  });

  it('keeps live edits on the previous tab when opening another', () => {
    const one = openOrActivateTab(emptyEditorTabs(), tab('/a.md', 'A'));
    const two = openOrActivateTab(one, tab('/b.md', 'B'), { markdown: 'A-edited', dirty: true });
    expect(two.tabs[0]?.markdown).toBe('A-edited');
    expect(two.tabs[0]?.dirty).toBe(true);
    expect(two.activePath).toBe('/b.md');
  });

  it('does not overwrite the active note with empty editor state on re-activate', () => {
    const one = openOrActivateTab(emptyEditorTabs(), tab('/a.md', 'Hello from disk'));
    const again = openOrActivateTab(one, tab('/a.md', 'ignored'), { markdown: '', dirty: false });
    expect(again.tabs).toHaveLength(1);
    expect(again.tabs[0]?.markdown).toBe('Hello from disk');
  });
});

describe('insertTab', () => {
  it('can add a background tab without stealing focus', () => {
    const active = openOrActivateTab(emptyEditorTabs(), tab('/a.md'));
    const next = insertTab(active, tab('/b.md'), { activate: false });
    expect(next.activePath).toBe('/a.md');
    expect(next.tabs.map((item) => item.path)).toEqual(['/a.md', '/b.md']);
  });
});

describe('putTab', () => {
  it('replaces an existing tab with freshly loaded content', () => {
    const one = openOrActivateTab(emptyEditorTabs(), tab('/a.md', 'old'));
    const next = putTab(one, tab('/a.md', 'from-disk'));
    expect(next.tabs).toHaveLength(1);
    expect(next.tabs[0]?.markdown).toBe('from-disk');
    expect(next.activePath).toBe('/a.md');
  });
});

describe('activateTabAt', () => {
  it('switches to the tab at a 0-based index', () => {
    const two = openOrActivateTab(
      openOrActivateTab(emptyEditorTabs(), tab('/a.md')),
      tab('/b.md'),
    );
    const switched = activateTabAt(two, 0, { markdown: 'B-live' });
    expect(switched.activePath).toBe('/a.md');
    expect(switched.tabs[1]?.markdown).toBe('B-live');
  });

  it('is a no-op for an out-of-range index', () => {
    const one = openOrActivateTab(emptyEditorTabs(), tab('/a.md'));
    expect(activateTabAt(one, 3)).toEqual(one);
  });
});

describe('closeTab', () => {
  it('activates a neighbor after closing the current tab', () => {
    const two = openOrActivateTab(
      openOrActivateTab(emptyEditorTabs(), tab('/a.md')),
      tab('/b.md'),
    );
    const closed = closeTab(two, '/b.md');
    expect(closed.tabs.map((item) => item.path)).toEqual(['/a.md']);
    expect(closed.activePath).toBe('/a.md');
    expect(shouldShowTabBar(closed)).toBe(false);
  });

  it('clears the session when the last tab closes', () => {
    const closed = closeTab(openOrActivateTab(emptyEditorTabs(), tab('/a.md')), '/a.md');
    expect(closed.tabs).toEqual([]);
    expect(closed.activePath).toBeNull();
  });
});

describe('closeTabsWhere', () => {
  it('drops matching tabs and picks a remaining active tab', () => {
    const three = openOrActivateTab(
      openOrActivateTab(openOrActivateTab(emptyEditorTabs(), tab('/root/a.md')), tab('/gone/b.md')),
      tab('/gone/c.md'),
    );
    const next = closeTabsWhere(three, (item) => item.path.startsWith('/gone/'));
    expect(next.tabs.map((item) => item.path)).toEqual(['/root/a.md']);
    expect(next.activePath).toBe('/root/a.md');
  });
});

describe('renameTabPath', () => {
  it('renames a tab and updates the active path', () => {
    const one = openOrActivateTab(emptyEditorTabs(), tab('/old.md'));
    const next = renameTabPath(one, '/old.md', '/new.md', 'new.md');
    expect(next.tabs[0]?.path).toBe('/new.md');
    expect(next.tabs[0]?.name).toBe('new.md');
    expect(next.activePath).toBe('/new.md');
  });
});

describe('renameTabPathsWithPrefix', () => {
  it('rewrites tabs under a renamed folder', () => {
    const one = openOrActivateTab(emptyEditorTabs(), tab('/notes/diary.md'));
    const next = renameTabPathsWithPrefix(one, '/notes', '/journal');
    expect(next.tabs[0]?.path).toBe('/journal/diary.md');
    expect(next.activePath).toBe('/journal/diary.md');
  });
});

describe('cloneJsonContent', () => {
  it('returns an empty doc instead of throwing on missing content', () => {
    expect(cloneJsonContent(undefined)).toEqual(emptyEditorDoc());
    expect(cloneJsonContent(null)).toEqual(emptyEditorDoc());
  });
});

describe('snapshotActiveTab', () => {
  it('writes live editor state onto the active tab only', () => {
    const two = openOrActivateTab(
      openOrActivateTab(emptyEditorTabs(), tab('/a.md')),
      tab('/b.md'),
    );
    const next = snapshotActiveTab(two, { markdown: 'draft', dirty: true });
    expect(next.tabs[0]?.dirty).toBe(false);
    expect(next.tabs[1]?.markdown).toBe('draft');
    expect(next.tabs[1]?.dirty).toBe(true);
  });

  it('does not snapshot an empty editor over a loaded note unless it is dirty', () => {
    const one = openOrActivateTab(emptyEditorTabs(), tab('/a.md', 'Hello from disk'));
    const next = snapshotActiveTab(one, {
      markdown: '',
      doc: { type: 'doc', content: [] },
      dirty: false,
    });
    expect(next.tabs[0]?.markdown).toBe('Hello from disk');
  });

  it('keeps an empty snapshot when the user actually cleared the note', () => {
    const one = openOrActivateTab(emptyEditorTabs(), tab('/a.md', 'Hello'));
    const next = snapshotActiveTab(one, { markdown: '', dirty: true });
    expect(next.tabs[0]?.markdown).toBe('');
    expect(next.tabs[0]?.dirty).toBe(true);
  });
});

describe('⌘1-9 shortcuts', () => {
  it('maps digits 1-9 onto existing tab indexes', () => {
    expect(tabIndexForShortcut(1, 3)).toBe(0);
    expect(tabIndexForShortcut(3, 3)).toBe(2);
    expect(tabIndexForShortcut(9, 3)).toBeNull();
    expect(tabIndexForShortcut(1, 0)).toBeNull();
  });

  it('parses modifier+digit and ignores shift/alt', () => {
    expect(parseTabShortcut({ key: '2', metaKey: true, ctrlKey: false, altKey: false, shiftKey: false })).toBe(2);
    expect(parseTabShortcut({ key: '1', metaKey: false, ctrlKey: true, altKey: false, shiftKey: false })).toBe(1);
    expect(parseTabShortcut({ key: '1', metaKey: true, ctrlKey: false, altKey: true, shiftKey: false })).toBeNull();
    expect(parseTabShortcut({ key: '1', metaKey: false, ctrlKey: false, altKey: false, shiftKey: false })).toBeNull();
  });
});
