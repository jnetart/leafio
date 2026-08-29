import type { Editor } from '@tiptap/core';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  BLOCK_ACTION_SECTION_KEYS,
  filterBlockActions,
  type BlockActionSection,
  type EditorBlockAction,
} from '../editor/blockActions';
import { useI18n } from '../hooks/useI18n';
import { usePreferences } from '../hooks/usePreferences';
import { scrollChildIntoNearestView } from '../lib/scroll-into-view';

export interface SlashCommandListProps {
  editor: Editor;
  query: string;
  command: (item: EditorBlockAction) => void;
}

export interface SlashCommandListHandle {
  onKeyDown: (event: globalThis.KeyboardEvent) => boolean;
}

export const SlashCommandList = forwardRef<SlashCommandListHandle, SlashCommandListProps>(
  function SlashCommandList({ query, command }, ref) {
    const { language } = usePreferences();
    const { t } = useI18n(language);
    const items = useMemo(() => filterBlockActions(query), [query]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const listRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

    useEffect(() => {
      setSelectedIndex(0);
    }, [query]);

    useEffect(() => {
      if (selectedIndex >= items.length) {
        setSelectedIndex(Math.max(0, items.length - 1));
      }
    }, [items.length, selectedIndex]);

    useEffect(() => {
      const list = listRef.current;
      const item = itemRefs.current[selectedIndex];
      if (!list || !item) {
        return;
      }
      scrollChildIntoNearestView(list, item);
    }, [items, selectedIndex]);

    useImperativeHandle(ref, () => ({
      onKeyDown: (event) => {
        if (items.length === 0) {
          return false;
        }
        if (event.key === 'ArrowUp') {
          event.preventDefault();
          setSelectedIndex((index) => (index + items.length - 1) % items.length);
          return true;
        }
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          setSelectedIndex((index) => (index + 1) % items.length);
          return true;
        }
        if (event.key === 'Enter') {
          event.preventDefault();
          const item = items[selectedIndex];
          if (item) {
            command(item);
          }
          return true;
        }
        return false;
      },
    }));

    if (items.length === 0) {
      return (
        <div className="min-w-[180px] rounded-lg border border-[var(--separator)] bg-[var(--paper)] px-3 py-2 text-[12px] text-[var(--text-secondary)] shadow-[0_8px_28px_rgba(0,0,0,0.14)]">
          {t('slash.noMatch')}
        </div>
      );
    }

    let lastSection: BlockActionSection | null = null;

    return (
      <div
        ref={listRef}
        className="max-h-[min(320px,50vh)] min-w-[196px] overflow-auto overscroll-contain rounded-lg border border-[var(--separator)] bg-[var(--paper)] py-1 shadow-[0_8px_28px_rgba(0,0,0,0.14)]"
        role="listbox"
        aria-label={t('slash.listLabel')}
      >
        {items.map((item, index) => {
          const showHeader = item.section !== lastSection;
          lastSection = item.section;
          return (
            <div key={item.id}>
              {showHeader ? (
                <div className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-secondary)] first:pt-1">
                  {t(BLOCK_ACTION_SECTION_KEYS[item.section])}
                </div>
              ) : null}
              <button
                ref={(element) => {
                  itemRefs.current[index] = element;
                }}
                type="button"
                role="option"
                aria-selected={index === selectedIndex}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => command(item)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-[13px] transition-colors ${
                  index === selectedIndex
                    ? 'bg-[rgba(91,140,111,0.12)] text-[#3B6B4E] dark:text-[#6baa83]'
                    : 'text-[var(--text)] hover:bg-black/5 dark:hover:bg-white/[0.08]'
                }`}
              >
                <span>{t(item.titleKey)}</span>
                <span className="text-[10px] text-[var(--text-secondary)]">/{item.keywords[0]}</span>
              </button>
            </div>
          );
        })}
      </div>
    );
  },
);
