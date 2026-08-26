import { useEditor, type Editor, type JSONContent } from '@tiptap/react';
import Heading from '@tiptap/extension-heading';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import StarterKit from '@tiptap/starter-kit';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import { TableCellWithBackground, TableHeaderWithBackground } from './extensions/tableCellBackground';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import { BlockGap } from './extensions/blockGap';
import { CodeBlockTab } from './extensions/codeBlockTab';
import { CodeBlockWithChrome } from './extensions/codeBlockWithChrome';
import { PanelBlockBoundary } from './extensions/panelBlockBoundary';
import { SlashCommandExtension } from './extensions/SlashCommand';
import { TrailingNode } from './extensions/trailingNode';
import { ImageBlock } from './extensions/imageBlock';

export const extensions = [
  StarterKit.configure({
    heading: false,
    codeBlock: false,
  }),
  Heading.configure({ levels: [1, 2, 3, 4] }),
  CodeBlockWithChrome,
  CodeBlockTab,
  TaskList,
  TaskItem.configure({ nested: true }),
  Table.configure({
    resizable: false,
  }),
  TableRow,
  TableHeaderWithBackground,
  TableCellWithBackground,
  Link.configure({
    openOnClick: false,
    autolink: true,
    linkOnPaste: true,
  }),
  Highlight.configure({
    multicolor: false,
  }),
  SlashCommandExtension,
  BlockGap,
  PanelBlockBoundary,
  TrailingNode,
  ImageBlock,
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
