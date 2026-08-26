export interface ParsedSearchQuery {
  terms: string[];
  tags: string[];
  paths: string[];
}

export type HighlightPart = {
  text: string;
  hit: boolean;
};

export function parseSearchQuery(input: string): ParsedSearchQuery {
  const terms: string[] = [];
  const tags: string[] = [];
  const paths: string[] = [];

  for (const token of tokenizeSearchQuery(input)) {
    const filter = splitFilter(token);
    if (filter) {
      if (!filter.value) {
        continue;
      }
      if (filter.kind === 'tag') {
        tags.push(stripTagSigil(filter.value));
      } else {
        paths.push(filter.value);
      }
      continue;
    }

    if (token.startsWith('#') && token.length > 1 && token[1] !== '#') {
      tags.push(stripTagSigil(token.slice(1)));
      continue;
    }

    terms.push(token);
  }

  return { terms, tags, paths };
}

export function isSearchQueryEmpty(query: ParsedSearchQuery): boolean {
  return query.terms.length === 0 && query.tags.length === 0 && query.paths.length === 0;
}

export function searchNeedles(query: ParsedSearchQuery): string[] {
  return [...query.terms, ...query.tags, ...query.paths];
}

export function highlightParts(text: string, needles: string[]): HighlightPart[] {
  if (!text) {
    return [];
  }

  const cleaned = needles.map((needle) => needle.trim()).filter((needle) => needle.length > 0);
  if (cleaned.length === 0) {
    return [{ text, hit: false }];
  }

  const lower = text.toLowerCase();
  const parts: HighlightPart[] = [];
  let cursor = 0;

  while (cursor < text.length) {
    let bestStart = -1;
    let bestEnd = -1;

    for (const needle of cleaned) {
      const index = lower.indexOf(needle.toLowerCase(), cursor);
      if (index < 0) {
        continue;
      }
      const end = index + needle.length;
      const better =
        bestStart < 0 ||
        index < bestStart ||
        (index === bestStart && end > bestEnd);
      if (better) {
        bestStart = index;
        bestEnd = end;
      }
    }

    if (bestStart < 0) {
      parts.push({ text: text.slice(cursor), hit: false });
      break;
    }

    if (bestStart > cursor) {
      parts.push({ text: text.slice(cursor, bestStart), hit: false });
    }
    parts.push({ text: text.slice(bestStart, bestEnd), hit: true });
    cursor = bestEnd;
  }

  return mergeHighlightParts(parts);
}

export function cycleSearchIndex(current: number, length: number, delta: number): number {
  if (length <= 0) {
    return 0;
  }
  return (current + delta + length) % length;
}

function tokenizeSearchQuery(input: string): string[] {
  const tokens: string[] = [];
  const source = input.trim();
  let index = 0;

  while (index < source.length) {
    while (index < source.length && isSearchSpace(source[index])) {
      index += 1;
    }
    if (index >= source.length) {
      break;
    }

    const quote = source[index];
    if (quote === '"' || quote === "'") {
      const end = source.indexOf(quote, index + 1);
      if (end < 0) {
        tokens.push(source.slice(index + 1).trim());
        break;
      }
      tokens.push(source.slice(index + 1, end));
      index = end + 1;
      continue;
    }

    let end = index;
    while (end < source.length && !isSearchSpace(source[end])) {
      const char = source[end];
      if (char === '"' || char === "'") {
        const prefix = source.slice(index, end);
        if (/^(tag|path):$/i.test(prefix)) {
          const closing = source.indexOf(char, end + 1);
          if (closing >= 0) {
            tokens.push(`${prefix}${source.slice(end, closing + 1)}`);
            index = closing + 1;
            end = index;
            break;
          }
        }
      }
      end += 1;
    }

    if (end > index) {
      tokens.push(source.slice(index, end));
      index = end;
    }
  }

  return tokens.filter((token) => token.length > 0);
}

function splitFilter(token: string): { kind: 'tag' | 'path'; value: string } | null {
  const match = /^(tag|path):(.*)$/i.exec(token);
  if (!match) {
    return null;
  }
  return {
    kind: match[1].toLowerCase() as 'tag' | 'path',
    value: unwrapQuotes(match[2]).trim(),
  };
}

function unwrapQuotes(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"') && value.length >= 2) ||
    (value.startsWith("'") && value.endsWith("'") && value.length >= 2)
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function stripTagSigil(value: string): string {
  return value.replace(/^#+/, '');
}

function isSearchSpace(char: string): boolean {
  return char === ' ' || char === '\t' || char === '\n' || char === '\r';
}

function mergeHighlightParts(parts: HighlightPart[]): HighlightPart[] {
  const merged: HighlightPart[] = [];
  for (const part of parts) {
    if (!part.text) {
      continue;
    }
    const last = merged[merged.length - 1];
    if (last && last.hit === part.hit) {
      last.text += part.text;
    } else {
      merged.push({ ...part });
    }
  }
  return merged;
}
