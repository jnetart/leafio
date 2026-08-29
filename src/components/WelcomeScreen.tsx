import { basename, dirname, formatDisplayPath } from '../lib/paths';
import { welcomeRecentFiles } from '../lib/welcome';
import type { WorkspaceRoot } from '../lib/workspace';
import { displayFileName, workspaceDisplayName } from '../lib/workspace';
import { IconFile, IconFolder, IconLeaf, IconPlus } from './icons';

interface WelcomeScreenProps {
  workspaceRoots: WorkspaceRoot[];
  recentFiles: string[];
  homeDir?: string | null;
  showWorkspaceList?: boolean;
  labels: {
    workspace: string;
    recent: string;
    tagline: string;
    newDocument: string;
    openFolder: string;
    openFile: string;
    or: string;
  };
  onNewDocument: () => void;
  onOpenWorkspace: () => void;
  onOpenFolder: () => void;
  onOpenFile: () => void;
  onOpenRecent: (path: string) => void;
}

export function WelcomeScreen({
  workspaceRoots,
  recentFiles,
  homeDir = null,
  showWorkspaceList = true,
  labels,
  onNewDocument,
  onOpenWorkspace,
  onOpenFolder,
  onOpenFile,
  onOpenRecent,
}: WelcomeScreenProps) {
  const visibleRecents = welcomeRecentFiles(recentFiles);
  const showWorkspaces = showWorkspaceList && workspaceRoots.length > 0;
  const showRecents = visibleRecents.length > 0;

  return (
    <div className="welcome-screen flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[var(--window-bg)]">
      <div className="welcome-screen__scroll scroll-pane">
        <div className="welcome-screen__stage">
          <div className="welcome-screen__hero flex flex-col items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6BAA83] to-[#4A755C] text-white shadow-[0_6px_18px_rgba(91,140,111,0.28)]">
              <IconLeaf className="h-8 w-8" />
            </div>
            <h1 className="mt-5 text-[22px] font-bold tracking-[-0.02em]">Leafio</h1>
            <p className="mt-2 text-[13px] text-[var(--text-secondary)]">{labels.tagline}</p>
          </div>

          <div className="welcome-screen__actions mt-8 flex w-full flex-col items-stretch gap-3">
            <button
              type="button"
              onClick={onNewDocument}
              className="group flex items-center justify-center gap-2.5 rounded-xl bg-leaf-accent px-5 py-3 text-[14px] font-medium text-white shadow-[0_4px_14px_rgba(91,140,111,0.32)] transition-all hover:bg-leaf-accent-hover hover:shadow-[0_6px_20px_rgba(91,140,111,0.38)] active:scale-[0.99]"
            >
              <IconPlus className="h-4 w-4 transition-transform group-hover:rotate-90" />
              {labels.newDocument}
            </button>

            <div className="flex items-center gap-3 py-1">
              <div className="h-px flex-1 bg-[var(--separator)]" />
              <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                {labels.or}
              </span>
              <div className="h-px flex-1 bg-[var(--separator)]" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onOpenFolder}
                className="flex items-center justify-center gap-2 rounded-lg border border-[var(--separator)] bg-[var(--paper)] px-3 py-2.5 text-[12px] font-medium transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
              >
                <IconFolder className="h-3.5 w-3.5 opacity-60" />
                {labels.openFolder}
              </button>
              <button
                type="button"
                onClick={onOpenFile}
                className="flex items-center justify-center gap-2 rounded-lg border border-[var(--separator)] bg-[var(--paper)] px-3 py-2.5 text-[12px] font-medium transition-colors hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
              >
                <IconFile className="h-3.5 w-3.5 opacity-60" />
                {labels.openFile}
              </button>
            </div>
          </div>

          {showWorkspaces || showRecents ? (
            <div className="welcome-screen__meta mt-9 w-full">
              {showWorkspaces ? (
                <div>
                  <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-[var(--text-secondary)]">
                    {labels.workspace}
                  </div>
                  <div className="space-y-0.5">
                    {workspaceRoots.length > 1 ? (
                      <button
                        type="button"
                        onClick={onOpenWorkspace}
                        className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left hover:bg-black/5 dark:hover:bg-white/[0.05]"
                      >
                        <IconFolder className="h-4 w-4 shrink-0 opacity-60" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[12px] font-medium text-[var(--text)]">
                            {workspaceRoots.length} {labels.workspace}
                          </span>
                          <span className="block truncate text-[11px] text-[var(--text-secondary)]">
                            {workspaceRoots.map((root) => workspaceDisplayName(root.path, root.label)).join(' · ')}
                          </span>
                        </span>
                      </button>
                    ) : null}
                    {workspaceRoots.map((root) => (
                      <button
                        key={root.path}
                        type="button"
                        onClick={onOpenWorkspace}
                        title={root.path}
                        className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left hover:bg-black/5 dark:hover:bg-white/[0.05]"
                      >
                        <IconFolder className="h-4 w-4 shrink-0 opacity-60" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[12px] font-medium text-[var(--text)]">
                            {workspaceDisplayName(root.path, root.label)}
                          </span>
                          <span className="block truncate text-[11px] text-[var(--text-secondary)]">
                            {formatDisplayPath(root.path, homeDir)}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {showRecents ? (
                <div className={showWorkspaces ? 'mt-6' : undefined}>
                  <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-[var(--text-secondary)]">
                    {labels.recent}
                  </div>
                  <div className="space-y-0.5">
                    {visibleRecents.map((path) => (
                      <button
                        key={path}
                        type="button"
                        onClick={() => onOpenRecent(path)}
                        title={path}
                        className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left hover:bg-black/5 dark:hover:bg-white/[0.05]"
                      >
                        <IconFile className="h-3.5 w-3.5 shrink-0 opacity-50" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[12px] font-medium text-[var(--text)]">
                            {displayFileName(basename(path))}
                          </span>
                          <span className="block truncate text-[11px] text-[var(--text-secondary)]">
                            {formatDisplayPath(dirname(path), homeDir)}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
