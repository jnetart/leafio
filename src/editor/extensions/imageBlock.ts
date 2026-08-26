import Image from '@tiptap/extension-image';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { ImageBlockView } from '../../components/ImageBlockView';

export const ImageBlock = Image.extend({
  name: 'image',
  inline: false,
  group: 'block',
  draggable: true,
  addStorage() {
    return { notePath: '' };
  },
  addAttributes() {
    return {
      src: { default: '' },
      alt: { default: '' },
      width: { default: null },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ImageBlockView);
  },
}).configure({
  inline: false,
  allowBase64: false,
});
