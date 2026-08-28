import { Node, mergeAttributes } from '@tiptap/core';

export const FootnoteDefinition = Node.create({
  name: 'footnoteDefinition',
  group: 'footnoteItem',
  content: 'block+',
  defining: true,
  isolating: true,

  addAttributes() {
    return {
      identifier: { default: '' },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-footnote-def]' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-footnote-def': node.attrs.identifier,
        class: 'leafio-fn-def',
      }),
      0,
    ];
  },
});
