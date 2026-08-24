import { Extension } from '@tiptap/core';
import { isPanelBlockType } from '../blockSpacing';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { Plugin, PluginKey, TextSelection } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import type { EditorView } from '@tiptap/pm/view';

export function posAfterDocChild(doc: ProseMirrorNode, childIndex: number): number {
  let pos = 0;
  for (let index = 0; index <= childIndex; index += 1) {
    pos += doc.child(index).nodeSize;
  }
  return pos;
}

function insertParagraphAt(view: EditorView, pos: number): void {
  const { state } = view;
  const paragraph = state.schema.nodes.paragraph;
  if (!paragraph) {
    return;
  }

  const safePos = Math.max(0, Math.min(pos, state.doc.content.size));
  const tr = state.tr.insert(safePos, paragraph.create());
  tr.setSelection(TextSelection.near(tr.doc.resolve(safePos + 1)));
  view.dispatch(tr);
  view.focus();
}

function createGapHitArea(insertPos: number, getView: () => EditorView | null): HTMLElement {
  const element = document.createElement('div');
  element.className = 'leafio-block-gap-hit';
  element.setAttribute('aria-hidden', 'true');
  element.addEventListener('mousedown', (event) => {
    if (!(event instanceof MouseEvent) || event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const view = getView();
    if (!view?.editable) {
      return;
    }

    insertParagraphAt(view, insertPos);
  });
  return element;
}

function buildGapDecorations(doc: ProseMirrorNode, getView: () => EditorView | null): DecorationSet {
  const decorations: Decoration[] = [];
  let pos = 0;

  for (let index = 0; index < doc.childCount; index += 1) {
    const node = doc.child(index);
    const nodeEnd = pos + node.nodeSize;
    const next = index < doc.childCount - 1 ? doc.child(index + 1) : null;

    if (isPanelBlockType(node.type.name)) {
      if (next && isPanelBlockType(next.type.name)) {
        decorations.push(
          Decoration.widget(nodeEnd, () => createGapHitArea(nodeEnd, getView), {
            side: 1,
            block: true,
            key: `block-gap-after-${nodeEnd}`,
            ignoreSelection: true,
            stopEvent: () => true,
          }),
        );
      }
    }

    pos = nodeEnd;
  }

  return DecorationSet.create(doc, decorations);
}

const blockGapPluginKey = new PluginKey('blockGap');

export const BlockGap = Extension.create({
  name: 'blockGap',

  addProseMirrorPlugins() {
    let editorView: EditorView | null = null;
    const getView = () => editorView;

    return [
      new Plugin({
        key: blockGapPluginKey,
        view(view) {
          editorView = view;
          return {
            destroy() {
              editorView = null;
            },
          };
        },
        state: {
          init: (_, { doc }) => buildGapDecorations(doc, getView),
          apply(tr, value, _oldState, newState) {
            if (tr.docChanged) {
              return buildGapDecorations(newState.doc, getView);
            }
            return value.map(tr.mapping, tr.doc);
          },
        },
        props: {
          decorations(state) {
            return blockGapPluginKey.getState(state);
          },
        },
      }),
    ];
  },
});
