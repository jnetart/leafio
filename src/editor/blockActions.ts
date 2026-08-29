import type { Editor } from '@tiptap/core';
import type { MessageKey } from '../lib/i18n';
import { insertFootnote } from './footnoteActions';
import { insertImagesFromPicker } from './insertImage';

export type SlashRange = { from: number; to: number };

export type BlockActionSection = 'convert' | 'list' | 'insert';

export interface EditorBlockAction {
  id: string;
  titleKey: MessageKey;
  keywords: string[];
  section: BlockActionSection;
  active?: (editor: Editor) => boolean;
  run: (editor: Editor, range?: SlashRange) => void;
}

export const BLOCK_ACTION_SECTION_KEYS: Record<BlockActionSection, MessageKey> = {
  convert: 'block.section.convert',
  list: 'block.section.list',
  insert: 'block.section.insert',
};

function runWithOptionalRange(
  editor: Editor,
  range: SlashRange | undefined,
  apply: (chain: ReturnType<Editor['chain']>) => ReturnType<Editor['chain']>,
) {
  let chain = editor.chain().focus();
  if (range) {
    chain = chain.deleteRange(range);
  }
  apply(chain).run();
}

export const EDITOR_BLOCK_ACTIONS: EditorBlockAction[] = [
  {
    id: 'paragraph',
    titleKey: 'block.paragraph',
    keywords: ['paragraph', 'text', '段落', '正文', 'p'],
    section: 'convert',
    active: (editor) =>
      editor.isActive('paragraph') &&
      !editor.isActive('heading') &&
      !editor.isActive('blockquote') &&
      !editor.isActive('codeBlock'),
    run: (editor, range) => {
      runWithOptionalRange(editor, range, (chain) => chain.setParagraph());
    },
  },
  {
    id: 'heading-1',
    titleKey: 'block.heading1',
    keywords: ['heading', 'h1', 'title', '一级标题'],
    section: 'convert',
    active: (editor) => editor.isActive('heading', { level: 1 }),
    run: (editor, range) => {
      runWithOptionalRange(editor, range, (chain) => chain.setHeading({ level: 1 }));
    },
  },
  {
    id: 'heading-2',
    titleKey: 'block.heading2',
    keywords: ['heading', 'h2', '二级标题'],
    section: 'convert',
    active: (editor) => editor.isActive('heading', { level: 2 }),
    run: (editor, range) => {
      runWithOptionalRange(editor, range, (chain) => chain.setHeading({ level: 2 }));
    },
  },
  {
    id: 'heading-3',
    titleKey: 'block.heading3',
    keywords: ['heading', 'h3', '三级标题'],
    section: 'convert',
    active: (editor) => editor.isActive('heading', { level: 3 }),
    run: (editor, range) => {
      runWithOptionalRange(editor, range, (chain) => chain.setHeading({ level: 3 }));
    },
  },
  {
    id: 'heading-4',
    titleKey: 'block.heading4',
    keywords: ['heading', 'h4', '四级标题'],
    section: 'convert',
    active: (editor) => editor.isActive('heading', { level: 4 }),
    run: (editor, range) => {
      runWithOptionalRange(editor, range, (chain) => chain.setHeading({ level: 4 }));
    },
  },
  {
    id: 'blockquote',
    titleKey: 'block.blockquote',
    keywords: ['quote', 'blockquote', '引用块'],
    section: 'convert',
    active: (editor) => editor.isActive('blockquote'),
    run: (editor, range) => {
      runWithOptionalRange(editor, range, (chain) => chain.toggleBlockquote());
    },
  },
  {
    id: 'bullet-list',
    titleKey: 'block.bulletList',
    keywords: ['bullet', 'ul', 'list', '无序'],
    section: 'list',
    active: (editor) => editor.isActive('bulletList'),
    run: (editor, range) => {
      runWithOptionalRange(editor, range, (chain) => chain.toggleBulletList());
    },
  },
  {
    id: 'ordered-list',
    titleKey: 'block.orderedList',
    keywords: ['ordered', 'ol', 'number', '有序', '编号'],
    section: 'list',
    active: (editor) => editor.isActive('orderedList'),
    run: (editor, range) => {
      runWithOptionalRange(editor, range, (chain) => chain.toggleOrderedList());
    },
  },
  {
    id: 'task-list',
    titleKey: 'block.taskList',
    keywords: ['task', 'todo', 'checkbox', '待办', '任务'],
    section: 'list',
    active: (editor) => editor.isActive('taskList'),
    run: (editor, range) => {
      runWithOptionalRange(editor, range, (chain) => chain.toggleTaskList());
    },
  },
  {
    id: 'table',
    titleKey: 'block.table',
    keywords: ['table', 'grid', '表格'],
    section: 'insert',
    active: (editor) => editor.isActive('table'),
    run: (editor, range) => {
      runWithOptionalRange(editor, range, (chain) =>
        chain.insertTable({ rows: 3, cols: 3, withHeaderRow: true }),
      );
    },
  },
  {
    id: 'footnote',
    titleKey: 'block.footnote',
    keywords: ['footnote', '脚注', 'fn', 'note'],
    section: 'insert',
    active: (editor) => editor.isActive('footnoteReference') || editor.isActive('footnoteDefinition'),
    run: (editor, range) => {
      insertFootnote(editor, range);
    },
  },
  {
    id: 'code-block',
    titleKey: 'block.codeBlock',
    keywords: ['code', 'snippet', '代码'],
    section: 'insert',
    active: (editor) => editor.isActive('codeBlock'),
    run: (editor, range) => {
      runWithOptionalRange(editor, range, (chain) => chain.toggleCodeBlock());
    },
  },
  {
    id: 'divider',
    titleKey: 'block.divider',
    keywords: ['divider', 'hr', 'line', '分隔', '横线'],
    section: 'insert',
    run: (editor, range) => {
      runWithOptionalRange(editor, range, (chain) => chain.setHorizontalRule());
    },
  },
  {
    id: 'link',
    titleKey: 'block.link',
    keywords: ['link', 'url', 'hyperlink', '超链接'],
    section: 'insert',
    active: (editor) => editor.isActive('link'),
    run: (editor, range) => {
      if (range) {
        editor.chain().focus().deleteRange(range).run();
      }
      insertPlaceholderLink(editor);
    },
  },
  {
    id: 'image',
    titleKey: 'block.image',
    keywords: ['image', 'img', '图片'],
    section: 'insert',
    active: (editor) => editor.isActive('image'),
    run: (editor, range) => {
      void insertImagesFromPicker(editor, range);
    },
  },
];

export function filterBlockActions(query: string): EditorBlockAction[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return EDITOR_BLOCK_ACTIONS;
  }
  return EDITOR_BLOCK_ACTIONS.filter((action) => {
    const haystack = [action.id, ...action.keywords].join(' ').toLowerCase();
    return haystack.includes(normalized);
  });
}

export function applyLink(editor: Editor, url: string) {
  const href = url.trim();
  if (!href) {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    return;
  }
  const normalized = /^[a-z][a-z0-9+.-]*:/i.test(href) ? href : `https://${href}`;
  const { from, to } = editor.state.selection;
  if (from === to) {
    insertPlaceholderLink(editor, normalized);
    return;
  }
  editor.chain().focus().extendMarkRange('link').setLink({ href: normalized }).run();
}

function insertPlaceholderLink(editor: Editor, href = 'https://') {
  editor
    .chain()
    .focus()
    .insertContent({
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: '链接',
          marks: [{ type: 'link', attrs: { href } }],
        },
      ],
    })
    .run();
}
