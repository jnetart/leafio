import type { EditorFontFamily, EditorFontSize } from './preferences';

export const EDITOR_FONT_SIZE_PX: Record<EditorFontSize, number> = {
  compact: 14,
  medium: 16,
  large: 18,
  xlarge: 20,
};

const EDITOR_FONT_FAMILY_STACK: Record<EditorFontFamily, string> = {
  sans:
    "-apple-system, BlinkMacSystemFont, 'Segoe WPC', 'Segoe UI', 'Helvetica Neue', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
  serif: "Georgia, 'Times New Roman', 'Songti SC', 'SimSun', serif",
  mono: "'SF Mono', 'JetBrains Mono', ui-monospace, monospace",
};

function companionSize(px: number): number {
  return Math.max(px - 1, 12);
}

export function applyEditorTypography(family: EditorFontFamily, size: EditorFontSize): void {
  const px = EDITOR_FONT_SIZE_PX[size];
  const companion = companionSize(px);
  const root = document.documentElement;

  root.style.setProperty('--editor-font', EDITOR_FONT_FAMILY_STACK[family]);
  root.style.setProperty('--editor-size', `${px}px`);
  root.style.setProperty('--editor-code-size', `${companion}px`);
  root.style.setProperty('--source-font-size', `${companion}px`);
  root.style.setProperty('--source-line-height', `${Math.round(companion * 1.615)}px`);
}
