import { useCallback, useEffect, useRef, useState } from 'react';
import { IconEdit, IconPreview, IconSource } from './icons';
import type { ViewMode } from '../lib/view-mode';

const FADE_DELAY_MS = 7000;

const VIEW_MODES: Array<{
  mode: ViewMode;
  labelKey: 'edit' | 'source' | 'preview';
  Icon: typeof IconEdit;
}> = [
  { mode: 'edit', labelKey: 'edit', Icon: IconEdit },
  { mode: 'source', labelKey: 'source', Icon: IconSource },
  { mode: 'preview', labelKey: 'preview', Icon: IconPreview },
];

interface ViewModeFloaterProps {
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
  activityAt?: number;
  labels: {
    edit: string;
    source: string;
    preview: string;
    modes: string;
  };
}

export function ViewModeFloater({ view, onViewChange, activityAt, labels }: ViewModeFloaterProps) {
  const [faded, setFaded] = useState(false);
  const timerRef = useRef<number | null>(null);

  const scheduleFade = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => setFaded(true), FADE_DELAY_MS);
  }, []);

  const wake = useCallback(() => {
    setFaded(false);
    scheduleFade();
  }, [scheduleFade]);

  useEffect(() => {
    wake();
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [wake]);

  useEffect(() => {
    if (activityAt) {
      wake();
    }
  }, [activityAt, wake]);

  return (
    <div
      className={`pointer-events-auto flex items-center rounded-lg border border-[var(--separator)] bg-[var(--paper)]/95 p-0.5 shadow-[0_4px_20px_rgba(0,0,0,0.08)] backdrop-blur-md transition-opacity duration-500 ${
        faded ? 'opacity-35' : 'opacity-100'
      }`}
      role="tablist"
      aria-label={labels.modes}
      onMouseEnter={() => setFaded(false)}
      onMouseLeave={scheduleFade}
      onFocus={wake}
    >
      {VIEW_MODES.map(({ mode, labelKey, Icon }) => (
        <button
          key={mode}
          type="button"
          role="tab"
          aria-selected={view === mode}
          aria-label={labels[labelKey]}
          title={labels[labelKey]}
          onClick={() => {
            onViewChange(mode);
            wake();
          }}
          className={`flex h-7 w-8 items-center justify-center rounded-md transition-colors ${
            view === mode
              ? 'bg-[rgba(91,140,111,0.14)] text-[#3B6B4E]'
              : 'text-[var(--text-secondary)] hover:bg-black/5 hover:text-[var(--text)]'
          }`}
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  );
}
