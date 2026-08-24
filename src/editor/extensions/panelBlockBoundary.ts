import { Extension } from '@tiptap/core';
import type { ResolvedPos } from '@tiptap/pm/model';
import { isPanelBlockType } from '../blockSpacing';

function docChildIndex($pos: ResolvedPos): number {
  return $pos.index(0);
}

function isTopLevelEmptyParagraph($pos: ResolvedPos): boolean {
  return $pos.depth === 1 && $pos.parent.type.name === 'paragraph' && $pos.parent.content.size === 0;
}

export const PanelBlockBoundary = Extension.create({
  name: 'panelBlockBoundary',
  priority: 1000,

  addKeyboardShortcuts() {
    return {
      Backspace: () => {
        const { state } = this.editor;
        const { $from, empty } = state.selection;

        if (!empty || !isTopLevelEmptyParagraph($from) || $from.parentOffset !== 0) {
          return false;
        }

        const index = docChildIndex($from);
        if (index === 0) {
          return false;
        }

        const nodeBefore = state.doc.child(index - 1);
        if (!isPanelBlockType(nodeBefore.type.name)) {
          return false;
        }

        return this.editor
          .chain()
          .focus()
          .deleteRange({ from: $from.before(1), to: $from.after(1) })
          .run();
      },

      Delete: () => {
        const { state } = this.editor;
        const { $from, empty } = state.selection;

        if (!empty || $from.parent.type.name !== 'codeBlock') {
          return false;
        }

        if ($from.parentOffset !== $from.parent.content.size) {
          return false;
        }

        const index = docChildIndex($from);
        if (index >= state.doc.childCount - 1) {
          return false;
        }

        const nodeAfter = state.doc.child(index + 1);
        if (nodeAfter.type.name !== 'paragraph' || nodeAfter.content.size > 0) {
          return false;
        }

        const from = $from.after(1);
        return this.editor.chain().focus().deleteRange({ from, to: from + nodeAfter.nodeSize }).run();
      },
    };
  },
});
