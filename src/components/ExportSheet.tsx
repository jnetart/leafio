import { useEffect, useState } from 'react';
import type { ExportFormat } from '../lib/preferences';

interface ExportSheetLabels {
  title: string;
  format: string;
  location: string;
  cancel: string;
  confirm: string;
}

interface ExportSheetProps {
  open: boolean;
  defaultPath: string;
  defaultFormat: ExportFormat;
  labels: ExportSheetLabels;
  onClose: () => void;
  onExport: (format: ExportFormat, targetPath: string) => void;
}

export function ExportSheet({
  open,
  defaultPath,
  defaultFormat,
  labels,
  onClose,
  onExport,
}: ExportSheetProps) {
  const [format, setFormat] = useState<ExportFormat>(defaultFormat);

  useEffect(() => {
    if (open) {
      setFormat(defaultFormat);
    }
  }, [open, defaultFormat]);

  if (!open) {
    return null;
  }

  return (
    <div className="absolute inset-0 z-20 flex items-start justify-center bg-black/20 pt-16">
      <form
        className="w-[360px] rounded-[10px] border border-[var(--separator)] bg-white/95 p-5 shadow-2xl backdrop-blur-xl dark:bg-[var(--paper)]/95"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const path = String(form.get('path'));
          onExport(format, path);
          onClose();
        }}
      >
        <h3 className="mb-4 text-[15px] font-semibold">{labels.title}</h3>

        <div className="mb-4 block text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
          {labels.format}
          <div className="mt-2 flex gap-2">
            {(['markdown', 'html'] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setFormat(option)}
                className={`rounded-full px-3 py-1 text-xs ${
                  format === option
                    ? 'bg-[rgba(91,140,111,0.14)] font-medium text-[#3B6B4E]'
                    : 'bg-black/5'
                }`}
              >
                {option === 'markdown' ? 'Markdown' : 'HTML'}
              </button>
            ))}
          </div>
        </div>

        <label className="mb-4 block text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
          {labels.location}
          <input
            name="path"
            defaultValue={defaultPath}
            className="mt-2 w-full rounded-md bg-black/5 px-3 py-2 text-[13px] text-[var(--text)]"
          />
        </label>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-black/5 px-4 py-2 text-[13px]"
          >
            {labels.cancel}
          </button>
          <button
            type="submit"
            className="rounded-md bg-leaf-accent px-4 py-2 text-[13px] font-medium text-white hover:bg-leaf-accent-hover"
          >
            {labels.confirm}
          </button>
        </div>
      </form>
    </div>
  );
}
