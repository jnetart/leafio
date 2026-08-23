import { useCallback, useEffect, useState } from 'react';
import type { FileEntry } from '../lib/fs';
import { listWorkspace } from '../lib/fs';
import { dirname, formatDisplayPath } from '../lib/paths';
import type { WorkspaceRoot } from '../lib/workspace';
import { findContainingRoot, workspaceDisplayName } from '../lib/workspace';
import { IconChevronDown, IconChevronRight, IconLayers, IconTreeFolder } from './icons';
import { treeRowStyle } from './FileTree';

function ancestorDirPaths(dir: string, rootPath: string): string[] {
  const paths: string[] = [];
  let current = dir;
  while (current && current.length >= rootPath.length) {
    if (current === rootPath) {
      break;
    }
    if (!current.startsWith(`${rootPath}/`) && current !== rootPath) {
      break;
    }
    current = dirname(current);
    paths.push(current);
  }
  return paths;
}

interface FolderPickerNodeProps {
  dirPath: string;
  name: string;
  depth: number;
  rootPath: string;
  selectedDir: string;
  expandedPaths: Set<string>;
  onToggleExpand: (dirPath: string) => void;
  onSelect: (dirPath: string) => void;
}

function FolderPickerNode({
  dirPath,
  name,
  depth,
  rootPath,
  selectedDir,
  expandedPaths,
  onToggleExpand,
  onSelect,
}: FolderPickerNodeProps) {
  const expanded = expandedPaths.has(dirPath);
  const [dirs, setDirs] = useState<FileEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const selected = selectedDir === dirPath;

  useEffect(() => {
    if (!expanded) {
      return;
    }
    let cancelled = false;
    void listWorkspace(dirPath).then((items) => {
      if (!cancelled) {
        setDirs(items.filter((item) => item.is_dir));
        setLoaded(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [dirPath, expanded]);

  const showChevron = !loaded || dirs.length > 0;

  return (
    <div>
      <div
        className={`folder-picker-row ${selected ? 'folder-picker-row--selected' : ''}`}
        style={treeRowStyle(depth)}
      >
        {showChevron ? (
          <button
            type="button"
            className="folder-picker-chevron"
            aria-label={expanded ? 'Collapse' : 'Expand'}
            onClick={(event) => {
              event.stopPropagation();
              onToggleExpand(dirPath);
            }}
          >
            {expanded ? (
              <IconChevronDown className="h-3 w-3" />
            ) : (
              <IconChevronRight className="h-3 w-3" />
            )}
          </button>
        ) : (
          <span className="folder-picker-chevron folder-picker-chevron--spacer" aria-hidden="true" />
        )}
        <button
          type="button"
          className="folder-picker-label"
          onClick={() => onSelect(dirPath)}
        >
          <IconTreeFolder className="folder-picker-icon shrink-0" open={expanded} />
          <span className="min-w-0 flex-1 truncate">{name}</span>
          {selected ? <span className="folder-picker-check" aria-hidden="true" /> : null}
        </button>
      </div>
      {expanded
        ? dirs.map((dir) => (
            <FolderPickerNode
              key={dir.path}
              dirPath={dir.path}
              name={dir.name}
              depth={depth + 1}
              rootPath={rootPath}
              selectedDir={selectedDir}
              expandedPaths={expandedPaths}
              onToggleExpand={onToggleExpand}
              onSelect={onSelect}
            />
          ))
        : null}
    </div>
  );
}

interface WorkspacePickerSectionProps {
  root: WorkspaceRoot;
  selectedDir: string;
  expandedPaths: Set<string>;
  onToggleExpand: (dirPath: string) => void;
  onSelect: (dirPath: string) => void;
}

function WorkspacePickerSection({
  root,
  selectedDir,
  expandedPaths,
  onToggleExpand,
  onSelect,
}: WorkspacePickerSectionProps) {
  const expanded = expandedPaths.has(root.path);
  const selected = selectedDir === root.path;
  const [dirs, setDirs] = useState<FileEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!expanded) {
      return;
    }
    let cancelled = false;
    void listWorkspace(root.path).then((items) => {
      if (!cancelled) {
        setDirs(items.filter((item) => item.is_dir));
        setLoaded(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [expanded, root.path]);

  const showChevron = !loaded || dirs.length > 0;

  return (
    <div className="workspace-picker-section">
      <div
        className={`folder-picker-row folder-picker-row--workspace ${selected ? 'folder-picker-row--selected' : ''}`}
        style={treeRowStyle(0)}
      >
        {showChevron ? (
          <button
            type="button"
            className="folder-picker-chevron"
            aria-label={expanded ? 'Collapse' : 'Expand'}
            onClick={(event) => {
              event.stopPropagation();
              onToggleExpand(root.path);
            }}
          >
            {expanded ? (
              <IconChevronDown className="h-3 w-3" />
            ) : (
              <IconChevronRight className="h-3 w-3" />
            )}
          </button>
        ) : (
          <span className="folder-picker-chevron folder-picker-chevron--spacer" aria-hidden="true" />
        )}
        <button
          type="button"
          className="folder-picker-label"
          onClick={() => onSelect(root.path)}
        >
          <IconLayers className="folder-picker-icon shrink-0" />
          <span className="min-w-0 flex-1 truncate font-medium">
            {workspaceDisplayName(root.path, root.label)}
          </span>
          {selected ? <span className="folder-picker-check" aria-hidden="true" /> : null}
        </button>
      </div>
      {expanded
        ? dirs.map((dir) => (
            <FolderPickerNode
              key={dir.path}
              dirPath={dir.path}
              name={dir.name}
              depth={1}
              rootPath={root.path}
              selectedDir={selectedDir}
              expandedPaths={expandedPaths}
              onToggleExpand={onToggleExpand}
              onSelect={onSelect}
            />
          ))
        : null}
    </div>
  );
}

interface WorkspaceFolderPickerProps {
  roots: WorkspaceRoot[];
  selectedDir: string;
  defaultDir: string;
  homeDir?: string | null;
  labels: {
    chooseLocation: string;
    useDefaultLocation: string;
  };
  onSelectDir: (dir: string) => void;
  onPickLocation: () => void;
  onDone: () => void;
}

export function WorkspaceFolderPicker({
  roots,
  selectedDir,
  defaultDir,
  homeDir = null,
  labels,
  onSelectDir,
  onPickLocation,
  onDone,
}: WorkspaceFolderPickerProps) {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    const containing = findContainingRoot(selectedDir, { roots });
    if (!containing) {
      setExpandedPaths(new Set());
      return;
    }
    const next = new Set<string>([containing.path]);
    for (const path of ancestorDirPaths(selectedDir, containing.path)) {
      next.add(path);
    }
    setExpandedPaths(next);
  }, [selectedDir, roots]);

  const handleSelect = useCallback(
    (dirPath: string) => {
      onSelectDir(dirPath);
      onDone();
    },
    [onSelectDir, onDone],
  );

  const handleToggleExpand = useCallback((dirPath: string) => {
    setExpandedPaths((current) => {
      const next = new Set(current);
      if (next.has(dirPath)) {
        next.delete(dirPath);
      } else {
        next.add(dirPath);
      }
      return next;
    });
  }, []);

  const defaultSelected = selectedDir === defaultDir;

  return (
    <div className="workspace-folder-picker-expanded mt-2.5 space-y-2 rounded-xl border border-[var(--separator)] bg-[var(--window-bg)] p-2">
      {!defaultSelected && defaultDir ? (
        <button
          type="button"
          onClick={() => handleSelect(defaultDir)}
          className="w-full rounded-lg px-2.5 py-2 text-left text-[12px] text-[var(--text-secondary)] transition-colors hover:bg-black/[0.04] hover:text-[var(--text)] dark:hover:bg-white/[0.06]"
        >
          <span className="font-medium text-[var(--accent)]">{labels.useDefaultLocation}</span>
          <span className="ml-1">{formatDisplayPath(defaultDir, homeDir)}</span>
        </button>
      ) : null}

      {roots.length > 0 ? (
        <div className="folder-picker-tree max-h-[220px] overflow-auto py-0.5">
          {roots.map((root) => (
            <WorkspacePickerSection
              key={root.path}
              root={root}
              selectedDir={selectedDir}
              expandedPaths={expandedPaths}
              onToggleExpand={handleToggleExpand}
              onSelect={handleSelect}
            />
          ))}
        </div>
      ) : null}

      <button
        type="button"
        onClick={onPickLocation}
        className="w-full rounded-lg px-2.5 py-2 text-left text-[12px] font-medium text-[var(--accent)] transition-colors hover:bg-[var(--accent)]/8"
      >
        {labels.chooseLocation}
      </button>
    </div>
  );
}
