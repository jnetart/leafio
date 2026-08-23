import { useEditor, type Editor, type JSONContent } from '@tiptap/react';
import CodeBlock from '@tiptap/extension-code-block';
import Heading from '@tiptap/extension-heading';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import StarterKit from '@tiptap/starter-kit';
import Table from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import { SlashCommandExtension } from './extensions/SlashCommand';

export const extensions = [
  StarterKit.configure({
    heading: false,
    codeBlock: false,
  }),
  Heading.configure({ levels: [1, 2, 3, 4] }),
  CodeBlock,
  TaskList,
  TaskItem.configure({ nested: true }),
  Table.configure({
    resizable: false,
  }),
  TableRow,
  TableHeader,
  TableCell,
  Link.configure({
    openOnClick: false,
    autolink: true,
    linkOnPaste: true,
  }),
  Highlight.configure({
    multicolor: false,
  }),
  SlashCommandExtension,
];

export const useLeafioEditor = (
  content: JSONContent,
  editable = true,
  onUpdate?: (doc: JSONContent) => void,
): Editor | null =>
  useEditor({
    extensions,
    content,
    editable,
    onUpdate: ({ editor }) => onUpdate?.(editor.getJSON()),
    editorProps: {
      attributes: {
        class: 'outline-none min-h-[320px]',
        autocorrect: 'off',
        autocapitalize: 'off',
        spellcheck: 'false',
      },
    },
  });
