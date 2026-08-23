import { load } from '@tauri-apps/plugin-store';
import { EMPTY_WORKSPACE, type WorkspaceRoot, type WorkspaceState } from './workspace';

const STORE_PATH = 'preferences.json';

interface StoredWorkspace {
  roots?: string[];
  rootLabels?: Record<string, string>;
  path?: string | null;
  label?: string;
}

function normalizeWorkspace(stored: StoredWorkspace | null | undefined): WorkspaceState {
  if (!stored) {
    return EMPTY_WORKSPACE;
  }
  if (stored.roots && stored.roots.length > 0) {
    return {
      roots: stored.roots.map((path) => ({
        path,
        label: stored.rootLabels?.[path],
      })),
    };
  }
  if (stored.path) {
    return { roots: [{ path: stored.path, label: stored.label }] };
  }
  return EMPTY_WORKSPACE;
}

function toStored(workspace: WorkspaceState): StoredWorkspace {
  const rootLabels: Record<string, string> = {};
  for (const root of workspace.roots) {
    if (root.label) {
      rootLabels[root.path] = root.label;
    }
  }
  return {
    roots: workspace.roots.map((root) => root.path),
    rootLabels,
  };
}

export async function loadWorkspace(): Promise<WorkspaceState> {
  try {
    const store = await load(STORE_PATH, { autoSave: false });
    const stored = await store.get<StoredWorkspace>('workspace');
    return normalizeWorkspace(stored);
  } catch {
    return EMPTY_WORKSPACE;
  }
}

export async function saveWorkspace(workspace: WorkspaceState): Promise<void> {
  const store = await load(STORE_PATH, { autoSave: true });
  await store.set('workspace', toStored(workspace));
  await store.save();
}

export type { WorkspaceRoot };
