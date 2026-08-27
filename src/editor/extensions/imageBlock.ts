import Image from '@tiptap/extension-image';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { ImageBlockView } from '../../components/ImageBlockView';
import type { ImageNoticeKey } from '../insertImage';

declare module '@tiptap/core' {
  interface Storage {
    image: {
      notePath: string;
      compress: boolean;
      maxEdge: number;
      onNotice?: (key: ImageNoticeKey) => void;
    };
  }
}

export const ImageBlock = Image.extend({
  name: 'image',
  inline: false,
  group: 'block',
  draggable: true,
  addStorage() {
    return {
      notePath: '',
      compress: false,
      maxEdge: 1920,
      onNotice: undefined as ((key: string) => void) | undefined,
    };
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
