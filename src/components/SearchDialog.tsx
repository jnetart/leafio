import { useEffect, useState } from 'react';
import { displayFileName } from '../lib/workspace';
import type { SearchResult } from '../lib/fs';

interface SearchDialogProps {
  open: boolean;
  hasWorkspace?: boolean;
  onClose: () => void;
  onSelect: (path: string) => void;
  onSearch: (query: string) => Promise<SearchResult[]>;
}

export function SearchDialog({
  open,
  hasWorkspace,
  onClose,
  onSelect,
  onSearch,
}: SearchDialogProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
      return;
    }
  }, [open]);

  useEffect(() => {
    if (!open || !hasWorkspace || !query.trim()) {
      setResults([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        setResults(await onSearch(query.trim()));
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => window.clearTimeout(timer);
  }, [open, onSearch, query, hasWorkspace]);

  if (!open) {
    return null;
  }

  return (
    <div className="absolute inset-0 z-30 flex items-start justify-center bg-black/20 pt-28">
      <div className="w-[min(520px,92vw)] overflow-hidden rounded-[10px] border border-white/20 bg-[rgba(245,245,247,0.94)] shadow-[0_24px_70px_rgba(0,0,0,0.25)] backdrop-blur-2xl">
        <div className="border-b border-[var(--separator)] px-4 py-3">
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索工作区中的 Markdown 文件…"
            className="w-full bg-transparent text-[15px] outline-none"
          />
        </div>

        <div className="max-h-[320px] overflow-auto py-2">
          {!hasWorkspace ? (
            <div className="px-4 py-6 text-[13px] text-[var(--text-secondary)]">
              请先打开文件夹或文件。
            </div>
          ) : null}
          {hasWorkspace && loading ? (
            <div className="px-4 py-6 text-[13px] text-[var(--text-secondary)]">搜索中…</div>
          ) : null}
          {hasWorkspace && !loading && query && results.length === 0 ? (
            <div className="px-4 py-6 text-[13px] text-[var(--text-secondary)]">没有匹配结果</div>
          ) : null}
          {results.map((result) => (
            <button
              key={result.path}
              type="button"
              onClick={() => {
                onSelect(result.path);
                onClose();
              }}
              className="flex w-full flex-col items-start gap-1 px-4 py-2 text-left hover:bg-[rgba(91,140,111,0.12)]"
            >
              <span className="text-[13px] font-medium">{displayFileName(result.name)}</span>
              <span className="line-clamp-2 text-[12px] text-[var(--text-secondary)]">
                {result.snippet}
              </span>
            </button>
          ))}
        </div>

        <div className="flex justify-end border-t border-[var(--separator)] px-4 py-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-[12px] text-[var(--text-secondary)] hover:bg-black/5"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
