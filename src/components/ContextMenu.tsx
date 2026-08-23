import { useEffect, useRef } from 'react';

export interface ContextMenuItem {
  id: string;
  label: string;
  danger?: boolean;
  disabled?: boolean;
  separatorBefore?: boolean;
  onSelect: () => void;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (event.button !== 0) {
        return;
      }
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('mousedown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  useEffect(() => {
    const menu = menuRef.current;
    if (!menu) {
      return;
    }
    const rect = menu.getBoundingClientRect();
    const maxX = window.innerWidth - rect.width - 8;
    const maxY = window.innerHeight - rect.height - 8;
    menu.style.left = `${Math.min(x, maxX)}px`;
    menu.style.top = `${Math.min(y, maxY)}px`;
  }, [x, y]);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[148px] overflow-hidden rounded-lg border border-[var(--separator)] bg-[var(--paper)] py-1 shadow-[0_8px_28px_rgba(0,0,0,0.14)]"
      style={{ left: x, top: y }}
      role="menu"
    >
      {items.map((item) => (
        <div key={item.id}>
          {item.separatorBefore ? (
            <div className="my-1 border-t border-[var(--separator)]" role="separator" />
          ) : null}
          <button
            type="button"
            role="menuitem"
            disabled={item.disabled}
            onClick={() => {
              if (!item.disabled) {
                item.onSelect();
                onClose();
              }
            }}
            className={`flex w-full px-3 py-1.5 text-left text-[13px] disabled:cursor-not-allowed disabled:opacity-40 ${
              item.danger
                ? 'text-red-600 hover:bg-red-50'
                : 'text-[var(--text)] hover:bg-black/5'
            }`}
          >
            {item.label}
          </button>
        </div>
      ))}
    </div>
  );
}
