import { Node, mergeAttributes } from '@tiptap/core';

export const Footnotes = Node.create({
  name: 'footnotes',
  group: 'block',
  content: 'footnoteDefinition+',
  defining: true,
  isolating: true,
  selectable: false,

  parseHTML() {
    return [{ tag: 'section[data-footnotes]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['section', mergeAttributes(HTMLAttributes, { 'data-footnotes': '', class: 'leafio-footnotes' }), 0];
  },
});
