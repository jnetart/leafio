import type { Editor } from '@tiptap/core';
import { isTextSelection } from '@tiptap/core';
import { CellSelection } from '@tiptap/pm/tables';

export function isTableStructureSelection(editor: Editor): boolean {
  return editor.state.selection instanceof CellSelection;
}

export function shouldShowTextFormatToolbar(editor: Editor): boolean {
  if (isTableStructureSelection(editor)) {
    return false;
  }

  if (editor.isActive('codeBlock')) {
    return false;
  }

  const { state } = editor;
  const { doc, selection } = state;
  if (selection.empty) {
    return false;
  }

  const isEmptyTextBlock =
    !doc.textBetween(selection.from, selection.to).length && isTextSelection(selection);

  return !isEmptyTextBlock;
}

export function shouldShowTableToolbar(editor: Editor, suppressed = false): boolean {
  if (suppressed) {
    return false;
  }
  return isTableStructureSelection(editor);
}
