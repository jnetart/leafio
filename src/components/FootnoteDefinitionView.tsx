import { NodeViewContent, NodeViewWrapper } from '@tiptap/react';
import type { ReactNodeViewProps } from '@tiptap/react';
import { countRefs, definitionPlainText, displayNumbers } from '../editor/footnoteModel';
import { jumpToReference } from '../editor/footnoteActions';
import { useI18n } from '../hooks/useI18n';
import { usePreferences } from '../hooks/usePreferences';

export function FootnoteDefinitionView({ node, editor }: ReactNodeViewProps) {
  const identifier = String(node.attrs.identifier ?? '');
  const { language } = usePreferences();
  const { t } = useI18n(language);
  const json = editor.getJSON();
  const number = displayNumbers(json)[identifier];
  const orphan = countRefs(json, identifier) === 0;
  const text = definitionPlainText(node.toJSON());
  const className = `leafio-fn-def${orphan ? ' leafio-fn-def--orphan' : ''}`;

  return (
    <NodeViewWrapper as="div" className={className} data-footnote-def={identifier}>
      <button
        type="button"
        className="leafio-fn-def-mark"
        aria-label={number ? String(number) : identifier}
        contentEditable={false}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => jumpToReference(editor, identifier)}
      >
        {number ?? '?'}
      </button>
      <div className="leafio-fn-def-body">
        <NodeViewContent />
        {!text ? (
          <span className="leafio-fn-def-placeholder" contentEditable={false}>
            {t('footnote.placeholder')}
          </span>
        ) : null}
      </div>
    </NodeViewWrapper>
  );
}
