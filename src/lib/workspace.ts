import { basename, dirname } from './paths';
import { isAssetsFolderName } from './image-assets';

export interface WorkspaceRoot {
  path: string;
  label?: string;
}

export interface WorkspaceState {
  roots: WorkspaceRoot[];
}

export const EMPTY_WORKSPACE: WorkspaceState = { roots: [] };

export function hasWorkspace(state: WorkspaceState): boolean {
  return state.roots.length > 0;
}

export function workspaceRootPaths(state: WorkspaceState): string[] {
  return state.roots.map((root) => root.path);
}

export function displayFileName(name: string): string {
  return name.replace(/\.md$/i, '');
}

export function storageFileName(name: string): string {
  return isMarkdownFile(name) ? name : `${name}.md`;
}

export function workspaceRootSubtitle(path: string, label?: string): string | undefined {
  const trimmedLabel = label?.trim();
  if (!trimmedLabel) {
    return undefined;
  }
  const realName = basename(path);
  if (trimmedLabel === realName) {
    return undefined;
  }
  return realName;
}

export function workspaceDisplayName(path: string, label?: string): string {
  if (!path) {
    return '';
  }
  return label ?? basename(path);
}

export function isPathInWorkspace(
  filePath: string,
  roots: WorkspaceRoot[] | string[] | WorkspaceState,
): boolean {
  const rootList = Array.isArray(roots)
    ? roots
    : roots.roots;
  const paths =
    rootList.length > 0 && typeof rootList[0] === 'string'
      ? (rootList as string[])
      : (rootList as WorkspaceRoot[]).map((root) => root.path);
  return paths.some((root) => filePath === root || filePath.startsWith(`${root}/`));
}

export function findContainingRoot(
  filePath: string,
  state: WorkspaceState,
): WorkspaceRoot | null {
  let best: WorkspaceRoot | null = null;
  for (const root of state.roots) {
    if (filePath === root.path || filePath.startsWith(`${root.path}/`)) {
      if (!best || root.path.length > best.path.length) {
        best = root;
      }
    }
  }
  return best;
}

export function defaultLeafioWorkspaceRoot(homeDir?: string | null): string | null {
  if (!homeDir) {
    return null;
  }
  return normalizeWorkspacePath(`${normalizeWorkspacePath(homeDir)}/Documents/leafio`);
}

export function isDefaultLeafioWorkspacePath(path: string, homeDir?: string | null): boolean {
  const normalized = normalizeWorkspacePath(path).toLowerCase();
  const root = defaultLeafioWorkspaceRoot(homeDir)?.toLowerCase();
  if (root && (normalized === root || normalized.startsWith(`${root}/`))) {
    return true;
  }
  return /\/documents\/leafio(?:\/|$)/.test(normalized);
}

export function defaultLeafioWorkspaceRootForPath(
  filePath: string,
  homeDir?: string | null,
): string | null {
  const normalized = normalizeWorkspacePath(filePath).toLowerCase();
  const root = defaultLeafioWorkspaceRoot(homeDir);
  if (root) {
    const rootLower = root.toLowerCase();
    if (normalized === rootLower || normalized.startsWith(`${rootLower}/`)) {
      return root;
    }
  }
  const match = normalizeWorkspacePath(filePath).match(/^(.*\/Documents\/leafio)(?:\/|$)/i);
  return match?.[1] ?? null;
}

function normalizeWorkspacePath(path: string): string {
  return path.replace(/\\/g, '/').replace(/\/$/, '');
}

export function addRoot(state: WorkspaceState, path: string, label?: string): WorkspaceState {
  const normalizedPath = normalizeWorkspacePath(path);
  if (state.roots.some((root) => normalizeWorkspacePath(root.path) === normalizedPath)) {
    return state;
  }
  const entry: WorkspaceRoot = { path, label };
  if (isDefaultLeafioWorkspacePath(path)) {
    return { roots: [entry, ...state.roots] };
  }
  return { roots: [...state.roots, entry] };
}

export function removeRoot(state: WorkspaceState, path: string): WorkspaceState {
  return { roots: state.roots.filter((root) => root.path !== path) };
}

export function renameRoot(state: WorkspaceState, path: string, label: string): WorkspaceState {
  return {
    roots: state.roots.map((root) => (root.path === path ? { ...root, label } : root)),
  };
}

export function workspaceForFile(filePath: string, homeDir?: string | null): string {
  const leafioRoot = defaultLeafioWorkspaceRootForPath(filePath, homeDir);
  if (leafioRoot) {
    return leafioRoot;
  }
  return dirname(filePath);
}

export function ancestorDirs(filePath: string, root: string): string[] {
  const dirs: string[] = [];
  let current = dirname(filePath);
  while (current.length >= root.length && (current === root || current.startsWith(`${root}/`))) {
    if (current !== root) {
      dirs.push(current);
    }
    if (current === root) {
      break;
    }
    current = dirname(current);
  }
  return dirs;
}

export function isMarkdownFile(name: string): boolean {
  return name.toLowerCase().endsWith('.md');
}

export function isVisibleTreeEntry(item: { name: string; is_dir: boolean }): boolean {
  if (isAssetsFolderName(item.name)) {
    return false;
  }
  return item.is_dir || isMarkdownFile(item.name);
}
