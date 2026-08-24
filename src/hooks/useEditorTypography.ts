import { useEffect } from 'react';
import { applyEditorTypography } from '../lib/editor-typography';
import type { EditorFontFamily, EditorFontSize } from '../lib/preferences';

export function useEditorTypography(family: EditorFontFamily, size: EditorFontSize) {
  useEffect(() => {
    applyEditorTypography(family, size);
  }, [family, size]);
}
