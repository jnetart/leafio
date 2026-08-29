import type { Editor } from '@tiptap/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  applyLink,
  BLOCK_ACTION_SECTION_KEYS,
  EDITOR_BLOCK_ACTIONS,
  type BlockActionSection,
  type EditorBlockAction,
} from '../editor/blockActions';
import { TABLE_STRUCTURE_ACTIONS, type TableAction } from '../editor/tableActions';
import { useI18n } from '../hooks/useI18n';
import { useNotifyContextMenuOpen } from '../lib/editor-context-menu';
import { usePreferences } from '../hooks/usePreferences';
import { scrollChildIntoNearestView } from '../lib/scroll-into-view';

interface EditorContextMenuState {
  x: number;
  y: number;
}

interface EditorContextMenuProps {
  editor: Editor;
  onMenuOpenChange?: (open: boolean) => void;
}

const SECTION_ORDER: BlockActionSection[] = ['convert', 'list', 'insert'];

function menuItemClassName(selected: boolean, active = false): string {
  const tone = selected
    ? 'bg-[rgba(91,140,111,0.12)] text-[#3B6B4E] dark:text-[#6baa83]'
    : active
      ? 'font-semibold text-[#3B6B4E] dark:text-[#6baa83]'
      : 'text-[var(--text)]';
  return `flex w-full items-center justify-between px-3 py-1.5 text-left text-[13px] transition-colors ${tone} ${
    selected ? '' : 'hover:bg-black/5 dark:hover:bg-white/[0.08]'
  }`;
}

