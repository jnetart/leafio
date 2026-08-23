import { useEffect, useState } from 'react';
import { isTextEditingSurfaceFocused } from '../lib/menu-edit';

export function useMenuTextFocus(): boolean {
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const sync = () => setFocused(isTextEditingSurfaceFocused());

    sync();
    document.addEventListener('focusin', sync);
    document.addEventListener('focusout', sync);
    return () => {
      document.removeEventListener('focusin', sync);
      document.removeEventListener('focusout', sync);
    };
  }, []);

  return focused;
}
