import type { JSONContent } from '@tiptap/react';
import { useEditor, EditorContent } from '@tiptap/react';
import { extensions } from '../editor/schema';

interface PreviewViewProps {
  content: JSONContent;
}

export function PreviewView({ content }: PreviewViewProps) {
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

  if (!editor) {
    return null;
  }

  return <EditorContent editor={editor} className="leafio-editor" />;
}
