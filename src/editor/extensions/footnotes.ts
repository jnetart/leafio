import { Node, mergeAttributes } from '@tiptap/core';
import { Fragment } from '@tiptap/pm/model';
import type { Node as ProseMirrorNode, NodeType } from '@tiptap/pm/model';
import { Plugin, PluginKey } from '@tiptap/pm/state';

function refCounts(doc: ProseMirrorNode): Map<string, number> {
  const counts = new Map<string, number>();
  doc.descendants((node) => {
    if (node.type.name === 'footnoteReference') {
      const id = String(node.attrs.identifier ?? '');
      if (id) {
        counts.set(id, (counts.get(id) ?? 0) + 1);
      }
    }
  });
  return counts;
}

function droppedIdentifiers(oldDoc: ProseMirrorNode, newDoc: ProseMirrorNode): Set<string> {
  const dropped = new Set<string>();
  const oldCounts = refCounts(oldDoc);
  const newCounts = refCounts(newDoc);
  for (const [id, count] of oldCounts) {
    if (count > 0 && (newCounts.get(id) ?? 0) === 0) {
      dropped.add(id);
    }
  }
  return dropped;
}

function desiredChildren(
  oldDoc: ProseMirrorNode,
  newDoc: ProseMirrorNode,
  notesType: NodeType,
): ProseMirrorNode[] | null {
  const dropped = droppedIdentifiers(oldDoc, newDoc);
  const body: ProseMirrorNode[] = [];
  const defs: ProseMirrorNode[] = [];
  const seen = new Set<string>();

  newDoc.forEach((child) => {
    if (child.type === notesType) {
      child.forEach((def) => {
        const id = String(def.attrs.identifier ?? '');
        if (!id || dropped.has(id) || seen.has(id)) {
          return;
        }
        seen.add(id);
        defs.push(def);
      });
      return;
    }
    body.push(child);
  });

  const next = defs.length > 0 ? [...body, notesType.create(null, defs)] : body;

  if (isAlreadyDesired(newDoc, body, defs, notesType)) {
    return null;
  }
  return next;
}

function isAlreadyDesired(
  doc: ProseMirrorNode,
  body: ProseMirrorNode[],
  defs: ProseMirrorNode[],
  notesType: NodeType,
): boolean {
  if (defs.length === 0) {
    return doc.childCount === body.length && body.every((node, index) => doc.child(index) === node);
  }
  if (doc.lastChild?.type !== notesType || doc.childCount !== body.length + 1) {
    return false;
  }
  if (!body.every((node, index) => doc.child(index) === node)) {
    return false;
  }
  const notes = doc.lastChild;
  if (notes.childCount !== defs.length) {
    return false;
  }
  return defs.every((def, index) => notes.child(index) === def);
}

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

  addProseMirrorPlugins() {
    const stickyKey = new PluginKey('leafio-footnotes-sticky');

    return [
      new Plugin({
        key: stickyKey,
        appendTransaction: (transactions, oldState, newState) => {
          if (!transactions.some((transaction) => transaction.docChanged)) {
            return;
          }
          const notesType = newState.schema.nodes.footnotes;
          if (!notesType) {
            return;
          }
          const next = desiredChildren(oldState.doc, newState.doc, notesType);
          if (!next) {
            return;
          }
          return newState.tr.replaceWith(0, newState.doc.content.size, Fragment.from(next));
        },
      }),
    ];
  },
});
