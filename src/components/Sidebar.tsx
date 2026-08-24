import { useEffect, useState } from 'react';
import type { createTranslator } from '../lib/i18n';
import type { FileEntry } from '../lib/fs';
import type { WorkspaceRoot } from '../lib/workspace';
import { workspaceDisplayName, workspaceRootSubtitle } from '../lib/workspace';
import { openInFileManager, openInTerminal } from '../lib/shell';
import { clearTextSelection } from '../lib/filename-input';
import type { TreeFocusTarget } from '../lib/app-menu-state';
import { SETTINGS_SECTIONS, type SettingsSection } from '../lib/settings-sections';
import { ContextMenu, type ContextMenuItem } from './ContextMenu';
import { FolderRow, useExpandedPaths, WorkspaceRootTree } from './FileTree';
import { useWindowDrag } from '../hooks/useWindowDrag';
import { basename } from '../lib/paths';
import { IconAddWorkspace, IconPanelLeft, IconSearch, IconSettings } from './icons';

const WORKSPACE_ROOT_DEPTH = 0;

interface SidebarChromeProps {
  open: boolean;
  scoped?: boolean;
  surface?: 'window' | 'paper' | 'settings';
  labels: {
    collapseSidebar: string;
    expandSidebar: string;
  };
  onToggle?: () => void;
}

function SidebarChrome({ open, scoped = false, surface = 'paper', labels, onToggle }: SidebarChromeProps) {
  const onMouseDown = useWindowDrag();
  const shellSurfaceClass = scoped ? 'sidebar-chrome-shell--scoped' : `sidebar-chrome-shell--surface-${surface}`;

  return (
    <div
      className={`sidebar-chrome-shell absolute left-0 top-0 z-30 flex h-[var(--titlebar-height)] pointer-events-none ${shellSurfaceClass} ${
        scoped ? 'w-full' : open ? 'w-[var(--sidebar-width)]' : 'w-auto'
      }`}
    >
      <div
        className="traffic-light-drag-zone relative shrink-0"
        data-tauri-drag-region
        onMouseDown={onMouseDown}
        aria-hidden="true"
      />
      <div className="sidebar-chrome sidebar-chrome--floating flex min-w-0 flex-1 items-center gap-0.5 pr-2">
        <button
          type="button"
          className="titlebar-btn"
          aria-label={open ? labels.collapseSidebar : labels.expandSidebar}
          title={open ? labels.collapseSidebar : labels.expandSidebar}
          onClick={onToggle}
        >
          <IconPanelLeft />
        </button>
        {open ? (
          <div
            className="min-w-0 flex-1 self-stretch"
            data-tauri-drag-region
            onMouseDown={onMouseDown}
          />
        ) : null}
      </div>
    </div>
  );
}

type MenuState =
  | { type: 'file'; x: number; y: number; file: FileEntry }
  | { type: 'folder'; x: number; y: number; dirPath: string }
  | { type: 'workspace-root'; x: number; y: number; root: WorkspaceRoot };

interface SidebarProps {
  roots: WorkspaceRoot[];
  activePath?: string;
  treeRefreshKey?: number;
  open?: boolean;
  chromeSurface?: 'window' | 'paper' | 'settings';
  settingsActive?: boolean;
  settingsSection?: SettingsSection;
  t: ReturnType<typeof createTranslator>;
  labels: {
    empty: string;
    emptyHint: string;
    settings: string;
    collapseSidebar: string;
    expandSidebar: string;
    newFile: string;
    newSubfolder: string;
    expand: string;
    collapse: string;
    search: string;
    rename: string;
    renameWorkspace: string;
    removeFromWorkspace: string;
    addFolder: string;
    copy: string;
    move: string;
    delete: string;
    export: string;
    openInFileManager: string;
    openInTerminal: string;
  };
  onSelect?: (file: FileEntry) => void;
  onOpenSettings?: () => void;
  onSettingsSectionChange?: (section: SettingsSection) => void;
  onToggle?: () => void;
  onSearch?: () => void;
  onAddFolder?: () => void;
  onNewFile?: () => void;
  onRenameRoot?: (root: WorkspaceRoot) => void;
  onRemoveRoot?: (root: WorkspaceRoot) => void;
  onNewFileInDir?: (dirPath: string) => void;
  onNewSubfolderInDir?: (dirPath: string) => void;
  onRename?: (file: FileEntry) => void;
  onCopy?: (file: FileEntry) => void;
  onMove?: (file: FileEntry) => void;
  onDelete?: (file: FileEntry) => void;
  onExport?: (file: FileEntry) => void;
  onTreeFocus?: (target: TreeFocusTarget) => void;
}

