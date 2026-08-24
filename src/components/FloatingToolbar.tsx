import { BubbleMenu } from '@tiptap/react';
import type { Editor } from '@tiptap/react';
import { useCallback, useEffect, useRef, useState, type ComponentType } from 'react';
import { createPortal } from 'react-dom';
import {
  IconBold,
  IconBulletList,
  IconChevronDown,
  IconCode,
  IconCodeBlock,
  IconDivider,
  IconHeading,
  IconHighlight,
  IconItalic,
  IconLink,
  IconOrderedList,
  IconQuote,
  IconStrikethrough,
  IconTable,
  IconTaskList,
  IconUnlink,
} from './icons';
import type { IconProps } from './icons';
import { shouldShowTextFormatToolbar } from '../editor/tableSelection';

interface FloatingToolbarProps {
  editor: Editor;
}

const HEADING_OPTIONS = [
  { label: '正文', level: 0 as const },
  { label: '标题 1', level: 1 as const },
  { label: '标题 2', level: 2 as const },
  { label: '标题 3', level: 3 as const },
  { label: '标题 4', level: 4 as const },
];

type HeadingLevel = (typeof HEADING_OPTIONS)[number]['level'];

export function FloatingToolbar({ editor }: FloatingToolbarProps) {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [showHeadingMenu, setShowHeadingMenu] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const linkInputRef = useRef<HTMLInputElement>(null);
  const headingTriggerRef = useRef<HTMLButtonElement>(null);

  const isLinkActive = editor.isActive('link');
  const activeHeadingLevel =
    HEADING_OPTIONS.find(({ level }) => level > 0 && editor.isActive('heading', { level }))?.level ?? 0;

  const closeMenus = useCallback(() => {
    setShowLinkInput(false);
    setShowHeadingMenu(false);
  }, []);

  const openLinkEditor = useCallback(() => {
    const previous = editor.getAttributes('link').href as string | undefined;
    setLinkUrl(previous ?? '');
    setShowHeadingMenu(false);
    setShowLinkInput(true);
  }, [editor]);

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

  const applyLink = useCallback(() => {
    const url = linkUrl.trim();
    if (!url) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      const href = /^[a-z][a-z0-9+.-]*:/i.test(url) ? url : `https://${url}`;
      editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
    }
    closeMenus();
  }, [closeMenus, editor, linkUrl]);

  const removeLink = useCallback(() => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    closeMenus();
  }, [closeMenus, editor]);

  const applyHeading = useCallback(
    (level: HeadingLevel) => {
      if (level === 0) {
        editor.chain().focus().setParagraph().run();
      } else {
        editor.chain().focus().setHeading({ level }).run();
      }
      setShowHeadingMenu(false);
    },
    [editor],
  );

  const preventFocusLoss = (event: React.MouseEvent) => {
    event.preventDefault();
  };

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{
        duration: 120,
        offset: [0, 10],
        maxWidth: 'none',
        interactive: true,
        moveTransition: 'transform 0.14s cubic-bezier(0.2, 0.8, 0.2, 1)',
        onHide: () => closeMenus(),
      }}
      shouldShow={({ editor: ed }) => shouldShowTextFormatToolbar(ed)}
    >
      <div
        className="w-max max-w-[calc(100vw-32px)] rounded-lg border border-[var(--separator)] bg-[var(--paper)]/95 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-md"
        role="toolbar"
        aria-label="文本格式"
      >
        <div className="flex w-max items-center gap-0.5 p-1">
          <ToolbarButton
            label="加粗"
            shortcut="⌘B"
            Icon={IconBold}
            active={editor.isActive('bold')}
            onMouseDown={preventFocusLoss}
            onClick={() => editor.chain().focus().toggleBold().run()}
          />
          <ToolbarButton
            label="斜体"
            shortcut="⌘I"
            Icon={IconItalic}
            active={editor.isActive('italic')}
            onMouseDown={preventFocusLoss}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          />
          <ToolbarButton
            label="删除线"
            shortcut="⌘⇧X"
            Icon={IconStrikethrough}
            active={editor.isActive('strike')}
            onMouseDown={preventFocusLoss}
            onClick={() => editor.chain().focus().toggleStrike().run()}
          />

          <ToolbarDivider />

          <ToolbarButton
            label="高亮"
            Icon={IconHighlight}
            active={editor.isActive('highlight')}
            onMouseDown={preventFocusLoss}
            onClick={() => editor.chain().focus().toggleHighlight().run()}
          />

          <ToolbarDivider />

          <ToolbarButton
            label="行内代码"
            shortcut="⌘E"
            Icon={IconCode}
            active={editor.isActive('code')}
            onMouseDown={preventFocusLoss}
            onClick={() => editor.chain().focus().toggleCode().run()}
          />
          <ToolbarButton
            label={isLinkActive ? '编辑链接' : '插入链接'}
            shortcut="⌘K"
            Icon={IconLink}
            active={isLinkActive || showLinkInput}
            onMouseDown={preventFocusLoss}
            onClick={openLinkEditor}
          />

          <ToolbarDivider />

          <div className="shrink-0">
            <button
              ref={headingTriggerRef}
              type="button"
              aria-label="标题级别"
              aria-expanded={showHeadingMenu}
              aria-haspopup="menu"
              title="标题级别"
              onMouseDown={preventFocusLoss}
              onClick={() => {
                setShowLinkInput(false);
                setShowHeadingMenu((open) => !open);
              }}
              className={`flex h-7 items-center gap-0.5 rounded-md px-1.5 transition-colors ${toolbarButtonClass(activeHeadingLevel > 0 || showHeadingMenu)}`}
            >
              <IconHeading className="h-3.5 w-3.5" />
              <span className="text-[10px] font-semibold">
                {activeHeadingLevel > 0 ? `H${activeHeadingLevel}` : '正文'}
              </span>
              <IconChevronDown className="h-3 w-3 opacity-70" />
            </button>

            <HeadingMenuPortal
              open={showHeadingMenu}
              anchorRef={headingTriggerRef}
              activeHeadingLevel={activeHeadingLevel}
              onSelect={applyHeading}
              onClose={() => setShowHeadingMenu(false)}
            />
          </div>

          <ToolbarDivider />

          <ToolbarButton
            label="引用"
            Icon={IconQuote}
            active={editor.isActive('blockquote')}
            onMouseDown={preventFocusLoss}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          />
          <ToolbarButton
            label="无序列表"
            Icon={IconBulletList}
            active={editor.isActive('bulletList')}
            onMouseDown={preventFocusLoss}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          />
          <ToolbarButton
            label="有序列表"
            Icon={IconOrderedList}
            active={editor.isActive('orderedList')}
            onMouseDown={preventFocusLoss}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          />
          <ToolbarButton
            label="任务列表"
            Icon={IconTaskList}
            active={editor.isActive('taskList')}
            onMouseDown={preventFocusLoss}
            onClick={() => editor.chain().focus().toggleTaskList().run()}
          />

          <ToolbarDivider />

          <ToolbarButton
            label="插入表格"
            Icon={IconTable}
            active={editor.isActive('table')}
            onMouseDown={preventFocusLoss}
            onClick={() =>
              editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
            }
          />
          <ToolbarButton
            label="代码块"
            Icon={IconCodeBlock}
            active={editor.isActive('codeBlock')}
            onMouseDown={preventFocusLoss}
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          />
          <ToolbarButton
            label="分隔线"
            Icon={IconDivider}
            onMouseDown={preventFocusLoss}
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
          />
        </div>

        {showLinkInput ? (
          <div className="flex items-center gap-1 border-t border-[var(--separator)] px-1.5 py-1.5">
            <input
              ref={linkInputRef}
              type="url"
              value={linkUrl}
              onChange={(event) => setLinkUrl(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  applyLink();
                }
                if (event.key === 'Escape') {
                  event.preventDefault();
                  closeMenus();
                }
              }}
              placeholder="粘贴或输入链接"
              aria-label="链接地址"
              className="min-w-0 flex-1 rounded-md border border-[var(--separator)] bg-[var(--settings-input-bg)] px-2 py-1 text-[11px] text-[var(--text)] outline-none transition-[border-color,box-shadow] focus:border-[var(--accent)] focus:shadow-[0_0_0_2px_rgba(91,140,111,0.18)]"
            />
            <button
              type="button"
              onMouseDown={preventFocusLoss}
              onClick={applyLink}
              className="flex h-6 min-w-6 items-center justify-center rounded-md bg-[var(--accent)] px-2 text-[10px] font-semibold text-white transition-opacity hover:opacity-90"
              aria-label="应用链接"
            >
              确定
            </button>
            {isLinkActive ? (
              <button
                type="button"
                onMouseDown={preventFocusLoss}
                onClick={removeLink}
                className="flex h-6 w-6 items-center justify-center rounded-md text-[var(--text-secondary)] transition-colors hover:bg-black/5 hover:text-[var(--text)] dark:hover:bg-white/[0.08]"
                aria-label="移除链接"
                title="移除链接"
              >
                <IconUnlink className="h-3 w-3" />
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </BubbleMenu>
  );
}

function ToolbarDivider() {
  return <div className="mx-0.5 h-4 w-px shrink-0 bg-[var(--separator)]" aria-hidden="true" />;
}

function HeadingMenuPortal({
  open,
  anchorRef,
  activeHeadingLevel,
  onSelect,
  onClose,
}: {
  open: boolean;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  activeHeadingLevel: number;
  onSelect: (level: HeadingLevel) => void;
  onClose: () => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) {
      return;
    }
    const rect = anchor.getBoundingClientRect();
    setPosition({
      top: rect.bottom + 6,
      left: rect.left,
    });
  }, [anchorRef]);

  useEffect(() => {
    if (!open) {
      return;
    }
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
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
      role="menu"
      style={{ position: 'fixed', top: position.top, left: position.left, zIndex: 10000 }}
      className="min-w-[116px] overflow-hidden rounded-md border border-[var(--separator)] bg-[var(--paper)] py-1 shadow-[0_8px_24px_rgba(0,0,0,0.16)]"
    >
      {HEADING_OPTIONS.map(({ label, level }) => (
        <button
          key={label}
          type="button"
          role="menuitem"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => onSelect(level)}
          className={`flex w-full items-center justify-between px-2.5 py-1.5 text-left text-[11px] transition-colors hover:bg-black/5 dark:hover:bg-white/[0.08] ${
            (level === 0 && activeHeadingLevel === 0) ||
            (level > 0 && activeHeadingLevel === level)
              ? 'font-semibold text-[#3B6B4E] dark:text-[#6baa83]'
              : 'text-[var(--text)]'
          }`}
        >
          <span>{label}</span>
          {level > 0 ? <span className="text-[10px] text-[var(--text-secondary)]">H{level}</span> : null}
        </button>
      ))}
    </div>,
    document.body,
  );
}

function toolbarButtonClass(active: boolean) {
  return active
    ? 'bg-[rgba(91,140,111,0.14)] text-[#3B6B4E] dark:text-[#6baa83]'
    : 'text-[var(--text-secondary)] hover:bg-black/5 hover:text-[var(--text)] dark:hover:bg-white/[0.08]';
}

function ToolbarButton({
  label,
  shortcut,
  Icon,
  active = false,
  onMouseDown,
  onClick,
}: {
  label: string;
  shortcut?: string;
  Icon: ComponentType<IconProps>;
  active?: boolean;
  onMouseDown: (event: React.MouseEvent) => void;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      title={shortcut ? `${label} (${shortcut})` : label}
      onMouseDown={onMouseDown}
      onClick={onClick}
      className={`flex h-7 w-8 shrink-0 items-center justify-center rounded-md transition-colors ${toolbarButtonClass(active)}`}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}
