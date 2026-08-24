import type { Editor } from '@tiptap/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  applyLink,
  BLOCK_ACTION_SECTION_LABELS,
  EDITOR_BLOCK_ACTIONS,
  type BlockActionSection,
  type EditorBlockAction,
} from '../editor/blockActions';
import { TABLE_STRUCTURE_ACTIONS, type TableAction } from '../editor/tableActions';
import { useNotifyContextMenuOpen } from '../lib/editor-context-menu';

interface EditorContextMenuState {
  x: number;
  y: number;
}

interface EditorContextMenuProps {
  editor: Editor;
  onMenuOpenChange?: (open: boolean) => void;
}

const SECTION_ORDER: BlockActionSection[] = ['convert', 'list', 'insert'];

export function EditorContextMenu({ editor, onMenuOpenChange }: EditorContextMenuProps) {
  const [menu, setMenu] = useState<EditorContextMenuState | null>(null);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const linkInputRef = useRef<HTMLInputElement>(null);

  const groupedActions = useMemo(() => {
    return SECTION_ORDER.map((section) => ({
      section,
      label: BLOCK_ACTION_SECTION_LABELS[section],
      items: EDITOR_BLOCK_ACTIONS.filter((action) => action.section === section),
    })).filter((group) => group.items.length > 0);
  }, []);

  const isInTable = editor.isActive('table');

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

      const previous = editor.getAttributes('link').href as string | undefined;
      setLinkUrl(previous ?? '');
      setShowLinkInput(false);
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
      }
    };
    window.addEventListener('mousedown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [closeMenu, menu]);

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
    if (!showLinkInput) {
      return;
    }
    const frame = window.requestAnimationFrame(() => {
      linkInputRef.current?.focus();
      linkInputRef.current?.select();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [showLinkInput]);

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

  if (!menu) {
    return null;
  }

  return (
    <div
      ref={menuRef}
      className="fixed z-[10000] min-w-[188px] overflow-hidden rounded-lg border border-[var(--separator)] bg-[var(--paper)] py-1 shadow-[0_8px_28px_rgba(0,0,0,0.14)]"
      style={{ left: menu.x, top: menu.y }}
      role="menu"
      aria-label={isInTable ? '表格菜单' : '编辑器格式菜单'}
    >
      {isInTable ? (
        <div>
          <div className="px-3 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
            表格
          </div>
          {TABLE_STRUCTURE_ACTIONS.map((action) => (
            <button
              key={action.id}
              type="button"
              role="menuitem"
              onClick={() => runTableAction(action)}
              className="flex w-full items-center justify-between px-3 py-1.5 text-left text-[13px] text-[var(--text)] transition-colors hover:bg-black/5 dark:hover:bg-white/[0.08]"
            >
              <span>{action.title}</span>
            </button>
          ))}
        </div>
      ) : (
        groupedActions.map((group, groupIndex) => (
          <div key={group.section}>
            {groupIndex > 0 ? <div className="my-1 h-px bg-[var(--separator)]" aria-hidden="true" /> : null}
            <div className="px-3 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
              {group.label}
            </div>
            {group.items.map((action) => (
              <button
                key={action.id}
                type="button"
                role="menuitem"
                onClick={() => runAction(action)}
                className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-[13px] transition-colors hover:bg-black/5 dark:hover:bg-white/[0.08] ${
                  action.active?.(editor)
                    ? 'font-semibold text-[#3B6B4E] dark:text-[#6baa83]'
                    : 'text-[var(--text)]'
                }`}
              >
                <span>{action.title}</span>
                {action.id.startsWith('heading-') ? (
                  <span className="text-[10px] text-[var(--text-secondary)]">
                    H{action.id.replace('heading-', '')}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        ))
      )}

      {!isInTable && showLinkInput ? (
        <div className="border-t border-[var(--separator)] px-2 py-2">
          <div className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
            链接地址
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
              placeholder="粘贴或输入链接"
              aria-label="链接地址"
              className="min-w-0 flex-1 rounded-md border border-[var(--separator)] bg-[var(--settings-input-bg)] px-2 py-1 text-[12px] text-[var(--text)] outline-none transition-[border-color,box-shadow] focus:border-[var(--accent)] focus:shadow-[0_0_0_2px_rgba(91,140,111,0.18)]"
            />
            <button
              type="button"
              onClick={submitLink}
              className="rounded-md bg-[var(--accent)] px-2 py-1 text-[11px] font-semibold text-white transition-opacity hover:opacity-90"
            >
              确定
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
