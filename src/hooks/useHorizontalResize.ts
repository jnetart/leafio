import { useCallback, useEffect, useRef, useState } from 'react';

interface UseHorizontalResizeOptions {
  initialWidth: number;
  minWidth: number;
  maxWidth: number;
  edge: 'left' | 'right';
}

export function useHorizontalResize({
  initialWidth,
  minWidth,
  maxWidth,
  edge,
}: UseHorizontalResizeOptions) {
  const [width, setWidth] = useState(initialWidth);
  const [resizing, setResizing] = useState(false);
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null);

  const onResizeStart = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      dragRef.current = { startX: event.clientX, startWidth: width };
      setResizing(true);
    },
    [width],
  );

  useEffect(() => {
    if (!resizing) {
      return;
    }

    const onMouseMove = (event: MouseEvent) => {
      if (!dragRef.current) {
        return;
      }
      const delta =
        edge === 'left'
          ? dragRef.current.startX - event.clientX
          : event.clientX - dragRef.current.startX;
      const nextWidth = Math.min(maxWidth, Math.max(minWidth, dragRef.current.startWidth + delta));
      setWidth(nextWidth);
    };

    const onMouseUp = () => {
      dragRef.current = null;
      setResizing(false);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [edge, maxWidth, minWidth, resizing]);

  return { width, setWidth, resizing, onResizeStart };
}
