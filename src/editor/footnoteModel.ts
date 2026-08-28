import type { JSONContent } from '@tiptap/react';

export const FOOTNOTE_REF = 'footnoteReference';
export const FOOTNOTE_DEF = 'footnoteDefinition';
export const FOOTNOTES = 'footnotes';

export function walkJson(node: JSONContent, visit: (n: JSONContent) => void): void {
  visit(node);
  for (const child of node.content ?? []) {
    walkJson(child, visit);
  }
}

export function nextIdentifier(used: Iterable<string>): string {
  const set = new Set(used);
  let n = 1;
  while (set.has(String(n))) {
    n += 1;
  }
  return String(n);
}

export function usedIdentifiers(doc: JSONContent): Set<string> {
  const used = new Set<string>();
  walkJson(doc, (node) => {
    if (node.type !== FOOTNOTE_REF && node.type !== FOOTNOTE_DEF) {
      return;
    }
    const id = String(node.attrs?.identifier ?? '');
    if (id) {
      used.add(id);
    }
  });
  return used;
}

export function displayNumbers(doc: JSONContent): Record<string, number> {
  const map: Record<string, number> = {};
  let next = 1;
  walkJson(doc, (node) => {
    if (node.type !== FOOTNOTE_REF) {
      return;
    }
    const id = String(node.attrs?.identifier ?? '');
    if (!id || map[id] !== undefined) {
      return;
    }
    map[id] = next;
    next += 1;
  });
  return map;
}

export function attachFootnotes(body: JSONContent[], definitions: JSONContent[]): JSONContent[] {
  if (definitions.length === 0) {
    return body;
  }
  return [...body, { type: FOOTNOTES, content: definitions }];
}

function collectDefinitions(doc: JSONContent): JSONContent[] {
  const defs: JSONContent[] = [];
  walkJson(doc, (node) => {
    if (node.type === FOOTNOTE_DEF) {
      defs.push(node);
    }
  });
  return defs;
}

export function orderDefinitionsForSerialize(doc: JSONContent): JSONContent[] {
  const defs = collectDefinitions(doc);
  const byId = new Map<string, JSONContent>();
  for (const definition of defs) {
    const id = String(definition.attrs?.identifier ?? '');
    if (id && !byId.has(id)) {
      byId.set(id, definition);
    }
  }

  const ordered: JSONContent[] = [];
  const seen = new Set<string>();
  walkJson(doc, (node) => {
    if (node.type !== FOOTNOTE_REF) {
      return;
    }
    const id = String(node.attrs?.identifier ?? '');
    if (!id || seen.has(id)) {
      return;
    }
    seen.add(id);
    const definition = byId.get(id);
    if (definition) {
      ordered.push(definition);
    }
  });

  for (const definition of defs) {
    const id = String(definition.attrs?.identifier ?? '');
    if (id && !seen.has(id)) {
      seen.add(id);
      ordered.push(definition);
    }
  }

  return ordered;
}

export function definitionPlainText(definition: JSONContent): string {
  const parts: string[] = [];
  walkJson(definition, (node) => {
    if (node.type === 'text' && node.text) {
      parts.push(node.text);
    }
  });
  return parts.join('');
}
