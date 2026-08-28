import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { FootnoteReferenceView } from '../../components/FootnoteReferenceView';

declare module '@tiptap/core' {
  interface Storage {
    footnoteReference: {
      lastClickedRefPos: Record<string, number>;
    };
  }
}

export const FootnoteReference = Node.create({
  name: 'footnoteReference',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,
  draggable: false,

  addStorage() {
    return {
      lastClickedRefPos: {} as Record<string, number>,
    };
  },

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

  addNodeView() {
    return ReactNodeViewRenderer(FootnoteReferenceView);
  },
});
