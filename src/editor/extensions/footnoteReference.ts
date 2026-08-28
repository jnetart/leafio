import { Node, mergeAttributes } from '@tiptap/core';

export const FootnoteReference = Node.create({
  name: 'footnoteReference',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      identifier: { default: '' },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-footnote-ref]' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-footnote-ref': node.attrs.identifier,
        class: 'leafio-fn-ref',
      }),
    ];
  },
});
