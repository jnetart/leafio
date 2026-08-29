import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { tabStringForSize } from '../editor/codeBlockIndent';
import type { EditorTabWidth } from '../lib/preferences';
import { findMatches } from '../lib/document-find';
import { LEAFIO_MENU_EDIT_EVENT, type LeafioMenuEditAction } from '../lib/menu-edit';

interface SourceViewProps {
  value: string;
  onChange: (value: string) => void;
  tabWidth: EditorTabWidth;
  findQuery?: string | null;
  findIndex?: number;
  onFindMatchCount?: (count: number) => void;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function highlightLine(line: string, context: { inFrontmatter: boolean }): string {
  const escaped = escapeHtml(line);

  if (line.trim() === '---') {
    return `<span class="source-token-heading">${escaped}</span>`;
  }

  if (context.inFrontmatter) {
    const yamlMatch = line.match(/^(\s*)([a-zA-Z_][\w-]*)(\s*:\s*)(.*)$/);
    if (yamlMatch) {
      const [, indent, key, sep, rest] = yamlMatch;
      const highlightedRest = rest.replace(
        /("[^"]*"|'[^']*'|\[[^\]]*\])/g,
        '<span class="source-token-string">$1</span>',
      );
      return `${indent}<span class="source-token-key">${key}</span>${sep}${highlightedRest}`;
    }
    return escaped;
  }

  const headingMatch = line.match(/^(#{1,6}\s+)(.*)$/);
  if (headingMatch) {
    return `<span class="source-token-heading">${escapeHtml(headingMatch[1])}${escapeHtml(headingMatch[2])}</span>`;
  }

  return escaped;
}

function highlightMarkdown(text: string): string {
  const lines = text.split('\n');
  let inFrontmatter = false;
  let frontmatterDone = false;

  return lines
    .map((line) => {
      const context = { inFrontmatter: inFrontmatter && !frontmatterDone };

      if (!frontmatterDone && line.trim() === '---') {
        if (!inFrontmatter) {
          inFrontmatter = true;
        } else {
          frontmatterDone = true;
          inFrontmatter = false;
        }
      }

      return highlightLine(line, context);
    })
    .join('\n');
}

export function SourceView({
  value,
  onChange,
  tabWidth,
  findQuery = null,
  findIndex = 0,
  onFindMatchCount,
}: SourceViewProps) {
  const [draft, setDraft] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (!findQuery?.trim()) {
      onFindMatchCount?.(0);
      return;
    }
    const matches = findMatches(draft, findQuery);
    onFindMatchCount?.(matches.length);
    const match = matches[findIndex] ?? matches[0];
    const textarea = textareaRef.current;
    if (!textarea || !match) {
      return;
    }
    textarea.focus();
    textarea.setSelectionRange(match.from, match.to);
    const lineHeight = Number.parseFloat(getComputedStyle(textarea).lineHeight) || 24;
    const line = draft.slice(0, match.from).split('\n').length - 1;
    textarea.scrollTop = Math.max(0, line * lineHeight - textarea.clientHeight / 3);
    textarea.dispatchEvent(new Event('scroll'));
  }, [draft, findQuery, findIndex, onFindMatchCount]);

  useEffect(() => {
    const onMenuEdit = (event: Event) => {
      const textarea = textareaRef.current;
      if (!textarea || !document.activeElement?.closest('.source-editor')) {
        return;
      }
      const action = (event as CustomEvent<{ action: LeafioMenuEditAction }>).detail?.action;
      textarea.focus();
      if (action === 'undo') {
        document.execCommand('undo');
      } else if (action === 'redo') {
        document.execCommand('redo');
      } else if (action === 'cut') {
        document.execCommand('cut');
      } else if (action === 'copy') {
        document.execCommand('copy');
      } else if (action === 'paste') {
        document.execCommand('paste');
      } else if (action === 'select-all') {
        document.execCommand('selectAll');
      }
    };
    window.addEventListener(LEAFIO_MENU_EDIT_EVENT, onMenuEdit);
    return () => window.removeEventListener(LEAFIO_MENU_EDIT_EVENT, onMenuEdit);
  }, []);

  const lineCount = useMemo(() => {
    if (!draft) {
      return 1;
    }
    return draft.split('\n').length;
  }, [draft]);

  const highlightedHtml = useMemo(() => highlightMarkdown(draft), [draft]);

  const syncScroll = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }
    const scrollTop = textarea.scrollTop;
    const scrollLeft = textarea.scrollLeft;
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = scrollTop;
    }
    if (backdropRef.current) {
      backdropRef.current.scrollTop = scrollTop;
      backdropRef.current.scrollLeft = scrollLeft;
    }
  }, []);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key !== 'Tab') {
        return;
      }

      event.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) {
        return;
      }

      const tab = tabStringForSize(tabWidth);
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const nextValue = `${draft.slice(0, start)}${tab}${draft.slice(end)}`;
      setDraft(nextValue);

      const cursor = start + tab.length;
      window.requestAnimationFrame(() => {
        textarea.selectionStart = cursor;
        textarea.selectionEnd = cursor;
      });
    },
    [draft, tabWidth],
  );

  return (
    <div className="source-editor">
      <div ref={lineNumbersRef} className="source-line-numbers" aria-hidden="true">
        {Array.from({ length: lineCount }, (_, index) => (
          <div key={index + 1} className="source-line-number">
            {index + 1}
          </div>
        ))}
      </div>
      <div className="source-lines">
        <pre
          ref={backdropRef}
          className="source-backdrop"
          dangerouslySetInnerHTML={{ __html: highlightedHtml }}
        />
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => onChange(draft)}
          onScroll={syncScroll}
          className="source-textarea"
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          wrap="off"
        />
      </div>
    </div>
  );
}
