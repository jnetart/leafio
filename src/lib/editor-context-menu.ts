import { useCallback, useEffect, useState } from 'react';

export function useEditorContextMenuOpen() {
  const [open, setOpen] = useState(false);
  const onMenuOpenChange = useCallback((nextOpen: boolean) => {
    setOpen(nextOpen);
  }, []);
  return { contextMenuOpen: open, onMenuOpenChange };
}

export function useNotifyContextMenuOpen(
  open: boolean,
  onMenuOpenChange?: (open: boolean) => void,
) {
  useEffect(() => {
    onMenuOpenChange?.(open);
  }, [onMenuOpenChange, open]);
}
