import { useEffect } from 'react';
import { EditorContent } from '@tiptap/react';
import type { JSONContent } from '@tiptap/react';
import { useLeafioEditor } from '../editor/schema';
import type { EditorTabWidth } from '../lib/preferences';
import { LEAFIO_MENU_EDIT_EVENT, type LeafioMenuEditAction } from '../lib/menu-edit';
import { useEditorContextMenuOpen } from '../lib/editor-context-menu';
import { EditorContextMenu } from './EditorContextMenu';
import { FloatingToolbar } from './FloatingToolbar';
import { TableBubbleMenu } from './TableBubbleMenu';

interface EditorProps {
  content: JSONContent;
  onChange: (doc: JSONContent) => void;
  tabWidth: EditorTabWidth;
}

export function Editor({ content, onChange, tabWidth }: EditorProps) {
  const editor = useLeafioEditor(content, true, onChange);
  const { contextMenuOpen, onMenuOpenChange } = useEditorContextMenuOpen();

  useEffect(() => {
    if (!editor) {
      return;
    }
    editor.storage.codeBlockTab.tabSize = tabWidth;
  }, [editor, tabWidth]);

  useEffect(() => {
    if (!editor) {
      return;
    }
    const onMenuEdit = (event: Event) => {
      const action = (event as CustomEvent<{ action: LeafioMenuEditAction }>).detail?.action;
      if (action === 'undo') {
        editor.chain().focus().undo().run();
      } else if (action === 'redo') {
        editor.chain().focus().redo().run();
      } else if (action === 'cut') {
        editor.commands.focus();
        document.execCommand('cut');
      } else if (action === 'copy') {
        editor.commands.focus();
        document.execCommand('copy');
      } else if (action === 'paste') {
        editor.commands.focus();
        document.execCommand('paste');
      } else if (action === 'select-all') {
        editor.chain().focus().selectAll().run();
      }
    };
    window.addEventListener(LEAFIO_MENU_EDIT_EVENT, onMenuEdit);
    return () => window.removeEventListener(LEAFIO_MENU_EDIT_EVENT, onMenuEdit);
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="relative">
      <FloatingToolbar editor={editor} />
      <TableBubbleMenu editor={editor} suppressed={contextMenuOpen} />
      <EditorContextMenu editor={editor} onMenuOpenChange={onMenuOpenChange} />
      <EditorContent editor={editor} className="leafio-editor" />
    </div>
  );
}
