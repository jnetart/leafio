import { useEffect, useRef, useState } from 'react';
import { displayFileName } from '../lib/workspace';
import { formatDisplayPath } from '../lib/paths';
import type { SearchResult } from '../lib/fs';
import { IconMarkdownFile, IconSearch } from './icons';

interface SearchDialogLabels {
  placeholder: string;
  noWorkspace: string;
  loading: string;
  noResults: string;
  hint: string;
  navigate: string;
  open: string;
  close: string;
}

interface SearchDialogProps {
  open: boolean;
  hasWorkspace?: boolean;
  homeDir?: string | null;
  labels: SearchDialogLabels;
  onClose: () => void;
  onSelect: (path: string) => void;
  onSearch: (query: string) => Promise<SearchResult[]>;
}

export function SearchDialog({
  open,
  hasWorkspace,
  homeDir = null,
  labels,
  onClose,
  onSelect,
  onSearch,
}: SearchDialogProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
      setActiveIndex(0);
      return;
    }
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  useEffect(() => {
    if (!open || !hasWorkspace || !query.trim()) {
      setResults([]);
      setActiveIndex(0);
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

  useEffect(() => {
    setActiveIndex(0);
  }, [results]);

  useEffect(() => {
    resultRefs.current[activeIndex]?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (results.length === 0) {
        return;
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveIndex((current) => Math.min(current + 1, results.length - 1));
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveIndex((current) => Math.max(current - 1, 0));
      } else if (event.key === 'Enter') {
        event.preventDefault();
        const selected = results[activeIndex];
        if (selected) {
          onSelect(selected.path);
          onClose();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose, onSelect, results, activeIndex]);

  if (!open) {
    return null;
  }

  const showHint = hasWorkspace && !query.trim() && !loading;
  const showNoResults = hasWorkspace && !loading && query.trim().length > 0 && results.length === 0;

  const selectResult = (path: string) => {
    onSelect(path);
    onClose();
  };

  return (
    <div
      className="search-palette-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="search-palette" role="dialog" aria-label={labels.placeholder}>
        <div className="search-palette-input-row">
          <IconSearch className="search-palette-input-icon" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={labels.placeholder}
            className="search-palette-input"
            autoComplete="off"
            spellCheck={false}
          />
          {loading ? <span className="search-palette-spinner" aria-hidden="true" /> : null}
        </div>

        <div className="search-palette-body scroll-pane">
          {!hasWorkspace ? (
            <div className="search-palette-empty">
              <p>{labels.noWorkspace}</p>
            </div>
          ) : null}

          {showHint ? (
            <div className="search-palette-empty search-palette-empty--hint">
              <div className="search-palette-empty-icon">
                <IconSearch className="h-5 w-5" />
              </div>
              <p>{labels.hint}</p>
            </div>
          ) : null}

          {hasWorkspace && loading ? (
            <div className="search-palette-empty">
              <p>{labels.loading}</p>
            </div>
          ) : null}

          {showNoResults ? (
            <div className="search-palette-empty">
              <p>{labels.noResults}</p>
            </div>
          ) : null}

          {results.length > 0 ? (
            <div className="search-palette-results" role="listbox">
              {results.map((result, index) => {
                const active = index === activeIndex;
                return (
                  <button
                    key={result.path}
                    ref={(node) => {
                      resultRefs.current[index] = node;
                    }}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => selectResult(result.path)}
                    className={`search-palette-result ${active ? 'search-palette-result--active' : ''}`}
                  >
                    <IconMarkdownFile className="search-palette-result-icon h-4 w-4 shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="search-palette-result-name block truncate">
                        {displayFileName(result.name)}
                      </span>
                      <span className="search-palette-result-path block truncate">
                        {formatDisplayPath(result.path, homeDir)}
                      </span>
                      {result.snippet ? (
                        <span className="search-palette-result-snippet line-clamp-2">{result.snippet}</span>
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        <div className="search-palette-footer">
          <span className="search-palette-hint-row">
            <kbd className="search-palette-kbd">↑</kbd>
            <kbd className="search-palette-kbd">↓</kbd>
            <span>{labels.navigate}</span>
          </span>
          <span className="search-palette-hint-row">
            <kbd className="search-palette-kbd">↵</kbd>
            <span>{labels.open}</span>
          </span>
          <span className="search-palette-hint-row search-palette-hint-row--end">
            <kbd className="search-palette-kbd">esc</kbd>
            <span>{labels.close}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
