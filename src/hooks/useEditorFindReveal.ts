import { useEffect, useRef } from 'react';
import type { Editor } from '@tiptap/core';
import { findMatchesInTextNodes, type FindableTextNode } from '../lib/document-find';

export function useEditorFindReveal(
  editor: Editor | null,
  query: string | null,
  index: number,
  onMatchCount: (count: number) => void,
) {
  const onMatchCountRef = useRef(onMatchCount);
  onMatchCountRef.current = onMatchCount;

  useEffect(() => {
    if (!editor || !query?.trim()) {
      onMatchCountRef.current(0);
      return;
    }

    const nodes: FindableTextNode[] = [];
    editor.state.doc.descendants((node, pos) => {
      if (node.isText && node.text) {
        nodes.push({ text: node.text, pos });
      }
    });
    const matches = findMatchesInTextNodes(nodes, query);
    onMatchCountRef.current(matches.length);
    const match = matches[index] ?? matches[0];
    if (!match) {
      return;
    }
    editor.chain().setTextSelection({ from: match.from, to: match.to }).scrollIntoView().run();
  }, [editor, query, index]);
}
