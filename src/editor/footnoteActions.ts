import type { Editor } from '@tiptap/core';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { TextSelection } from '@tiptap/pm/state';
import { nextIdentifier, usedIdentifiers } from './footnoteModel';

export type FootnoteRange = { from: number; to: number };

export function insertFootnote(editor: Editor, range?: FootnoteRange): void {
  const identifier = nextIdentifier(usedIdentifiers(editor.getJSON()));
  if (!identifier) {
    return;
  }

  const { state } = editor;
  const refType = state.schema.nodes.footnoteReference;
  const defType = state.schema.nodes.footnoteDefinition;
  const notesType = state.schema.nodes.footnotes;
  const paragraphType = state.schema.nodes.paragraph;
  if (!refType || !defType || !notesType || !paragraphType) {
    return;
  }

  let tr = state.tr;
  if (range) {
    tr = tr.delete(range.from, range.to);
  }

  let $from = tr.selection.$from;
  for (let depth = $from.depth; depth > 0; depth -= 1) {
    if ($from.node(depth).type === notesType) {
      const notesPos = $from.before(depth);
      tr = tr.setSelection(TextSelection.near(tr.doc.resolve(notesPos), -1));
      $from = tr.selection.$from;
      break;
    }
  }

  const refNode = refType.create({ identifier });
  tr = tr.replaceSelectionWith(refNode, false);

  const definition = defType.create({ identifier }, paragraphType.create());
  const last = tr.doc.lastChild;
  if (last?.type === notesType) {
    const insertPos = tr.doc.content.size - 1;
    tr = tr.insert(insertPos, definition);
  } else {
    tr = tr.insert(tr.doc.content.size, notesType.create(null, definition));
  }

  const defPos = findDefinitionPos(tr.doc, identifier);
  if (defPos !== null) {
    tr = tr.setSelection(TextSelection.near(tr.doc.resolve(defPos + 2)));
  }

  editor.view.dispatch(tr.scrollIntoView());
  editor.view.focus();
}

function findDefinitionPos(doc: ProseMirrorNode, identifier: string): number | null {
  let found: number | null = null;
  doc.descendants((node, pos) => {
    if (found !== null) {
      return false;
    }
    if (node.type.name === 'footnoteDefinition' && node.attrs.identifier === identifier) {
      found = pos;
      return false;
    }
    return true;
  });
  return found;
}
