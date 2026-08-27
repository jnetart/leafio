import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { JSONContent } from '@tiptap/react';
import { Editor } from './components/Editor';
import { EditorTabBar } from './components/EditorTabBar';
import { ExportSheet } from './components/ExportSheet';
import { ExternalChangeBar } from './components/ExternalChangeBar';
import { ExternalChangeCompare } from './components/ExternalChangeCompare';
import { Inspector } from './components/Inspector';
import { PreviewView } from './components/PreviewView';
import { NewFileDialog } from './components/NewFileDialog';
import { RenameDialog } from './components/RenameDialog';
import { SearchDialog } from './components/SearchDialog';
import { SettingsView } from './components/SettingsView';
import { Sidebar } from './components/Sidebar';
import { SourceView } from './components/SourceView';
import { StatusBar } from './components/StatusBar';
import { ViewModeFloater } from './components/ViewModeFloater';
import { WindowDragBar } from './components/WindowDragBar';
import { WelcomeScreen } from './components/WelcomeScreen';
import { parseMarkdown, serializeMarkdown } from './editor/markdown';
import type { ImageNoticeKey } from './editor/insertImage';
import {
  syncAssetsOnCopy,
  syncAssetsOnDelete,
  syncAssetsOnMove,
  syncAssetsOnRename,
} from './lib/note-assets';
import { useActiveOutlineHeading } from './hooks/useActiveOutlineHeading';
import { useAppMenu } from './hooks/useAppMenu';
import { useMenuTextFocus } from './hooks/useMenuTextFocus';
import { useI18n } from './hooks/useI18n';
import { computeDocumentStats } from './lib/textStats';
import { usePreferences } from './hooks/usePreferences';
import { useAppUpdate } from './hooks/useAppUpdate';
import { useEditorTypography } from './hooks/useEditorTypography';
import { useTheme } from './hooks/useTheme';
import { useUserHomeDir } from './hooks/useUserHomeDir';
import { useWorkspaceWatcher } from './hooks/useWorkspaceWatcher';
import { selectTabDigitFromAction, type AppMenuAction } from './lib/app-menu';
import { deriveAppMenuState, type TreeFocusTarget } from './lib/app-menu-state';
import { dispatchMenuEditAction } from './lib/menu-edit';
import { pickFolder, pickMarkdownFile, confirmTrash } from './lib/dialog';
import { classifyExternalChange } from './lib/external-change';
import { documentToHtml, exportFile } from './lib/export';
import { alignMarkdownDiff, countChangedRows } from './lib/line-diff';
import {
  addRecentFile,
  createMarkdownFile,
  createSubdirectory,
  suggestSubdirectoryName,
  defaultNewFileDir,
  moveToTrash,
  copyFile,
  getRecentFiles,
  listMarkdownFiles,
  moveFile,
  readFile,
  removeRecentFile,
  renameFile,
  renameDirectory,
  replaceRecentFile,
  searchWorkspace,
  suggestMarkdownFilename,
  writeFile,
  type FileEntry,
} from './lib/fs';
import type { ParsedSearchQuery } from './lib/searchQuery';
import { extractHeadings, OUTLINE_HEADING_SELECTOR } from './lib/headings';
import { basename, dirname, expandUserPath, formatDisplayPath, replacePathPrefix } from './lib/paths';
import {
  activateTabAt,
  activeTab,
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
  type EditorTabLivePatch,
  type EditorTabsState,
} from './lib/editor-tabs';
import type { SettingsSection } from './lib/settings-sections';
import type { ViewMode } from './lib/view-mode';
import { loadWorkspace, saveWorkspace } from './lib/workspace-store';
import {
  addRoot,
  displayFileName,
  EMPTY_WORKSPACE,
  hasWorkspace,
  isPathInWorkspace,
  removeRoot,
  renameRoot,
  workspaceDisplayName,
  workspaceForFile,
  workspaceRootPaths,
  type WorkspaceRoot,
  type WorkspaceState,
} from './lib/workspace';

function toFileEntry(path: string): FileEntry {
  return {
    name: basename(path),
    path,
    is_dir: false,
  };
}

