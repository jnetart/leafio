import { NodeViewContent, NodeViewWrapper } from '@tiptap/react';
import type { ReactNodeViewProps } from '@tiptap/react';
import { useRef, useState } from 'react';
import { getCodeBlockLanguageLabel } from '../editor/codeBlockLanguages';
import { CodeBlockLanguageMenu, CodeBlockLanguageTrigger } from './CodeBlockLanguageMenu';

export function CodeBlockView({ node, updateAttributes, editor, selected }: ReactNodeViewProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const language = node.attrs.language as string | null | undefined;
  const label = getCodeBlockLanguageLabel(language);
  const editable = editor.isEditable;
  const languageClass = language ? `language-${language}` : undefined;
  const showBadge = Boolean(language) || editable;

  return (
    <NodeViewWrapper className="leafio-code-block">
      <div
        className={`leafio-code-block-shell${selected ? ' leafio-code-block-shell--selected' : ''}${editable ? ' leafio-code-block-shell--editable' : ''}`}
      >
        {showBadge ? (
          <div className="leafio-code-block-chrome" contentEditable={false}>
            {editable ? (
              <>
                <CodeBlockLanguageTrigger
                  label={label}
                  open={menuOpen}
                  triggerRef={triggerRef}
                  onToggle={() => setMenuOpen((open) => !open)}
                />
                <CodeBlockLanguageMenu
                  open={menuOpen}
                  anchorRef={triggerRef}
                  activeLanguage={language ?? null}
                  onSelect={(nextLanguage) => updateAttributes({ language: nextLanguage })}
                  onClose={() => setMenuOpen(false)}
                />
              </>
            ) : (
              <span className="leafio-code-block-lang-badge">{label}</span>
            )}
          </div>
        ) : null}
        <pre className="leafio-code-block-pre">
          <NodeViewContent as="code" className={languageClass} spellCheck={false} />
        </pre>
      </div>
    </NodeViewWrapper>
  );
}
