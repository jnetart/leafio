import { describe, expect, it } from 'vitest';
import { deriveAppMenuState } from '../src/lib/app-menu-state';

const file = { name: 'a.md', path: '/notes/a.md', is_dir: false };

describe('deriveAppMenuState find', () => {
  it('enables in-document find only when a note is open', () => {
    expect(
      deriveAppMenuState({
        textFocus: false,
        treeFocus: null,
        activeFile: file,
        hasWorkspace: true,
        settingsOpen: false,
        welcomeScreen: false,
      }).canFind,
    ).toBe(true);

    expect(
      deriveAppMenuState({
        textFocus: false,
        treeFocus: null,
        activeFile: null,
        hasWorkspace: true,
        settingsOpen: false,
        welcomeScreen: true,
      }).canFind,
    ).toBe(false);
  });

  it('enables workspace search when a workspace is open', () => {
    expect(
      deriveAppMenuState({
        textFocus: false,
        treeFocus: null,
        activeFile: null,
        hasWorkspace: true,
        settingsOpen: false,
        welcomeScreen: true,
      }).canFindInWorkspace,
    ).toBe(true);

    expect(
      deriveAppMenuState({
        textFocus: false,
        treeFocus: null,
        activeFile: null,
        hasWorkspace: false,
        settingsOpen: false,
        welcomeScreen: true,
      }).canFindInWorkspace,
    ).toBe(false);
  });
});