export default function App() {
  const {
    editorWidthMode,
    editorFontFamily,
    editorFontSize,
    editorTabWidth,
    compressImages,
    theme,
    language,
    launchBehavior,
    autoUpdateEnabled,
    lastUpdateCheckAt,
    ready,
    setEditorWidthMode,
    setEditorFontFamily,
    setEditorFontSize,
    setEditorTabWidth,
    setCompressImages,
    setTheme,
    setLanguage,
    setLaunchBehavior,
    setAutoUpdateEnabled,
    setLastUpdateCheckAt,
  } = usePreferences();
  useTheme(theme);
  useEditorTypography(editorFontFamily, editorFontSize, editorTabWidth);
  const { locale, t } = useI18n(language);
  const {
    appVersion,
    status: updateStatus,
    availableVersion,
    errorMessage: updateError,
    downloadRatio,
    checkForUpdates,
    installUpdate,
  } = useAppUpdate({
    ready,
    autoUpdateEnabled,
    lastUpdateCheckAt,
    onLastCheckAtChange: setLastUpdateCheckAt,
  });
  const userHomeDir = useUserHomeDir();

  const [workspace, setWorkspace] = useState<WorkspaceState>(EMPTY_WORKSPACE);
  const [persistedWorkspace, setPersistedWorkspace] = useState<WorkspaceState>(EMPTY_WORKSPACE);
  const [workspaceReady, setWorkspaceReady] = useState(false);
  const [tabSession, setTabSession] = useState<EditorTabsState>(() => emptyEditorTabs());
  const [recentFiles, setRecentFiles] = useState<string[]>([]);
  const [treeRefreshKey, setTreeRefreshKey] = useState(0);

  const [view, setView] = useState<ViewMode>('edit');
  const [markdown, setMarkdown] = useState('');
  const [doc, setDoc] = useState<JSONContent>({ type: 'doc', content: [] });
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(true);
  const [imageNotice, setImageNotice] = useState<string | null>(null);
  const [editorEpoch, setEditorEpoch] = useState(0);
  const [conflict, setConflict] = useState<{
    path: string;
    diskContent: string;
    comparing: boolean;
  } | null>(null);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsSection, setSettingsSection] = useState<SettingsSection>('general');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportTarget, setExportTarget] = useState<FileEntry | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<FileEntry | null>(null);
  const [renameRootTarget, setRenameRootTarget] = useState<WorkspaceRoot | null>(null);
  const [newFolderState, setNewFolderState] = useState<{
    parent: string;
    defaultName: string;
  } | null>(null);
  const [newFileState, setNewFileState] = useState<{
    dir: string;
    defaultName: string;
    defaultDir: string;
    locationLocked: boolean;
  } | null>(null);
  const [editorActivityAt, setEditorActivityAt] = useState(() => Date.now());
  const [treeFocus, setTreeFocus] = useState<TreeFocusTarget | null>(null);

  const activeFile = useMemo(() => {
    const tab = activeTab(tabSession);
    return tab ? { name: tab.name, path: tab.path, is_dir: false } : null;
  }, [tabSession]);
  const showTabBar = shouldShowTabBar(tabSession);
  const hasSidebar = hasWorkspace(workspace);
  const showWelcomeScreen = !activeFile && launchBehavior === 'welcome';
  const textFocus = useMenuTextFocus();
  const menuState = useMemo(
    () =>
      deriveAppMenuState({
        textFocus,
        treeFocus,
        activeFile,
        hasWorkspace: hasSidebar,
        settingsOpen,
        welcomeScreen: showWelcomeScreen,
        tabCount: tabSession.tabs.length,
      }),
    [textFocus, treeFocus, activeFile, hasSidebar, settingsOpen, showWelcomeScreen, tabSession.tabs.length],
  );
  const restoredRef = useRef(false);
  const imageNoticeTimerRef = useRef<number | null>(null);
  const handleImageNotice = useCallback(
    (key: ImageNoticeKey) => {
      const messageKey = {
        unsupported: 'status.image.unsupported',
        'too-large': 'status.image.too-large',
        'write-failed': 'status.image.write-failed',
        'saved-original': 'status.image.saved-original',
      } as const;
      setImageNotice(t(messageKey[key]));
      if (imageNoticeTimerRef.current !== null) {
        window.clearTimeout(imageNoticeTimerRef.current);
      }
      imageNoticeTimerRef.current = window.setTimeout(() => setImageNotice(null), 3000);
    },
    [t],
  );
  const diskBaselineRef = useRef('');
  const writingRef = useRef(false);
  const checkGenerationRef = useRef(0);
  const loadGenerationRef = useRef(0);
  const hydratedPathRef = useRef<string | null>(null);
  const tabSessionRef = useRef(tabSession);
  const activeFileRef = useRef(activeFile);
  const markdownRef = useRef(markdown);
  const docRef = useRef(doc);
  const dirtyRef = useRef(dirty);
  const savedRef = useRef(saved);
  const viewRef = useRef(view);
  const editorEpochRef = useRef(editorEpoch);
  const conflictRef = useRef(conflict);
  tabSessionRef.current = tabSession;
  activeFileRef.current = activeFile;
  markdownRef.current = markdown;
  docRef.current = doc;
  dirtyRef.current = dirty;
  savedRef.current = saved;
  viewRef.current = view;
  editorEpochRef.current = editorEpoch;
  conflictRef.current = conflict;

  const livePatch = (): EditorTabLivePatch => ({
    markdown: markdownRef.current,
    doc: docRef.current,
    dirty: dirtyRef.current,
    saved: savedRef.current,
    view: viewRef.current,
    editorEpoch: editorEpochRef.current,
    diskBaseline: diskBaselineRef.current,
    conflict: conflictRef.current,
  });

  const applyTabSession = useCallback((next: EditorTabsState, options?: { force?: boolean }) => {
    const tab = activeTab(next);
    tabSessionRef.current = next;
    setTabSession(next);
    const file = tab ? { name: tab.name, path: tab.path, is_dir: false } : null;
    activeFileRef.current = file;
    if (!tab) {
      hydratedPathRef.current = null;
      checkGenerationRef.current += 1;
      markdownRef.current = '';
      docRef.current = emptyEditorDoc();
      dirtyRef.current = false;
      savedRef.current = true;
      viewRef.current = 'edit';
      editorEpochRef.current = 0;
      conflictRef.current = null;
      diskBaselineRef.current = '';
      setMarkdown('');
      setDoc(emptyEditorDoc());
      setDirty(false);
      setSaved(true);
      setView('edit');
      setConflict(null);
      setEditorEpoch(0);
      return;
    }
    if (!options?.force && tab.path === hydratedPathRef.current) {
      return;
    }
    hydratedPathRef.current = tab.path;
    checkGenerationRef.current += 1;
    let nextDoc = emptyEditorDoc();
    try {
      nextDoc = parseMarkdown(tab.markdown);
    } catch {
      nextDoc = cloneJsonContent(tab.doc);
    }
    markdownRef.current = tab.markdown;
    docRef.current = nextDoc;
    dirtyRef.current = tab.dirty;
    savedRef.current = tab.saved;
    viewRef.current = tab.view;
    editorEpochRef.current += 1;
    conflictRef.current = tab.conflict;
    diskBaselineRef.current = tab.diskBaseline;
    setMarkdown(tab.markdown);
    setDoc(nextDoc);
    setDirty(tab.dirty);
    setSaved(tab.saved);
    setView(tab.view);
    setConflict(tab.conflict);
    setEditorEpoch((value) => value + 1);
  }, []);

  const focusTabFile = useCallback((path: string, name: string) => {
    setTreeFocus({ type: 'file', file: { name, path, is_dir: false } });
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && settingsOpen) {
        setSettingsOpen(false);
      }
      const digit = parseTabShortcut(event);
      if (digit === null) {
        return;
      }
      const index = tabIndexForShortcut(digit, tabSessionRef.current.tabs.length);
      if (index === null) {
        return;
      }
      event.preventDefault();
      setSettingsOpen(false);
      const next = activateTabAt(tabSessionRef.current, index, livePatch());
      applyTabSession(next);
      const tab = activeTab(next);
      if (tab) {
        focusTabFile(tab.path, tab.name);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [settingsOpen, applyTabSession, focusTabFile]);

  const contentClass =
    editorWidthMode === 'wide'
      ? 'w-full min-h-full px-10 py-10'
      : 'mx-auto w-full max-w-[720px] min-h-full px-10 py-10';

  const sourceContentClass =
    editorWidthMode === 'wide'
      ? 'flex w-full min-h-0 flex-1 flex-col overflow-hidden'
      : 'mx-auto flex w-full max-w-[720px] min-h-0 flex-1 flex-col overflow-hidden';

  const floaterAnchorClass =
    editorWidthMode === 'wide'
      ? 'px-10'
      : 'mx-auto w-full max-w-[720px] px-10';

  const stats = useMemo(
    () => computeDocumentStats(doc, locale),
    [doc, locale],
  );

  const headings = useMemo(() => extractHeadings(doc), [doc]);
  const { activeIndex: activeHeadingIndex, setActiveIndex: setActiveHeadingIndex } =
    useActiveOutlineHeading(headings, view, activeFile?.path ?? '');

  const handleHeadingClick = useCallback((index: number) => {
    setActiveHeadingIndex(index);
    const elements = document.querySelectorAll(OUTLINE_HEADING_SELECTOR);
    const target = elements[index];
    if (target instanceof HTMLElement) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [setActiveHeadingIndex]);

  const refreshRecentFiles = useCallback(async () => {
    setRecentFiles(await getRecentFiles());
  }, []);

  const persistWorkspace = useCallback(async (next: WorkspaceState) => {
    await saveWorkspace(next);
    setPersistedWorkspace(next);
  }, []);

  const applyWorkspace = useCallback(
    (next: WorkspaceState) => {
      setWorkspace(next);
      void persistWorkspace(next);
    },
    [persistWorkspace],
  );

  const refreshTree = useCallback(() => {
    setTreeRefreshKey((key) => key + 1);
  }, []);

  const applyDiskContent = useCallback((content: string) => {
    diskBaselineRef.current = content;
    setMarkdown(content);
    setDoc(parseMarkdown(content));
    setDirty(false);
    setSaved(true);
    setConflict(null);
    setEditorEpoch((value) => value + 1);
  }, []);

  const checkExternalChange = useCallback(async () => {
    const file = activeFileRef.current;
    if (!file || writingRef.current) {
      return;
    }
    const generation = checkGenerationRef.current;
    let diskContent: string;
    try {
      diskContent = await readFile(file.path);
    } catch {
      return;
    }
    if (
      generation !== checkGenerationRef.current ||
      writingRef.current ||
      activeFileRef.current?.path !== file.path
    ) {
      return;
    }

    const action = classifyExternalChange({
      diskContent,
      baseline: diskBaselineRef.current,
      editorContent: markdownRef.current,
      dirty: dirtyRef.current || conflictRef.current !== null,
    });

    if (action === 'ignore') {
      if (conflictRef.current) {
        setConflict(null);
      }
      return;
    }
    if (action === 'sync') {
      diskBaselineRef.current = diskContent;
      setDirty(false);
      setSaved(true);
      setConflict(null);
      return;
    }
    if (action === 'reload') {
      applyDiskContent(diskContent);
      return;
    }

    setConflict((current) => {
      if (current && current.path === file.path) {
        return { ...current, diskContent };
      }
      return { path: file.path, diskContent, comparing: false };
    });
  }, [applyDiskContent]);

  useWorkspaceWatcher(workspaceRootPaths(workspace), () => {
    refreshTree();
    void checkExternalChange();
  });

  const ensureRootForPath = useCallback(
    (filePath: string): WorkspaceState => {
      if (isPathInWorkspace(filePath, workspace)) {
        return workspace;
      }
      const next = addRoot(workspace, workspaceForFile(filePath, userHomeDir));
      applyWorkspace(next);
      return next;
    },
    [workspace, applyWorkspace, userHomeDir],
  );

  useEffect(() => {
    if (!ready || restoredRef.current) {
      return;
    }
    restoredRef.current = true;
    void (async () => {
      try {
        const stored = await loadWorkspace();
        setPersistedWorkspace(stored);
        if (hasWorkspace(stored)) {
          setWorkspace(stored);
        }
        await refreshRecentFiles();
      } finally {
        setWorkspaceReady(true);
      }
    })();
  }, [ready, launchBehavior, refreshRecentFiles]);

  const loadFile = useCallback(
    async (path: string) => {
      const existing = tabSessionRef.current.tabs.find((tab) => tab.path === path);
      if (existing?.dirty || existing?.conflict) {
        loadGenerationRef.current += 1;
        setSettingsOpen(false);
        applyTabSession(openOrActivateTab(tabSessionRef.current, existing, livePatch()));
        focusTabFile(existing.path, existing.name);
        return;
      }

      const generation = ++loadGenerationRef.current;
      ensureRootForPath(path);
      try {
        const content = await readFile(path);
        const entry = toFileEntry(path);
        const nextTab = createEditorTab({
          path,
          name: entry.name,
          markdown: content,
          doc: parseMarkdown(content),
        });
        if (generation !== loadGenerationRef.current) {
          applyTabSession(insertTab(tabSessionRef.current, nextTab, { activate: false, live: livePatch() }));
          await addRecentFile(path);
          await refreshRecentFiles();
          return;
        }

        setSettingsOpen(false);
        applyTabSession(putTab(tabSessionRef.current, nextTab, { live: livePatch() }), { force: true });
        focusTabFile(entry.path, entry.name);
        await addRecentFile(path);
        await refreshRecentFiles();
      } catch {
        loadGenerationRef.current += 1;
      }
    },
    [ensureRootForPath, refreshRecentFiles, applyTabSession, focusTabFile],
  );

  const addFolderToWorkspace = useCallback(
    async (path: string, loadFirst = false) => {
      const next = addRoot(workspace, path);
      applyWorkspace(next);
      refreshTree();
      if (loadFirst) {
        const files = await listMarkdownFiles(path);
        if (files[0]) {
          await loadFile(files[0].path);
        }
      }
    },
    [workspace, applyWorkspace, refreshTree, loadFile],
  );

  const handleOpenSavedWorkspace = useCallback(() => {
    if (!hasWorkspace(persistedWorkspace)) {
      return;
    }
    applyWorkspace(persistedWorkspace);
    refreshTree();
  }, [persistedWorkspace, applyWorkspace, refreshTree]);

  const handleAddFolder = useCallback(async () => {
    const path = await pickFolder();
    if (path) {
      await addFolderToWorkspace(path, false);
    }
  }, [addFolderToWorkspace]);

  const handleOpenFile = useCallback(async () => {
    const path = await pickMarkdownFile();
    if (path) {
      ensureRootForPath(path);
      await loadFile(path);
    }
  }, [ensureRootForPath, loadFile]);

  const handleOpenRecent = useCallback(
    async (path: string) => {
      try {
        ensureRootForPath(path);
        await loadFile(path);
      } catch {
        await removeRecentFile(path);
        await refreshRecentFiles();
      }
    },
    [ensureRootForPath, loadFile, refreshRecentFiles],
  );

  const handleRemoveRoot = useCallback(
    (root: WorkspaceRoot) => {
      const next = removeRoot(workspace, root.path);
      applyWorkspace(next);
      refreshTree();
      applyTabSession(
        closeTabsWhere(
          tabSessionRef.current,
          (tab) => !isPathInWorkspace(tab.path, next),
          livePatch(),
        ),
      );
      const remaining = activeTab(tabSessionRef.current);
      if (remaining) {
        focusTabFile(remaining.path, remaining.name);
      } else {
        setTreeFocus(null);
      }
    },
    [workspace, applyWorkspace, refreshTree, applyTabSession, focusTabFile],
  );

  const handleRenameRootConfirm = useCallback(
    (label: string) => {
      if (!renameRootTarget) {
        return;
      }
      const next = renameRoot(workspace, renameRootTarget.path, label);
      applyWorkspace(next);
      setRenameRootTarget(null);
    },
    [renameRootTarget, workspace, applyWorkspace],
  );

  const handleRenameFile = useCallback((file: FileEntry) => {
    setRenameTarget(file);
  }, []);

  const handleRenameConfirm = useCallback(
    async (nextName: string) => {
      if (!renameTarget) {
        return;
      }
      const target = renameTarget;
      setRenameTarget(null);
      try {
        if (target.is_dir) {
          const newPath = await renameDirectory(target.path, nextName);
          const recent = await getRecentFiles();
          await Promise.all(
            recent.map(async (recentPath) => {
              const updated = replacePathPrefix(recentPath, target.path, newPath);
              if (updated !== recentPath) {
                await replaceRecentFile(recentPath, updated);
              }
            }),
          );
          refreshTree();
          applyTabSession(
            renameTabPathsWithPrefix(
              snapshotActiveTab(tabSessionRef.current, livePatch()),
              target.path,
              newPath,
            ),
          );
          const renamed = activeTab(tabSessionRef.current);
          if (renamed) {
            focusTabFile(renamed.path, renamed.name);
          }
          await refreshRecentFiles();
          return;
        }

        const newPath = await renameFile(target.path, nextName);
        await syncAssetsOnRename(target.path, newPath);
        await replaceRecentFile(target.path, newPath);
        refreshTree();
        applyTabSession(
          renameTabPath(
            snapshotActiveTab(tabSessionRef.current, livePatch()),
            target.path,
            newPath,
            basename(newPath),
          ),
        );
        const renamed = activeTab(tabSessionRef.current);
        if (renamed) {
          focusTabFile(renamed.path, renamed.name);
        }
      } catch {
        // operation failed silently; UI state unchanged
      }
    },
    [renameTarget, refreshTree, applyTabSession, focusTabFile, refreshRecentFiles],
  );

  const handleCopyFile = useCallback(
    async (file: FileEntry) => {
      try {
        const newPath = await copyFile(file.path);
        await syncAssetsOnCopy(file.path, newPath);
        refreshTree();
        await loadFile(newPath);
      } catch {
        // operation failed silently; UI state unchanged
      }
    },
    [refreshTree, loadFile],
  );

  const handleMoveFile = useCallback(
    async (file: FileEntry) => {
      const destDir = await pickFolder();
      if (!destDir) {
        return;
      }
      try {
        const newPath = await moveFile(file.path, destDir);
        await syncAssetsOnMove(file.path, newPath);
        await replaceRecentFile(file.path, newPath);
        ensureRootForPath(newPath);
        refreshTree();
        applyTabSession(
          renameTabPath(
            snapshotActiveTab(tabSessionRef.current, livePatch()),
            file.path,
            newPath,
            basename(newPath),
          ),
        );
        const moved = activeTab(tabSessionRef.current);
        if (moved) {
          focusTabFile(moved.path, moved.name);
        }
      } catch {
        // operation failed silently; UI state unchanged
      }
    },
    [ensureRootForPath, refreshTree, applyTabSession, focusTabFile],
  );

  const handleDelete = useCallback(
    async (entry: FileEntry) => {
      const displayName = entry.is_dir ? entry.name : displayFileName(entry.name);
      const confirmed = await confirmTrash(displayName, {
        title: entry.is_dir ? t('dialog.deleteFolder.title') : t('dialog.deleteFile.title'),
        message: entry.is_dir ? t('dialog.deleteFolder.message') : t('dialog.deleteFile.message'),
        cancel: t('dialog.cancel'),
        confirm: t('dialog.confirm'),
      });
      if (!confirmed) {
        return;
      }
      try {
        await moveToTrash(entry.path);
        if (!entry.is_dir) {
          await syncAssetsOnDelete(entry.path);
        }
        const recent = await getRecentFiles();
        const dirPrefix = entry.is_dir ? `${entry.path}/` : null;
        await Promise.all(
          recent.map(async (recentPath) => {
            if (
              recentPath === entry.path ||
              (dirPrefix !== null && recentPath.startsWith(dirPrefix))
            ) {
              await removeRecentFile(recentPath);
            }
          }),
        );
        refreshTree();
        applyTabSession(
          closeTabsWhere(
            tabSessionRef.current,
            (tab) =>
              tab.path === entry.path ||
              (dirPrefix !== null && tab.path.startsWith(dirPrefix)),
            livePatch(),
          ),
        );
        const remaining = activeTab(tabSessionRef.current);
        if (remaining) {
          focusTabFile(remaining.path, remaining.name);
        } else {
          setTreeFocus(null);
        }
        await refreshRecentFiles();
      } catch {
        // operation failed silently; UI state unchanged
      }
    },
    [refreshTree, refreshRecentFiles, applyTabSession, focusTabFile, t],
  );

  const resolveNewFileDir = useCallback(async (): Promise<string> => {
    if (activeFile) {
      return dirname(activeFile.path);
    }
    if (treeFocus?.type === 'folder' || treeFocus?.type === 'root') {
      return treeFocus.path;
    }
    if (treeFocus?.type === 'file') {
      return dirname(treeFocus.file.path);
    }
    return defaultNewFileDir();
  }, [activeFile, treeFocus]);

  const openNewFileDialog = useCallback(
    async (explicitDir?: string) => {
      try {
        const defaultDir = (await defaultNewFileDir()).trim();
        if (!defaultDir) {
          return;
        }
        const contextualDir = (await resolveNewFileDir()).trim();
        const dir = explicitDir?.trim() || contextualDir || defaultDir;
        const name = await suggestMarkdownFilename(dir);
        setNewFileState({
          dir,
          defaultName: name,
          defaultDir,
          locationLocked: Boolean(explicitDir?.trim()),
        });
      } catch {
        // operation failed silently; UI state unchanged
      }
    },
    [resolveNewFileDir],
  );

  const handleNewFileConfirm = useCallback(
    async (dir: string, name: string) => {
      setNewFileState(null);
      if (!dir) {
        return;
      }
      try {
        const path = await createMarkdownFile(dir, name);
        ensureRootForPath(path);
        refreshTree();
        await loadFile(path);
      } catch {
        // operation failed silently; UI state unchanged
      }
    },
    [ensureRootForPath, refreshTree, loadFile],
  );

  const handleNewFilePickLocation = useCallback(async () => {
    const path = await pickFolder();
    if (path) {
      setNewFileState((current) => (current ? { ...current, dir: path } : null));
    }
  }, []);

  const handleNewFileSelectLocation = useCallback((dir: string) => {
    setNewFileState((current) => (current ? { ...current, dir } : null));
  }, []);

  const handleNewFileInDir = useCallback(
    (dir: string) => {
      void openNewFileDialog(dir);
    },
    [openNewFileDialog],
  );

  const handleNewSubfolderInDir = useCallback(
    async (dir: string) => {
      try {
        const defaultName = await suggestSubdirectoryName(dir);
        setNewFolderState({ parent: dir, defaultName });
      } catch {
        // operation failed silently; UI state unchanged
      }
    },
    [],
  );

  const handleNewFolderConfirm = useCallback(
    async (name: string) => {
      const state = newFolderState;
      setNewFolderState(null);
      if (!state) {
        return;
      }
      try {
        await createSubdirectory(state.parent, name);
        refreshTree();
      } catch {
        // operation failed silently; UI state unchanged
      }
    },
    [newFolderState, refreshTree],
  );

  const handleNewFile = useCallback(async () => {
    await openNewFileDialog();
  }, [openNewFileDialog]);

  const handleViewChange = (nextView: ViewMode) => {
    if (view === 'edit' && nextView !== 'edit') {
      setMarkdown(serializeMarkdown(doc));
    }
    if (view === 'source' && nextView !== 'source') {
      setDoc(parseMarkdown(markdown));
    }
    setView(nextView);
  };

  const handleSourceChange = (value: string) => {
    setMarkdown(value);
    setDoc(parseMarkdown(value));
    setDirty(true);
    setSaved(false);
  };

  const handleEditorChange = (nextDoc: JSONContent) => {
    let nextMarkdown: string;
    try {
      nextMarkdown = serializeMarkdown(nextDoc);
    } catch {
      return;
    }
    setDoc(nextDoc);
    setMarkdown(nextMarkdown);
    setDirty(true);
    setSaved(false);
  };

  const handleExport = async (format: 'markdown' | 'html', targetPath: string) => {
    const file = exportTarget ?? activeFile;
    const title = file ? displayFileName(file.name) : '文档';
    let sourceMarkdown = markdown;
    if (file && file.path !== activeFile?.path) {
      sourceMarkdown = await readFile(file.path);
    }
    const content =
      format === 'markdown'
        ? sourceMarkdown
        : documentToHtml(title, sourceMarkdown.replace(/\n/g, '<br />'));
    await exportFile(expandUserPath(targetPath, userHomeDir), format, content);
    setExportTarget(null);
  };

  const handleExportFile = useCallback((file: FileEntry) => {
    setExportTarget(file);
    setExportOpen(true);
  }, []);

  const handleSearch = useCallback(
    async (query: ParsedSearchQuery) => {
      if (!hasWorkspace(workspace)) {
        return [];
      }
      const batches = await Promise.all(
        workspace.roots.map((root) => searchWorkspace(root.path, query)),
      );
      return batches.flat();
    },
    [workspace],
  );

  const handleOpenFolder = useCallback(async () => {
    const path = await pickFolder();
    if (path) {
      await addFolderToWorkspace(path, true);
    }
  }, [addFolderToWorkspace]);

  const closeEditorTab = useCallback(
    (path: string) => {
      const session = tabSessionRef.current;
      const tab = session.tabs.find((item) => item.path === path);
      if (!tab) {
        return;
      }
      const isActive = session.activePath === path;
      const markdownToWrite = isActive ? markdownRef.current : tab.markdown;
      if (tab.dirty || tab.conflict || (isActive && (dirtyRef.current || conflictRef.current))) {
        checkGenerationRef.current += 1;
        writingRef.current = true;
        void writeFile(path, markdownToWrite).finally(() => {
          writingRef.current = false;
        });
      }
      const next = closeTab(session, path, livePatch());
      applyTabSession(next);
      const remaining = activeTab(next);
      if (remaining) {
        focusTabFile(remaining.path, remaining.name);
      } else {
        setTreeFocus(null);
      }
    },
    [applyTabSession, focusTabFile],
  );

  const handleSelectTabPath = useCallback(
    (path: string) => {
      const existing = tabSessionRef.current.tabs.find((tab) => tab.path === path);
      if (!existing) {
        return;
      }
      setSettingsOpen(false);
      applyTabSession(openOrActivateTab(tabSessionRef.current, existing, livePatch()));
      focusTabFile(path, existing.name);
    },
    [applyTabSession, focusTabFile],
  );

  const handleCloseDocument = useCallback(() => {
    setSettingsOpen(false);
    const file = activeFileRef.current;
    if (!file) {
      return;
    }
    closeEditorTab(file.path);
  }, [closeEditorTab]);

  const handleMenuAction = useCallback(
    (action: AppMenuAction) => {
      const tabDigit = selectTabDigitFromAction(action);
      if (tabDigit !== null) {
        const index = tabIndexForShortcut(tabDigit, tabSessionRef.current.tabs.length);
        if (index === null) {
          return;
        }
        const tab = tabSessionRef.current.tabs[index];
        if (tab) {
          handleSelectTabPath(tab.path);
        }
        return;
      }
      switch (action) {
        case 'settings':
          setSettingsOpen(true);
          return;
        case 'new-document':
          void handleNewFile();
          return;
        case 'open-folder':
          void handleOpenFolder();
          return;
        case 'open-file':
          void handleOpenFile();
          return;
        case 'new-folder': {
          const dir =
            treeFocus?.type === 'folder'
              ? treeFocus.path
              : treeFocus?.type === 'root'
                ? treeFocus.path
                : null;
          if (dir) {
            void handleNewSubfolderInDir(dir);
          }
          return;
        }
        case 'duplicate': {
          const file = treeFocus?.type === 'file' ? treeFocus.file : activeFile;
          if (file) {
            void handleCopyFile(file);
          }
          return;
        }
        case 'export':
          setExportTarget(null);
          setExportOpen(true);
          return;
        case 'close-document':
          handleCloseDocument();
          return;
        case 'find':
          setSearchOpen(true);
          return;
        case 'undo':
          dispatchMenuEditAction('undo');
          return;
        case 'redo':
          dispatchMenuEditAction('redo');
          return;
        case 'cut':
          dispatchMenuEditAction('cut');
          return;
        case 'copy':
          dispatchMenuEditAction('copy');
          return;
        case 'paste':
          dispatchMenuEditAction('paste');
          return;
        case 'select-all':
          dispatchMenuEditAction('select-all');
          return;
        case 'toggle-sidebar':
          setSidebarOpen((value) => !value);
          return;
        case 'toggle-inspector':
          setInspectorOpen((value) => !value);
          return;
        case 'view-edit':
          handleViewChange('edit');
          return;
        case 'view-source':
          handleViewChange('source');
          return;
        case 'view-preview':
          handleViewChange('preview');
          return;
      }
    },
    [
      activeFile,
      treeFocus,
      handleNewFile,
      handleOpenFolder,
      handleOpenFile,
      handleNewSubfolderInDir,
      handleCopyFile,
      handleCloseDocument,
      handleSelectTabPath,
      handleViewChange,
    ],
  );

  useAppMenu(ready && workspaceReady, t, menuState, handleMenuAction);

  const handleReloadExternal = useCallback(() => {
    const openConflict = conflictRef.current;
    if (!openConflict) {
      return;
    }
    checkGenerationRef.current += 1;
    applyDiskContent(openConflict.diskContent);
  }, [applyDiskContent]);

  const handleKeepLocal = useCallback(async () => {
    const file = activeFileRef.current;
    if (!file) {
      return;
    }
    checkGenerationRef.current += 1;
    writingRef.current = true;
    try {
      await writeFile(file.path, markdownRef.current);
      diskBaselineRef.current = markdownRef.current;
      setDirty(false);
      setSaved(true);
      setConflict(null);
    } finally {
      writingRef.current = false;
    }
  }, []);

  const handleToggleCompare = useCallback(() => {
    setConflict((current) =>
      current ? { ...current, comparing: !current.comparing } : current,
    );
  }, []);

  useEffect(() => {
    if (!activeFile || !dirty || conflict) {
      return;
    }
    const timer = window.setTimeout(async () => {
      writingRef.current = true;
      try {
        await writeFile(activeFile.path, markdown);
        diskBaselineRef.current = markdown;
        setDirty(false);
        setSaved(true);
      } finally {
        writingRef.current = false;
      }
    }, 2000);
    return () => window.clearTimeout(timer);
  }, [activeFile, dirty, markdown, conflict]);

  const conflictChangedCount = useMemo(() => {
    if (!conflict) {
      return 0;
    }
    return countChangedRows(alignMarkdownDiff(markdown, conflict.diskContent));
  }, [conflict, markdown]);

  const welcomeLabels = {
    workspace: t('sidebar.workspace'),
    recent: t('welcome.recent'),
    tagline: t('welcome.tagline'),
    newDocument: t('welcome.newDocument'),
    openFolder: t('welcome.openFolder'),
    openFile: t('welcome.openFile'),
    or: t('welcome.or'),
  };

  const sidebarLabels = {
    empty: t('sidebar.empty'),
    emptyHint: t('sidebar.emptyHint'),
    settings: t('sidebar.settings'),
    collapseSidebar: t('app.collapseSidebar'),
    expandSidebar: t('app.expandSidebar'),
    newFile: t('context.newFile'),
    newFolder: t('menu.newFolder'),
    newSubfolder: t('context.newSubfolder'),
    expand: t('sidebar.expand'),
    collapse: t('sidebar.collapse'),
    search: t('app.search'),
    rename: t('context.rename'),
    renameWorkspace: t('context.renameWorkspace'),
    removeFromWorkspace: t('context.removeFromWorkspace'),
    addFolder: t('app.addFolder'),
    copy: t('context.copy'),
    move: t('context.move'),
    delete: t('context.delete'),
    export: t('context.export'),
    openInFileManager: t('context.openInFileManager'),
    openInTerminal: t('context.openInTerminal'),
    update: availableVersion
      ? t('sidebar.update').replace('{version}', availableVersion)
      : t('settings.updateAction.install'),
    updateInstalling: t('sidebar.update.installing'),
  };

  const welcomeScreen = (
    <WelcomeScreen
      workspaceRoots={workspace.roots}
      recentFiles={recentFiles}
      homeDir={userHomeDir}
      showWorkspaceList={!hasSidebar}
      labels={welcomeLabels}
      onNewDocument={() => void handleNewFile()}
      onOpenWorkspace={handleOpenSavedWorkspace}
      onOpenFolder={async () => {
        const path = await pickFolder();
        if (path) {
          await addFolderToWorkspace(path, true);
        }
      }}
      onOpenFile={handleOpenFile}
      onOpenRecent={handleOpenRecent}
    />
  );

  const appDialogs = (
    <>
      <ExportSheet
        open={exportOpen}
        defaultPath={formatDisplayPath(
          (exportTarget ?? activeFile)
            ? (exportTarget ?? activeFile)!.path.replace(/\.md$/i, '.html')
            : userHomeDir
              ? `${userHomeDir}/Downloads/leafio-export.html`
              : '~/Downloads/leafio-export.html',
          userHomeDir,
        )}
        onClose={() => {
          setExportOpen(false);
          setExportTarget(null);
        }}
        onExport={handleExport}
      />
      <RenameDialog
        open={newFolderState !== null}
        currentName={newFolderState?.defaultName ?? ''}
        title={t('context.newSubfolder')}
        cancelLabel={t('dialog.cancel')}
        confirmLabel={t('dialog.confirm')}
        parentPath={newFolderState?.parent}
        duplicateError={t('dialog.nameExists')}
        onConfirm={(name) => void handleNewFolderConfirm(name)}
        onClose={() => setNewFolderState(null)}
      />
      <RenameDialog
        open={renameTarget !== null}
        currentName={renameTarget?.name ?? ''}
        title={
          renameTarget?.is_dir ? t('context.renameFolder') : t('context.rename')
        }
        cancelLabel={t('dialog.cancel')}
        confirmLabel={t('dialog.confirm')}
        stripMdExtension={!renameTarget?.is_dir}
        parentPath={renameTarget ? dirname(renameTarget.path) : undefined}
        excludeName={renameTarget?.name}
        duplicateError={t('dialog.nameExists')}
        onConfirm={(name) => void handleRenameConfirm(name)}
        onClose={() => setRenameTarget(null)}
      />
      <RenameDialog
        open={renameRootTarget !== null}
        title={t('context.renameWorkspace')}
        cancelLabel={t('dialog.cancel')}
        confirmLabel={t('dialog.confirm')}
        currentName={
          renameRootTarget
            ? workspaceDisplayName(renameRootTarget.path, renameRootTarget.label)
            : ''
        }
        conflictNames={workspace.roots
          .filter((root) => root.path !== renameRootTarget?.path)
          .map((root) => workspaceDisplayName(root.path, root.label))}
        excludeName={
          renameRootTarget
            ? workspaceDisplayName(renameRootTarget.path, renameRootTarget.label)
            : undefined
        }
        duplicateError={t('dialog.workspaceNameExists')}
        onConfirm={handleRenameRootConfirm}
        onClose={() => setRenameRootTarget(null)}
      />
      <NewFileDialog
        open={newFileState !== null}
        dir={newFileState?.dir ?? ''}
        defaultName={newFileState?.defaultName ?? ''}
        homeDir={userHomeDir}
        workspaceRoots={workspace.roots}
        defaultDir={newFileState?.defaultDir ?? ''}
        locationLocked={newFileState?.locationLocked ?? false}
        labels={{
          title: t('newFile.title'),
          location: t('newFile.location'),
          filename: t('newFile.filename'),
          changeLocation: t('newFile.changeLocation'),
          collapsePicker: t('newFile.collapsePicker'),
          chooseLocation: t('newFile.chooseLocation'),
          useDefaultLocation: t('newFile.useDefaultLocation'),
          cancel: t('dialog.cancel'),
          confirm: t('newFile.create'),
          nameExists: t('dialog.nameExists'),
        }}
        onConfirm={(dir, name) => void handleNewFileConfirm(dir, name)}
        onPickLocation={() => void handleNewFilePickLocation()}
        onSelectLocation={handleNewFileSelectLocation}
        onClose={() => setNewFileState(null)}
      />
      <SearchDialog
        open={searchOpen}
        hasWorkspace={hasSidebar}
        homeDir={userHomeDir}
        labels={{
          placeholder: t('search.placeholder'),
          noWorkspace: t('search.noWorkspace'),
          loading: t('search.loading'),
          noResults: t('search.noResults'),
          hint: t('search.hint'),
          hintTag: t('search.hintTag'),
          hintPath: t('search.hintPath'),
          exampleTag: t('search.exampleTag'),
          examplePath: t('search.examplePath'),
          navigate: t('search.navigate'),
          open: t('search.open'),
          close: t('search.close'),
        }}
        onClose={() => setSearchOpen(false)}
        onSearch={handleSearch}
        onSelect={(path) => void loadFile(path)}
      />
    </>
  );

  if (!ready || !workspaceReady) {
    return (
      <div className="relative flex h-full flex-col overflow-hidden bg-[var(--window-bg)] font-ui text-[var(--text)]">
        <WindowDragBar title="Leafio" />
      </div>
    );
  }

  if (!hasSidebar && !activeFile) {
    return (
      <div className="relative flex h-full flex-col overflow-hidden bg-[var(--window-bg)] font-ui text-[var(--text)]">
        <WindowDragBar title="Leafio" />
        {welcomeScreen}
        {appDialogs}
      </div>
    );
  }

  const chromeSurface = settingsOpen
    ? 'settings'
    : showWelcomeScreen
      ? 'window'
      : 'paper';

  return (
    <div className="relative flex h-full overflow-hidden bg-[var(--window-bg)] font-ui text-[var(--text)]">
      <Sidebar
        roots={workspace.roots}
        activePath={activeFile?.path}
        treeRefreshKey={treeRefreshKey}
        open={sidebarOpen}
        chromeSurface={chromeSurface}
        settingsActive={settingsOpen}
        settingsSection={settingsSection}
        t={t}
        onSelect={(file) => {
          setSettingsOpen(false);
          void loadFile(file.path);
        }}
        onOpenSettings={() => setSettingsOpen((value) => !value)}
        onInstallUpdate={() => void installUpdate()}
        onSettingsSectionChange={setSettingsSection}
        labels={sidebarLabels}
        updateAvailable={Boolean(availableVersion) || updateStatus === 'available'}
        updateInstalling={updateStatus === 'downloading'}
        onSearch={() => setSearchOpen(true)}
        onExport={handleExportFile}
        onToggle={() => setSidebarOpen((value) => !value)}
        onAddFolder={() => void handleAddFolder()}
        onNewFile={() => void handleNewFile()}
        onRenameRoot={setRenameRootTarget}
        onRemoveRoot={handleRemoveRoot}
        onNewFileInDir={(dir) => void handleNewFileInDir(dir)}
        onNewSubfolderInDir={(dir) => void handleNewSubfolderInDir(dir)}
        onRename={handleRenameFile}
        onCopy={(file) => void handleCopyFile(file)}
        onMove={(file) => void handleMoveFile(file)}
        onDelete={(entry) => void handleDelete(entry)}
        onTreeFocus={setTreeFocus}
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {showTabBar ? (
          <EditorTabBar
            tabs={tabSession.tabs}
            activePath={tabSession.activePath}
            insetForTrafficLights={!sidebarOpen}
            labels={{
              list: t('tabs.list'),
              close: t('tabs.close'),
            }}
            onSelect={handleSelectTabPath}
            onClose={closeEditorTab}
          />
        ) : null}
        <div className="flex min-h-0 flex-1 overflow-hidden">
          {settingsOpen ? (
            <SettingsView
              section={settingsSection}
              editorWidthMode={editorWidthMode}
              editorFontFamily={editorFontFamily}
              editorFontSize={editorFontSize}
              editorTabWidth={editorTabWidth}
              compressImages={compressImages}
              theme={theme}
              language={language}
              launchBehavior={launchBehavior}
              autoUpdateEnabled={autoUpdateEnabled}
              appVersion={appVersion}
              updateStatus={updateStatus}
              availableVersion={availableVersion}
              updateError={updateError}
              downloadRatio={downloadRatio}
              t={t}
              onEditorWidthModeChange={setEditorWidthMode}
              onEditorFontFamilyChange={setEditorFontFamily}
              onEditorFontSizeChange={setEditorFontSize}
              onEditorTabWidthChange={setEditorTabWidth}
              onCompressImagesChange={setCompressImages}
              onThemeChange={setTheme}
              onLanguageChange={setLanguage}
              onLaunchBehaviorChange={setLaunchBehavior}
              onAutoUpdateEnabledChange={setAutoUpdateEnabled}
              onCheckForUpdates={() => void checkForUpdates()}
              onInstallUpdate={() => void installUpdate()}
            />
          ) : showWelcomeScreen ? (
            welcomeScreen
          ) : (
            <>
              <main
                className="relative flex flex-1 flex-col overflow-hidden bg-[var(--paper)]"
                onMouseMove={() => setEditorActivityAt(Date.now())}
              >
                {conflict && activeFile && conflict.path === activeFile.path ? (
                  <ExternalChangeBar
                    labels={{
                      title: t('external.title'),
                      message: t('external.message').replace(
                        '{name}',
                        displayFileName(activeFile.name),
                      ),
                      reload: t('external.reload'),
                      keep: t('external.keep'),
                      compare: t('external.compare'),
                      closeCompare: t('external.closeCompare'),
                      reloadHint: t('external.reloadHint'),
                      keepHint: t('external.keepHint'),
                      compareHint: t('external.compareHint'),
                      changedCount: t('external.changedCount'),
                    }}
                    comparing={conflict.comparing}
                    changedCount={conflictChangedCount}
                    onReload={handleReloadExternal}
                    onKeep={() => void handleKeepLocal()}
                    onToggleCompare={handleToggleCompare}
                  />
                ) : null}
                {conflict?.comparing ? (
                  <ExternalChangeCompare
                    localContent={markdown}
                    diskContent={conflict.diskContent}
                    localLabel={t('external.local')}
                    diskLabel={t('external.disk')}
                  />
                ) : (
                  <>
                    <div
                      className={
                        view === 'source'
                          ? sourceContentClass
                          : `${contentClass} editor-scroll scroll-pane flex flex-1 flex-col min-h-0 overflow-auto`
                      }
                    >
                      {view === 'edit' && activeFile ? (
                        <Editor
                          key={`${activeFile.path}:${editorEpoch}`}
                          content={doc}
                          notePath={activeFile.path}
                          onChange={handleEditorChange}
                          tabWidth={editorTabWidth}
                          compressImages={compressImages}
                          onImageNotice={handleImageNotice}
                        />
                      ) : null}
                      {view === 'source' && activeFile ? (
                        <SourceView
                          value={markdown}
                          onChange={handleSourceChange}
                          tabWidth={editorTabWidth}
                        />
                      ) : null}
                      {view === 'preview' && activeFile ? (
                        <PreviewView
                          key={`${activeFile.path}:${editorEpoch}`}
                          content={doc}
                          notePath={activeFile.path}
                        />
                      ) : null}
                      {!activeFile ? (
                        <p className="text-sm text-[var(--text-secondary)]">
                          {t('app.noFileSelected')}
                        </p>
                      ) : null}
                    </div>
                    {conflict ? null : (
                      <div
                        className={`pointer-events-none absolute inset-x-0 top-0 z-20 ${floaterAnchorClass}`}
                      >
                        <div className="flex justify-end pt-4">
                          <ViewModeFloater
                            view={view}
                            onViewChange={handleViewChange}
                            activityAt={editorActivityAt}
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </main>
              <Inspector
                headings={headings}
                open={inspectorOpen}
                documentKey={activeFile?.path ?? ''}
                activeIndex={activeHeadingIndex}
                onOpenChange={setInspectorOpen}
                onHeadingClick={handleHeadingClick}
              />
            </>
          )}
        </div>
        <StatusBar
          saved={saved}
          notice={imageNotice}
          homeDir={userHomeDir}
          filePath={
            settingsOpen
              ? t('app.settings')
              : activeFile?.path ?? null
          }
          wordCount={stats.words}
          lineCount={stats.lines}
          modeLabel={view === 'source' ? t('status.sourceMode') : undefined}
          editorWidthMode={editorWidthMode}
          onEditorWidthModeChange={setEditorWidthMode}
          widthLabels={{
            centered: t('settings.width.centered'),
            wide: t('settings.width.wide'),
          }}
          labels={{
            saved: t('status.saved'),
            unsaved: t('status.unsaved'),
            words: t('status.words'),
            lines: t('status.lines'),
          }}
        />
      </div>
      {appDialogs}
    </div>
  );
}
