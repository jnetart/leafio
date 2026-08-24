import { Extension } from '@tiptap/core';
import type { Editor } from '@tiptap/core';
import type { EditorTabWidth } from '../../lib/preferences';
import {
  getCodeBlockLineRange,
  indentCodeBlockText,
  outdentCodeBlockText,
  tabStringForSize,
} from '../codeBlockIndent';

declare module '@tiptap/core' {
  interface Storage {
    codeBlockTab: {
      tabSize: EditorTabWidth;
    };
  }
}

function getTabSize(editor: Editor): EditorTabWidth {
  return editor.storage.codeBlockTab?.tabSize ?? 2;
}

function replaceCodeBlockRange(
  editor: Editor,
  from: number,
  to: number,
  text: string,
  cursorPos?: number,
): boolean {
  const chain = editor.chain().focus().insertContentAt({ from, to }, text);
  if (cursorPos !== undefined) {
    chain.setTextSelection(cursorPos);
  }
  return chain.run();
}

function indentCodeBlock(editor: Editor): boolean {
  if (!editor.isActive('codeBlock')) {
    return false;
  }

  const tabSize = getTabSize(editor);
  const tab = tabStringForSize(tabSize);
  const { state } = editor;
  const { $from, $to, empty } = state.selection;

  if (empty) {
    return editor.chain().focus().insertContent(tab).run();
  }

  const blockStart = $from.start();
  const parentText = $from.parent.textContent;
  const { lineStart, lineEnd, selectedText } = getCodeBlockLineRange(
    parentText,
    $from.parentOffset,
    $to.parentOffset,
  );
  const indented = indentCodeBlockText(selectedText, tab);

  return replaceCodeBlockRange(
    editor,
    blockStart + lineStart,
    blockStart + lineEnd,
    indented,
  );
}

function outdentCodeBlock(editor: Editor): boolean {
  if (!editor.isActive('codeBlock')) {
    return false;
  }

  const tabSize = getTabSize(editor);
  const { state } = editor;
  const { $from, $to, empty } = state.selection;
  const blockStart = $from.start();
  const parentText = $from.parent.textContent;
  const { lineStart, lineEnd, selectedText } = getCodeBlockLineRange(
    parentText,
    $from.parentOffset,
    $to.parentOffset,
  );
  const outdented = outdentCodeBlockText(selectedText, tabSize);

  if (outdented === selectedText) {
    return true;
  }

  const from = blockStart + lineStart;
  const to = blockStart + lineEnd;
  const removed = selectedText.length - outdented.length;
  const cursorPos = empty
    ? Math.max(from, $from.pos - Math.min(removed, tabSize))
    : undefined;

  return replaceCodeBlockRange(editor, from, to, outdented, cursorPos);
}

export const CodeBlockTab = Extension.create({
  name: 'codeBlockTab',
  priority: 1000,

  addStorage() {
    return {
      tabSize: 2 satisfies EditorTabWidth,
    };
  },

  addKeyboardShortcuts() {
    return {
      Tab: () => indentCodeBlock(this.editor),
      'Shift-Tab': () => outdentCodeBlock(this.editor),
    };
  },
});
