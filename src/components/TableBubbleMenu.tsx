import { BubbleMenu } from '@tiptap/react';
import type { Editor } from '@tiptap/react';
import { useCallback, useEffect, useRef, useState, type ComponentType } from 'react';
import { createPortal } from 'react-dom';
import {
  getActiveCellBackground,
  setTableCellBackground,
  TABLE_CELL_COLORS,
} from '../editor/tableActions';
import { shouldShowTableToolbar } from '../editor/tableSelection';
import {
  IconChevronDown,
  IconTableCellFill,
  IconTableColumnDelete,
  IconTableColumnInsertLeft,
  IconTableColumnInsertRight,
  IconTableHeaderColumn,
  IconTableHeaderRow,
  IconTableRemove,
  IconTableRowDelete,
  IconTableRowInsertAbove,
  IconTableRowInsertBelow,
} from './icons';
import type { IconProps } from './icons';

interface TableBubbleMenuProps {
  editor: Editor;
  suppressed?: boolean;
}

export function TableBubbleMenu({ editor, suppressed = false }: TableBubbleMenuProps) {
  const [showColorMenu, setShowColorMenu] = useState(false);
  const colorTriggerRef = useRef<HTMLButtonElement>(null);
  const activeColor = getActiveCellBackground(editor);

  const preventFocusLoss = (event: React.MouseEvent) => {
    event.preventDefault();
  };

  const closeColorMenu = useCallback(() => setShowColorMenu(false), []);

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{
        duration: 120,
        offset: [0, 12],
        maxWidth: 'none',
        interactive: true,
        placement: 'top',
        moveTransition: 'transform 0.14s cubic-bezier(0.2, 0.8, 0.2, 1)',
        onHide: () => closeColorMenu(),
      }}
      shouldShow={({ editor: ed }) => shouldShowTableToolbar(ed, suppressed)}
    >
      <div
        className="w-max max-w-[calc(100vw-32px)] rounded-lg border border-[var(--separator)] bg-[var(--paper)]/95 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-md"
        role="toolbar"
        aria-label="表格编辑"
      >
        <div className="flex w-max items-center gap-0.5 p-1">
          <TableToolbarButton
            label="在上方插入行"
            Icon={IconTableRowInsertAbove}
            onMouseDown={preventFocusLoss}
            onClick={() => editor.chain().focus().addRowBefore().run()}
          />
          <TableToolbarButton
            label="在下方插入行"
            Icon={IconTableRowInsertBelow}
            onMouseDown={preventFocusLoss}
            onClick={() => editor.chain().focus().addRowAfter().run()}
          />
          <TableToolbarButton
            label="删除当前行"
            Icon={IconTableRowDelete}
            onMouseDown={preventFocusLoss}
            onClick={() => editor.chain().focus().deleteRow().run()}
          />

          <TableToolbarDivider />

          <TableToolbarButton
            label="在左侧插入列"
            Icon={IconTableColumnInsertLeft}
            onMouseDown={preventFocusLoss}
            onClick={() => editor.chain().focus().addColumnBefore().run()}
          />
          <TableToolbarButton
            label="在右侧插入列"
            Icon={IconTableColumnInsertRight}
            onMouseDown={preventFocusLoss}
            onClick={() => editor.chain().focus().addColumnAfter().run()}
          />
          <TableToolbarButton
            label="删除当前列"
            Icon={IconTableColumnDelete}
            onMouseDown={preventFocusLoss}
            onClick={() => editor.chain().focus().deleteColumn().run()}
          />

          <TableToolbarDivider />

          <TableToolbarButton
            label="切换标题行"
            Icon={IconTableHeaderRow}
            onMouseDown={preventFocusLoss}
            onClick={() => editor.chain().focus().toggleHeaderRow().run()}
          />
          <TableToolbarButton
            label="切换标题列"
            Icon={IconTableHeaderColumn}
            onMouseDown={preventFocusLoss}
            onClick={() => editor.chain().focus().toggleHeaderColumn().run()}
          />

          <TableToolbarDivider />

          <div className="relative shrink-0">
            <button
              ref={colorTriggerRef}
              type="button"
              aria-label="单元格背景色"
              aria-expanded={showColorMenu}
              aria-haspopup="menu"
              title="单元格背景色"
              onMouseDown={preventFocusLoss}
              onClick={() => setShowColorMenu((open) => !open)}
              className={`flex h-7 items-center gap-0.5 rounded-md px-1.5 transition-colors ${tableButtonClass(showColorMenu)}`}
            >
              <IconTableCellFill className="h-3.5 w-3.5" />
              <span
                className="h-2.5 w-2.5 rounded-[3px] border border-black/10"
                style={{
                  background: activeColor ?? 'transparent',
                  boxShadow: activeColor ? undefined : 'inset 0 0 0 1px var(--separator)',
                }}
              />
              <IconChevronDown className="h-3 w-3 opacity-70" />
            </button>

            <ColorMenuPortal
              open={showColorMenu}
              anchorRef={colorTriggerRef}
              activeColor={activeColor}
              onSelect={(color) => {
                setTableCellBackground(editor, color);
                setShowColorMenu(false);
              }}
              onClose={closeColorMenu}
            />
          </div>

          <TableToolbarDivider />

          <TableToolbarButton
            label="删除表格"
            Icon={IconTableRemove}
            danger
            onMouseDown={preventFocusLoss}
            onClick={() => editor.chain().focus().deleteTable().run()}
          />
        </div>
      </div>
    </BubbleMenu>
  );
}

