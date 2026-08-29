import type { JSONContent } from '@tiptap/react';
import { useEditor, EditorContent } from '@tiptap/react';
import { useEffect } from 'react';
import { getImageBlockStorage } from '../editor/insertImage';
import { extensions } from '../editor/schema';
import { useEditorFindReveal } from '../hooks/useEditorFindReveal';

interface PreviewViewProps {
  content: JSONContent;
  notePath: string;
  findQuery?: string | null;
  findIndex?: number;
  onFindMatchCount?: (count: number) => void;
}

export function PreviewView({
  content,
  notePath,
  findQuery = null,
  findIndex = 0,
  onFindMatchCount,
}: PreviewViewProps) {
  const editor = useEditor({
    extensions,
    content,
    editable: false,
    editorProps: {
      attributes: {
        class: 'outline-none',
      },
    },
  });
  useEditorFindReveal(editor, findQuery, findIndex, onFindMatchCount ?? (() => undefined));

  useEffect(() => {
    if (!editor) {
      return;
    }
    const storage = getImageBlockStorage(editor);
    if (!storage) {
      return;
    }
    storage.notePath = notePath;
  }, [editor, notePath]);

  if (!editor) {
    return null;
  }

  return <EditorContent editor={editor} className="leafio-editor" />;
}
