import { useCallback, useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import type { FileEntry } from '../lib/fs';
import { listWorkspace } from '../lib/fs';
import { displayFileName, isMarkdownFile } from '../lib/workspace';
import { dirname } from '../lib/paths';
import { IconChevronDown, IconChevronRight, IconLayers, IconMarkdownFile, IconPlus, IconTreeFolder } from './icons';
import { clearTextSelection, preventContextMenuSelection } from '../lib/filename-input';

const INDENT_PX = 14;
const BASE_INDENT_PX = 8;

export function treeRowStyle(depth: number): CSSProperties {
  return { paddingLeft: `${depth * INDENT_PX + BASE_INDENT_PX}px` };
}

interface TreeCallbacks {
  onSelect?: (file: FileEntry) => void;
  onFileContextMenu?: (event: React.MouseEvent, file: FileEntry) => void;
  onFolderContextMenu?: (event: React.MouseEvent, dirPath: string) => void;
  onNewFileInDir?: (dirPath: string) => void;
  onExpandDir?: (dirPath: string) => void;
  onFileFocus?: (file: FileEntry) => void;
  onFolderFocus?: (dirPath: string) => void;
  onRootFocus?: (rootPath: string) => void;
}

interface FolderRowProps {
  name: string;
  subtitle?: string;
  depth: number;
  expanded: boolean;
  icon?: 'folder' | 'layers';
  collapsible?: boolean;
  onToggle: () => void;
  onContextMenu: (event: React.MouseEvent) => void;
  onNewFile: () => void;
  newFileLabel: string;
  expandLabel: string;
  collapseLabel: string;
  onFocus?: () => void;
}

export function FolderRow({
  name,
  subtitle,
  depth,
  expanded,
  icon = 'folder',
  collapsible = true,
  onToggle,
  onContextMenu,
  onNewFile,
  newFileLabel,
  expandLabel,
  collapseLabel,
  onFocus,
}: FolderRowProps) {
  return (
    <div
      className="file-tree-folder-row group"
      style={treeRowStyle(depth)}
      onContextMenu={(event) => {
        event.preventDefault();
        clearTextSelection();
        onContextMenu(event);
      }}
    >
      <button
        type="button"
        className="file-tree-folder-label"
        onClick={collapsible ? onToggle : undefined}
        onFocus={onFocus}
        onMouseDown={(event) => {
          preventContextMenuSelection(event);
          if (event.button !== 2) {
            onFocus?.();
          }
        }}
      >
        {icon === 'layers' ? (
          <IconLayers className="file-tree-icon shrink-0" />
        ) : (
          <IconTreeFolder className="file-tree-icon file-tree-icon--folder shrink-0" open={expanded} />
        )}
        <span className="min-w-0 flex-1 truncate">
          <span>{name}</span>
          {subtitle ? (
            <span className="text-[var(--text-secondary)]"> ({subtitle})</span>
          ) : null}
        </span>
      </button>
      <div className="file-tree-folder-actions">
        <button
          type="button"
          className="file-tree-action-btn"
          aria-label={newFileLabel}
          title={newFileLabel}
          onClick={(event) => {
            event.stopPropagation();
            onNewFile();
          }}
        >
          <IconPlus className="h-3 w-3" />
        </button>
        {collapsible ? (
          <button
            type="button"
            className="file-tree-chevron-btn"
            aria-label={expanded ? collapseLabel : expandLabel}
            title={expanded ? collapseLabel : expandLabel}
            onClick={(event) => {
              event.stopPropagation();
              onToggle();
            }}
          >
            {expanded ? (
              <IconChevronDown className="h-3 w-3" />
            ) : (
              <IconChevronRight className="h-3 w-3" />
            )}
          </button>
        ) : null}
      </div>
    </div>
  );
}

interface FileTreeProps extends TreeCallbacks {
  rootPath: string;
  activePath?: string;
  refreshKey?: number;
  startDepth?: number;
  expandedPaths: Set<string>;
  onExpandedChange: (paths: Set<string>) => void;
  labels: {
    newFile: string;
    expand: string;
    collapse: string;
  };
}

interface DirectoryNodeProps extends TreeCallbacks {
  dirPath: string;
  name: string;
  depth: number;
  activePath?: string;
  refreshKey?: number;
  expandedPaths: Set<string>;
  onExpandedChange: (paths: Set<string>) => void;
  labels: FileTreeProps['labels'];
}

function DirectoryNode({
  dirPath,
  name,
  depth,
  activePath,
  refreshKey,
  expandedPaths,
  onExpandedChange,
  onSelect,
  onFileContextMenu,
  onFolderContextMenu,
  onNewFileInDir,
  onFileFocus,
  onFolderFocus,
  labels,
}: DirectoryNodeProps) {
  const alwaysOpen = depth === 0;
  const expanded = alwaysOpen || expandedPaths.has(dirPath);
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  const loadEntries = useCallback(async () => {
    const items = await listWorkspace(dirPath);
    const visible = items.filter((item) => item.is_dir || isMarkdownFile(item.name));
    setEntries(visible);
    setLoaded(true);
  }, [dirPath]);

  useEffect(() => {
    if (expanded) {
      void loadEntries();
    }
  }, [expanded, loadEntries, refreshKey]);

  const toggle = () => {
    if (alwaysOpen) {
      return;
    }
    const next = new Set(expandedPaths);
    if (expanded) {
      next.delete(dirPath);
    } else {
      next.add(dirPath);
    }
    onExpandedChange(next);
  };

  return (
    <div>
      <FolderRow
        name={name}
        depth={depth}
        expanded={expanded}
        collapsible={!alwaysOpen}
        onToggle={toggle}
        onContextMenu={(event) => onFolderContextMenu?.(event, dirPath)}
        onNewFile={() => onNewFileInDir?.(dirPath)}
        newFileLabel={labels.newFile}
        expandLabel={labels.expand}
        collapseLabel={labels.collapse}
        onFocus={() => onFolderFocus?.(dirPath)}
      />
      {expanded && loaded ? (
        <FileTreeLevel
          entries={entries}
          depth={depth + 1}
          activePath={activePath}
          refreshKey={refreshKey}
          expandedPaths={expandedPaths}
          onExpandedChange={onExpandedChange}
          onSelect={onSelect}
          onFileContextMenu={onFileContextMenu}
          onFolderContextMenu={onFolderContextMenu}
          onNewFileInDir={onNewFileInDir}
          onFileFocus={onFileFocus}
          onFolderFocus={onFolderFocus}
          labels={labels}
        />
      ) : null}
    </div>
  );
}

interface FileTreeLevelProps extends TreeCallbacks {
  entries: FileEntry[];
  depth: number;
  activePath?: string;
  refreshKey?: number;
  expandedPaths: Set<string>;
  onExpandedChange: (paths: Set<string>) => void;
  labels: FileTreeProps['labels'];
}

function FileTreeLevel({
  entries,
  depth,
  activePath,
  refreshKey,
  expandedPaths,
  onExpandedChange,
  onSelect,
  onFileContextMenu,
  onFolderContextMenu,
  onNewFileInDir,
  onFileFocus,
  onFolderFocus,
  labels,
}: FileTreeLevelProps) {
  const dirs = entries.filter((e) => e.is_dir);
  const files = entries.filter((e) => !e.is_dir);

  return (
    <>
      {dirs.map((dir) => (
        <DirectoryNode
          key={dir.path}
          dirPath={dir.path}
          name={dir.name}
          depth={depth}
          activePath={activePath}
          refreshKey={refreshKey}
          expandedPaths={expandedPaths}
          onExpandedChange={onExpandedChange}
          onSelect={onSelect}
          onFileContextMenu={onFileContextMenu}
          onFolderContextMenu={onFolderContextMenu}
          onNewFileInDir={onNewFileInDir}
          onFileFocus={onFileFocus}
          onFolderFocus={onFolderFocus}
          labels={labels}
        />
      ))}
      {files.map((file) => {
        const active = file.path === activePath;
        return (
          <button
            key={file.path}
            type="button"
            onClick={() => {
              onFileFocus?.(file);
              onSelect?.(file);
            }}
            onFocus={() => onFileFocus?.(file)}
            onMouseDown={(event) => {
              preventContextMenuSelection(event);
              if (event.button !== 2) {
                onFileFocus?.(file);
              }
            }}
            onContextMenu={(event) => {
              event.preventDefault();
              clearTextSelection();
              onFileContextMenu?.(event, file);
            }}
            className={`file-tree-row ${active ? 'file-tree-row--active' : ''}`}
            style={treeRowStyle(depth)}
          >
            <IconMarkdownFile className="file-tree-icon file-tree-icon--markdown shrink-0" />
            <span className="truncate">{displayFileName(file.name)}</span>
          </button>
        );
      })}
    </>
  );
}

export function WorkspaceRootTree({
  rootPath,
  activePath,
  refreshKey,
  startDepth = 1,
  expandedPaths,
  onExpandedChange,
  onSelect,
  onFileContextMenu,
  onFolderContextMenu,
  onNewFileInDir,
  onFileFocus,
  onFolderFocus,
  labels,
}: FileTreeProps) {
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  const loadEntries = useCallback(async () => {
    const items = await listWorkspace(rootPath);
    const visible = items.filter((item) => item.is_dir || isMarkdownFile(item.name));
    setEntries(visible);
    setLoaded(true);
  }, [rootPath]);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries, refreshKey]);

  if (!loaded) {
    return null;
  }

  return (
    <FileTreeLevel
      entries={entries}
      depth={startDepth}
      activePath={activePath}
      refreshKey={refreshKey}
      expandedPaths={expandedPaths}
      onExpandedChange={onExpandedChange}
      onSelect={onSelect}
      onFileContextMenu={onFileContextMenu}
      onFolderContextMenu={onFolderContextMenu}
      onNewFileInDir={onNewFileInDir}
      onFileFocus={onFileFocus}
      onFolderFocus={onFolderFocus}
      labels={labels}
    />
  );
}

