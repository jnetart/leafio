import type { EditorTabWidth } from '../lib/preferences';

export function tabStringForSize(tabSize: EditorTabWidth): string {
  return ' '.repeat(tabSize);
}

export function indentCodeBlockText(text: string, tab: string): string {
  return text
    .split('\n')
    .map((line) => tab + line)
    .join('\n');
}

export function outdentCodeBlockText(text: string, tabSize: EditorTabWidth): string {
  return text
    .split('\n')
    .map((line) => {
      if (line.startsWith('\t')) {
        return line.slice(1);
      }
      let remove = 0;
      while (remove < tabSize && line[remove] === ' ') {
        remove += 1;
      }
      return line.slice(remove);
    })
    .join('\n');
}

export function getCodeBlockLineRange(
  text: string,
  fromOffset: number,
  toOffset: number,
): { lineStart: number; lineEnd: number; selectedText: string } {
  const lineStart = text.lastIndexOf('\n', fromOffset - 1) + 1;
  const lineEndIndex = text.indexOf('\n', toOffset);
  const lineEnd = lineEndIndex === -1 ? text.length : lineEndIndex;
  return {
    lineStart,
    lineEnd,
    selectedText: text.slice(lineStart, lineEnd),
  };
}
