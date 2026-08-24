import { describe, expect, it } from 'vitest';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { posAfterDocChild } from '../src/editor/extensions/blockGap';

function mockDoc(children: Array<{ nodeSize: number }>): ProseMirrorNode {
  return {
    childCount: children.length,
    child(index: number) {
      return children[index]!;
    },
    get content() {
      return { size: children.reduce((sum, child) => sum + child.nodeSize, 0) };
    },
  } as unknown as ProseMirrorNode;
}

describe('block gap helpers', () => {
  it('computes insert position after a doc child', () => {
    const doc = mockDoc([{ nodeSize: 10 }, { nodeSize: 8 }, { nodeSize: 6 }]);
    expect(posAfterDocChild(doc, 0)).toBe(10);
    expect(posAfterDocChild(doc, 1)).toBe(18);
    expect(posAfterDocChild(doc, 2)).toBe(24);
  });
});
