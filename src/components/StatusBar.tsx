import { formatDisplayPath } from '../lib/paths';

interface StatusBarProps {
  saved?: boolean;
  filePath?: string | null;
  homeDir?: string | null;
  wordCount?: number;
  lineCount?: number;
  encoding?: string;
  modeLabel?: string;
  labels?: {
    saved: string;
    unsaved: string;
    words: string;
    lines: string;
  };
}

export function StatusBar({
  saved = true,
  filePath,
  homeDir = null,
  wordCount = 0,
  lineCount = 0,
  encoding = 'UTF-8',
  modeLabel,
  labels = {
    saved: '已保存',
    unsaved: '未保存',
    words: '字',
    lines: '行',
  },
}: StatusBarProps) {
  const saveTitle = saved ? labels.saved : labels.unsaved;
  const displayPath = filePath ? formatDisplayPath(filePath, homeDir) : null;

  return (
    <footer className="flex h-[22px] shrink-0 items-center justify-between gap-3 border-t border-[var(--separator)] px-3 text-[12px] text-[var(--text-secondary)]">
      <span className="flex min-w-0 flex-1 items-center gap-2">
        {filePath ? (
          <span
            className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${
              saved ? 'bg-[var(--accent)]' : 'bg-amber-500'
            }`}
            title={saveTitle}
            aria-label={saveTitle}
          />
        ) : null}
        {displayPath ? (
          <span className="min-w-0 truncate opacity-80" title={filePath ?? undefined}>
            {displayPath}
          </span>
        ) : null}
        {modeLabel ? <span className="shrink-0 opacity-70">· {modeLabel}</span> : null}
      </span>
      <span className="shrink-0">
        {wordCount.toLocaleString()} {labels.words} · {lineCount} {labels.lines} · {encoding}
      </span>
    </footer>
  );
}
