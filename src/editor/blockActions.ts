import type { Editor } from '@tiptap/core';

export type SlashRange = { from: number; to: number };

export type BlockActionSection = 'convert' | 'list' | 'insert';

export interface EditorBlockAction {
  id: string;
  title: string;
  keywords: string[];
  section: BlockActionSection;
  active?: (editor: Editor) => boolean;
  run: (editor: Editor, range?: SlashRange) => void;
}

export const BLOCK_ACTION_SECTION_LABELS: Record<BlockActionSection, string> = {
  convert: '转换为',
  list: '列表',
  insert: '插入',
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
    title: '正文',
    keywords: ['paragraph', 'text', '段落', 'p'],
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
    title: '标题 1',
    keywords: ['heading', 'h1', 'title', '一级标题'],
    section: 'convert',
    active: (editor) => editor.isActive('heading', { level: 1 }),
    run: (editor, range) => {
      runWithOptionalRange(editor, range, (chain) => chain.setHeading({ level: 1 }));
    },
  },
  {
    id: 'heading-2',
    title: '标题 2',
    keywords: ['heading', 'h2', '二级标题'],
    section: 'convert',
    active: (editor) => editor.isActive('heading', { level: 2 }),
    run: (editor, range) => {
      runWithOptionalRange(editor, range, (chain) => chain.setHeading({ level: 2 }));
    },
  },
  {
    id: 'heading-3',
    title: '标题 3',
    keywords: ['heading', 'h3', '三级标题'],
    section: 'convert',
    active: (editor) => editor.isActive('heading', { level: 3 }),
    run: (editor, range) => {
      runWithOptionalRange(editor, range, (chain) => chain.setHeading({ level: 3 }));
    },
  },
  {
    id: 'heading-4',
    title: '标题 4',
    keywords: ['heading', 'h4', '四级标题'],
    section: 'convert',
    active: (editor) => editor.isActive('heading', { level: 4 }),
    run: (editor, range) => {
      runWithOptionalRange(editor, range, (chain) => chain.setHeading({ level: 4 }));
    },
  },
  {
    id: 'blockquote',
    title: '引用',
    keywords: ['quote', 'blockquote', '引用块'],
    section: 'convert',
    active: (editor) => editor.isActive('blockquote'),
    run: (editor, range) => {
      runWithOptionalRange(editor, range, (chain) => chain.toggleBlockquote());
    },
  },
  {
    id: 'bullet-list',
    title: '无序列表',
    keywords: ['bullet', 'ul', 'list', '无序'],
    section: 'list',
    active: (editor) => editor.isActive('bulletList'),
    run: (editor, range) => {
      runWithOptionalRange(editor, range, (chain) => chain.toggleBulletList());
    },
  },
  {
    id: 'ordered-list',
    title: '有序列表',
    keywords: ['ordered', 'ol', 'number', '有序', '编号'],
    section: 'list',
    active: (editor) => editor.isActive('orderedList'),
    run: (editor, range) => {
      runWithOptionalRange(editor, range, (chain) => chain.toggleOrderedList());
    },
  },
  {
    id: 'task-list',
    title: '任务列表',
    keywords: ['task', 'todo', 'checkbox', '待办', '任务'],
    section: 'list',
    active: (editor) => editor.isActive('taskList'),
    run: (editor, range) => {
      runWithOptionalRange(editor, range, (chain) => chain.toggleTaskList());
    },
  },
  {
    id: 'table',
    title: '表格',
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
    id: 'code-block',
    title: '代码块',
    keywords: ['code', 'snippet', '代码'],
    section: 'insert',
    active: (editor) => editor.isActive('codeBlock'),
    run: (editor, range) => {
      runWithOptionalRange(editor, range, (chain) => chain.toggleCodeBlock());
    },
  },
  {
    id: 'divider',
    title: '分隔线',
    keywords: ['divider', 'hr', 'line', '分隔', '横线'],
    section: 'insert',
    run: (editor, range) => {
      runWithOptionalRange(editor, range, (chain) => chain.setHorizontalRule());
    },
  },
  {
    id: 'link',
    title: '链接',
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
];

export function filterBlockActions(query: string): EditorBlockAction[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return EDITOR_BLOCK_ACTIONS;
  }
  return EDITOR_BLOCK_ACTIONS.filter((action) => {
    const haystack = [action.title, ...action.keywords].join(' ').toLowerCase();
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