export function Sidebar({
  roots,
  activePath,
  treeRefreshKey,
  open = true,
  chromeSurface = 'paper',
  settingsActive = false,
  settingsSection = 'general',
  t,
  labels,
  onSelect,
  onOpenSettings,
  onSettingsSectionChange,
  onToggle,
  onSearch,
  onAddFolder,
  onNewFile,
  onRenameRoot,
  onRemoveRoot,
  onNewFileInDir,
  onNewSubfolderInDir,
  onRename,
  onCopy,
  onMove,
  onDelete,
  onExport,
  onTreeFocus,
}: SidebarProps) {
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [expandedRootPath, setExpandedRootPath] = useState<string | null>(null);
  const rootPaths = roots.map((root) => root.path);
  const [expandedPaths, setExpandedPaths, expandDir] = useExpandedPaths(activePath, rootPaths);

  useEffect(() => {
    if (!activePath) {
      return;
    }
    const containing = roots.find(
      (root) => activePath === root.path || activePath.startsWith(`${root.path}/`),
    );
    if (!containing) {
      return;
    }
    setExpandedRootPath(containing.path);
  }, [activePath, roots]);

  useEffect(() => {
    if (expandedRootPath && !roots.some((root) => root.path === expandedRootPath)) {
      setExpandedRootPath(null);
    }
  }, [roots, expandedRootPath]);

  const openFileMenu = (event: React.MouseEvent, file: FileEntry) => {
    event.preventDefault();
    clearTextSelection();
    setMenu({ type: 'file', x: event.clientX, y: event.clientY, file });
  };

  const openFolderMenu = (event: React.MouseEvent, dirPath: string) => {
    event.preventDefault();
    clearTextSelection();
    setMenu({ type: 'folder', x: event.clientX, y: event.clientY, dirPath });
  };

  const openWorkspaceRootMenu = (event: React.MouseEvent, root: WorkspaceRoot) => {
    event.preventDefault();
    clearTextSelection();
    setMenu({ type: 'workspace-root', x: event.clientX, y: event.clientY, root });
  };

  const expandWorkspaceRoot = (dirPath: string) => {
    const owningRoot = roots.find(
      (root) => dirPath === root.path || dirPath.startsWith(`${root.path}/`),
    );
    if (owningRoot) {
      setExpandedRootPath(owningRoot.path);
    }
  };

  const handleNewFileInDir = (dirPath: string) => {
    expandWorkspaceRoot(dirPath);
    expandDir(dirPath);
    onNewFileInDir?.(dirPath);
  };

  const handleNewSubfolderInDir = (dirPath: string) => {
    expandWorkspaceRoot(dirPath);
    expandDir(dirPath);
    onNewSubfolderInDir?.(dirPath);
  };

  const toggleRootExpanded = (rootPath: string) => {
    setExpandedRootPath((current) => (current === rootPath ? null : rootPath));
  };

  const revealInFileManager = (path: string) => {
    void openInFileManager(path).catch(() => {
      // shell open failed silently
    });
  };

  const revealInTerminal = (path: string) => {
    void openInTerminal(path).catch(() => {
      // shell open failed silently
    });
  };

  const shellMenuItems = (path: string): ContextMenuItem[] => [
    {
      id: 'open-in-file-manager',
      label: labels.openInFileManager,
      separatorBefore: true,
      onSelect: () => revealInFileManager(path),
    },
    {
      id: 'open-in-terminal',
      label: labels.openInTerminal,
      onSelect: () => revealInTerminal(path),
    },
  ];

  const menuItems: ContextMenuItem[] =
    menu?.type === 'file'
      ? [
          { id: 'rename', label: labels.rename, onSelect: () => onRename?.(menu.file) },
          { id: 'copy', label: labels.copy, onSelect: () => onCopy?.(menu.file) },
          { id: 'move', label: labels.move, onSelect: () => onMove?.(menu.file) },
          { id: 'export', label: labels.export, onSelect: () => onExport?.(menu.file) },
          ...shellMenuItems(menu.file.path),
          {
            id: 'delete',
            label: labels.delete,
            danger: true,
            separatorBefore: true,
            onSelect: () => onDelete?.(menu.file),
          },
        ]
      : menu?.type === 'folder'
        ? [
            {
              id: 'new-file',
              label: labels.newFile,
              onSelect: () => handleNewFileInDir(menu.dirPath),
            },
            {
              id: 'new-subfolder',
              label: labels.newSubfolder,
              onSelect: () => handleNewSubfolderInDir(menu.dirPath),
            },
            {
              id: 'rename',
              label: labels.rename,
              onSelect: () =>
                onRename?.({
                  name: basename(menu.dirPath),
                  path: menu.dirPath,
                  is_dir: true,
                }),
            },
            ...shellMenuItems(menu.dirPath),
            {
              id: 'delete',
              label: labels.delete,
              danger: true,
              separatorBefore: true,
              onSelect: () =>
                onDelete?.({
                  name: basename(menu.dirPath),
                  path: menu.dirPath,
                  is_dir: true,
                }),
            },
          ]
        : menu?.type === 'workspace-root'
          ? [
              {
                id: 'new-file',
                label: labels.newFile,
                onSelect: () => handleNewFileInDir(menu.root.path),
              },
              {
                id: 'rename-workspace',
                label: labels.renameWorkspace,
                onSelect: () => onRenameRoot?.(menu.root),
              },
              {
                id: 'remove-workspace',
                label: labels.removeFromWorkspace,
                onSelect: () => onRemoveRoot?.(menu.root),
              },
              ...shellMenuItems(menu.root.path),
            ]
          : [];

  return (
    <>
      {!open ? (
        <SidebarChrome
          open={false}
          surface={chromeSurface}
          labels={{
            collapseSidebar: labels.collapseSidebar,
            expandSidebar: labels.expandSidebar,
          }}
          onToggle={onToggle}
        />
      ) : null}

      {open ? (
        <div className="sidebar-column shrink-0 border-r border-[var(--separator)]">
          <SidebarChrome
            open
            scoped
            surface={chromeSurface}
            labels={{
              collapseSidebar: labels.collapseSidebar,
              expandSidebar: labels.expandSidebar,
            }}
            onToggle={onToggle}
          />
          <aside className="mt-[var(--titlebar-height)] flex h-[calc(100%-var(--titlebar-height))] w-full flex-col bg-[var(--sidebar-bg)] backdrop-blur-xl">
          {settingsActive ? (
            <div className="flex flex-1 flex-col overflow-hidden">
              <div className="sidebar-settings-search">
                <IconSearch className="h-3.5 w-3.5 shrink-0 opacity-50" />
                <input type="text" placeholder={t('settings.search')} readOnly tabIndex={-1} />
              </div>
              <nav className="scroll-pane flex flex-1 flex-col gap-0.5 overflow-auto px-2 py-2">
                {SETTINGS_SECTIONS.map((item) => {
                  const active = item.id === settingsSection;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSettingsSectionChange?.(item.id)}
                      className={`sidebar-nav-item ${active ? 'sidebar-nav-item--active' : ''}`}
                    >
                      <Icon className="h-4 w-4 shrink-0 opacity-70" />
                      {t(item.labelKey)}
                    </button>
                  );
                })}
              </nav>
            </div>
          ) : (
            <div className="flex flex-1 flex-col overflow-hidden">
              <button
                type="button"
                className="sidebar-settings-search mx-3 mt-2 shrink-0"
                onClick={onSearch}
              >
                <IconSearch className="h-3.5 w-3.5 shrink-0 opacity-50" />
                <span className="text-[12px] text-[var(--text-secondary)]">{labels.search}</span>
              </button>
              <div className="scroll-pane flex flex-1 flex-col gap-0.5 overflow-auto px-2 py-2">
                {roots.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 px-3 py-6 text-center">
                    <p className="text-[12px] leading-relaxed text-[var(--text-secondary)]">{labels.emptyHint}</p>
                    <button
                      type="button"
                      onClick={onNewFile}
                      className="flex items-center gap-1.5 rounded-lg bg-leaf-accent px-3 py-1.5 text-[12px] font-medium text-white hover:bg-leaf-accent-hover"
                    >
                      <span className="text-[14px] leading-none">+</span>
                      {labels.newFile}
                    </button>
                  </div>
                ) : (
                  roots.map((root) => {
                    const expanded = expandedRootPath === root.path;
                    return (
                      <div key={root.path} className="flex flex-col">
                        <FolderRow
                          name={workspaceDisplayName(root.path, root.label)}
                          subtitle={workspaceRootSubtitle(root.path, root.label)}
                          depth={WORKSPACE_ROOT_DEPTH}
                          icon="layers"
                          expanded={expanded}
                          onToggle={() => toggleRootExpanded(root.path)}
                          onContextMenu={(event) => openWorkspaceRootMenu(event, root)}
                          onNewFile={() => handleNewFileInDir(root.path)}
                          newFileLabel={labels.newFile}
                          expandLabel={labels.expand}
                          collapseLabel={labels.collapse}
                          onFocus={() => onTreeFocus?.({ type: 'root', path: root.path })}
                        />
                        {expanded ? (
                          <WorkspaceRootTree
                            rootPath={root.path}
                            activePath={activePath}
                            refreshKey={treeRefreshKey}
                            startDepth={WORKSPACE_ROOT_DEPTH + 1}
                            expandedPaths={expandedPaths}
                            onExpandedChange={setExpandedPaths}
                            onSelect={onSelect}
                            onFileContextMenu={openFileMenu}
                            onFolderContextMenu={openFolderMenu}
                            onNewFileInDir={handleNewFileInDir}
                            onFileFocus={(file) => onTreeFocus?.({ type: 'file', file })}
                            onFolderFocus={(path) => onTreeFocus?.({ type: 'folder', path })}
                            labels={{
                              newFile: labels.newFile,
                              expand: labels.expand,
                              collapse: labels.collapse,
                            }}
                          />
                        ) : null}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          <div
            className={`flex shrink-0 items-center border-t border-[var(--separator)] px-2 py-2 ${
              settingsActive ? 'justify-end' : 'justify-between'
            }`}
          >
            {!settingsActive ? (
              <button
                type="button"
                onClick={onAddFolder}
                className="sidebar-settings-btn"
                aria-label={labels.addFolder}
                title={labels.addFolder}
              >
                <IconAddWorkspace className="h-4 w-4" />
              </button>
            ) : null}
            <button
              type="button"
              onClick={onOpenSettings}
              className={`sidebar-settings-btn ${settingsActive ? 'sidebar-settings-btn--active' : ''}`}
              aria-label={labels.settings}
              title={labels.settings}
            >
              <IconSettings className="h-4 w-4" />
            </button>
          </div>
        </aside>
        </div>
      ) : null}

      {menu ? (
        <ContextMenu x={menu.x} y={menu.y} items={menuItems} onClose={() => setMenu(null)} />
      ) : null}
    </>
  );
}
