export type FindRange = {
  from: number;
  to: number;
};

export type FindableTextNode = {
  text: string;
  pos: number;
};

export function findMatches(haystack: string, query: string): FindRange[] {
  const needle = query.trim();
  if (!needle) {
    return [];
  }

  const lower = haystack.toLowerCase();
  const target = needle.toLowerCase();
  const matches: FindRange[] = [];
  let from = 0;

  while (from < lower.length) {
    const index = lower.indexOf(target, from);
    if (index < 0) {
      break;
    }
    matches.push({ from: index, to: index + needle.length });
    from = index + Math.max(needle.length, 1);
  }

  return matches;
}

export function findMatchesInTextNodes(nodes: FindableTextNode[], query: string): FindRange[] {
  const needle = query.trim();
  if (!needle) {
    return [];
  }

  const matches: FindRange[] = [];
  for (const node of nodes) {
    for (const match of findMatches(node.text, needle)) {
      matches.push({ from: node.pos + match.from, to: node.pos + match.to });
    }
  }
  return matches;
}

export function formatFindCount(index: number, total: number): { current: number; total: number } {
  if (total <= 0) {
    return { current: 0, total: 0 };
  }
  return { current: index + 1, total };
}
