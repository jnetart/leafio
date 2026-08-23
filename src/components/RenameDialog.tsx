import { useEffect, useMemo, useRef, useState } from 'react';
import { listWorkspace } from '../lib/fs';
import { hasSiblingNameConflict } from '../lib/name-conflict';
import { displayFileName, storageFileName } from '../lib/workspace';
import { filenameInputProps } from '../lib/filename-input';

interface RenameDialogProps {
  open: boolean;
  currentName: string;
  title?: string;
  cancelLabel?: string;
  confirmLabel?: string;
  /** When true, hides `.md` in the input and restores it on confirm. */
  stripMdExtension?: boolean;
  /** Parent directory for on-disk duplicate checking. */
  parentPath?: string;
  /** Existing name to treat as unchanged (rename flows). */
  excludeName?: string;
  /** Precomputed names to check (e.g. workspace display labels). */
  conflictNames?: string[];
  duplicateError?: string;
  onConfirm: (name: string) => void;
  onClose: () => void;
}

export function RenameDialog({
  open,
  currentName,
  title = '重命名',
  cancelLabel = '取消',
  confirmLabel = '确定',
  stripMdExtension = false,
  parentPath,
  excludeName,
  conflictNames,
  duplicateError = '名称已存在',
  onConfirm,
  onClose,
}: RenameDialogProps) {
  const [value, setValue] = useState(currentName);
  const [siblingNames, setSiblingNames] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setValue(stripMdExtension ? displayFileName(currentName) : currentName);
      window.setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 0);
    }
  }, [open, currentName, stripMdExtension]);

  useEffect(() => {
    if (!open || !parentPath) {
      setSiblingNames([]);
      return;
    }
    let cancelled = false;
    void listWorkspace(parentPath)
      .then((entries) => {
        if (!cancelled) {
          setSiblingNames(entries.map((entry) => entry.name));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSiblingNames([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [open, parentPath]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const resolvedName = useMemo(() => {
    const trimmed = value.trim();
    if (!trimmed) {
      return '';
    }
    return stripMdExtension ? storageFileName(trimmed) : trimmed;
  }, [value, stripMdExtension]);

  const namesToCheck = parentPath ? siblingNames : (conflictNames ?? []);
  const hasConflict =
    resolvedName.length > 0 &&
    hasSiblingNameConflict(resolvedName, namesToCheck, excludeName);
  const canSubmit = resolvedName.length > 0 && !hasConflict;

  if (!open) {
    return null;
  }

  const submit = () => {
    if (canSubmit) {
      onConfirm(resolvedName);
    }
  };

  const inputClassName = hasConflict
    ? 'mt-3 w-full rounded-md border border-red-500 bg-[var(--window-bg)] px-3 py-2 text-[13px] outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
    : 'mt-3 w-full rounded-md border border-[var(--separator)] bg-[var(--window-bg)] px-3 py-2 text-[13px] outline-none focus:border-[var(--accent)]';

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/25 p-8">
      <div
        className="w-[min(360px,90vw)] rounded-xl border border-[var(--separator)] bg-[var(--paper)] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.18)]"
        role="dialog"
        aria-labelledby="rename-dialog-title"
      >
        <h2 id="rename-dialog-title" className="text-[15px] font-semibold">
          {title}
        </h2>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              submit();
            }
          }}
          className={inputClassName}
          aria-invalid={hasConflict}
          {...filenameInputProps}
        />
        {hasConflict ? (
          <p className="mt-1.5 text-[12px] text-red-500">{duplicateError}</p>
        ) : null}
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-[13px] text-[var(--text-secondary)] hover:bg-black/5"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            className="rounded-md bg-leaf-accent px-3 py-1.5 text-[13px] font-medium text-white hover:bg-leaf-accent-hover disabled:cursor-not-allowed disabled:opacity-45"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
