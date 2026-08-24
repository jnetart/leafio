import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { JSONContent } from '@tiptap/react';
import { Editor } from './components/Editor';
import { ExportSheet } from './components/ExportSheet';
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
import { useAppMenu } from './hooks/useAppMenu';
import { useMenuTextFocus } from './hooks/useMenuTextFocus';
import { useI18n } from './hooks/useI18n';
import { computeDocumentStats } from './lib/textStats';
import { usePreferences } from './hooks/usePreferences';
import { useTheme } from './hooks/useTheme';
import { useUserHomeDir } from './hooks/useUserHomeDir';
import { useWorkspaceWatcher } from './hooks/useWorkspaceWatcher';
import type { AppMenuAction } from './lib/app-menu';
import { deriveAppMenuState, type TreeFocusTarget } from './lib/app-menu-state';
import { dispatchMenuEditAction } from './lib/menu-edit';
import { pickFolder, pickMarkdownFile, confirmTrash } from './lib/dialog';
import { documentToHtml, exportFile } from './lib/export';
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
import { extractHeadings } from './lib/headings';
import { basename, dirname, expandUserPath, formatDisplayPath, replacePathPrefix } from './lib/paths';
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
    theme,
    language,
    launchBehavior,
    ready,
    setEditorWidthMode,
    setTheme,
    setLanguage,
    setLaunchBehavior,
  } = usePreferences();
  useTheme(theme);
  const { locale, t } = useI18n(language);
  const userHomeDir = useUserHomeDir();

  const [workspace, setWorkspace] = useState<WorkspaceState>(EMPTY_WORKSPACE);
  const [persistedWorkspace, setPersistedWorkspace] = useState<WorkspaceState>(EMPTY_WORKSPACE);
  const [workspaceReady, setWorkspaceReady] = useState(false);
  const [activeFile, setActiveFile] = useState<FileEntry | null>(null);
  const [recentFiles, setRecentFiles] = useState<string[]>([]);
  const [treeRefreshKey, setTreeRefreshKey] = useState(0);

  const [view, setView] = useState<ViewMode>('edit');
  const [markdown, setMarkdown] = useState('');
  const [doc, setDoc] = useState<JSONContent>({ type: 'doc', content: [] });
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(true);

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
      }),
    [textFocus, treeFocus, activeFile, hasSidebar, settingsOpen, showWelcomeScreen],
  );
  const restoredRef = useRef(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && settingsOpen) {
        setSettingsOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [settingsOpen]);

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

  const handleHeadingClick = useCallback((index: number) => {
    const selector = '.leafio-editor h1, .leafio-editor h2, .leafio-editor h3, .leafio-editor h4';
    const elements = document.querySelectorAll(selector);
    const target = elements[index];
    if (target instanceof HTMLElement) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

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

  useWorkspaceWatcher(workspaceRootPaths(workspace), refreshTree);

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
      const stored = await loadWorkspace();
      setPersistedWorkspace(stored);
      if (hasWorkspace(stored)) {
        setWorkspace(stored);
      }
      setWorkspaceReady(true);
      await refreshRecentFiles();
    })();
  }, [ready, launchBehavior, refreshRecentFiles]);

  const loadFile = useCallback(
    async (path: string) => {
      ensureRootForPath(path);
      const content = await readFile(path);
      const entry = toFileEntry(path);
      setActiveFile(entry);
      setTreeFocus({ type: 'file', file: entry });
      setMarkdown(content);
      setDoc(parseMarkdown(content));
      setDirty(false);
      setSaved(true);
      setView('edit');
      await addRecentFile(path);
      await refreshRecentFiles();
    },
    [ensureRootForPath, refreshRecentFiles],
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
        } else {
          setActiveFile(null);
          setMarkdown('');
          setDoc({ type: 'doc', content: [{ type: 'paragraph' }] });
          setDirty(false);
          setSaved(true);
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
      if (activeFile && !isPathInWorkspace(activeFile.path, next)) {
        setActiveFile(null);
        setMarkdown('');
        setDoc({ type: 'doc', content: [{ type: 'paragraph' }] });
        setDirty(false);
        setSaved(true);
      }
    },
    [workspace, applyWorkspace, refreshTree, activeFile],
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
          if (activeFile?.path.startsWith(`${target.path}/`)) {
            const newActivePath = replacePathPrefix(activeFile.path, target.path, newPath);
            await loadFile(newActivePath);
          }
          await refreshRecentFiles();
          return;
        }

        const newPath = await renameFile(target.path, nextName);
        await replaceRecentFile(target.path, newPath);
        refreshTree();
        if (activeFile?.path === target.path) {
          await loadFile(newPath);
        }
      } catch {
        // operation failed silently; UI state unchanged
      }
    },
    [renameTarget, activeFile?.path, refreshTree, loadFile, refreshRecentFiles],
  );

  const handleCopyFile = useCallback(
    async (file: FileEntry) => {
      try {
        const newPath = await copyFile(file.path);
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
        await replaceRecentFile(file.path, newPath);
        ensureRootForPath(newPath);
        refreshTree();
        if (activeFile?.path === file.path) {
          await loadFile(newPath);
        }
      } catch {
        // operation failed silently; UI state unchanged
      }
    },
    [ensureRootForPath, refreshTree, activeFile?.path, loadFile],
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
        const activeInDeletedTree =
          activeFile &&
          (activeFile.path === entry.path ||
            (dirPrefix !== null && activeFile.path.startsWith(dirPrefix)));
        if (activeInDeletedTree) {
          setActiveFile(null);
          setMarkdown('');
          setDoc({ type: 'doc', content: [{ type: 'paragraph' }] });
          setDirty(false);
          setSaved(true);
        }
        await refreshRecentFiles();
      } catch {
        // operation failed silently; UI state unchanged
      }
    },
    [activeFile, refreshTree, refreshRecentFiles, t],
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
    setDoc(nextDoc);
    setMarkdown(serializeMarkdown(nextDoc));
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
    async (query: string) => {
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

  const handleCloseDocument = useCallback(() => {
    setSettingsOpen(false);
    setActiveFile(null);
    setTreeFocus(null);
    setMarkdown('');
    setDoc({ type: 'doc', content: [{ type: 'paragraph' }] });
    setDirty(false);
    setSaved(true);
    setView('edit');
  }, []);

  const handleMenuAction = useCallback(
    (action: AppMenuAction) => {
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
      handleViewChange,
    ],
  );

  useAppMenu(ready && workspaceReady, t, menuState, handleMenuAction);

  useEffect(() => {
    if (!activeFile || !dirty) {
      return;
    }
    const timer = window.setTimeout(async () => {
      await writeFile(activeFile.path, markdown);
      setDirty(false);
      setSaved(true);
    }, 2000);
    return () => window.clearTimeout(timer);
  }, [activeFile, dirty, markdown]);

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
        onClose={() => setSearchOpen(false)}
        onSearch={handleSearch}
        onSelect={(path) => void loadFile(path)}
      />
    </>
  );

  if (!ready || !workspaceReady) {
    return <div className="flex h-full items-center justify-center bg-[var(--window-bg)]" />;
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
        onSettingsSectionChange={setSettingsSection}
        labels={sidebarLabels}
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
        <div className="flex min-h-0 flex-1 overflow-hidden">
          {settingsOpen ? (
            <SettingsView
              section={settingsSection}
              editorWidthMode={editorWidthMode}
              theme={theme}
              language={language}
              launchBehavior={launchBehavior}
              t={t}
              onEditorWidthModeChange={setEditorWidthMode}
              onThemeChange={setTheme}
              onLanguageChange={setLanguage}
              onLaunchBehaviorChange={setLaunchBehavior}
            />
          ) : showWelcomeScreen ? (
            welcomeScreen
          ) : (
            <>
              <main
                className="relative flex flex-1 flex-col overflow-hidden bg-[var(--paper)]"
                onMouseMove={() => setEditorActivityAt(Date.now())}
              >
                <div
                  className={
                    view === 'source'
                      ? sourceContentClass
                      : `${contentClass} editor-scroll scroll-pane flex flex-1 flex-col min-h-0 overflow-auto`
                  }
                >
                  {view === 'edit' && activeFile ? (
                    <Editor key={activeFile.path} content={doc} onChange={handleEditorChange} />
                  ) : null}
                  {view === 'source' && activeFile ? (
                    <SourceView value={markdown} onChange={handleSourceChange} />
                  ) : null}
                  {view === 'preview' ? <PreviewView content={doc} /> : null}
                  {!activeFile ? (
                    <p className="text-sm text-[var(--text-secondary)]">{t('app.noFileSelected')}</p>
                  ) : null}
                </div>
                <div className={`pointer-events-none absolute inset-x-0 top-0 z-20 ${floaterAnchorClass}`}>
                  <div className="flex justify-end pt-4">
                    <ViewModeFloater
                      view={view}
                      onViewChange={handleViewChange}
                      activityAt={editorActivityAt}
                    />
                  </div>
                </div>
              </main>
              <Inspector
                headings={headings}
                open={inspectorOpen}
                onOpenChange={setInspectorOpen}
                onHeadingClick={handleHeadingClick}
              />
            </>
          )}
        </div>
        <StatusBar
          saved={saved}
          homeDir={userHomeDir}
          filePath={
            settingsOpen
              ? t('app.settings')
              : activeFile?.path ?? null
          }
          wordCount={stats.words}
          lineCount={stats.lines}
          modeLabel={
            editorWidthMode === 'wide'
              ? t('status.wideMode')
              : view === 'source'
                ? t('status.sourceMode')
                : undefined
          }
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
