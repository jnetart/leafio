import type { EditorWidthMode } from '../lib/preferences';
import { formatDisplayPath } from '../lib/paths';

interface StatusBarProps {
  saved?: boolean;
  filePath?: string | null;
  homeDir?: string | null;
  wordCount?: number;
  lineCount?: number;
  encoding?: string;
  modeLabel?: string;
  editorWidthMode?: EditorWidthMode;
  onEditorWidthModeChange?: (mode: EditorWidthMode) => void;
  widthLabels?: {
    centered: string;
    wide: string;
  };
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
  editorWidthMode = 'centered',
  onEditorWidthModeChange,
  widthLabels = {
    centered: '居中',
    wide: '宽屏',
  },
  labels = {
    saved: '已保存',
    unsaved: '未保存',
    words: '字',
    lines: '行',
  },
}: StatusBarProps) {
  const saveTitle = saved ? labels.saved : labels.unsaved;
  const displayPath = filePath ? formatDisplayPath(filePath, homeDir) : null;
  const widthOptions: Array<{ value: EditorWidthMode; label: string }> = [
    { value: 'centered', label: widthLabels.centered },
    { value: 'wide', label: widthLabels.wide },
  ];

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
      <span className="flex shrink-0 items-center gap-2">
        {onEditorWidthModeChange ? (
          <div
            className="status-width-control"
            role="group"
            aria-label={`${widthLabels.centered} / ${widthLabels.wide}`}
          >
            {widthOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={editorWidthMode === option.value}
                onClick={() => onEditorWidthModeChange(option.value)}
                className={`status-width-btn ${
                  editorWidthMode === option.value ? 'status-width-btn--active' : ''
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        ) : null}
        <span>
          {wordCount.toLocaleString()} {labels.words} · {lineCount} {labels.lines} · {encoding}
        </span>
      </span>
    </footer>
  );
}
