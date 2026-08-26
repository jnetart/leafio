import { useEffect, useMemo, useRef, useState } from 'react';
import { displayFileName } from '../lib/workspace';
import { formatDisplayPath } from '../lib/paths';
import type { SearchResult } from '../lib/fs';
import {
  cycleSearchIndex,
  highlightParts,
  isSearchQueryEmpty,
  parseSearchQuery,
  searchNeedles,
  type ParsedSearchQuery,
} from '../lib/searchQuery';
import { scrollChildIntoNearestView } from '../lib/scroll-into-view';
import { IconMarkdownFile, IconSearch } from './icons';

interface SearchDialogLabels {
  placeholder: string;
  noWorkspace: string;
  loading: string;
  noResults: string;
  hint: string;
  hintTag: string;
  hintPath: string;
  exampleTag: string;
  examplePath: string;
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
  onSearch: (query: ParsedSearchQuery) => Promise<SearchResult[]>;
}

function HighlightedText({
  text,
  needles,
  className,
}: {
  text: string;
  needles: string[];
  className?: string;
}) {
  const parts = highlightParts(text, needles);
  return (
    <span className={className}>
      {parts.map((part, index) =>
        part.hit ? (
          <mark key={index} className="search-hit">
            {part.text}
          </mark>
        ) : (
          <span key={index}>{part.text}</span>
        ),
      )}
    </span>
  );
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
  const listRef = useRef<HTMLDivElement>(null);
  const resultRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const parsed = useMemo(() => parseSearchQuery(query), [query]);
  const needles = useMemo(() => searchNeedles(parsed), [parsed]);
  const queryEmpty = isSearchQueryEmpty(parsed);

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
    if (!open || !hasWorkspace || queryEmpty) {
      setResults([]);
      setActiveIndex(0);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const next = await onSearch(parsed);
        if (!cancelled) {
          setResults(next);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }, 200);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open, onSearch, parsed, queryEmpty, hasWorkspace]);

  useEffect(() => {
    setActiveIndex(0);
  }, [results]);

  useEffect(() => {
    const list = listRef.current;
    const item = resultRefs.current[activeIndex];
    if (list && item) {
      scrollChildIntoNearestView(list, item);
    }
  }, [activeIndex, results]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.isComposing) {
        return;
      }
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
        setActiveIndex((current) => cycleSearchIndex(current, results.length, 1));
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveIndex((current) => cycleSearchIndex(current, results.length, -1));
      } else if (event.key === 'Enter') {
        event.preventDefault();
        const selected = results[activeIndex];
        if (selected) {
          onSelect(selected.path);
          onClose();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [open, onClose, onSelect, results, activeIndex]);

  if (!open) {
    return null;
  }

  const showHint = hasWorkspace && queryEmpty && !loading;
  const showNoResults = hasWorkspace && !loading && !queryEmpty && results.length === 0;
  const showFilters = parsed.tags.length > 0 || parsed.paths.length > 0;
  const activeId = results[activeIndex] ? `search-option-${activeIndex}` : undefined;

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
            role="combobox"
            aria-expanded={!queryEmpty}
            aria-controls="search-palette-results"
            aria-activedescendant={activeId}
            aria-autocomplete="list"
          />
          {loading ? <span className="search-palette-spinner" aria-hidden="true" /> : null}
        </div>

        {showFilters ? (
          <div className="search-palette-filters" aria-label="filters">
            {parsed.tags.map((tag) => (
              <span key={`tag:${tag}`} className="search-filter-chip">
                <span className="search-filter-chip-op">tag</span>
                {tag}
              </span>
            ))}
            {parsed.paths.map((path) => (
              <span key={`path:${path}`} className="search-filter-chip">
                <span className="search-filter-chip-op">path</span>
                {path}
              </span>
            ))}
          </div>
        ) : null}

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
              <div className="search-palette-syntax">
                <span>
                  <code className="search-syntax">{labels.exampleTag}</code>
                  <span className="search-syntax-label">{labels.hintTag}</span>
                </span>
                <span>
                  <code className="search-syntax">{labels.examplePath}</code>
                  <span className="search-syntax-label">{labels.hintPath}</span>
                </span>
              </div>
            </div>
          ) : null}

          {hasWorkspace && loading && results.length === 0 ? (
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
            <div
              ref={listRef}
              id="search-palette-results"
              className="search-palette-results"
              role="listbox"
            >
              {results.map((result, index) => {
                const active = index === activeIndex;
                return (
                  <button
                    key={result.path}
                    id={`search-option-${index}`}
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
                      <HighlightedText
                        text={displayFileName(result.name)}
                        needles={needles}
                        className="search-palette-result-name block truncate"
                      />
                      <HighlightedText
                        text={formatDisplayPath(result.path, homeDir)}
                        needles={needles}
                        className="search-palette-result-path block truncate"
                      />
                      {result.snippet ? (
                        <HighlightedText
                          text={result.snippet}
                          needles={needles}
                          className="search-palette-result-snippet line-clamp-2"
                        />
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
