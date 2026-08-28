import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import type { Node as ProseMirrorNode, NodeType } from '@tiptap/pm/model';

function nodeEqualsType({
  node,
  types,
}: {
  node: ProseMirrorNode | null;
  types: NodeType[];
}): boolean {
  return node ? types.some((type) => type === node.type) : false;
}

export const TrailingNode = Extension.create({
  name: 'trailingNode',

  addOptions() {
    return {
      node: 'paragraph',
      notAfter: ['paragraph'],
    };
  },

  addProseMirrorPlugins() {
    const pluginKey = new PluginKey(this.name);
    const { node, notAfter } = this.options;

    const disabledNodes = Object.entries(this.editor.schema.nodes)
      .map(([, value]) => value)
      .filter((schemaNode) => notAfter.concat(node).includes(schemaNode.name));

    return [
      new Plugin({
        key: pluginKey,
        appendTransaction: (_, __, state) => {
          const { doc, schema } = state;
          const paragraph = schema.nodes[node];
          const footnotes = schema.nodes.footnotes;
          if (!paragraph) {
            return;
          }

          const last = doc.lastChild;
          if (footnotes && last?.type === footnotes) {
            const beforeIndex = doc.childCount - 2;
            if (beforeIndex < 0) {
              return state.tr.insert(0, paragraph.create());
            }
            const before = doc.child(beforeIndex);
            if (nodeEqualsType({ node: before, types: disabledNodes })) {
              return;
            }
            const insertPos = doc.content.size - last.nodeSize;
            return state.tr.insert(insertPos, paragraph.create());
          }

          const shouldInsertNodeAtEnd = pluginKey.getState(state);
          if (!shouldInsertNodeAtEnd) {
            return;
          }
          return state.tr.insert(doc.content.size, paragraph.create());
        },
        state: {
          init: (_, state) => {
            const lastNode = state.doc.lastChild;
            if (lastNode?.type.name === 'footnotes') {
              return false;
            }
            return !nodeEqualsType({ node: lastNode, types: disabledNodes });
          },
          apply: (tr, value) => {
            if (!tr.docChanged) {
              return value;
            }

            const lastNode = tr.doc.lastChild;
            if (lastNode?.type.name === 'footnotes') {
              return false;
            }
            return !nodeEqualsType({ node: lastNode, types: disabledNodes });
          },
        },
      }),
    ];
  },
});
