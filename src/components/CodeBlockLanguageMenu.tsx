import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  filterCodeBlockLanguages,
  isSameCodeBlockLanguage,
} from '../editor/codeBlockLanguages';
import { IconChevronDown } from './icons';

interface CodeBlockLanguageMenuProps {
  open: boolean;
  anchorRef: React.RefObject<HTMLElement | null>;
  activeLanguage: string | null;
  onSelect: (language: string | null) => void;
  onClose: () => void;
}

export function CodeBlockLanguageMenu({
  open,
  anchorRef,
  activeLanguage,
  onSelect,
  onClose,
}: CodeBlockLanguageMenuProps) {
  const [query, setQuery] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });

  const filteredLanguages = useMemo(() => filterCodeBlockLanguages(query), [query]);

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) {
      return;
    }
    const rect = anchor.getBoundingClientRect();
    setPosition({
      top: rect.bottom + 6,
      left: rect.right,
      width: Math.max(rect.width, 220),
    });
  }, [anchorRef]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      return;
    }
    updatePosition();
    const frame = window.requestAnimationFrame(() => {
      searchRef.current?.focus();
    });
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (anchorRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }
      onClose();
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [anchorRef, onClose, open]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div
      ref={menuRef}
      role="listbox"
      aria-label="代码语言"
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        width: position.width,
        transform: 'translateX(-100%)',
        zIndex: 10000,
      }}
      className="flex flex-col overflow-hidden rounded-lg border border-[var(--separator)] bg-[var(--paper)] shadow-[0_10px_36px_rgba(0,0,0,0.16)]"
    >
      <div className="border-b border-[var(--separator)] px-2.5 py-2">
        <input
          ref={searchRef}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onMouseDown={(event) => event.stopPropagation()}
          placeholder="搜索语言…"
          aria-label="搜索语言"
          className="w-full rounded-md border border-[var(--separator)] bg-[var(--settings-input-bg)] px-2 py-1.5 text-[11px] text-[var(--text)] outline-none transition-[border-color,box-shadow] focus:border-[var(--accent)] focus:shadow-[0_0_0_2px_rgba(91,140,111,0.18)]"
        />
      </div>
      <div className="max-h-[min(320px,50vh)] overflow-y-auto overscroll-contain py-1">
        {filteredLanguages.length === 0 ? (
          <div className="px-3 py-4 text-center text-[11px] text-[var(--text-secondary)]">
            未找到匹配语言
          </div>
        ) : (
          filteredLanguages.map(({ id, label }) => {
            const isActive = isSameCodeBlockLanguage(id, activeLanguage);
            return (
              <button
                key={id ?? 'plain'}
                type="button"
                role="option"
                aria-selected={isActive}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onSelect(id);
                  onClose();
                }}
                className={`flex w-full items-center justify-between gap-3 px-3 py-1.5 text-left text-[11px] transition-colors ${
                  isActive
                    ? 'bg-[var(--accent)]/10 text-[var(--accent)]'
                    : 'text-[var(--text)] hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
                }`}
              >
                <span className="font-medium">{label}</span>
                {id ? (
                  <span className="shrink-0 font-mono text-[10px] text-[var(--text-secondary)] opacity-80">
                    {id}
                  </span>
                ) : null}
              </button>
            );
          })
        )}
      </div>
    </div>,
    document.body,
  );
}

interface CodeBlockLanguageTriggerProps {
  label: string;
  open: boolean;
  onToggle: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

export function CodeBlockLanguageTrigger({
  label,
  open,
  onToggle,
  triggerRef,
}: CodeBlockLanguageTriggerProps) {
  return (
    <button
      ref={triggerRef}
      type="button"
      contentEditable={false}
      aria-label="代码语言"
      aria-expanded={open}
      aria-haspopup="listbox"
      title="选择语言"
      onMouseDown={(event) => event.preventDefault()}
      onClick={onToggle}
      className={`leafio-code-block-lang-trigger ${open ? 'leafio-code-block-lang-trigger--open' : ''}`}
    >
      <span className="truncate">{label}</span>
      <IconChevronDown className="h-3 w-3 shrink-0 opacity-70" />
    </button>
  );
}
