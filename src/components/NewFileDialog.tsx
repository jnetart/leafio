import { useEffect, useMemo, useRef, useState } from 'react';
import type { WorkspaceRoot } from '../lib/workspace';
import { displayFileName, storageFileName } from '../lib/workspace';
import { listWorkspace } from '../lib/fs';
import { hasSiblingNameConflict } from '../lib/name-conflict';
import { formatDisplayPath } from '../lib/paths';
import { filenameInputProps } from '../lib/filename-input';
import { IconFolder, IconMarkdownFile } from './icons';
import { WorkspaceFolderPicker } from './WorkspaceFolderPicker';

interface NewFileDialogProps {
  open: boolean;
  dir: string;
  defaultName: string;
  homeDir?: string | null;
  workspaceRoots?: WorkspaceRoot[];
  defaultDir?: string;
  locationLocked?: boolean;
  labels: {
    title: string;
    location: string;
    filename: string;
    changeLocation: string;
    collapsePicker: string;
    chooseLocation: string;
    useDefaultLocation: string;
    cancel: string;
    confirm: string;
    nameExists?: string;
  };
  onConfirm: (dir: string, name: string) => void;
  onPickLocation: () => void;
  onSelectLocation: (dir: string) => void;
  onClose: () => void;
}

export function NewFileDialog({
  open,
  dir,
  defaultName,
  homeDir = null,
  workspaceRoots = [],
  defaultDir = '',
  locationLocked = false,
  labels,
  onConfirm,
  onPickLocation,
  onSelectLocation,
  onClose,
}: NewFileDialogProps) {
  const [name, setName] = useState(defaultName);
  const [pickerExpanded, setPickerExpanded] = useState(false);
  const [siblingNames, setSiblingNames] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const resolvedDir = dir || defaultDir;
  const duplicateError = labels.nameExists ?? '名称已存在';

  useEffect(() => {
    if (open) {
      setName(displayFileName(defaultName));
      setPickerExpanded(false);
      window.setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 0);
    }
  }, [open, defaultName]);

  useEffect(() => {
    if (!open || !resolvedDir) {
      setSiblingNames([]);
      return;
    }
    let cancelled = false;
    void listWorkspace(resolvedDir)
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
  }, [open, resolvedDir]);

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
    const trimmed = name.trim();
    if (!trimmed) {
      return '';
    }
    return storageFileName(trimmed);
  }, [name]);

  const hasConflict =
    resolvedName.length > 0 && hasSiblingNameConflict(resolvedName, siblingNames);
  const canSubmit = resolvedName.length > 0 && resolvedDir.length > 0 && !hasConflict;

  if (!open) {
    return null;
  }

  const displayPath = formatDisplayPath(resolvedDir, homeDir) || resolvedDir;
  const canChangeLocation = !locationLocked;

  const submit = () => {
    if (canSubmit) {
      onConfirm(resolvedDir, resolvedName);
    }
  };

  const inputClassName = hasConflict
    ? 'w-full rounded-lg border border-red-500 bg-[var(--window-bg)] px-3 py-2.5 text-[13px] outline-none transition-colors focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
    : 'w-full rounded-lg border border-[var(--separator)] bg-[var(--window-bg)] px-3 py-2.5 text-[13px] outline-none transition-colors focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20';

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/30 p-8 backdrop-blur-[2px]">
      <div
        className="new-file-dialog w-[min(420px,92vw)] overflow-hidden rounded-2xl border border-[var(--separator)] bg-[var(--paper)] shadow-[0_28px_90px_rgba(0,0,0,0.22)]"
        role="dialog"
        aria-labelledby="new-file-dialog-title"
      >
        <div className="border-b border-[var(--separator)] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#6BAA83] to-[#4A755C] text-white shadow-[0_4px_12px_rgba(91,140,111,0.3)]">
              <IconMarkdownFile className="h-4 w-4" />
            </div>
            <h2 id="new-file-dialog-title" className="text-[15px] font-semibold tracking-[-0.01em]">
              {labels.title}
            </h2>
          </div>
        </div>

        <div className="max-h-[min(70vh,520px)] space-y-4 overflow-y-auto px-5 py-4">
          <div>
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
              {labels.location}
            </label>

            <div className="new-file-location-row flex items-center gap-2 rounded-lg border border-[var(--separator)] bg-[var(--window-bg)] px-3 py-2.5">
              <IconFolder className="h-4 w-4 shrink-0 opacity-50" />
              <span
                className="min-w-0 flex-1 truncate text-[12px] font-medium text-[var(--text)]"
                title={resolvedDir}
              >
                {displayPath}
              </span>
              {canChangeLocation ? (
                <button
                  type="button"
                  onClick={() => setPickerExpanded((value) => !value)}
                  className="shrink-0 rounded-md px-2 py-0.5 text-[12px] font-medium text-[var(--accent)] transition-colors hover:bg-[var(--accent)]/10"
                >
                  {pickerExpanded ? labels.collapsePicker : labels.changeLocation}
                </button>
              ) : null}
            </div>

            {canChangeLocation && pickerExpanded ? (
              <WorkspaceFolderPicker
                roots={workspaceRoots}
                selectedDir={resolvedDir}
                defaultDir={defaultDir || resolvedDir}
                homeDir={homeDir}
                labels={{
                  chooseLocation: labels.chooseLocation,
                  useDefaultLocation: labels.useDefaultLocation,
                }}
                onSelectDir={onSelectLocation}
                onPickLocation={() => {
                  void onPickLocation();
                  setPickerExpanded(false);
                }}
                onDone={() => setPickerExpanded(false)}
              />
            ) : null}
          </div>

          <div>
            <label
              htmlFor="new-file-name"
              className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]"
            >
              {labels.filename}
            </label>
            <input
              id="new-file-name"
              ref={inputRef}
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
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
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-[var(--separator)] px-5 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3.5 py-2 text-[13px] text-[var(--text-secondary)] transition-colors hover:bg-black/[0.05] dark:hover:bg-white/[0.06]"
          >
            {labels.cancel}
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            className="rounded-lg bg-leaf-accent px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-leaf-accent-hover disabled:cursor-not-allowed disabled:opacity-45"
          >
            {labels.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}
