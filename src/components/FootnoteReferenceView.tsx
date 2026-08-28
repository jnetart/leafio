import { NodeViewWrapper } from '@tiptap/react';
import type { ReactNodeViewProps } from '@tiptap/react';
import type { JSONContent } from '@tiptap/react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { jumpToDefinition, rememberClickedRef } from '../editor/footnoteActions';
import {
  definitionPlainText,
  displayNumbers,
  FOOTNOTE_DEF,
  walkJson,
} from '../editor/footnoteModel';
import { useI18n } from '../hooks/useI18n';
import { usePreferences } from '../hooks/usePreferences';

function definitionFor(doc: JSONContent, identifier: string): JSONContent | null {
  let found: JSONContent | null = null;
  walkJson(doc, (node) => {
    if (node.type === FOOTNOTE_DEF && String(node.attrs?.identifier ?? '') === identifier) {
      found = node;
    }
  });
  return found;
}

export function FootnoteReferenceView({ node, editor, getPos }: ReactNodeViewProps) {
  const identifier = String(node.attrs.identifier ?? '');
  const { language } = usePreferences();
  const { t } = useI18n(language);
  const json = editor.getJSON();
  const number = displayNumbers(json)[identifier];
  const def = definitionFor(json, identifier);
  const dangling = !def;
  const previewText = dangling ? t('footnote.missing') : definitionPlainText(def);
  const [slip, setSlip] = useState<{ top: number; left: number } | null>(null);
  const timer = useRef(0);
  const wrapRef = useRef<HTMLButtonElement>(null);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const showSlip = () => {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }
    if (!dangling && !previewText.trim()) {
      return;
    }
    setSlip({ top: rect.top, left: rect.left + rect.width / 2 });
  };

  return (
    <NodeViewWrapper
      as="span"
      className={`leafio-fn-ref${dangling ? ' leafio-fn-ref--dangling' : ''}`}
      data-footnote-ref={identifier}
    >
      <button
        ref={wrapRef}
        type="button"
        className="leafio-fn-ref-btn"
        aria-label={number ? String(number) : identifier}
        onMouseDown={(event) => event.preventDefault()}
        onMouseEnter={() => {
          timer.current = window.setTimeout(showSlip, 400);
        }}
        onMouseLeave={() => {
          window.clearTimeout(timer.current);
          setSlip(null);
        }}
        onClick={() => {
          const pos = typeof getPos === 'function' ? getPos() : null;
          if (typeof pos === 'number') {
            rememberClickedRef(editor, identifier, pos);
          }
          if (!dangling) {
            jumpToDefinition(editor, identifier);
          }
        }}
      >
        {number ?? '?'}
      </button>
      {slip
        ? createPortal(
            <div
              className="leafio-fn-preview"
              style={{ top: slip.top, left: slip.left }}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                if (!dangling) {
                  jumpToDefinition(editor, identifier);
                }
              }}
            >
              {previewText}
            </div>,
            document.body,
          )
        : null}
    </NodeViewWrapper>
  );
}