function ColorMenuPortal({
  open,
  anchorRef,
  activeColor,
  onSelect,
  onClose,
}: {
  open: boolean;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  activeColor: string | null;
  onSelect: (color: string | null) => void;
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
      className="min-w-[120px] overflow-hidden rounded-md border border-[var(--separator)] bg-[var(--paper)] py-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.16)]"
    >
      <div className="px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
        背景色
      </div>
      <div className="grid grid-cols-3 gap-1 px-2 pb-1">
        {TABLE_CELL_COLORS.map(({ label, value }) => (
          <button
            key={label}
            type="button"
            role="menuitem"
            title={label}
            aria-label={label}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onSelect(value)}
            className={`flex h-7 w-7 items-center justify-center rounded-md border transition-[transform,box-shadow] hover:scale-105 ${
              activeColor === value
                ? 'border-[var(--accent)] shadow-[0_0_0_2px_rgba(91,140,111,0.25)]'
                : 'border-[var(--separator)]'
            }`}
          >
            {value ? (
              <span
                className="h-4 w-4 rounded-sm border border-black/5"
                style={{ background: value }}
              />
            ) : (
              <span className="relative h-4 w-4 rounded-sm border border-[var(--separator)]">
                <span className="absolute inset-0 flex items-center justify-center text-[9px] text-[var(--text-secondary)]">
                  无
                </span>
              </span>
            )}
          </button>
        ))}
      </div>
    </div>,
    document.body,
  );
}

function TableToolbarDivider() {
  return <div className="mx-0.5 h-4 w-px shrink-0 bg-[var(--separator)]" aria-hidden="true" />;
}

function tableButtonClass(active: boolean, danger = false) {
  if (danger) {
    return 'text-[#b4534a] hover:bg-[rgba(180,83,74,0.1)] dark:text-[#e08a82]';
  }
  return active
    ? 'bg-[rgba(91,140,111,0.14)] text-[#3B6B4E] dark:text-[#6baa83]'
    : 'text-[var(--text-secondary)] hover:bg-black/5 hover:text-[var(--text)] dark:hover:bg-white/[0.08]';
}

function TableToolbarButton({
  label,
  Icon,
  danger = false,
  onMouseDown,
  onClick,
}: {
  label: string;
  Icon: ComponentType<IconProps>;
  danger?: boolean;
  onMouseDown: (event: React.MouseEvent) => void;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onMouseDown={onMouseDown}
      onClick={onClick}
      className={`flex h-7 w-8 shrink-0 items-center justify-center rounded-md transition-colors ${tableButtonClass(false, danger)}`}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}
