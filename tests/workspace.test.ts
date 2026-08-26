import { describe, expect, it } from 'vitest';
import {
  addRoot,
  ancestorDirs,
  displayFileName,
  storageFileName,
  EMPTY_WORKSPACE,
  findContainingRoot,
  hasWorkspace,
  isPathInWorkspace,
  isVisibleTreeEntry,
  removeRoot,
  renameRoot,
  workspaceDisplayName,
  workspaceForFile,
} from '../src/lib/workspace';

describe('displayFileName', () => {
  it('strips .md extension', () => {
    expect(displayFileName('未命名.md')).toBe('未命名');
    expect(displayFileName('notes.MD')).toBe('notes');
  });

  it('leaves non-md names unchanged', () => {
    expect(displayFileName('readme')).toBe('readme');
  });
});

describe('storageFileName', () => {
  it('appends .md when missing', () => {
    expect(storageFileName('未命名')).toBe('未命名.md');
    expect(storageFileName('notes')).toBe('notes.md');
  });

  it('keeps existing .md extension', () => {
    expect(storageFileName('未命名.md')).toBe('未命名.md');
    expect(storageFileName('notes.MD')).toBe('notes.MD');
  });
});

describe('workspaceDisplayName', () => {
  it('uses custom label when provided', () => {
    expect(workspaceDisplayName('/Users/me/notes', '我的笔记')).toBe('我的笔记');
  });

  it('falls back to basename', () => {
    expect(workspaceDisplayName('/Users/me/notes')).toBe('notes');
  });
});

describe('hasWorkspace', () => {
  it('is false for empty workspace', () => {
    expect(hasWorkspace(EMPTY_WORKSPACE)).toBe(false);
  });

  it('is true when roots exist', () => {
    expect(hasWorkspace(addRoot(EMPTY_WORKSPACE, '/Users/me/notes'))).toBe(true);
  });
});

describe('isPathInWorkspace', () => {
  it('matches files under any workspace root', () => {
    const workspace = addRoot(addRoot(EMPTY_WORKSPACE, '/Users/me/notes'), '/Users/me/other');
    expect(isPathInWorkspace('/Users/me/notes/diary.md', workspace.roots)).toBe(true);
    expect(isPathInWorkspace('/Users/me/other/file.md', workspace.roots)).toBe(true);
    expect(isPathInWorkspace('/Users/me/elsewhere/file.md', workspace.roots)).toBe(false);
  });
});

describe('findContainingRoot', () => {
  it('returns the longest matching root', () => {
    const workspace = addRoot(addRoot(EMPTY_WORKSPACE, '/Users/me'), '/Users/me/notes');
    expect(findContainingRoot('/Users/me/notes/diary.md', workspace)?.path).toBe('/Users/me/notes');
  });
});

describe('addRoot', () => {
  it('deduplicates existing roots', () => {
    const once = addRoot(EMPTY_WORKSPACE, '/Users/me/notes');
    const twice = addRoot(once, '/Users/me/notes');
    expect(twice.roots).toHaveLength(1);
  });

  it('appends non-default roots at the end', () => {
    const workspace = addRoot(EMPTY_WORKSPACE, '/Users/me/notes');
    const next = addRoot(workspace, '/Users/me/other');
    expect(next.roots.map((root) => root.path)).toEqual(['/Users/me/notes', '/Users/me/other']);
  });

  it('pins default leafio folder at the top', () => {
    const workspace = addRoot(EMPTY_WORKSPACE, '/Users/me/notes');
    const next = addRoot(workspace, '/Users/me/Documents/leafio');
    expect(next.roots.map((root) => root.path)).toEqual([
      '/Users/me/Documents/leafio',
      '/Users/me/notes',
    ]);
  });

  it('pins default leafio folder when workspace is empty', () => {
    const workspace = addRoot(EMPTY_WORKSPACE, '/Users/me/Documents/leafio');
    expect(workspace.roots.map((root) => root.path)).toEqual(['/Users/me/Documents/leafio']);
  });
});

describe('removeRoot', () => {
  it('removes a root by path', () => {
    const workspace = addRoot(addRoot(EMPTY_WORKSPACE, '/a'), '/b');
    expect(removeRoot(workspace, '/a').roots.map((root) => root.path)).toEqual(['/b']);
  });
});

describe('renameRoot', () => {
  it('updates the label for a root', () => {
    const workspace = addRoot(EMPTY_WORKSPACE, '/Users/me/notes');
    const renamed = renameRoot(workspace, '/Users/me/notes', '日记');
    expect(renamed.roots[0]?.label).toBe('日记');
  });
});

describe('workspaceForFile', () => {
  it('returns parent directory for regular files', () => {
    expect(workspaceForFile('/a/b/file.md')).toBe('/a/b');
  });

  it('returns leafio root for files under default Documents/leafio', () => {
    const home = '/Users/me';
    expect(workspaceForFile('/Users/me/Documents/leafio/2026-08-23/note.md', home)).toBe(
      '/Users/me/Documents/leafio',
    );
  });

  it('returns leafio root without homeDir when path matches Documents/leafio', () => {
    expect(workspaceForFile('/Users/me/Documents/leafio/2026-08-23/note.md')).toBe(
      '/Users/me/Documents/leafio',
    );
  });
});

describe('ancestorDirs', () => {
  it('returns parent directories up to root', () => {
    expect(ancestorDirs('/root/a/b/file.md', '/root')).toEqual(['/root/a/b', '/root/a']);
  });
});

describe('isVisibleTreeEntry', () => {
  it('hides sibling asset folders and non-markdown files', () => {
    expect(isVisibleTreeEntry({ name: 'guide.assets', is_dir: true })).toBe(false);
    expect(isVisibleTreeEntry({ name: 'shot.png', is_dir: false })).toBe(false);
    expect(isVisibleTreeEntry({ name: 'guide.md', is_dir: false })).toBe(true);
    expect(isVisibleTreeEntry({ name: 'docs', is_dir: true })).toBe(true);
  });
});
