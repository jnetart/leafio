import { useEffect } from 'react';

export interface ExternalChangeLabels {
  title: string;
  message: string;
  reload: string;
  keep: string;
  compare: string;
  closeCompare: string;
  reloadHint: string;
  keepHint: string;
  compareHint: string;
  changedCount: string;
}

interface ExternalChangeBarProps {
  labels: ExternalChangeLabels;
  comparing: boolean;
  changedCount: number;
  onReload: () => void;
  onKeep: () => void;
  onToggleCompare: () => void;
}

export function ExternalChangeBar({
  labels,
  comparing,
  changedCount,
  onReload,
  onKeep,
  onToggleCompare,
}: ExternalChangeBarProps) {
  useEffect(() => {
    if (!comparing) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onToggleCompare();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [comparing, onToggleCompare]);

  const compareLabel =
    comparing
      ? labels.closeCompare
      : changedCount > 0
        ? `${labels.compare} · ${labels.changedCount.replace('{count}', String(changedCount))}`
        : labels.compare;

  return (
    <div
      className="revision-slip"
      role="region"
      aria-live="polite"
      aria-labelledby="revision-slip-title"
      aria-describedby="revision-slip-message"
    >
      <div className="revision-slip-copy">
        <p id="revision-slip-title" className="revision-slip-title">
          {labels.title}
        </p>
        <p id="revision-slip-message" className="revision-slip-message">
          {labels.message}
        </p>
      </div>
      <div className="revision-slip-actions">
        <button
          type="button"
          className="revision-slip-btn"
          title={labels.reloadHint}
          onClick={onReload}
        >
          {labels.reload}
        </button>
        <button
          type="button"
          className="revision-slip-btn"
          title={labels.keepHint}
          onClick={onKeep}
        >
          {labels.keep}
        </button>
        <button
          type="button"
          className={`revision-slip-btn${comparing ? ' is-active' : ''}`}
          title={labels.compareHint}
          aria-pressed={comparing}
          onClick={onToggleCompare}
        >
          {compareLabel}
        </button>
      </div>
    </div>
  );
}
