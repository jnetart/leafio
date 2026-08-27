import type { JSONContent } from '@tiptap/react';
import { useEditor, EditorContent } from '@tiptap/react';
import { useEffect } from 'react';
import { getImageBlockStorage } from '../editor/insertImage';
import { extensions } from '../editor/schema';

interface PreviewViewProps {
  content: JSONContent;
  notePath: string;
}

export function PreviewView({ content, notePath }: PreviewViewProps) {
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
