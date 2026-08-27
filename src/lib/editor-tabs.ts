import type { JSONContent } from '@tiptap/react';
import { basename } from './paths';
import type { ViewMode } from './view-mode';

export interface EditorTabConflict {
  path: string;
  diskContent: string;
  comparing: boolean;
}

export interface EditorTab {
  path: string;
  name: string;
  markdown: string;
  doc: JSONContent;
  dirty: boolean;
  saved: boolean;
  view: ViewMode;
  editorEpoch: number;
  diskBaseline: string;
  conflict: EditorTabConflict | null;
}

export interface EditorTabsState {
  tabs: EditorTab[];
  activePath: string | null;
}

export type EditorTabLivePatch = Partial<
  Pick<
    EditorTab,
    'markdown' | 'doc' | 'dirty' | 'saved' | 'view' | 'editorEpoch' | 'diskBaseline' | 'conflict'
  >
>;

export function cloneJsonContent(doc: JSONContent | null | undefined): JSONContent {
  if (!doc || typeof doc !== 'object') {
    return emptyEditorDoc();
  }
  try {
    const cloned = JSON.parse(JSON.stringify(doc)) as JSONContent;
    if (!cloned || cloned.type !== 'doc') {
      return emptyEditorDoc();
    }
    return cloned;
  } catch {
    return emptyEditorDoc();
  }
}

export function emptyEditorTabs(): EditorTabsState {
  return { tabs: [], activePath: null };
}

export function emptyEditorDoc(): JSONContent {
  return { type: 'doc', content: [{ type: 'paragraph' }] };
}

export function createEditorTab(input: {
  path: string;
  name?: string;
  markdown: string;
  doc?: JSONContent;
  view?: ViewMode;
  dirty?: boolean;
  saved?: boolean;
  editorEpoch?: number;
  diskBaseline?: string;
  conflict?: EditorTabConflict | null;
}): EditorTab {
  return {
    path: input.path,
    name: input.name ?? basename(input.path),
    markdown: input.markdown,
    doc: cloneJsonContent(input.doc ?? emptyEditorDoc()),
    dirty: input.dirty ?? false,
    saved: input.saved ?? true,
    view: input.view ?? 'edit',
    editorEpoch: input.editorEpoch ?? 0,
    diskBaseline: input.diskBaseline ?? input.markdown,
    conflict: input.conflict ?? null,
  };
}

export function activeTab(state: EditorTabsState): EditorTab | null {
  if (!state.activePath) {
    return null;
  }
  return state.tabs.find((tab) => tab.path === state.activePath) ?? null;
}

export function shouldShowTabBar(state: EditorTabsState): boolean {
  return state.tabs.length > 1;
}

function mergeLivePatch(tab: EditorTab, live: EditorTabLivePatch): EditorTab {
  const next = { ...live };
  const emptyLiveMarkdown = next.markdown === '' && tab.markdown !== '';
  const emptyLiveDoc =
    next.doc !== undefined &&
    Array.isArray(next.doc.content) &&
    next.doc.content.length === 0 &&
    tab.markdown !== '';
  if (next.dirty !== true && (emptyLiveMarkdown || emptyLiveDoc)) {
    delete next.markdown;
    delete next.doc;
  }
  return { ...tab, ...next };
}

export function snapshotActiveTab(
  state: EditorTabsState,
  live?: EditorTabLivePatch,
): EditorTabsState {
  if (!state.activePath || !live) {
    return state;
  }
  return {
    ...state,
    tabs: state.tabs.map((tab) => (tab.path === state.activePath ? mergeLivePatch(tab, live) : tab)),
  };
}

function snapshotLeavingTab(
  state: EditorTabsState,
  nextPath: string,
  live?: EditorTabLivePatch,
): EditorTabsState {
  if (!state.activePath || state.activePath === nextPath) {
    return state;
  }
  return snapshotActiveTab(state, live);
}

export function insertTab(
  state: EditorTabsState,
  tab: EditorTab,
  options: { activate?: boolean; live?: EditorTabLivePatch } = {},
): EditorTabsState {
  const withLive = snapshotLeavingTab(state, tab.path, options.live);
  if (withLive.tabs.some((item) => item.path === tab.path)) {
    return options.activate === false ? withLive : { ...withLive, activePath: tab.path };
  }
  return {
    tabs: [...withLive.tabs, tab],
    activePath: options.activate === false ? withLive.activePath : tab.path,
  };
}

