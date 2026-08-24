import { useEffect } from 'react';
import { applyEditorTypography } from '../lib/editor-typography';
import type { EditorFontFamily, EditorFontSize, EditorTabWidth } from '../lib/preferences';

export function useEditorTypography(
  family: EditorFontFamily,
  size: EditorFontSize,
  tabWidth: EditorTabWidth,
) {
  useEffect(() => {
    applyEditorTypography(family, size, tabWidth);
  }, [family, size, tabWidth]);
}
