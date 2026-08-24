import type { Editor } from '@tiptap/core';

export interface TableAction {
  id: string;
  title: string;
  keywords: string[];
  canRun?: (editor: Editor) => boolean;
  run: (editor: Editor) => void;
}

export const TABLE_CELL_COLORS = [
  { label: '无', value: null },
  { label: '绿色', value: 'rgba(91, 140, 111, 0.18)' },
  { label: '黄色', value: 'rgba(234, 179, 8, 0.22)' },
  { label: '蓝色', value: 'rgba(59, 130, 246, 0.18)' },
  { label: '粉色', value: 'rgba(236, 72, 153, 0.16)' },
  { label: '灰色', value: 'rgba(0, 0, 0, 0.06)' },
] as const;

export const TABLE_STRUCTURE_ACTIONS: TableAction[] = [
  {
    id: 'add-row-before',
    title: '在上方插入行',
    keywords: ['row', 'above', '上方', '插入行'],
    run: (editor) => editor.chain().focus().addRowBefore().run(),
  },
  {
    id: 'add-row-after',
    title: '在下方插入行',
    keywords: ['row', 'below', '下方', '插入行'],
    run: (editor) => editor.chain().focus().addRowAfter().run(),
  },
  {
    id: 'add-column-before',
    title: '在左侧插入列',
    keywords: ['column', 'left', '左侧', '插入列'],
    run: (editor) => editor.chain().focus().addColumnBefore().run(),
  },
  {
    id: 'add-column-after',
    title: '在右侧插入列',
    keywords: ['column', 'right', '右侧', '插入列'],
    run: (editor) => editor.chain().focus().addColumnAfter().run(),
  },
  {
    id: 'toggle-header-row',
    title: '切换标题行',
    keywords: ['header', 'row', '标题行'],
    run: (editor) => editor.chain().focus().toggleHeaderRow().run(),
  },
  {
    id: 'toggle-header-column',
    title: '切换标题列',
    keywords: ['header', 'column', '标题列'],
    run: (editor) => editor.chain().focus().toggleHeaderColumn().run(),
  },
  {
    id: 'delete-row',
    title: '删除当前行',
    keywords: ['delete', 'row', '删除行'],
    run: (editor) => editor.chain().focus().deleteRow().run(),
  },
  {
    id: 'delete-column',
    title: '删除当前列',
    keywords: ['delete', 'column', '删除列'],
    run: (editor) => editor.chain().focus().deleteColumn().run(),
  },
  {
    id: 'delete-table',
    title: '删除表格',
    keywords: ['delete', 'table', '删除表格'],
    run: (editor) => editor.chain().focus().deleteTable().run(),
  },
];

export function setTableCellBackground(editor: Editor, color: string | null) {
  editor.chain().focus().setCellAttribute('backgroundColor', color).run();
}

export function getActiveCellBackground(editor: Editor): string | null {
  const attrs = editor.getAttributes('tableCell');
  if (attrs.backgroundColor) {
    return attrs.backgroundColor as string;
  }
  const headerAttrs = editor.getAttributes('tableHeader');
  return (headerAttrs.backgroundColor as string | undefined) ?? null;
}

export function filterTableActions(query: string): TableAction[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return TABLE_STRUCTURE_ACTIONS;
  }
  return TABLE_STRUCTURE_ACTIONS.filter((action) => {
    const haystack = [action.title, ...action.keywords].join(' ').toLowerCase();
    return haystack.includes(normalized);
  });
}