export function EditorContextMenu({ editor, onMenuOpenChange }: EditorContextMenuProps) {
  const { language } = usePreferences();
  const { t } = useI18n(language);
  const [menu, setMenu] = useState<EditorContextMenuState | null>(null);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const linkInputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const groupedActions = useMemo(() => {
    return SECTION_ORDER.map((section) => ({
      section,
      label: t(BLOCK_ACTION_SECTION_KEYS[section]),
      items: EDITOR_BLOCK_ACTIONS.filter((action) => action.section === section),
    })).filter((group) => group.items.length > 0);
  }, [t]);

  const isInTable = editor.isActive('table');
  const selectableCount = isInTable
    ? TABLE_STRUCTURE_ACTIONS.length
    : groupedActions.reduce((count, group) => count + group.items.length, 0);

  useNotifyContextMenuOpen(menu !== null, onMenuOpenChange);

  const closeMenu = useCallback(() => {
    setMenu(null);
    setShowLinkInput(false);
    setLinkUrl('');
  }, []);

  const openMenu = useCallback(
    (event: MouseEvent) => {
      event.preventDefault();
      const view = editor.view;
      if (!view) {
        return;
      }

      const coords = { left: event.clientX, top: event.clientY };
      const position = view.posAtCoords(coords);
      if (position) {
        const { from, to } = editor.state.selection;
        if (from === to) {
          editor.chain().focus().setTextSelection(position.pos).run();
        }
      } else {
        editor.commands.focus();
      }

      if (editor.isActive('codeBlock')) {
        return;
      }

      const previous = editor.getAttributes('link').href as string | undefined;
      setLinkUrl(previous ?? '');
      setShowLinkInput(false);
      setSelectedIndex(0);
      setMenu({ x: event.clientX, y: event.clientY });
    },
    [editor],
  );

  useEffect(() => {
    const dom = editor.view?.dom;
    if (!dom) {
      return;
    }
    dom.addEventListener('contextmenu', openMenu);
    return () => dom.removeEventListener('contextmenu', openMenu);
  }, [editor, openMenu]);

  const runTableAction = useCallback(
    (action: TableAction) => {
      action.run(editor);
      closeMenu();
    },
    [closeMenu, editor],
  );

  const runAction = useCallback(
    (action: EditorBlockAction) => {
      if (action.id === 'link') {
        setShowLinkInput(true);
        return;
      }
      action.run(editor);
      closeMenu();
    },
    [closeMenu, editor],
  );

  const submitLink = useCallback(() => {
    applyLink(editor, linkUrl);
    closeMenu();
  }, [closeMenu, editor, linkUrl]);

  useEffect(() => {
    if (!menu) {
      return;
    }
    const onPointerDown = (event: MouseEvent) => {
      if (event.button !== 0) {
        return;
      }
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        closeMenu();
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMenu();
        return;
      }
      if (showLinkInput || selectableCount === 0) {
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        event.stopPropagation();
        setSelectedIndex((index) => (index + selectableCount - 1) % selectableCount);
        return;
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        event.stopPropagation();
        setSelectedIndex((index) => (index + 1) % selectableCount);
        return;
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        if (isInTable) {
          const action = TABLE_STRUCTURE_ACTIONS[selectedIndex];
          if (action) {
            runTableAction(action);
          }
          return;
        }
        const action = groupedActions.flatMap((group) => group.items)[selectedIndex];
        if (action) {
          runAction(action);
        }
      }
    };
    window.addEventListener('mousedown', onPointerDown);
    window.addEventListener('keydown', onKeyDown, true);
    return () => {
      window.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown, true);
    };
  }, [
    closeMenu,
    groupedActions,
    isInTable,
    menu,
    runAction,
    runTableAction,
    selectableCount,
    selectedIndex,
    showLinkInput,
  ]);

  useEffect(() => {
    const menuElement = menuRef.current;
    if (!menu || !menuElement) {
      return;
    }
    const rect = menuElement.getBoundingClientRect();
    const maxX = window.innerWidth - rect.width - 8;
    const maxY = window.innerHeight - rect.height - 8;
    menuElement.style.left = `${Math.min(menu.x, maxX)}px`;
    menuElement.style.top = `${Math.min(menu.y, maxY)}px`;
  }, [menu, showLinkInput]);

  useEffect(() => {
    if (!menu) {
      return;
    }
    const list = menuRef.current;
    const item = itemRefs.current[selectedIndex];
    if (!list || !item) {
      return;
    }
    scrollChildIntoNearestView(list, item);
  }, [menu, selectedIndex, showLinkInput, selectableCount]);

  useEffect(() => {
    if (!showLinkInput) {
      return;
    }
    const frame = window.requestAnimationFrame(() => {
      linkInputRef.current?.focus();
      linkInputRef.current?.select();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [showLinkInput]);

  if (!menu) {
    return null;
  }

  return (
    <div
      ref={menuRef}
      className="fixed z-[10000] max-h-[min(320px,50vh)] min-w-[188px] overflow-y-auto overscroll-contain rounded-lg border border-[var(--separator)] bg-[var(--paper)] py-1 shadow-[0_8px_28px_rgba(0,0,0,0.14)]"
      style={{ left: menu.x, top: menu.y }}
      role="menu"
      aria-label={isInTable ? '表格菜单' : '编辑器格式菜单'}
    >
      {isInTable ? (
        <div>
          <div className="px-3 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
            表格
          </div>
          {TABLE_STRUCTURE_ACTIONS.map((action, index) => (
            <button
              key={action.id}
              ref={(element) => {
                itemRefs.current[index] = element;
              }}
              type="button"
              role="menuitem"
              onClick={() => runTableAction(action)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={menuItemClassName(index === selectedIndex)}
            >
              <span>{action.title}</span>
            </button>
          ))}
        </div>
      ) : (
        groupedActions.map((group, groupIndex) => {
          const groupStart = groupedActions
            .slice(0, groupIndex)
            .reduce((count, current) => count + current.items.length, 0);
          return (
            <div key={group.section}>
              {groupIndex > 0 ? <div className="my-1 h-px bg-[var(--separator)]" aria-hidden="true" /> : null}
              <div className="px-3 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                {group.label}
              </div>
              {group.items.map((action, offset) => {
                const index = groupStart + offset;
                return (
                  <button
                    key={action.id}
                    ref={(element) => {
                      itemRefs.current[index] = element;
                    }}
                    type="button"
                    role="menuitem"
                    onClick={() => runAction(action)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={menuItemClassName(index === selectedIndex, Boolean(action.active?.(editor)))}
                  >
                    <span>{t(action.titleKey)}</span>
                    {action.id.startsWith('heading-') ? (
                      <span className="text-[10px] text-[var(--text-secondary)]">
                        H{action.id.replace('heading-', '')}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          );
        })
      )}

      {!isInTable && showLinkInput ? (
        <div className="border-t border-[var(--separator)] px-2 py-2">
          <div className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
            {t('toolbar.linkUrl')}
          </div>
          <div className="flex items-center gap-1">
            <input
              ref={linkInputRef}
              type="url"
              value={linkUrl}
              onChange={(event) => setLinkUrl(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  submitLink();
                }
                if (event.key === 'Escape') {
                  event.preventDefault();
                  closeMenu();
                }
              }}
              placeholder={t('toolbar.linkPlaceholder')}
              aria-label={t('toolbar.linkUrl')}
              className="min-w-0 flex-1 rounded-md border border-[var(--separator)] bg-[var(--settings-input-bg)] px-2 py-1 text-[12px] text-[var(--text)] outline-none transition-[border-color,box-shadow] focus:border-[var(--accent)] focus:shadow-[0_0_0_2px_rgba(91,140,111,0.18)]"
            />
            <button
              type="button"
              onClick={submitLink}
              className="rounded-md bg-[var(--accent)] px-2 py-1 text-[11px] font-semibold text-white transition-opacity hover:opacity-90"
            >
              {t('toolbar.linkApply')}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