function expandPathToRoot(next: Set<string>, activePath: string, root: string) {
  if (!activePath.startsWith(`${root}/`) && dirname(activePath) !== root) {
    return;
  }
  next.add(root);
  const parts = activePath.slice(root.length + 1).split('/');
  let path = root;
  for (let i = 0; i < parts.length - 1; i++) {
    path = `${path}/${parts[i]}`;
    next.add(path);
  }
}

function setsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) {
    return false;
  }
  for (const value of a) {
    if (!b.has(value)) {
      return false;
    }
  }
  return true;
}

export function useExpandedPaths(activePath?: string, roots?: string[]) {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(() =>
    roots?.length ? new Set(roots) : new Set(),
  );

  const expandDir = useCallback((dirPath: string) => {
    setExpandedPaths((current) => {
      const next = new Set(current);
      next.add(dirPath);
      return next;
    });
  }, []);

  const rootsKey = roots?.join('\0') ?? '';
  const rootList = rootsKey ? rootsKey.split('\0') : [];

  useEffect(() => {
    if (!activePath || rootList.length === 0) {
      return;
    }
    setExpandedPaths((current) => {
      const next = new Set(current);
      for (const root of rootList) {
        expandPathToRoot(next, activePath, root);
      }
      return setsEqual(current, next) ? current : next;
    });
  }, [activePath, rootsKey]);

  useEffect(() => {
    if (rootList.length === 0) {
      return;
    }
    setExpandedPaths((current) => {
      const next = new Set(current);
      let changed = false;
      for (const root of rootList) {
        if (!next.has(root)) {
          next.add(root);
          changed = true;
        }
      }
      return changed ? next : current;
    });
  }, [rootsKey]);

  return [expandedPaths, setExpandedPaths, expandDir] as const;
}