export function putTab(
  state: EditorTabsState,
  tab: EditorTab,
  options: { activate?: boolean; live?: EditorTabLivePatch } = {},
): EditorTabsState {
  const withLive = snapshotLeavingTab(state, tab.path, options.live);
  const index = withLive.tabs.findIndex((item) => item.path === tab.path);
  const tabs =
    index >= 0
      ? withLive.tabs.map((item, itemIndex) => (itemIndex === index ? tab : item))
      : [...withLive.tabs, tab];
  return {
    tabs,
    activePath: options.activate === false ? withLive.activePath : tab.path,
  };
}

export function openOrActivateTab(
  state: EditorTabsState,
  tab: EditorTab,
  live?: EditorTabLivePatch,
): EditorTabsState {
  return insertTab(state, tab, { activate: true, live });
}

export function activateTabAt(
  state: EditorTabsState,
  index: number,
  live?: EditorTabLivePatch,
): EditorTabsState {
  const tab = state.tabs[index];
  if (!tab) {
    return state;
  }
  const withLive = snapshotLeavingTab(state, tab.path, live);
  return { ...withLive, activePath: tab.path };
}

export function closeTab(
  state: EditorTabsState,
  path: string,
  live?: EditorTabLivePatch,
): EditorTabsState {
  const withLive = snapshotActiveTab(state, live);
  const index = withLive.tabs.findIndex((tab) => tab.path === path);
  if (index < 0) {
    return withLive;
  }
  const tabs = withLive.tabs.filter((tab) => tab.path !== path);
  if (tabs.length === 0) {
    return emptyEditorTabs();
  }
  if (withLive.activePath !== path) {
    return { tabs, activePath: withLive.activePath };
  }
  const next = tabs[Math.min(index, tabs.length - 1)];
  return { tabs, activePath: next.path };
}

export function closeTabsWhere(
  state: EditorTabsState,
  predicate: (tab: EditorTab) => boolean,
  live?: EditorTabLivePatch,
): EditorTabsState {
  const withLive = snapshotActiveTab(state, live);
  const closingActive = withLive.activePath
    ? withLive.tabs.some((tab) => tab.path === withLive.activePath && predicate(tab))
    : false;
  const tabs = withLive.tabs.filter((tab) => !predicate(tab));
  if (tabs.length === 0) {
    return emptyEditorTabs();
  }
  if (!closingActive) {
    return { tabs, activePath: withLive.activePath };
  }
  const previousIndex = withLive.tabs.findIndex((tab) => tab.path === withLive.activePath);
  const next = tabs[Math.min(Math.max(previousIndex, 0), tabs.length - 1)];
  return { tabs, activePath: next.path };
}

export function renameTabPath(
  state: EditorTabsState,
  fromPath: string,
  toPath: string,
  name: string,
): EditorTabsState {
  return {
    tabs: state.tabs.map((tab) => (tab.path === fromPath ? { ...tab, path: toPath, name } : tab)),
    activePath: state.activePath === fromPath ? toPath : state.activePath,
  };
}

export function renameTabPathsWithPrefix(
  state: EditorTabsState,
  fromPrefix: string,
  toPrefix: string,
): EditorTabsState {
  const rewrite = (path: string) => {
    if (path === fromPrefix) {
      return toPrefix;
    }
    const prefix = `${fromPrefix}/`;
    if (path.startsWith(prefix)) {
      return `${toPrefix}${path.slice(fromPrefix.length)}`;
    }
    return path;
  };
  return {
    tabs: state.tabs.map((tab) => {
      const nextPath = rewrite(tab.path);
      if (nextPath === tab.path) {
        return tab;
      }
      return { ...tab, path: nextPath, name: basename(nextPath) };
    }),
    activePath: state.activePath ? rewrite(state.activePath) : null,
  };
}

export const SELECT_TAB_DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

export type SelectTabDigit = (typeof SELECT_TAB_DIGITS)[number];

export function tabIndexForShortcut(digit: number, tabCount: number): number | null {
  if (digit < 1 || digit > 9 || tabCount <= 0) {
    return null;
  }
  const index = digit - 1;
  return index < tabCount ? index : null;
}

export function parseTabShortcut(event: {
  key: string;
  metaKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
}): number | null {
  if (event.altKey || event.shiftKey) {
    return null;
  }
  if (!(event.metaKey || event.ctrlKey)) {
    return null;
  }
  if (!/^[1-9]$/.test(event.key)) {
    return null;
  }
  return Number(event.key);
}
