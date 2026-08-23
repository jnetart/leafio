import { useWindowDrag } from '../hooks/useWindowDrag';

interface WindowDragBarProps {
  title?: string;
}

export function WindowDragBar({ title = 'Leafio' }: WindowDragBarProps) {
  const onMouseDown = useWindowDrag();

  return (
    <header className="titlebar-shell shrink-0 border-b border-[var(--separator)] bg-[var(--sidebar-bg)] backdrop-blur-xl">
      <div className="titlebar-drag-layer" data-tauri-drag-region onMouseDown={onMouseDown} />
      <div className="titlebar-content w-full justify-center pl-[var(--traffic-light-offset)]">
        <span className="truncate text-[13px] font-semibold">{title}</span>
      </div>
    </header>
  );
}
