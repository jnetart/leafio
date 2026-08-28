import { NodeViewContent, NodeViewWrapper } from '@tiptap/react';

export function FootnotesView() {
  return (
    <NodeViewWrapper as="section" className="leafio-footnotes" data-footnotes="">
      <NodeViewContent className="leafio-footnotes-list" />
    </NodeViewWrapper>
  );
}
