import { useEffect, useRef } from 'react';
import { formatFindCount } from '../lib/document-find';
import { IconChevronDown, IconClose, IconSearch } from './icons';

export interface FindBarLabels {
  placeholder: string;
  noResults: string;
  next: string;
  previous: string;
  close: string;
}

interface FindBarProps {
  query: string;
  index: number;
  matchCount: number;
  labels: FindBarLabels;
  onQueryChange: (query: string) => void;
  onNext: () => void;
  onPrevious: () => void;
  onClose: () => void;
}

export function FindBar({
  query,
  index,
  matchCount,
  labels,
  onQueryChange,
  onNext,
  onPrevious,
  onClose,
}: FindBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const count = formatFindCount(index, matchCount);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="find-bar" role="search">
      <IconSearch className="find-bar-icon" />
      <input
        ref={inputRef}
        type="search"
        value={query}
        placeholder={labels.placeholder}
        aria-label={labels.placeholder}
        onChange={(event) => onQueryChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            if (event.shiftKey) {
              onPrevious();
            } else {
              onNext();
            }
          }
          if (event.key === 'Escape') {
            event.preventDefault();
            onClose();
          }
        }}
        className="find-bar-input"
      />
      <span className={`find-bar-count${matchCount === 0 && query.trim() ? ' find-bar-count--empty' : ''}`}>
        {query.trim() && matchCount === 0 ? labels.noResults : `${count.current} / ${count.total}`}
      </span>
      <button
        type="button"
        className="find-bar-btn"
        aria-label={labels.previous}
        title={labels.previous}
        onClick={onPrevious}
      >
        <IconChevronDown className="h-3.5 w-3.5 rotate-180" />
      </button>
      <button
        type="button"
        className="find-bar-btn"
        aria-label={labels.next}
        title={labels.next}
        onClick={onNext}
      >
        <IconChevronDown className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        className="find-bar-btn"
        aria-label={labels.close}
        title={labels.close}
        onClick={onClose}
      >
        <IconClose className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
